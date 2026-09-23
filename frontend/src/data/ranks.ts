export type RankFamily =
  | "INITIATE"
  | "STRIKER"
  | "VANGUARD"
  | "IRONCLAD"
  | "DOMINATOR"
  | "APEX"
  | "TITAN"
  | "ASCENDANT"
  | "IMMORTAL";

export type Rank = {
  index: number;
  family: RankFamily;
  tier: string; // "I" | "II" | "III" | "IV" or ""
  name: string; // display name e.g. "APEX III"
  minXp: number;
  color: string;
  accent: string;
  icon: string; // ionicons name for placeholder badge
};

const build = (index: number, family: RankFamily, tier: string, minXp: number): Rank => {
  const meta: Record<RankFamily, { color: string; accent: string; icon: string }> = {
    INITIATE: { color: "#CD7F32", accent: "#F0B27A", icon: "shield-outline" },
    STRIKER: { color: "#4FC3F7", accent: "#B3E5FC", icon: "flash" },
    VANGUARD: { color: "#26C281", accent: "#7BE0B3", icon: "shield-half" },
    IRONCLAD: { color: "#B0BEC5", accent: "#ECEFF1", icon: "shield" },
    DOMINATOR: { color: "#FF5A36", accent: "#FF9E7D", icon: "flame" },
    APEX: { color: "#B388FF", accent: "#E1BEE7", icon: "paw" },
    TITAN: { color: "#4FC3F7", accent: "#82B1FF", icon: "cube" },
    ASCENDANT: { color: "#7C4DFF", accent: "#B388FF", icon: "sparkles" },
    IMMORTAL: { color: "#FFD54F", accent: "#FFF176", icon: "trophy" },
  };
  const m = meta[family];
  const name = tier ? `${family} ${tier}` : family;
  return { index, family, tier, name, minXp, color: m.color, accent: m.accent, icon: m.icon };
};

export const RANKS: Rank[] = [
  build(1, "INITIATE", "I", 0),
  build(2, "INITIATE", "II", 500),
  build(3, "INITIATE", "III", 1200),
  build(4, "INITIATE", "IV", 2000),
  build(5, "STRIKER", "I", 3000),
  build(6, "STRIKER", "II", 4200),
  build(7, "STRIKER", "III", 5600),
  build(8, "STRIKER", "IV", 7200),
  build(9, "VANGUARD", "I", 9000),
  build(10, "VANGUARD", "II", 11000),
  build(11, "VANGUARD", "III", 13500),
  build(12, "VANGUARD", "IV", 16000),
  build(13, "IRONCLAD", "I", 19000),
  build(14, "IRONCLAD", "II", 22500),
  build(15, "IRONCLAD", "III", 26000),
  build(16, "IRONCLAD", "IV", 30000),
  build(17, "DOMINATOR", "I", 35000),
  build(18, "DOMINATOR", "II", 40000),
  build(19, "DOMINATOR", "III", 46000),
  build(20, "DOMINATOR", "IV", 52000),
  build(21, "APEX", "I", 60000),
  build(22, "APEX", "II", 70000),
  build(23, "APEX", "III", 82000),
  build(24, "APEX", "IV", 95000),
  build(25, "TITAN", "", 110000),
  build(26, "ASCENDANT", "", 130000),
  build(27, "IMMORTAL", "", 155000),
];

export function rankForXp(xp: number): { current: Rank; next: Rank | null; progress: number } {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) current = r;
    else break;
  }
  const idx = RANKS.indexOf(current);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  const progress = next
    ? Math.min(1, (xp - current.minXp) / (next.minXp - current.minXp))
    : 1;
  return { current, next, progress };
}
