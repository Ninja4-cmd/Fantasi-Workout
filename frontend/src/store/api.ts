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
