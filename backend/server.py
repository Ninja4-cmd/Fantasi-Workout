from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
import os
import uuid
import random
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Ascend RPG API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("ascend")


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


# ---------------- Helpers ----------------
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
        return _public(merged, me_id=merged["id"])
    else:
        new_id = str(uuid.uuid4())
        doc = body.dict()
        doc["id"] = new_id
        doc["created_at"] = now
        doc["updated_at"] = now
        if not doc.get("username"):
            doc["username"] = f"Athlete{random.randint(1000, 9999)}"
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
