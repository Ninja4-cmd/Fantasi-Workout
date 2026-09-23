import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { XpToast, pushXpToast } from "@/src/components/xp-toast";
import { DAILY_QUESTS, WEEKLY_QUESTS } from "@/src/data/game";
import { useProgress, questProgress, todayISO } from "@/src/store/progress";
import { colors, radius, spacing } from "@/src/theme";
import { isoWeekOf } from "@/src/data/workouts";

export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, claimDailyQuest, claimWeeklyQuest } = useProgress();

  const today = todayISO();
  const week = isoWeekOf(new Date());
  const claimedD = state?.claimedDailyQuests[today] ?? [];
  const claimedW = state?.claimedWeeklyQuests[week] ?? [];

  const claim = async (id: string, cadence: "daily" | "weekly") => {
    const ok = cadence === "daily" ? await claimDailyQuest(id) : await claimWeeklyQuest(id);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const def = (cadence === "daily" ? DAILY_QUESTS : WEEKLY_QUESTS).find((q) => q.id === id);
      if (def) pushXpToast(`+${def.reward} XP · ${def.title}`);
    }
  };

  return (
    <View style={styles.root} testID="quests-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="back-btn" onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>QUESTS</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>DAILY QUESTS</Text>
        {DAILY_QUESTS.map((q) => {
          const p = state ? questProgress(state, q.id, "daily") : 0;
          const claimed = claimedD.includes(q.id);
          const complete = p >= q.target;
          const pct = Math.round((p / q.target) * 100);
          return (
            <View key={q.id} style={[styles.card, claimed && styles.cardClaimed]} testID={`quest-${q.id}`}>
              <View style={styles.rowTop}>
                <View style={[styles.iconWrap, { backgroundColor: claimed ? colors.success : colors.brandTertiary, borderColor: claimed ? colors.success : colors.brandPrimary }]}>
                  <Ionicons name={q.icon as any} size={20} color={claimed ? colors.onSuccess : colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qTitle}>{q.title}</Text>
                  <Text style={styles.qDesc}>{q.description}</Text>
                </View>
                <View style={styles.reward}>
                  <Text style={styles.rewardTxt}>+{q.reward}</Text>
                  <Text style={styles.rewardLbl}>XP</Text>
                </View>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: claimed ? colors.success : colors.brandPrimary }]} /></View>
              <View style={styles.rowBottom}>
                <Text style={styles.progressText}>{p} / {q.target}</Text>
                <Pressable
                  disabled={!complete || claimed}
                  testID={`claim-${q.id}`}
                  onPress={() => claim(q.id, "daily")}
                  style={[styles.claimBtn, (!complete || claimed) && styles.claimBtnDisabled]}
                >
                  <Text style={styles.claimTxt}>{claimed ? "CLAIMED" : complete ? "CLAIM" : "IN PROGRESS"}</Text>
                </Pressable>
              </View>
            </View>
          );
        })}

        <Text style={[styles.section, { marginTop: spacing.md }]}>WEEKLY QUESTS</Text>
        {WEEKLY_QUESTS.map((q) => {
          const p = state ? questProgress(state, q.id, "weekly") : 0;
          const claimed = claimedW.includes(q.id);
          const complete = p >= q.target;
          const pct = Math.round((p / q.target) * 100);
          return (
            <View key={q.id} style={[styles.card, claimed && styles.cardClaimed]} testID={`quest-${q.id}`}>
              <View style={styles.rowTop}>
                <View style={[styles.iconWrap, { backgroundColor: claimed ? colors.success : "#7C4DFF22", borderColor: claimed ? colors.success : "#7C4DFF" }]}>
                  <Ionicons name={q.icon as any} size={20} color={claimed ? colors.onSuccess : "#7C4DFF"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qTitle}>{q.title}</Text>
                  <Text style={styles.qDesc}>{q.description}</Text>
                </View>
                <View style={styles.reward}>
                  <Text style={styles.rewardTxt}>+{q.reward}</Text>
                  <Text style={styles.rewardLbl}>XP</Text>
                </View>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${pct}%`, backgroundColor: claimed ? colors.success : "#7C4DFF" }]} /></View>
              <View style={styles.rowBottom}>
                <Text style={styles.progressText}>{p} / {q.target}</Text>
                <Pressable
                  disabled={!complete || claimed}
                  testID={`claim-${q.id}`}
                  onPress={() => claim(q.id, "weekly")}
                  style={[styles.claimBtn, (!complete || claimed) && styles.claimBtnDisabled]}
                >
                  <Text style={styles.claimTxt}>{claimed ? "CLAIMED" : complete ? "CLAIM" : "IN PROGRESS"}</Text>
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
  section: { color: colors.brandPrimary, fontSize: 12, fontWeight: "900", letterSpacing: 2.5 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardClaimed: { borderColor: colors.success, opacity: 0.85 },
  rowTop: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  qTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  qDesc: { color: colors.onSurfaceTertiary, fontSize: 12, marginTop: 2 },
  reward: { alignItems: "flex-end" },
  rewardTxt: { color: colors.brandPrimary, fontSize: 16, fontWeight: "900" },
  rewardLbl: { color: colors.brandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
  rowBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressText: { color: colors.onSurfaceTertiary, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  claimBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.brandPrimary },
  claimBtnDisabled: { backgroundColor: colors.surfaceTertiary },
  claimTxt: { color: colors.onBrandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
});
