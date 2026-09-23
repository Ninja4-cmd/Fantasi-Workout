import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { XpToast, pushXpToast } from "@/src/components/xp-toast";
import { ACHIEVEMENTS } from "@/src/data/game";
import { useProgress, achievementProgress } from "@/src/store/progress";
import { colors, radius, spacing } from "@/src/theme";

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, claimAchievement } = useProgress();

  const claim = async (id: string) => {
    const ok = await claimAchievement(id);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) pushXpToast(`ACHIEVEMENT · ${def.title}`);
    }
  };

  return (
    <View style={styles.root} testID="achievements-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>ACHIEVEMENTS</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        {ACHIEVEMENTS.map((a) => {
          const p = state ? achievementProgress(state, a.id) : 0;
          const claimed = state?.claimedAchievements.includes(a.id) ?? false;
          const complete = p >= a.target;
          const pct = Math.round((p / a.target) * 100);
          return (
            <View
              key={a.id}
              testID={`achievement-${a.id}`}
              style={[styles.row, complete && styles.rowUnlocked, claimed && { borderColor: colors.success }]}
            >
              <View style={[styles.iconWrap, claimed ? styles.iconDone : complete ? styles.iconReady : styles.iconLocked]}>
                <Ionicons name={complete ? (a.icon as any) : "lock-closed"} size={24} color={claimed ? colors.onSuccess : complete ? colors.brandPrimary : colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, !complete && styles.titleLocked]}>{a.title}</Text>
                <Text style={styles.desc}>{a.description}</Text>
                <View style={styles.trackWrap}>
                  <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: claimed ? colors.success : colors.brandPrimary }]} /></View>
                  <Text style={styles.progressTxt}>{p.toLocaleString()} / {a.target.toLocaleString()}</Text>
                </View>
              </View>
              <Pressable
                disabled={!complete || claimed}
                testID={`claim-${a.id}`}
                onPress={() => claim(a.id)}
                style={[styles.claimBtn, (!complete || claimed) && styles.claimBtnDisabled]}
              >
                <Text style={styles.claimTxt}>{claimed ? "✓" : complete ? "CLAIM" : "LOCKED"}</Text>
              </Pressable>
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
  row: { flexDirection: "row", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  rowUnlocked: { borderColor: colors.brandPrimary },
  iconWrap: { width: 52, height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  iconLocked: { backgroundColor: colors.surfaceTertiary, borderColor: colors.border },
  iconReady: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary },
  iconDone: { backgroundColor: colors.success, borderColor: colors.success },
  title: { color: colors.onSurface, fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  titleLocked: { color: colors.onSurfaceTertiary },
  desc: { color: colors.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  trackWrap: { marginTop: 6, gap: 4 },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  progressTxt: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  claimBtn: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.brandPrimary },
  claimBtnDisabled: { backgroundColor: colors.surfaceTertiary },
  claimTxt: { color: colors.onBrandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
});
