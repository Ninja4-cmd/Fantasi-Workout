const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type UserPublic = {
  id: string;
  username: string;
  xp: number;
  streak: number;
  workouts_completed: number;
  quests_completed: number;
  challenges_completed: number;
  achievements_unlocked: number;
  title: string | null;
  is_npc: boolean;
  is_you: boolean;
  friend_code?: string | null;
};

export type SquadMember = UserPublic & { squad_rank: number };
export type FriendsResp = {
  me: UserPublic;
  friends: SquadMember[];
  squad_xp: number;
  squad_size: number;
  my_squad_rank: number;
  rival: { username: string; gap: number } | null;
};

export type LeaderboardRow = UserPublic & { rank: number };
export type LeaderboardResp = {
  top: LeaderboardRow[];
  my_position: number | null;
  nearby: LeaderboardRow[];
  total_users: number;
};

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export async function upsertUser(body: {
  device_id: string;
  username?: string;
  xp?: number;
  streak?: number;
  workouts_completed?: number;
  quests_completed?: number;
  challenges_completed?: number;
  achievements_unlocked?: number;
  title?: string | null;
}): Promise<UserPublic> {
  return req<UserPublic>("/users/upsert", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchLeaderboard(device_id?: string, limit = 100): Promise<LeaderboardResp> {
  const q = new URLSearchParams();
  if (device_id) q.set("device_id", device_id);
  q.set("limit", String(limit));
  return req<LeaderboardResp>(`/leaderboard?${q.toString()}`);
}

export async function fetchFriends(device_id: string): Promise<FriendsResp> {
  return req<FriendsResp>(`/friends?device_id=${encodeURIComponent(device_id)}`);
}

export async function addFriend(device_id: string, code: string): Promise<UserPublic> {
  return req<UserPublic>("/friends/add", {
    method: "POST",
    body: JSON.stringify({ device_id, code }),
  });
}

export async function removeFriend(device_id: string, friend_id: string): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>("/friends/remove", {
    method: "POST",
    body: JSON.stringify({ device_id, friend_id }),
  });
}
