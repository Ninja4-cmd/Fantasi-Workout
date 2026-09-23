from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, date, timedelta
from pathlib import Path
from dotenv import load_dotenv
import os
import uuid
import random
import string
import logging
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Ascend RPG API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ascend")

# ---------------- Emergent Push relay ----------------
PUSH_BASE_URL = "https://integrations.emergentagent.com"
PUSH_KEY = os.environ.get("EMERGENT_PUSH_KEY", "placeholder")
_push_client = httpx.AsyncClient(
    base_url=PUSH_BASE_URL,
    headers={"X-Push-Key": PUSH_KEY},
    timeout=10.0,
)


async def send_push(recipients: List[str], data: Dict[str, Any], idempotency_key: Optional[str] = None) -> None:
    if not recipients:
        return
    if "title" not in data or "message" not in data:
        raise ValueError("data must include title and message")
    payload: Dict[str, Any] = {"recipients": recipients[:100], "data": data}
    if idempotency_key:
        payload["$idempotency_key"] = idempotency_key
    resp = await _push_client.post("/api/v1/push/trigger", json=payload)
    if resp.status_code == 401:
        raise HTTPException(500, "EMERGENT_PUSH_KEY missing or invalid")
    if resp.status_code >= 500:
        raise HTTPException(502, "Push provider unavailable")
    resp.raise_for_status()


# ---------------- Models ----------------
class UserUpsert(BaseModel):
    device_id: str
    username: Optional[str] = None
    xp: int = 0
    streak: int = 0
    workouts_completed: int = 0
    quests_completed: int = 0
    challenges_completed: int = 0
    achievements_unlocked: int = 0
    title: Optional[str] = None
    is_npc: bool = False
    week_key: Optional[str] = None
    week_xp: int = 0


class UserPublic(BaseModel):
    id: str
    username: str
    xp: int
    streak: int
    workouts_completed: int
    quests_completed: int
    challenges_completed: int
    achievements_unlocked: int
    title: Optional[str] = None
    is_npc: bool = False
    is_you: bool = False
    friend_code: Optional[str] = None


class FriendAdd(BaseModel):
    device_id: str
    code: str


class FriendRemove(BaseModel):
    device_id: str
    friend_id: str


class RegisterPushBody(BaseModel):
    user_id: str
    platform: str
    device_token: str


class NotifyBody(BaseModel):
    device_id: str
    title: str
    message: str
    action_url: Optional[str] = None


# ---------------- Helpers ----------------
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no ambiguous chars


def _gen_code() -> str:
    return "".join(random.choice(CODE_ALPHABET) for _ in range(6))


async def _ensure_friend_code(doc: Dict[str, Any]) -> str:
    code = doc.get("friend_code")
    if code:
        return code
    for _ in range(10):
        code = _gen_code()
        if not await db.users.find_one({"friend_code": code}):
            break
    await db.users.update_one({"id": doc["id"]}, {"$set": {"friend_code": code}})
    doc["friend_code"] = code
    return code


def _public(doc: Dict[str, Any], me_id: Optional[str] = None) -> Dict[str, Any]:
    return {
        "id": doc["id"],
        "username": doc.get("username", "Athlete"),
        "xp": int(doc.get("xp", 0)),
        "streak": int(doc.get("streak", 0)),
        "workouts_completed": int(doc.get("workouts_completed", 0)),
        "quests_completed": int(doc.get("quests_completed", 0)),
        "challenges_completed": int(doc.get("challenges_completed", 0)),
        "achievements_unlocked": int(doc.get("achievements_unlocked", 0)),
        "title": doc.get("title"),
        "is_npc": bool(doc.get("is_npc", False)),
        "is_you": me_id is not None and doc.get("id") == me_id,
        "friend_code": doc.get("friend_code"),
    }


# ---------------- Routes ----------------
@api.get("/")
async def root():
    return {"message": "Ascend RPG API"}


@api.post("/users/upsert", response_model=UserPublic)
async def upsert_user(body: UserUpsert):
    existing = await db.users.find_one({"device_id": body.device_id}, {"_id": 0})
    now = datetime.now(timezone.utc).isoformat()
    if existing:
        update = body.dict(exclude_unset=True)
        update.pop("device_id", None)
        update["updated_at"] = now
        await db.users.update_one({"device_id": body.device_id}, {"$set": update})
        merged = {**existing, **update}
        await _ensure_friend_code(merged)
        return _public(merged, me_id=merged["id"])
    else:
        new_id = str(uuid.uuid4())
        doc = body.dict()
        doc["id"] = new_id
        doc["created_at"] = now
        doc["updated_at"] = now
        doc["friends"] = []
        doc["referrals"] = []
        if not doc.get("username"):
            doc["username"] = f"Athlete{random.randint(1000, 9999)}"
        doc["friend_code"] = _gen_code()
        await db.users.insert_one(doc)
        return _public(doc, me_id=new_id)


