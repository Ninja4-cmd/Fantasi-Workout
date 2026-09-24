// XP rewards for events
export const XP_REWARDS = {
  EXERCISE_COMPLETE: 40,
  WORKOUT_COMPLETE: 250,
  DIFFICULT_WORKOUT_COMPLETE: 400,
  DAILY_GOAL: 100,
  WEEKLY_GOAL: 500,
  QUEST_DAILY_SMALL: 75,
  QUEST_DAILY_MED: 100,
  QUEST_DAILY_LARGE: 250,
  QUEST_WEEKLY_SMALL: 500,
  QUEST_WEEKLY_LARGE: 2000,
  CHALLENGE_EASY: 500,
  CHALLENGE_MEDIUM: 1000,
  CHALLENGE_HARD: 1500,
  CHALLENGE_ELITE: 3000,
  CHALLENGE_LEGENDARY: 5000,
  STREAK_7: 500,
  STREAK_30: 2000,
  PERSONAL_RECORD: 250,
  ALL_WEEK_WORKOUTS: 1000,
  MEAL_COMPLETE: 25,
  HYDRATION_GOAL: 75,
  INVITE_FRIEND: 500,
};

// Streak protection shields are bought with XP that sits *above* your current rank
// threshold, so buying never drops your rank.
export const STREAK_SHIELD_COST = 1500;
// Grant a reward chest every N character levels (level = 1 + floor(totalXP/500)).
export const CHEST_LEVEL_INTERVAL = 5;
// Exclusive titles that can drop from chests.
export const CHEST_TITLES = ["Vault Raider", "Fortune's Favor", "Golden One", "Lucky Star", "Chestbreaker"];

export const DAILY_HYDRATION_GOAL_ML = 2500; // 2.5L default
