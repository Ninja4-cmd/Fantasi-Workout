import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";

import { ACHIEVEMENTS, CHALLENGES, DAILY_QUESTS, WEEKLY_QUESTS } from "@/src/data/game";
import { rankForXp } from "@/src/data/ranks";
import { HYDRATION_GOAL_ML, HYDRATION_STEP_ML } from "@/src/data/meals";
import { WORKOUT_PLAN, isoDate, isoWeekOf } from "@/src/data/workouts";
import { XP_REWARDS } from "@/src/data/xp";
import { upsertUser } from "@/src/store/api";

const KEY = "ascend90:state:v2";
const EVT = "ascend90:state-changed";

// ---------------- Types ----------------
export type CharacterCustom = {
  hair: number;     // 0-4
  outfit: number;   // 0-4
  aura: number;     // 0-4 (unlocked by level)
  badge: number;    // 0-4
};

export type Progress = {
  version: 2;
  deviceId: string;
  username: string;
  title: string | null;

  xp: number;
  totalXpEver: number;
  challengeStartDate: string; // "YYYY-MM-DD"

  // completions tracked per day (workouts + meals + exercises)
  completedExercises: Record<string, string[]>;
  completedMeals: Record<string, { slot: string; mealId: string }[]>;
  workoutFullCompleteDays: string[];
  hydrationMl: Record<string, number>; // date -> ml

  // Quest / challenge / achievement state
  claimedDailyQuests: Record<string, string[]>; // date -> questIds claimed
  claimedWeeklyQuests: Record<string, string[]>; // week -> questIds
  claimedChallenges: string[];
  claimedAchievements: string[];

  // Personal records set count (for PR XP)
  personalRecords: number;

  // Streak tracking
  streak: number;
  streakMax: number;
  lastActiveDate: string | null;

  // Character
  character: CharacterCustom;

  // Notifications (in-app inbox)
  notifications: NotificationItem[];

  // Rank-up modal signaling
  pendingRankUp: null | { fromIndex: number; toIndex: number };
};

export type NotificationItem = {
  id: string;
  ts: number;
  icon: string;
  title: string;
  body: string;
  seen: boolean;
};

function todayISO(d = new Date()) { return isoDate(d); }
function newId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

const DEFAULT_CHARACTER: CharacterCustom = { hair: 0, outfit: 0, aura: 0, badge: 0 };

function makeDefault(): Progress {
  return {
    version: 2,
    deviceId: newId(),
    username: `Athlete${Math.floor(1000 + Math.random() * 9000)}`,
    title: null,
    xp: 0,
    totalXpEver: 0,
    challengeStartDate: todayISO(),
    completedExercises: {},
    completedMeals: {},
    workoutFullCompleteDays: [],
    hydrationMl: {},
    claimedDailyQuests: {},
    claimedWeeklyQuests: {},
    claimedChallenges: [],
    claimedAchievements: [],
    personalRecords: 0,
    streak: 0,
    streakMax: 0,
    lastActiveDate: null,
    character: DEFAULT_CHARACTER,
    notifications: [],
    pendingRankUp: null,
  };
}

let cache: Progress | null = null;
let loadPromise: Promise<Progress> | null = null;

async function load(): Promise<Progress> {
  if (cache) return cache;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        cache = { ...makeDefault(), ...parsed, character: { ...DEFAULT_CHARACTER, ...(parsed.character ?? {}) } };
      } else {
        cache = makeDefault();
        await AsyncStorage.setItem(KEY, JSON.stringify(cache));
      }
    } catch {
      cache = makeDefault();
    }
    return cache!;
  })();
  return loadPromise;
}

async function save(next: Progress) {
  cache = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  DeviceEventEmitter.emit(EVT, next);
  // fire-and-forget backend sync
  syncToBackend(next).catch(() => {});
}

async function syncToBackend(s: Progress) {
  try {
    await upsertUser({
      device_id: s.deviceId,
      username: s.username,
      xp: s.xp,
      streak: s.streakMax,
      workouts_completed: s.workoutFullCompleteDays.length,
      quests_completed:
        Object.values(s.claimedDailyQuests).reduce((a, arr) => a + arr.length, 0) +
        Object.values(s.claimedWeeklyQuests).reduce((a, arr) => a + arr.length, 0),
      challenges_completed: s.claimedChallenges.length,
      achievements_unlocked: s.claimedAchievements.length,
      title: s.title,
    });
  } catch { /* offline is fine */ }
}