@api.get("/users/me")
async def get_me(device_id: str):
    doc = await db.users.find_one({"device_id": device_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "user not found")
    return _public(doc, me_id=doc["id"])


@api.get("/leaderboard")
async def leaderboard(device_id: Optional[str] = None, limit: int = 100):
    cursor = db.users.find({}, {"_id": 0}).sort("xp", -1).limit(limit)
    rows = await cursor.to_list(limit)
    me_doc = None
    if device_id:
        me_doc = await db.users.find_one({"device_id": device_id}, {"_id": 0})
    me_id = me_doc["id"] if me_doc else None
    top = [{"rank": i + 1, **_public(r, me_id=me_id)} for i, r in enumerate(rows)]
    my_position = None
    nearby: List[Dict[str, Any]] = []
    if me_doc:
        higher = await db.users.count_documents({"xp": {"$gt": me_doc.get("xp", 0)}})
        my_position = higher + 1
        # nearby = 2 above + me + 2 below
        above = await (
            db.users.find({"xp": {"$gt": me_doc.get("xp", 0)}}, {"_id": 0})
            .sort("xp", 1)
            .limit(2)
            .to_list(2)
        )
        below = await (
            db.users.find({"xp": {"$lt": me_doc.get("xp", 0)}}, {"_id": 0})
            .sort("xp", -1)
            .limit(2)
            .to_list(2)
        )
        chunk = list(reversed(above)) + [me_doc] + below
        start_rank = my_position - len(above)
        nearby = [
            {"rank": start_rank + i, **_public(u, me_id=me_id)}
            for i, u in enumerate(chunk)
        ]
    total = await db.users.count_documents({})
    return {
        "top": top,
        "my_position": my_position,
        "nearby": nearby,
        "total_users": total,
    }


# ---------------- Friends & Squad ----------------
async def _get_me(device_id: str) -> Dict[str, Any]:
    me = await db.users.find_one({"device_id": device_id}, {"_id": 0})
    if not me:
        raise HTTPException(404, "user not found — sync progress first")
    return me


@api.get("/friends")
async def get_friends(device_id: str):
    me = await _get_me(device_id)
    await _ensure_friend_code(me)
    friend_ids = me.get("friends", []) or []
    friends = []
    if friend_ids:
        friends = await db.users.find({"id": {"$in": friend_ids}}, {"_id": 0}).to_list(200)

    # squad = me + friends, ranked by total xp
    squad = [me] + friends
    squad.sort(key=lambda d: int(d.get("xp", 0)), reverse=True)
    ranked = [{"squad_rank": i + 1, **_public(u, me_id=me["id"])} for i, u in enumerate(squad)]
    squad_xp = sum(int(u.get("xp", 0)) for u in squad)

    # rival to chase: the squad member directly above me (by total xp)
    me_idx = next((i for i, u in enumerate(squad) if u["id"] == me["id"]), 0)
    rival = None
    if me_idx > 0:
        r = squad[me_idx - 1]
        rival = {"username": r.get("username", "Athlete"), "gap": int(r.get("xp", 0)) - int(me.get("xp", 0))}

    # ---- Weekly Squad Race (resets Monday) ----
    # current week = the most recent week_key reported across the squad (TZ-proof,
    # ISO dates sort lexically). Members whose week_key != current contribute 0.
    server_week = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    week_keys = [u.get("week_key") for u in squad if u.get("week_key")]
    current_week = max(week_keys + [server_week])

    def _week_xp(u: Dict[str, Any]) -> int:
        return int(u.get("week_xp", 0)) if u.get("week_key") == current_week else 0

    race_sorted = sorted(squad, key=_week_xp, reverse=True)
    board = [
        {
            "id": u["id"],
            "username": u.get("username", "Athlete"),
            "is_you": u["id"] == me["id"],
            "week_xp": _week_xp(u),
            "xp": int(u.get("xp", 0)),
            "rank": i + 1,
        }
        for i, u in enumerate(race_sorted)
    ]

    return {
        "me": _public(me, me_id=me["id"]),
        "friends": ranked,
        "squad_xp": squad_xp,
        "squad_size": len(squad),
        "my_squad_rank": me_idx + 1,
        "rival": rival,
        "referral_count": len(me.get("referrals", []) or []),
        "race": {"week_start": current_week, "board": board},
    }


@api.post("/friends/add")
async def add_friend(body: FriendAdd):
    me = await _get_me(body.device_id)
    await _ensure_friend_code(me)
    code = body.code.strip().upper()
    if code == (me.get("friend_code") or ""):
        raise HTTPException(400, "that's your own code")
    target = await db.users.find_one({"friend_code": code}, {"_id": 0})
    if not target:
        raise HTTPException(404, "no athlete with that code")
    if target["id"] in (me.get("friends", []) or []):
        raise HTTPException(400, "already in your squad")
    # mutual link
    await db.users.update_one({"id": me["id"]}, {"$addToSet": {"friends": target["id"]}})
    await db.users.update_one({"id": target["id"]}, {"$addToSet": {"friends": me["id"]}})
    # record referral on the code owner (target) so they can be rewarded
    await db.users.update_one({"id": target["id"]}, {"$addToSet": {"referrals": me["id"]}})
    # notify the code owner (likely offline) that a friend joined their squad
    try:
        await send_push(
            recipients=[target["device_id"]],
            data={
                "title": "New squad member! 💪",
                "message": f"{me.get('username', 'An athlete')} joined your squad using your code.",
                "action_url": "/leaderboard",
            },
            idempotency_key=f"ref-{target['id']}-{me['id']}",
        )
    except Exception as e:  # noqa: BLE001
        log.warning("friend-join push failed (non-blocking): %s", e)
    return _public(target, me_id=me["id"])


@api.post("/friends/remove")
async def remove_friend(body: FriendRemove):
    me = await _get_me(body.device_id)
    await db.users.update_one({"id": me["id"]}, {"$pull": {"friends": body.friend_id}})
    await db.users.update_one({"id": body.friend_id}, {"$pull": {"friends": me["id"]}})
    return {"ok": True}


# ---------------- Push notifications ----------------
@api.post("/register-push", status_code=201)
async def register_push(body: RegisterPushBody):
    resp = await _push_client.post("/api/v1/push/users/register", json=body.model_dump())
    if resp.status_code == 401:
        raise HTTPException(500, "EMERGENT_PUSH_KEY missing or invalid")
    if resp.status_code >= 500:
        raise HTTPException(502, "Push provider unavailable")
    resp.raise_for_status()
    return {"status": "registered"}


@api.post("/notify")
async def notify(body: NotifyBody):
    # Sends a push to the caller's own device (used for streak/quest/rank-up alerts).
    data: Dict[str, Any] = {"title": body.title, "message": body.message}
    if body.action_url:
        data["action_url"] = body.action_url
    try:
        await send_push(recipients=[body.device_id], data=data)
    except Exception as e:  # noqa: BLE001
        log.warning("notify push failed (non-blocking): %s", e)
        return {"ok": False}
    return {"ok": True}


# ---------------- NPC seeding ----------------
NPC_FIRST = [
    "Vex", "Ryder", "Kai", "Zara", "Luca", "Nova", "Rhea", "Kaz", "Iris", "Onyx",
    "Blaze", "Storm", "Ash", "Rune", "Cove", "Hex", "Jinx", "Mako", "Nyx", "Orion",
    "Pyra", "Quill", "Reef", "Sable", "Tarek", "Ulla", "Vale", "Wren", "Zeph", "Yara",
]
NPC_LAST = [
    "Sable", "Vlk", "Kade", "Frost", "Raze", "Crux", "Hollow", "Voss", "Steel",
    "Wraith", "Karn", "Volt", "Kilo", "Rook", "Talon", "Bane", "Grim", "Fury",
]
TITLES = [
    "The Grinder", "Streak Master", "Quest Hunter", "Iron Warrior",
    "Apex Predator", "Dominator", "Consistency King", "Challenge Beast",
]


async def seed_npcs():
    count = await db.users.count_documents({"is_npc": True})
    if count >= 500:
        log.info("NPCs already seeded (%d)", count)
        return
    log.info("Seeding NPC leaderboard...")
    rng = random.Random(1337)
    docs = []
    # Distribution: lots of low, few high — matches real pyramids
    for i in range(600):
        # skewed XP: exponential-ish
        base = int((rng.random() ** 2.4) * 155000)
        xp = max(0, base + rng.randint(-500, 500))
        first = rng.choice(NPC_FIRST)
        last = rng.choice(NPC_LAST)
        name = f"{first}{last}{rng.randint(10, 99)}"
        doc = {
            "id": str(uuid.uuid4()),
            "device_id": f"npc-{i}-{uuid.uuid4()}",
            "username": name,
            "xp": xp,
            "streak": rng.randint(0, 60),
            "workouts_completed": rng.randint(0, 300),
            "quests_completed": rng.randint(0, 400),
            "challenges_completed": rng.randint(0, 50),
            "achievements_unlocked": rng.randint(0, 80),
            "title": rng.choice(TITLES) if rng.random() > 0.4 else None,
            "is_npc": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        docs.append(doc)
    # Add a handful of Immortals at the top
    for i in range(8):
        xp = rng.randint(155000, 250000)
        docs.append({
            "id": str(uuid.uuid4()),
            "device_id": f"npc-immortal-{i}-{uuid.uuid4()}",
            "username": f"Immortal{rng.choice(NPC_FIRST)}{rng.randint(1, 99)}",
            "xp": xp,
            "streak": rng.randint(60, 365),
            "workouts_completed": rng.randint(200, 800),
            "quests_completed": rng.randint(300, 1000),
            "challenges_completed": rng.randint(30, 120),
            "achievements_unlocked": rng.randint(50, 100),
            "title": "Immortal",
            "is_npc": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
    if docs:
        await db.users.insert_many(docs)
    log.info("Seeded %d NPCs", len(docs))


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("device_id", unique=True)
    await db.users.create_index([("xp", -1)])
    await seed_npcs()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
