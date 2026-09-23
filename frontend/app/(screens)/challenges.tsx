import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { XpToast, pushXpToast } from "@/src/components/xp-toast";
import { CHALLENGES, Difficulty } from "@/src/data/game";
import { useProgress, challengeProgress } from "@/src/store/progress";
import { colors, radius, spacing } from "@/src/theme";

const DIFF_COLORS: Record<Difficulty, string> = {
  EASY: "#26C281",
  MEDIUM: "#4FC3F7",
  HARD: "#FF9800",
  ELITE: "#B388FF",
  LEGENDARY: "#FFD54F",
};

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, claimChallenge } = useProgress();

  const claim = async (id: string) => {
    const ok = await claimChallenge(id);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const def = CHALLENGES.find((c) => c.id === id);
      if (def) pushXpToast(`+${def.reward} XP · ${def.title}`);
    }
  };

  return (
    <View style={styles.root} testID="challenges-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>CHALLENGES</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        {CHALLENGES.map((c) => {
          const p = state ? challengeProgress(state, c.id) : 0;
          const claimed = state?.claimedChallenges.includes(c.id) ?? false;
          const complete = p >= c.target;
          const pct = Math.round((p / c.target) * 100);
          const dc = DIFF_COLORS[c.difficulty];
          return (
            <View key={c.id} style={[styles.card, claimed && styles.cardClaimed]} testID={`challenge-${c.id}`}>
              <View style={styles.top}>
                <View style={[styles.iconWrap, { borderColor: dc, backgroundColor: dc + "22" }]}>
                  <Ionicons name={c.icon as any} size={24} color={dc} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={[styles.diffPill, { borderColor: dc }]}>
                    <Text style={[styles.diffText, { color: dc }]}>{c.difficulty}</Text>
                  </View>
                  <Text style={styles.title}>{c.title}</Text>
                  <Text style={styles.desc}>{c.description}</Text>
                </View>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: claimed ? colors.success : dc }]} /></View>
              <View style={styles.bottom}>
                <View>
                  <Text style={styles.progressTxt}>{p.toLocaleString()} / {c.target.toLocaleString()}</Text>
                  <Text style={styles.rewardTxt}>REWARD: +{c.reward.toLocaleString()} XP{c.badgeTitle ? ` · "${c.badgeTitle}"` : ""}</Text>
                </View>
                <Pressable
                  disabled={!complete || claimed}
                  testID={`claim-${c.id}`}
                  onPress={() => claim(c.id)}
                  style={[styles.claimBtn, { backgroundColor: dc }, (!complete || claimed) && styles.claimBtnDisabled]}
                >
                  <Text style={styles.claimTxt}>{claimed ? "CLAIMED" : complete ? "CLAIM" : "LOCKED"}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <XpToast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardClaimed: { borderColor: colors.success, opacity: 0.85 },
  top: { flexDirection: "row", gap: spacing.md },
  iconWrap: { width: 56, height: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  diffPill: { alignSelf: "flex-start", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1 },
  diffText: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: colors.onSurface, fontSize: 16, fontWeight: "900", letterSpacing: 1, marginTop: 4 },
  desc: { color: colors.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressTxt: { color: colors.onSurface, fontSize: 12, fontWeight: "800" },
  rewardTxt: { color: colors.brandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 2 },
  claimBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  claimBtnDisabled: { backgroundColor: colors.surfaceTertiary },
  claimTxt: { color: "#0D0E12", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
});