// ---------------- Metrics ----------------
export function metrics(s: Progress) {
  const today = todayISO();
  const totalExercises = Object.values(s.completedExercises).reduce((a, arr) => a + arr.length, 0);
  const mealsToday = (s.completedMeals[today] ?? []).length;
  const hydrationToday = s.hydrationMl[today] ?? 0;
  const workoutsCompleted = s.workoutFullCompleteDays.length;
  const questsCompleted =
    Object.values(s.claimedDailyQuests).reduce((a, arr) => a + arr.length, 0) +
    Object.values(s.claimedWeeklyQuests).reduce((a, arr) => a + arr.length, 0);
  const challengesCompleted = s.claimedChallenges.length;
  const achievementsUnlocked = s.claimedAchievements.length;
  const rankIndex = rankForXp(s.xp).current.index;

  // XP this week (rough): count exercise + meal + hydration + workout bonuses claimed today's week
  const weekKey = isoWeekOf(new Date());
  const weeklyClaimed = (s.claimedWeeklyQuests[weekKey] ?? []).length;

  return {
    totalExercises,
    mealsToday,
    hydrationToday,
    workoutsCompleted,
    questsCompleted,
    challengesCompleted,
    achievementsUnlocked,
    rankIndex,
    weeklyClaimed,
  };
}

// ---------------- Quest / Challenge / Achievement progress ----------------
export function questProgress(s: Progress, questId: string, cadence: "daily" | "weekly"): number {
  const today = todayISO();
  const week = isoWeekOf(new Date());
  const startOfWeek = getWeekMondayISO();
  switch (questId) {
    case "q_daily_workout":
      return s.workoutFullCompleteDays.includes(today) ? 1 : 0;
    case "q_daily_streak":
      return s.streak > 0 ? 1 : 0;
    case "q_daily_hydration":
      return (s.hydrationMl[today] ?? 0) >= HYDRATION_GOAL_ML ? 1 : 0;
    case "q_daily_fuel":
      return Math.min(4, (s.completedMeals[today] ?? []).length);
    case "q_daily_move":
      return Math.min(3, (s.completedExercises[today] ?? []).length);
    case "q_weekly_warrior": {
      let count = 0;
      for (const d of s.workoutFullCompleteDays) {
        if (d >= startOfWeek) count++;
      }
      return Math.min(4, count);
    }
    case "q_weekly_king": {
      let count = 0;
      for (const d of s.workoutFullCompleteDays) {
        if (d >= startOfWeek) count++;
      }
      return Math.min(5, count);
    }
    case "q_weekly_levelup":
      // approximate: exercise + meal xp claimed inside week isn't tracked directly,
      // use a soft indicator based on workout full completions this week
      // scale to feel meaningful
      return Math.min(2000, weekXpEstimate(s, startOfWeek));
    case "q_weekly_perfect": {
      const w = Math.min(5, s.workoutFullCompleteDays.filter((d) => d >= startOfWeek).length);
      const dq = Object.entries(s.claimedDailyQuests)
        .filter(([d]) => d >= startOfWeek)
        .reduce((a, [, arr]) => a + arr.length, 0);
      return Math.min(25, w + dq);
    }
    default:
      return 0;
  }
}

function weekXpEstimate(s: Progress, startOfWeek: string): number {
  let xp = 0;
  for (const d of s.workoutFullCompleteDays) if (d >= startOfWeek) xp += XP_REWARDS.WORKOUT_COMPLETE;
  for (const [d, ex] of Object.entries(s.completedExercises)) if (d >= startOfWeek) xp += ex.length * XP_REWARDS.EXERCISE_COMPLETE;
  for (const [d, ml] of Object.entries(s.completedMeals)) if (d >= startOfWeek) xp += ml.length * XP_REWARDS.MEAL_COMPLETE;
  return xp;
}

function getWeekMondayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return isoDate(monday);
}

