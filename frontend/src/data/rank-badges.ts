// Static require map for the 27 illustrated rank badges (assets/badges/rank_XX.png).
// Keyed by Rank.index (1..27). Metro requires static require() calls.
export const RANK_BADGE_IMAGES: Record<number, number> = {
  1: require("@/assets/badges/rank_01.png"),
  2: require("@/assets/badges/rank_02.png"),
  3: require("@/assets/badges/rank_03.png"),
  4: require("@/assets/badges/rank_04.png"),
  5: require("@/assets/badges/rank_05.png"),
  6: require("@/assets/badges/rank_06.png"),
  7: require("@/assets/badges/rank_07.png"),
  8: require("@/assets/badges/rank_08.png"),
  9: require("@/assets/badges/rank_09.png"),
  10: require("@/assets/badges/rank_10.png"),
  11: require("@/assets/badges/rank_11.png"),
  12: require("@/assets/badges/rank_12.png"),
  13: require("@/assets/badges/rank_13.png"),
  14: require("@/assets/badges/rank_14.png"),
  15: require("@/assets/badges/rank_15.png"),
  16: require("@/assets/badges/rank_16.png"),
  17: require("@/assets/badges/rank_17.png"),
  18: require("@/assets/badges/rank_18.png"),
  19: require("@/assets/badges/rank_19.png"),
  20: require("@/assets/badges/rank_20.png"),
  21: require("@/assets/badges/rank_21.png"),
  22: require("@/assets/badges/rank_22.png"),
  23: require("@/assets/badges/rank_23.png"),
  24: require("@/assets/badges/rank_24.png"),
  25: require("@/assets/badges/rank_25.png"),
  26: require("@/assets/badges/rank_26.png"),
  27: require("@/assets/badges/rank_27.png"),
};

export function badgeImageForRank(index: number): number | undefined {
  return RANK_BADGE_IMAGES[index];
}
