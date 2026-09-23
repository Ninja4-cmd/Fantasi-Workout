export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSec: number;
};

export type WorkoutDay = {
  id: string;
  weekday: number; // 0 Sun ... 6 Sat
  title: string;
  subtitle: string;
  category: "PUSH" | "PULL" | "LEGS" | "SHOULDERS" | "POSTERIOR" | "REST";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  exercises: Exercise[];
  isRest: boolean;
};

const e = (id: string, name: string, sets: number, reps: string, restSec: number): Exercise => ({
  id, name, sets, reps, restSec,
});

export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    id: "sun", weekday: 0, title: "REST DAY", subtitle: "Recover Your Strength",
    category: "REST", difficulty: "EASY", isRest: true, exercises: [],
  },
  {
    id: "mon", weekday: 1, title: "CHEST + TRICEPS", subtitle: "Push Day",
    category: "PUSH", difficulty: "MEDIUM", isRest: false,
    exercises: [
      e("mon-1", "Dumbbell Bench Press", 3, "8-12", 90),
      e("mon-2", "Incline Dumbbell Press", 3, "8-12", 90),
      e("mon-3", "Chest Fly Machine", 3, "10-15", 60),
      e("mon-4", "Push-ups", 2, "10-15", 60),
      e("mon-5", "Triceps Pushdowns", 3, "10-15", 60),
      e("mon-6", "Overhead Triceps Extensions", 2, "10-15", 60),
    ],
  },
  {
    id: "tue", weekday: 2, title: "QUADS + CALVES", subtitle: "Leg Day",
    category: "LEGS", difficulty: "HARD", isRest: false,
    exercises: [
      e("tue-1", "Leg Press", 3, "10-12", 90),
      e("tue-2", "Goblet Squat", 3, "8-12", 90),
      e("tue-3", "Bulgarian Split Squat", 3, "8-10 each leg", 75),
      e("tue-4", "Leg Extensions", 3, "12-15", 60),
      e("tue-5", "Calf Raises", 3, "12-15", 45),
      e("tue-6", "Plank", 3, "30-60 sec", 45),
    ],
  },
  {
    id: "wed", weekday: 3, title: "BACK + BICEPS", subtitle: "Pull Day",
    category: "PULL", difficulty: "MEDIUM", isRest: false,
    exercises: [
      e("wed-1", "Lat Pulldown", 3, "8-12", 90),
      e("wed-2", "Seated Cable Row", 3, "8-12", 90),
      e("wed-3", "Dumbbell Row", 3, "8-12", 75),
      e("wed-4", "Face Pulls", 3, "12-15", 60),
      e("wed-5", "Dumbbell Curls", 3, "10-15", 60),
      e("wed-6", "Hammer Curls", 2, "10-15", 60),
    ],
  },
  {
    id: "thu", weekday: 4, title: "SHOULDERS + ARMS", subtitle: "Delts & Guns",
    category: "SHOULDERS", difficulty: "MEDIUM", isRest: false,
    exercises: [
      e("thu-1", "Dumbbell Shoulder Press", 3, "8-12", 90),
      e("thu-2", "Lateral Raises", 3, "12-15", 60),
      e("thu-3", "Rear-Delt Fly", 3, "12-15", 60),
      e("thu-4", "Cable Curls", 3, "10-15", 60),
      e("thu-5", "Triceps Pushdowns", 3, "10-15", 60),
      e("thu-6", "Hammer Curls", 2, "10-15", 60),
    ],
  },
  {
    id: "fri", weekday: 5, title: "HAMSTRINGS + GLUTES + CORE", subtitle: "Posterior Chain",
    category: "POSTERIOR", difficulty: "HARD", isRest: false,
    exercises: [
      e("fri-1", "Romanian Deadlift", 3, "8-10", 90),
      e("fri-2", "Hip Thrust", 3, "8-12", 90),
      e("fri-3", "Leg Curl", 3, "10-15", 60),
      e("fri-4", "Walking Lunges", 3, "8 each leg", 75),
      e("fri-5", "Calf Raises", 3, "12-15", 45),
      e("fri-6", "Hanging Knee Raises", 3, "8-12", 60),
    ],
  },
  {
    id: "sat", weekday: 6, title: "REST DAY", subtitle: "Recover Your Strength",
    category: "REST", difficulty: "EASY", isRest: true, exercises: [],
  },
];

export function getWorkoutFor(date: Date): WorkoutDay {
  return WORKOUT_PLAN.find((d) => d.weekday === date.getDay()) ?? WORKOUT_PLAN[0];
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoWeekOf(d: Date): string {
  // ISO week number as YYYY-Www
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function weekStart(d: Date): Date {
  // Monday-start week
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