export function challengeProgress(s: Progress, challengeId: string): number {
  switch (challengeId) {
    case "c_7day": return Math.min(7, s.streakMax);
    case "c_30day": return Math.min(30, s.streakMax);
    case "c_ironweek": return Math.min(5, s.workoutFullCompleteDays.filter((d) => d >= getWeekMondayISO()).length);
    case "c_climb": return Math.min(5000, s.totalXpEver);
    case "c_apex": return Math.min(10000, monthXp(s));
    case "c_legendary": return Math.min(5, s.claimedChallenges.length);
    default: return 0;
  }
}

function monthXp(s: Progress): number {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let xp = 0;
  for (const d of s.workoutFullCompleteDays) if (d.startsWith(monthKey)) xp += XP_REWARDS.WORKOUT_COMPLETE;
  for (const [d, ex] of Object.entries(s.completedExercises)) if (d.startsWith(monthKey)) xp += ex.length * XP_REWARDS.EXERCISE_COMPLETE;
  return xp;
}

export function achievementProgress(s: Progress, id: string): number {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return 0;
  const rankIdx = rankForXp(s.xp).current.index;
  const total = s.claimedAchievements.length + s.claimedChallenges.length +
    Object.values(s.claimedDailyQuests).reduce((a, arr) => a + arr.length, 0) +
    Object.values(s.claimedWeeklyQuests).reduce((a, arr) => a + arr.length, 0);
  switch (def.metric) {
    case "workouts_completed": return Math.min(def.target, s.workoutFullCompleteDays.length);
    case "streak_max": return Math.min(def.target, s.streakMax);
    case "xp_total": return Math.min(def.target, s.totalXpEver);
    case "quests_completed": return Math.min(def.target,
      Object.values(s.claimedDailyQuests).reduce((a, arr) => a + arr.length, 0) +
      Object.values(s.claimedWeeklyQuests).reduce((a, arr) => a + arr.length, 0));
    case "challenges_completed": return Math.min(def.target, s.claimedChallenges.length);
    case "rank_index": return Math.min(def.target, rankIdx);
    case "achievements_unlocked": return Math.min(def.target, total);
  }
}

// ---------------- Actions ----------------
function updateStreak(s: Progress): Progress {
  const today = todayISO();
  if (s.lastActiveDate === today) return s;
  let nextStreak = 1;
  if (s.lastActiveDate) {
    const last = new Date(s.lastActiveDate + "T00:00:00");
    const diff = Math.round((new Date(today + "T00:00:00").getTime() - last.getTime()) / 86400000);
    if (diff === 1) nextStreak = s.streak + 1;
    else if (diff === 0) nextStreak = s.streak;
    else nextStreak = 1;
  }
  return {
    ...s,
    streak: nextStreak,
    streakMax: Math.max(s.streakMax, nextStreak),
    lastActiveDate: today,
  };
}

function pushNotification(s: Progress, n: Omit<NotificationItem, "id" | "ts" | "seen">): Progress {
  const item: NotificationItem = { id: newId(), ts: Date.now(), seen: false, ...n };
  return { ...s, notifications: [item, ...s.notifications].slice(0, 40) };
}

function awardXp(s: Progress, amount: number, reason: string): Progress {
  const prevIdx = rankForXp(s.xp).current.index;
  const nextXp = Math.max(0, s.xp + amount);
  const nextTotal = amount > 0 ? s.totalXpEver + amount : s.totalXpEver;
  const nextIdx = rankForXp(nextXp).current.index;
  let out: Progress = { ...s, xp: nextXp, totalXpEver: nextTotal };
  if (amount > 0 && nextIdx > prevIdx) {
    out = { ...out, pendingRankUp: { fromIndex: prevIdx, toIndex: nextIdx } };
    out = pushNotification(out, {
      icon: "trophy",
      title: "NEW RANK!",
      body: `You reached ${rankForXp(nextXp).current.name}`,
    });
  }
  return out;
}

