import { View, Image, StyleSheet } from "react-native";

import { Rank } from "@/src/data/ranks";
import { badgeImageForRank } from "@/src/data/rank-badges";

type Props = {
  rank: Rank;
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  testID?: string;
};

// Illustrated rank badges (assets/badges). A soft colored glow sits behind the art
// so it reads well on the dark surfaces.
export function RankBadge({ rank, size = "md", glow = true, testID }: Props) {
  const dims = size === "xl" ? 140 : size === "lg" ? 100 : size === "md" ? 64 : 44;
  const src = badgeImageForRank(rank.index);
  return (
    <View
      testID={testID ?? "rank-badge"}
      style={[styles.wrap, { width: dims, height: dims }]}
    >
      {glow ? (
        <View
          style={[
            styles.glow,
            {
              width: dims * 0.82,
              height: dims * 0.82,
              borderRadius: (dims * 0.82) / 2,
              backgroundColor: rank.color + "33",
            },
          ]}
        />
      ) : null}
      <Image source={src} style={{ width: dims, height: dims }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
  },
});
