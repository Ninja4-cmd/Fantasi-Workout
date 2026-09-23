import { Stack, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RankBadge } from "@/src/components/rank-badge";
import { XpBar } from "@/src/components/xp-bar";
import { rankForXp, RANKS } from "@/src/data/ranks";
import { useProgress, metrics } from "@/src/store/progress";
import { colors, radius, spacing } from "@/src/theme";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, resetProgress } = useProgress();
  const xp = state?.xp ?? 0;
  const { current, next } = rankForXp(xp);
  const m = state ? metrics(state) : null;
  const xpToNext = next ? Math.max(0, next.minXp - xp) : 0;

  const weeklyExercises = state ? Object.entries(state.completedExercises).reduce((acc, [d, arr]) => acc + (d >= isoDaysAgo(7) ? arr.length : 0), 0) : 0;
  const monthlyExercises = state ? Object.entries(state.completedExercises).reduce((acc, [d, arr]) => acc + (d >= isoDaysAgo(30) ? arr.length : 0), 0) : 0;
  const totalActivities = (m?.workoutsCompleted ?? 0) + (m?.questsCompleted ?? 0) + (m?.challengesCompleted ?? 0) + (m?.achievementsUnlocked ?? 0);

  return (
    <View style={styles.root} testID="stats-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>STATS</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xl }}>
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <RankBadge rank={current} size="lg" />
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>YOUR RANK</Text>
              <Text style={[styles.rank, { color: current.color }]}>{current.name}</Text>
              <XpBar xp={xp} compact />
              <Text style={styles.xpMeta}>
                {xp.toLocaleString()} XP{next ? ` · ${xpToNext.toLocaleString()} to ${next.name}` : " · MAX"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          <StatBox testID="stat-total-xp"    label="TOTAL XP EVER"   value={(state?.totalXpEver ?? 0).toLocaleString()} tint={colors.brandPrimary} />
          <StatBox testID="stat-current-rank" label="RANK"            value={`#${current.index}/27`} tint={current.color} />
        </View>
        <View style={styles.grid}>
          <StatBox testID="stat-workouts"    label="WORKOUTS DONE"    value={String(m?.workoutsCompleted ?? 0)} tint="#4FC3F7" />
          <StatBox testID="stat-streak"      label="STREAK / MAX"     value={`${state?.streak ?? 0}d / ${state?.streakMax ?? 0}d`} tint="#FF9800" />
        </View>
        <View style={styles.grid}>
          <StatBox testID="stat-quests"      label="QUESTS DONE"      value={String(m?.questsCompleted ?? 0)} tint="#7C4DFF" />
          <StatBox testID="stat-challenges"  label="CHALLENGES DONE"  value={String(m?.challengesCompleted ?? 0)} tint="#26C281" />
        </View>
        <View style={styles.grid}>
          <StatBox testID="stat-achievements" label="ACHIEVEMENTS"    value={String(m?.achievementsUnlocked ?? 0)} tint="#FFD54F" />
          <StatBox testID="stat-total-acts"   label="TOTAL UNLOCKS"   value={String(totalActivities)} tint={colors.onSurface} />
        </View>
        <View style={styles.grid}>
          <StatBox testID="stat-weekly"      label="EXERCISES / 7D"   value={String(weeklyExercises)} tint={colors.brandPrimary} />
          <StatBox testID="stat-monthly"     label="EXERCISES / 30D"  value={String(monthlyExercises)} tint={colors.brandPrimary} />
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>RANK LADDER</Text>
          <View style={{ gap: 4, marginTop: spacing.sm }}>
            {RANKS.map((r) => {
              const isCurrent = r.index === current.index;
              const reached = xp >= r.minXp;
              return (
                <View key={r.name} style={[styles.ladderRow, isCurrent && styles.ladderRowActive]}>
                  <View style={[styles.ladderDot, { backgroundColor: reached ? r.color : colors.surfaceTertiary, borderColor: r.color }]} />
                  <Text style={[styles.ladderName, isCurrent && { color: r.color }, !reached && { color: colors.muted }]}>{r.name}</Text>
                  <Text style={styles.ladderXp}>{r.minXp.toLocaleString()} XP</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Pressable
          testID="reset-progress-btn"
          onPress={resetProgress}
          style={styles.resetBtn}
        >
          <Ionicons name="refresh" size={16} color={colors.error} />
          <Text style={styles.resetTxt}>RESET ALL PROGRESS</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, tint, testID }: { label: string; value: string; tint: string; testID: string }) {
  return (
    <View style={styles.tile} testID={testID}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={[styles.tileLabel, { color: tint }]}>{label}</Text>
    </View>
  );
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  card: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  rank: { fontSize: 24, fontWeight: "900", letterSpacing: 1, marginTop: 2 },
  xpMeta: { color: colors.onSurfaceTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  grid: { flexDirection: "row", gap: spacing.sm },
  tile: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: 4 },
  tileValue: { color: colors.onSurface, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  tileLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  ladderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  ladderRowActive: { backgroundColor: colors.surfaceTertiary },
  ladderDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  ladderName: { color: colors.onSurface, fontSize: 12, fontWeight: "900", letterSpacing: 1.5, flex: 1 },
  ladderXp: { color: colors.onSurfaceTertiary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  resetBtn: { flexDirection: "row", gap: spacing.sm, justifyContent: "center", alignItems: "center", paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.error, borderRadius: radius.md },
  resetTxt: { color: colors.error, fontWeight: "900", letterSpacing: 1.5, fontSize: 12 },
});
