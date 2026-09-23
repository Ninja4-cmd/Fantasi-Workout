import { View, Text, StyleSheet } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";

import { colors, radius, spacing } from "@/src/theme";
import { Rank } from "@/src/data/ranks";

type Props = {
  rank: Rank;
  size?: "sm" | "md" | "lg" | "xl";
  testID?: string;
};

// Placeholder badge until user drops in real art:
// stacked shield tile with color per family, rank icon in the center, tier stars.
export function RankBadge({ rank, size = "md", testID }: Props) {
  const dims = size === "xl" ? 132 : size === "lg" ? 96 : size === "md" ? 64 : 44;
  const iconSize = size === "xl" ? 56 : size === "lg" ? 40 : size === "md" ? 26 : 18;
  const abbrSize = size === "xl" ? 15 : size === "lg" ? 12 : 9;
  const starSize = size === "xl" ? 12 : size === "lg" ? 10 : 8;
  return (
    <View
      testID={testID ?? "rank-badge"}
      style={[
        styles.wrap,
        { width: dims, height: dims, borderRadius: radius.md, borderColor: rank.color },
      ]}
    >
      <View
        style={[
          styles.glow,
          { backgroundColor: rank.color + "22", borderRadius: radius.md },
        ]}
      />
      <Ionicons name={rank.icon as any} size={iconSize} color={rank.color} />
      <Text style={[styles.family, { color: rank.color, fontSize: abbrSize }]}>
        {rank.family.slice(0, 4)}
      </Text>
      {rank.tier ? (
        <View style={styles.tiers}>
          {["I", "II", "III", "IV"].slice(0, tierNum(rank.tier)).map((_, i) => (
            <View key={i} style={[styles.tierDot, { backgroundColor: rank.color, width: starSize, height: starSize, borderRadius: starSize / 2 }]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function tierNum(tier: string): number {
  if (tier === "I") return 1;
  if (tier === "II") return 2;
  if (tier === "III") return 3;
  if (tier === "IV") return 4;
  return 0;
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
  },
  glow: { ...StyleSheet.absoluteFillObject },
  family: {
    marginTop: 2,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  tiers: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  tierDot: {},
});
