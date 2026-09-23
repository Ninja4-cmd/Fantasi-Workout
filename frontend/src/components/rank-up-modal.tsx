import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { RankBadge } from "@/src/components/rank-badge";
import { ImmortalCinematic } from "@/src/components/immortal-cinematic";
import { RANKS } from "@/src/data/ranks";
import { colors, radius, spacing } from "@/src/theme";

type Props = {
  fromIndex: number | null;
  toIndex: number | null;
  onDismiss: () => void;
};

export function RankUpModal({ fromIndex, toIndex, onDismiss }: Props) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const visible = fromIndex != null && toIndex != null && toIndex > fromIndex;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.4);
    glow.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ]),
      ).start(),
    ]).start();
  }, [visible, scale, glow]);

  if (!visible) return null;
  const from = RANKS[fromIndex!];
  const to = RANKS[toIndex!];

  // Hitting the final rank triggers the dedicated Immortal cinematic instead of the card.
  if (to.family === "IMMORTAL") {
    return <ImmortalCinematic visible onDismiss={onDismiss} />;
  }

  const isMajor = to.family === "TITAN" || to.family === "ASCENDANT" || to.family === "APEX";

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.bg} testID="rank-up-modal">
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale }],
              shadowOpacity: glow,
              borderColor: to.color,
            },
          ]}
        >
          <Text style={styles.eyebrow}>{isMajor ? "MAJOR PROMOTION" : "RANK UP"}</Text>
          <View style={styles.row}>
            <RankBadge rank={from} size="lg" />
            <Text style={[styles.arrow, { color: to.color }]}>→</Text>
            <RankBadge rank={to} size="lg" />
          </View>
          <Text style={[styles.name, { color: to.color }]}>{to.name}</Text>
          <Text style={styles.hint}>New badge unlocked</Text>
          <Pressable
            testID="rank-up-dismiss"
            onPress={onDismiss}
            style={[styles.btn, { backgroundColor: to.color }]}
          >
            <Text style={styles.btnText}>CONTINUE</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 2,
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 10,
  },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: "900", letterSpacing: 3 },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  arrow: { fontSize: 44, fontWeight: "900" },
  name: { fontSize: 30, fontWeight: "900", letterSpacing: 2, marginTop: spacing.sm },
  hint: { color: colors.onSurfaceTertiary, fontSize: 12, letterSpacing: 1.5, fontWeight: "700" },
  btn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, marginTop: spacing.sm },
  btnText: { color: "#0D0E12", fontWeight: "900", letterSpacing: 2, fontSize: 14 },
});
