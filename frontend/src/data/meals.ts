export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type MealOption = {
  id: string;
  slot: MealSlot;
  title: string;
  emoji: string;
  items: string[]; // ingredient list
  focus: string; // "balanced" | "recovery" | "energy"
};

export const MEAL_OPTIONS: Record<MealSlot, MealOption[]> = {
  breakfast: [
    { id: "b1", slot: "breakfast", title: "Oats Power Bowl",    emoji: "🥣", items: ["Oatmeal made with milk", "Banana slices", "Peanut butter", "Greek yogurt"], focus: "energy" },
    { id: "b2", slot: "breakfast", title: "Classic Athlete",    emoji: "🍳", items: ["2-3 eggs", "2 slices whole-grain toast", "Banana", "Glass of milk"], focus: "balanced" },
    { id: "b3", slot: "breakfast", title: "Yogurt Parfait",     emoji: "🥛", items: ["Greek yogurt", "Granola", "Mixed berries", "Honey drizzle"], focus: "recovery" },
    { id: "b4", slot: "breakfast", title: "Green Smoothie",     emoji: "🥤", items: ["Milk", "Banana", "Spinach", "Oats", "Peanut butter"], focus: "energy" },
  ],
  lunch: [
    { id: "l1", slot: "lunch", title: "Chicken + Rice Plate",   emoji: "🍗", items: ["Grilled chicken", "White rice", "Steamed vegetables", "Fruit", "Milk"], focus: "balanced" },
    { id: "l2", slot: "lunch", title: "Turkey Wrap",            emoji: "🌯", items: ["Whole-grain tortilla", "Turkey slices", "Avocado", "Lettuce + tomato", "Fruit side"], focus: "balanced" },
    { id: "l3", slot: "lunch", title: "Beef & Potatoes",        emoji: "🥩", items: ["Lean ground beef", "Baked potato", "Broccoli", "Milk or water"], focus: "recovery" },
    { id: "l4", slot: "lunch", title: "Bean Bowl",              emoji: "🌱", items: ["Black beans", "Brown rice", "Corn + salsa", "Avocado", "Cheese"], focus: "energy" },
  ],
  dinner: [
    { id: "d1", slot: "dinner", title: "Chicken Pasta",         emoji: "🍝", items: ["Chicken breast", "Whole-wheat pasta", "Vegetables", "Olive oil"], focus: "balanced" },
    { id: "d2", slot: "dinner", title: "Turkey Tacos",          emoji: "🌮", items: ["Turkey", "Corn tortillas", "Rice", "Beans", "Salsa"], focus: "recovery" },
    { id: "d3", slot: "dinner", title: "Steak & Sweet Potato",  emoji: "🥔", items: ["Lean steak", "Sweet potato", "Green beans", "Avocado"], focus: "recovery" },
    { id: "d4", slot: "dinner", title: "Spaghetti Meat Sauce",  emoji: "🍅", items: ["Spaghetti", "Beef meat sauce", "Side salad", "Milk"], focus: "energy" },
  ],
  snack: [
    { id: "s1", slot: "snack", title: "PB Sandwich",            emoji: "🥪", items: ["Whole-grain bread", "Peanut butter", "Banana"], focus: "energy" },
    { id: "s2", slot: "snack", title: "Yogurt & Granola",       emoji: "🥣", items: ["Greek yogurt", "Granola", "Fruit"], focus: "recovery" },
    { id: "s3", slot: "snack", title: "Cheese & Crackers",      emoji: "🧀", items: ["Cheese slices", "Whole-grain crackers", "Fruit"], focus: "balanced" },
    { id: "s4", slot: "snack", title: "Recovery Smoothie",      emoji: "🥤", items: ["Milk", "Banana", "Oats", "Peanut butter", "Yogurt"], focus: "recovery" },
  ],
};

export const HYDRATION_STEP_ML = 250; // one glass
export const HYDRATION_GOAL_ML = 2500; // 2.5L default

export const MEAL_SLOT_ORDER: MealSlot[] = ["breakfast", "lunch", "snack", "dinner"];

export const MEAL_TIMES: Record<MealSlot, string> = {
  breakfast: "7:00 AM",
  lunch: "12:30 PM",
  snack: "3:30 PM",
  dinner: "6:30 PM",
};
