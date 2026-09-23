import { XP_REWARDS } from "./xp";

export type Difficulty = "EASY" | "MEDIUM" | "HARD" | "ELITE" | "LEGENDARY";

export type QuestDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: number;
  target: number;
  cadence: "daily" | "weekly";
};

export type ChallengeDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: number;
  target: number;
  difficulty: Difficulty;
  badgeTitle?: string;
};

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  metric: AchMetric;
};

export type AchMetric =
  | "workouts_completed"
  | "streak_max"
  | "xp_total"
  | "quests_completed"
  | "challenges_completed"
  | "rank_index"
  | "achievements_unlocked";

export const DAILY_QUESTS: QuestDef[] = [
  { id: "q_daily_workout",   title: "COMPLETE THE MISSION", description: "Complete today's workout",         icon: "flash",      reward: XP_REWARDS.QUEST_DAILY_LARGE, target: 1, cadence: "daily" },
  { id: "q_daily_streak",    title: "KEEP THE STREAK",      description: "Maintain your workout streak",     icon: "flame",      reward: XP_REWARDS.QUEST_DAILY_MED,   target: 1, cadence: "daily" },
  { id: "q_daily_hydration", title: "HYDRATION",            description: "Hit your hydration goal (2.5L)",   icon: "water",      reward: XP_REWARDS.QUEST_DAILY_SMALL, target: 1, cadence: "daily" },
  { id: "q_daily_fuel",      title: "FUEL UP",              description: "Complete your planned meals",      icon: "restaurant", reward: XP_REWARDS.QUEST_DAILY_MED,   target: 4, cadence: "daily" },
  { id: "q_daily_move",      title: "MOVE",                 description: "Complete 3 exercises today",       icon: "walk",       reward: XP_REWARDS.QUEST_DAILY_MED,   target: 3, cadence: "daily" },
];

export const WEEKLY_QUESTS: QuestDef[] = [
  { id: "q_weekly_warrior",  title: "WEEKLY WARRIOR",    description: "Complete 4 workouts this week",              icon: "trophy",      reward: 750,  target: 4,     cadence: "weekly" },
  { id: "q_weekly_king",     title: "CONSISTENCY KING",  description: "Complete every scheduled workout this week", icon: "ribbon",      reward: 1000, target: 5,     cadence: "weekly" },
  { id: "q_weekly_levelup",  title: "LEVEL UP",          description: "Earn 2,000 XP this week",                    icon: "trending-up", reward: 500,  target: 2000,  cadence: "weekly" },
  { id: "q_weekly_perfect",  title: "PERFECT WEEK",      description: "Complete 5 workouts and 20 daily quests",    icon: "star",        reward: 2000, target: 25,    cadence: "weekly" },
];

export const CHALLENGES: ChallengeDef[] = [
  { id: "c_7day",      title: "7 DAY STREAK",       description: "Complete workouts for 7 consecutive days",     icon: "flame",       reward: 500,  target: 7,     difficulty: "EASY",      badgeTitle: "Streak Master" },
  { id: "c_30day",     title: "30 DAY GRIND",       description: "Maintain a 30-day activity streak",            icon: "calendar",    reward: 2000, target: 30,    difficulty: "HARD",      badgeTitle: "The Grinder" },
  { id: "c_ironweek",  title: "IRON WEEK",          description: "Complete every strength workout in one week",  icon: "barbell",     reward: 1500, target: 5,     difficulty: "MEDIUM" },
  { id: "c_climb",     title: "THE CLIMB",          description: "Earn 5,000 XP total",                          icon: "trending-up", reward: 1000, target: 5000,  difficulty: "MEDIUM" },
  { id: "c_apex",      title: "APEX CHALLENGE",     description: "Earn 10,000 XP in a single month",             icon: "paw",         reward: 3000, target: 10000, difficulty: "ELITE",     badgeTitle: "Apex Predator" },
  { id: "c_legendary", title: "LEGENDARY MODE",     description: "Complete every other challenge",               icon: "diamond",     reward: 5000, target: 5,     difficulty: "LEGENDARY", badgeTitle: "Immortal" },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "a_first",         title: "FIRST STEP",      description: "Complete your first workout",       icon: "footsteps",   target: 1,     metric: "workouts_completed" },
  { id: "a_onfire",        title: "ON FIRE",         description: "Reach a 7-day streak",              icon: "flame",       target: 7,     metric: "streak_max" },
  { id: "a_grinder",       title: "GRINDER",         description: "Complete 25 workouts",              icon: "flash",       target: 25,    metric: "workouts_completed" },
  { id: "a_powerhouse",    title: "POWERHOUSE",      description: "Complete 50 workouts",              icon: "barbell",     target: 50,    metric: "workouts_completed" },
  { id: "a_century",       title: "CENTURY",         description: "Complete 100 workouts",             icon: "medal",       target: 100,   metric: "workouts_completed" },
  { id: "a_elite",         title: "ELITE",           description: "Reach Ironclad rank",               icon: "shield",      target: 13,    metric: "rank_index" },
  { id: "a_apex",          title: "APEX PREDATOR",   description: "Reach Apex rank",                   icon: "paw",         target: 21,    metric: "rank_index" },
  { id: "a_titan",         title: "TITAN",           description: "Reach Titan rank",                  icon: "cube",        target: 25,    metric: "rank_index" },
  { id: "a_ascendant",     title: "ASCENSION",       description: "Reach Ascendant rank",              icon: "sparkles",    target: 26,    metric: "rank_index" },
  { id: "a_immortal",      title: "IMMORTAL",        description: "Reach Immortal rank",               icon: "trophy",      target: 27,    metric: "rank_index" },
  { id: "a_questmaster",   title: "QUEST HUNTER",    description: "Complete 50 quests",                icon: "map",         target: 50,    metric: "quests_completed" },
  { id: "a_challenger",    title: "CHALLENGE BEAST", description: "Complete 10 challenges",            icon: "trophy",      target: 10,    metric: "challenges_completed" },
  { id: "a_streak30",      title: "MONTH OF FIRE",   description: "Reach a 30-day streak",             icon: "flame",       target: 30,    metric: "streak_max" },
  { id: "a_xp10k",         title: "TEN K CLUB",      description: "Earn 10,000 total XP",              icon: "trending-up", target: 10000, metric: "xp_total" },
  { id: "a_xp50k",         title: "FIFTY K CLUB",    description: "Earn 50,000 total XP",              icon: "trending-up", target: 50000, metric: "xp_total" },
  { id: "a_completionist", title: "COMPLETIONIST",   description: "Unlock 100 total items",            icon: "diamond",     target: 100,   metric: "achievements_unlocked" },
];

export const TITLES = [
  "The Grinder", "Streak Master", "Quest Hunter", "Iron Warrior",
  "Apex Predator", "Dominator", "Consistency King", "Challenge Beast",
  "Titan", "Ascendant", "Immortal",
];