export function useProgress() {
  const [state, setState] = useState<Progress | null>(cache);

  useEffect(() => {
    let mounted = true;
    load().then((s) => {
      if (mounted) setState({ ...s });
      // initial sync
      syncToBackend(s).catch(() => {});
    });
    const sub = DeviceEventEmitter.addListener(EVT, (next: Progress) => {
      if (mounted) setState({ ...next });
    });
    return () => { mounted = false; sub.remove(); };
  }, []);

  const toggleExercise = useCallback(async (exerciseId: string) => {
    const s = await load();
    const today = todayISO();
    const list = s.completedExercises[today] ?? [];
    const has = list.includes(exerciseId);
    const next = has ? list.filter((x) => x !== exerciseId) : [...list, exerciseId];
    let out: Progress = {
      ...s,
      completedExercises: { ...s.completedExercises, [today]: next },
    };
    out = awardXp(out, has ? -XP_REWARDS.EXERCISE_COMPLETE : XP_REWARDS.EXERCISE_COMPLETE, "exercise");
    if (!has) out = updateStreak(out);
    await save(out);
    return !has;
  }, []);

  const claimFullWorkout = useCallback(async () => {
    const s = await load();
    const today = todayISO();
    if (s.workoutFullCompleteDays.includes(today)) return false;
    const workout = WORKOUT_PLAN.find((w) => w.weekday === new Date().getDay());
    const bonus = workout?.difficulty === "HARD" ? XP_REWARDS.DIFFICULT_WORKOUT_COMPLETE : XP_REWARDS.WORKOUT_COMPLETE;
    let out: Progress = {
      ...s,
      workoutFullCompleteDays: [...s.workoutFullCompleteDays, today],
    };
    out = awardXp(out, bonus, "workout");
    out = updateStreak(out);
    out = pushNotification(out, {
      icon: "flash",
      title: "MISSION COMPLETE",
      body: `+${bonus} XP for finishing ${workout?.title ?? "your workout"}`,
    });
    // streak bonuses
    if (out.streak === 7) out = awardXp(out, XP_REWARDS.STREAK_7, "streak7");
    if (out.streak === 30) out = awardXp(out, XP_REWARDS.STREAK_30, "streak30");
    await save(out);
    return true;
  }, []);

  const toggleMeal = useCallback(async (slot: string, mealId: string) => {
    const s = await load();
    const today = todayISO();
    const list = s.completedMeals[today] ?? [];
    const idx = list.findIndex((m) => m.slot === slot);
    let next = list.slice();
    let awarded = 0;
    let removed = false;
    if (idx >= 0 && list[idx].mealId === mealId) {
      next.splice(idx, 1);
      awarded = -XP_REWARDS.MEAL_COMPLETE;
      removed = true;
    } else if (idx >= 0) {
      next[idx] = { slot, mealId };
    } else {
      next.push({ slot, mealId });
      awarded = XP_REWARDS.MEAL_COMPLETE;
    }
    let out: Progress = { ...s, completedMeals: { ...s.completedMeals, [today]: next } };
    if (awarded !== 0) out = awardXp(out, awarded, "meal");
    if (!removed) out = updateStreak(out);
    await save(out);
    return !removed;
  }, []);

  const addHydration = useCallback(async (delta = HYDRATION_STEP_ML) => {
    const s = await load();
    const today = todayISO();
    const before = s.hydrationMl[today] ?? 0;
    const after = Math.max(0, before + delta);
    let out: Progress = { ...s, hydrationMl: { ...s.hydrationMl, [today]: after } };
    if (before < HYDRATION_GOAL_ML && after >= HYDRATION_GOAL_ML) {
      out = awardXp(out, XP_REWARDS.HYDRATION_GOAL, "hydration");
      out = pushNotification(out, {
        icon: "water",
        title: "HYDRATED",
        body: `+${XP_REWARDS.HYDRATION_GOAL} XP · Daily hydration goal hit`,
      });
    }
    await save(out);
  }, []);

  const claimDailyQuest = useCallback(async (questId: string) => {
    const s = await load();
    const today = todayISO();
    const claimed = s.claimedDailyQuests[today] ?? [];
    if (claimed.includes(questId)) return false;
    const def = DAILY_QUESTS.find((q) => q.id === questId);
    if (!def) return false;
    if (questProgress(s, questId, "daily") < def.target) return false;
    let out: Progress = {
      ...s,
      claimedDailyQuests: { ...s.claimedDailyQuests, [today]: [...claimed, questId] },
    };
    out = awardXp(out, def.reward, "quest");
    out = pushNotification(out, {
      icon: def.icon,
      title: "QUEST COMPLETE",
      body: `+${def.reward} XP · ${def.title}`,
    });
    await save(out);
    return true;
  }, []);

  const claimWeeklyQuest = useCallback(async (questId: string) => {
    const s = await load();
    const week = isoWeekOf(new Date());
    const claimed = s.claimedWeeklyQuests[week] ?? [];
    if (claimed.includes(questId)) return false;
    const def = WEEKLY_QUESTS.find((q) => q.id === questId);
    if (!def) return false;
    if (questProgress(s, questId, "weekly") < def.target) return false;
    let out: Progress = {
      ...s,
      claimedWeeklyQuests: { ...s.claimedWeeklyQuests, [week]: [...claimed, questId] },
    };
    out = awardXp(out, def.reward, "weekly");
    out = pushNotification(out, {
      icon: def.icon,
      title: "WEEKLY COMPLETE",
      body: `+${def.reward} XP · ${def.title}`,
    });
    await save(out);
    return true;
  }, []);

  const claimChallenge = useCallback(async (challengeId: string) => {
    const s = await load();
    if (s.claimedChallenges.includes(challengeId)) return false;
    const def = CHALLENGES.find((c) => c.id === challengeId);
    if (!def) return false;
    if (challengeProgress(s, challengeId) < def.target) return false;
    let out: Progress = { ...s, claimedChallenges: [...s.claimedChallenges, challengeId] };
    if (def.badgeTitle && !out.title) out = { ...out, title: def.badgeTitle };
    out = awardXp(out, def.reward, "challenge");
    out = pushNotification(out, {
      icon: def.icon,
      title: "CHALLENGE COMPLETE",
      body: `+${def.reward} XP · ${def.title}${def.badgeTitle ? ` · Title unlocked: ${def.badgeTitle}` : ""}`,
    });
    await save(out);
    return true;
  }, []);

  const claimAchievement = useCallback(async (achId: string) => {
    const s = await load();
    if (s.claimedAchievements.includes(achId)) return false;
    const def = ACHIEVEMENTS.find((a) => a.id === achId);
    if (!def) return false;
    if (achievementProgress(s, achId) < def.target) return false;
    let out: Progress = { ...s, claimedAchievements: [...s.claimedAchievements, achId] };
    out = awardXp(out, 100, "achievement");
    out = pushNotification(out, {
      icon: def.icon,
      title: "ACHIEVEMENT UNLOCKED",
      body: def.title,
    });
    await save(out);
    return true;
  }, []);

  const setUsername = useCallback(async (name: string) => {
    const s = await load();
    await save({ ...s, username: name.trim() || s.username });
  }, []);

  const setTitle = useCallback(async (title: string | null) => {
    const s = await load();
    await save({ ...s, title });
  }, []);

  const setCharacter = useCallback(async (patch: Partial<CharacterCustom>) => {
    const s = await load();
    await save({ ...s, character: { ...s.character, ...patch } });
  }, []);

  const acknowledgeRankUp = useCallback(async () => {
    const s = await load();
    if (!s.pendingRankUp) return;
    await save({ ...s, pendingRankUp: null });
  }, []);

  const markNotificationsSeen = useCallback(async () => {
    const s = await load();
    await save({ ...s, notifications: s.notifications.map((n) => ({ ...n, seen: true })) });
  }, []);

  const resetProgress = useCallback(async () => {
    const s = await load();
    const fresh = makeDefault();
    fresh.deviceId = s.deviceId;
    fresh.username = s.username;
    fresh.character = s.character;
    await save(fresh);
  }, []);

  return {
    state,
    toggleExercise,
    claimFullWorkout,
    toggleMeal,
    addHydration,
    claimDailyQuest,
    claimWeeklyQuest,
    claimChallenge,
    claimAchievement,
    setUsername,
    setTitle,
    setCharacter,
    acknowledgeRankUp,
    markNotificationsSeen,
    resetProgress,
  };
}

export { todayISO };
