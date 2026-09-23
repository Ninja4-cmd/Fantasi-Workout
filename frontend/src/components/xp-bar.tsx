import { View, Text, StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/src/theme";
import { rankForXp } from "@/src/data/ranks";

type Props = {
  xp: number;
  compact?: boolean;
};

export function XpBar({ xp, compact }: Props) {
  const { current, next, progress } = rankForXp(xp);
  const pct = Math.round(progress * 100);
  return (
    <View testID="xp-bar" style={styles.wrap}>
      {!compact && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: current.color }]}>
            {current.name.toUpperCase()} {current.tier}
          </Text>
          <Text style={styles.xpText} testID="xp-total-text">
            {xp} XP
          </Text>
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      {!compact && (
        <Text style={styles.next}>
          {next
            ? `${next.minXp - xp} XP to ${next.name.toUpperCase()} ${next.tier}`
            : "Maximum rank reached"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
  xpText: { color: colors.onSurface, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTertiary,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
  },
  next: { color: colors.muted, fontSize: 11, letterSpacing: 0.5, fontWeight: "600" },
});
