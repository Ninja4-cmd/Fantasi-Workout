"""Backend tests: Squad race board, invite rewards, push endpoints graceful handling."""
import os
import uuid
from datetime import date, timedelta

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/") or \
           "https://fittrack-gains-4.preview.emergentagent.com"
API = f"{BASE_URL}/api"


def _current_week_iso() -> str:
    today = date.today()
    return (today - timedelta(days=today.weekday())).isoformat()


def _old_week_iso() -> str:
    today = date.today()
    return (today - timedelta(days=today.weekday()) - timedelta(days=14)).isoformat()


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def alpha_beta_users(api_client):
    """Create two fresh test users AlphaTester (high total, low week) and BetaTester (low total, high week)."""
    alpha_dev = f"TEST_alpha_{uuid.uuid4()}"
    beta_dev = f"TEST_beta_{uuid.uuid4()}"
    current = _current_week_iso()
    old = _old_week_iso()

    # Alpha: high total XP but week_key is OLD -> weekly contribution should be 0
    a = api_client.post(f"{API}/users/upsert", json={
        "device_id": alpha_dev,
        "username": "TEST_AlphaTester",
        "xp": 12000,
        "week_key": old,
        "week_xp": 1800,
    })
    assert a.status_code == 200, a.text
    alpha = a.json()

    # Beta: lower total XP, current week high week_xp
    b = api_client.post(f"{API}/users/upsert", json={
        "device_id": beta_dev,
        "username": "TEST_BetaTester",
        "xp": 4000,
        "week_key": current,
        "week_xp": 3200,
    })
    assert b.status_code == 200, b.text
    beta = b.json()

    yield {"alpha_dev": alpha_dev, "beta_dev": beta_dev, "alpha": alpha, "beta": beta}


# ---------------- Race board tests ----------------
class TestRaceBoard:
    def test_race_board_sorted_by_week_xp_not_total(self, api_client, alpha_beta_users):
        """Beta (week_xp=3200, current week) must outrank Alpha (week_xp=1800, old week => 0)."""
        alpha_dev = alpha_beta_users["alpha_dev"]
        beta_code = alpha_beta_users["beta"]["friend_code"]

        # Alpha adds Beta to squad
        r = api_client.post(f"{API}/friends/add", json={"device_id": alpha_dev, "code": beta_code})
        assert r.status_code == 200, r.text

        # Fetch Alpha's friends
        r = api_client.get(f"{API}/friends", params={"device_id": alpha_dev})
        assert r.status_code == 200, r.text
        data = r.json()

        assert "race" in data and "board" in data["race"]
        board = data["race"]["board"]
        assert len(board) == 2, f"expected 2 members, got {len(board)}"

        # Rank 1 must be Beta with 3200 wk_xp
        assert board[0]["username"] == "TEST_BetaTester", f"expected Beta first, got {board[0]}"
        assert board[0]["rank"] == 1
        assert board[0]["week_xp"] == 3200

        # Alpha's week_key is stale => week_xp contribution is 0
        alpha_row = next(b for b in board if b["username"] == "TEST_AlphaTester")
        assert alpha_row["week_xp"] == 0, f"stale week_key should yield 0, got {alpha_row['week_xp']}"
        assert alpha_row["rank"] == 2

    def test_friends_response_shape(self, api_client, alpha_beta_users):
        alpha_dev = alpha_beta_users["alpha_dev"]
        r = api_client.get(f"{API}/friends", params={"device_id": alpha_dev})
        assert r.status_code == 200
        d = r.json()
        for key in ("me", "friends", "squad_xp", "squad_size", "my_squad_rank",
                    "rival", "referral_count", "race"):
            assert key in d, f"missing key {key}"
        assert d["race"]["week_start"] == _current_week_iso()

    def test_squad_xp_total(self, api_client, alpha_beta_users):
        alpha_dev = alpha_beta_users["alpha_dev"]
        beta_code = alpha_beta_users["beta"]["friend_code"]
        # link squad first (fixture is function-scoped, so friendship isn't preserved)
        api_client.post(f"{API}/friends/add", json={"device_id": alpha_dev, "code": beta_code})
        r = api_client.get(f"{API}/friends", params={"device_id": alpha_dev})
        d = r.json()
        # squad_xp = sum of totals = 12000 + 4000
        assert d["squad_xp"] == 16000, d["squad_xp"]
        assert d["squad_size"] == 2


# ---------------- Referral / invite tests ----------------
class TestReferrals:
    def test_referral_count_increments_on_code_owner(self, api_client):
        # Owner user
        owner_dev = f"TEST_owner_{uuid.uuid4()}"
        r = api_client.post(f"{API}/users/upsert", json={
            "device_id": owner_dev, "username": "TEST_Owner", "xp": 1000,
        })
        assert r.status_code == 200
        owner = r.json()
        owner_code = owner["friend_code"]

        # Baseline referral_count = 0
        r = api_client.get(f"{API}/friends", params={"device_id": owner_dev})
        assert r.json()["referral_count"] == 0

        # Friend joins using owner's code
        friend_dev = f"TEST_friend_{uuid.uuid4()}"
        api_client.post(f"{API}/users/upsert", json={
            "device_id": friend_dev, "username": "TEST_Friend", "xp": 500,
        })
        r = api_client.post(f"{API}/friends/add",
                            json={"device_id": friend_dev, "code": owner_code})
        assert r.status_code == 200, r.text

        # Owner's referral_count should now be 1
        r = api_client.get(f"{API}/friends", params={"device_id": owner_dev})
        d = r.json()
        assert d["referral_count"] == 1, f"expected 1, got {d['referral_count']}"

        # Mutual friendship
        assert any(f["username"] == "TEST_Friend" for f in d["friends"])

    def test_cannot_add_own_code(self, api_client):
        dev = f"TEST_self_{uuid.uuid4()}"
        r = api_client.post(f"{API}/users/upsert",
                            json={"device_id": dev, "username": "TEST_Self"})
        code = r.json()["friend_code"]
        r = api_client.post(f"{API}/friends/add", json={"device_id": dev, "code": code})
        assert r.status_code == 400


# ---------------- Push endpoints graceful degradation ----------------
class TestPushEndpoints:
    def test_notify_returns_ok_false_with_placeholder_key(self, api_client):
        dev = f"TEST_notify_{uuid.uuid4()}"
        api_client.post(f"{API}/users/upsert", json={"device_id": dev, "username": "TEST_N"})
        r = api_client.post(f"{API}/notify", json={
            "device_id": dev, "title": "hi", "message": "test"
        })
        # Must NOT crash; endpoint returns 200 with {"ok": false}
        assert r.status_code == 200, r.text
        body = r.json()
        assert "ok" in body
        # With placeholder key, expect graceful false
        assert body["ok"] is False, f"expected ok:false with placeholder key, got {body}"

    def test_register_push_returns_error_without_crash(self, api_client):
        r = api_client.post(f"{API}/register-push", json={
            "user_id": "TEST_user", "platform": "ios", "device_token": "faketoken",
        })
        # Should be a proper HTTP error (500/502), not a crash / no response
        assert r.status_code in (500, 502, 400, 401), r.status_code
        # Body should still be JSON
        try:
            r.json()
        except Exception:
            pytest.fail("register-push did not return JSON body")


# ---------------- Cleanup ----------------
@pytest.fixture(scope="session", autouse=True)
def cleanup_after_all():
    yield
    # Cleanup via direct mongo would be ideal but we only have HTTP.
    # Leave TEST_ users; safe because they don't affect production users.
