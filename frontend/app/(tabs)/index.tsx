import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RankBadge } from "@/src/components/rank-badge";
import { RankUpModal } from "@/src/components/rank-up-modal";
import { XpBar } from "@/src/components/xp-bar";
import { XpToast } from "@/src/components/xp-toast";
import { DAILY_QUESTS, WEEKLY_QUESTS } from "@/src/data/game";
import { rankForXp } from "@/src/data/ranks";
import { getWorkoutFor } from "@/src/data/workouts";
import { useProgress, questProgress, metrics } from "@/src/store/progress";
import { usesNativeTabs } from "@/src/navigation";
import { colors, radius, spacing } from "@/src/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { state, acknowledgeRankUp } = useProgress();

  const xp = state?.xp ?? 0;
  const { current, next } = rankForXp(xp);
  const m = state ? metrics(state) : null;
  const today = new Date();
  const workout = getWorkoutFor(today);

  const dailyQuestsPreview = useMemo(() => {
    if (!state) return [];
    return DAILY_QUESTS.slice(0, 3).map((q) => {
      const p = questProgress(state, q.id, "daily");
      const claimed = (state.claimedDailyQuests[isoNow()] ?? []).includes(q.id);
      return { q, p, claimed };
    });
  }, [state]);

  const weeklyPreview = useMemo(() => {
    if (!state) return null;
    const q = WEEKLY_QUESTS[0];
    return { q, p: questProgress(state, q.id, "weekly") };
  }, [state]);

  const greeting = getGreeting();
  const unreadNotifs = state?.notifications.filter((n) => !n.seen).length ?? 0;

  return (
    <View style={styles.root} testID="home-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: bottomChrome + spacing.xl,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>{greeting.toUpperCase()},</Text>
            <Text style={styles.username} testID="home-username">
              {state?.username ?? "Athlete"}
            </Text>
            {state?.title ? (
              <Text style={[styles.title, { color: current.color }]}>"{state.title}"</Text>
            ) : null}
          </View>
          <Pressable
            testID="notifications-btn"
            onPress={() => router.push("/(screens)/notifications")}
            style={styles.iconBtn}
          >
            <Ionicons name="notifications" size={20} color={colors.onSurface} />
            {unreadNotifs > 0 ? <View style={styles.badgeDot} /> : null}
          </Pressable>
        </View>

        {/* Rank card */}
        <Pressable
          testID="rank-card"
          onPress={() => router.push("/(tabs)/character")}
          style={styles.rankCard}
        >
          <RankBadge rank={current} size="lg" />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.rankLabel}>CURRENT RANK</Text>
            <Text style={[styles.rankName, { color: current.color }]}>{current.name}</Text>
            <XpBar xp={xp} compact />
            <Text style={styles.xpLine}>
              {formatXp(xp)}{next ? ` / ${formatXp(next.minXp)} XP` : " XP"}
            </Text>
          </View>
        </Pressable>

        {/* Stats grid */}
        <View style={styles.grid}>
          <StatTile icon="flame" label="STREAK" value={`${state?.streak ?? 0}d`} tint={colors.brandPrimary} testID="stat-streak" />
          <StatTile icon="barbell" label="WORKOUTS" value={String(m?.workoutsCompleted ?? 0)} tint={colors.onSurface} testID="stat-workouts" />
        </View>
        <View style={styles.grid}>
          <StatTile icon="flash" label="TOTAL XP" value={formatXp(state?.totalXpEver ?? 0)} tint="#4FC3F7" testID="stat-total-xp" />
          <StatTile icon="trophy" label="ACHIEVEMENTS" value={String(m?.achievementsUnlocked ?? 0)} tint="#FFD54F" testID="stat-achievements" />
        </View>

        {/* Today's mission */}
        <Pressable
          testID="todays-mission"
          onPress={() => router.push("/(tabs)/workout")}
          style={styles.missionCard}
        >
          <View style={styles.missionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>TODAY'S MISSION</Text>
              <Text style={styles.missionTitle}>{workout.title}</Text>
              <Text style={styles.missionSub}>
                {workout.isRest ? "Rest and recover" : `${workout.exercises.length} exercises · ${workout.difficulty}`}
              </Text>
            </View>
            <View style={[styles.missionIcon, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name={workout.isRest ? "bed" : "flash"} size={24} color={colors.brandPrimary} />
            </View>
          </View>
          <View style={styles.missionCta}>
            <Text style={styles.missionCtaText}>OPEN WORKOUT</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.brandPrimary} />
          </View>
        </Pressable>

        {/* Daily quests preview */}
        <Pressable
          testID="quests-card"
          onPress={() => router.push("/(screens)/quests")}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.sectionEyebrow}>DAILY QUESTS</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
          {dailyQuestsPreview.map(({ q, p, claimed }) => (
            <View key={q.id} style={styles.miniQuest}>
              <Ionicons name={q.icon as any} size={16} color={claimed ? colors.success : colors.brandPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.miniQuestTitle}>{q.title}</Text>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: `${Math.round((p / q.target) * 100)}%`, backgroundColor: claimed ? colors.success : colors.brandPrimary }]} />
                </View>
              </View>
              <Text style={styles.miniReward}>+{q.reward}</Text>
            </View>
          ))}
        </Pressable>

        {/* Weekly challenge preview */}
        {weeklyPreview && (
          <Pressable
            testID="challenges-card"
            onPress={() => router.push("/(screens)/challenges")}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.sectionEyebrow}>WEEKLY CHALLENGE</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
            <Text style={styles.weeklyTitle}>{weeklyPreview.q.title}</Text>
            <Text style={styles.weeklyDesc}>{weeklyPreview.q.description}</Text>
            <View style={styles.miniTrack}>
              <View style={[styles.miniFill, { width: `${Math.round((weeklyPreview.p / weeklyPreview.q.target) * 100)}%`, backgroundColor: colors.brandPrimary }]} />
            </View>
            <Text style={styles.miniReward}>+{weeklyPreview.q.reward} XP</Text>
          </Pressable>
        )}

        {/* Nav grid */}
        <View style={styles.navGrid}>
          <NavTile icon="trophy" label="Challenges" onPress={() => router.push("/(screens)/challenges")} testID="nav-challenges" />
          <NavTile icon="medal" label="Achievements" onPress={() => router.push("/(screens)/achievements")} testID="nav-achievements" />
          <NavTile icon="podium" label="Leaderboard" onPress={() => router.push("/(screens)/leaderboard")} testID="nav-leaderboard" />
          <NavTile icon="stats-chart" label="Stats" onPress={() => router.push("/(screens)/stats")} testID="nav-stats" />
        </View>
      </ScrollView>

      <XpToast />
      <RankUpModal
        fromIndex={state?.pendingRankUp?.fromIndex ?? null}
        toIndex={state?.pendingRankUp?.toIndex ?? null}
        onDismiss={() => { void acknowledgeRankUp(); }}
      />
    </View>
  );
}

function StatTile({ icon, label, value, tint, testID }: { icon: string; label: string; value: string; tint: string; testID: string }) {
  return (
    <View style={styles.statTile} testID={testID}>
      <Ionicons name={icon as any} size={16} color={tint} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NavTile({ icon, label, onPress, testID }: { icon: string; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={styles.navTile}>
      <Ionicons name={icon as any} size={22} color={colors.brandPrimary} />
      <Text style={styles.navLabel}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function isoNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatXp(n: number): string {
  return n.toLocaleString();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  hello: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 2 },
  username: { color: colors.onSurface, fontSize: 24, fontWeight: "900", letterSpacing: -0.3 },
  title: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 2 },
  iconBtn: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  badgeDot: { position: "absolute", top: 10, right: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brandPrimary },
  rankCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  rankLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  rankName: { fontSize: 22, fontWeight: "900", letterSpacing: 1.5 },
  xpLine: { color: colors.onSurfaceTertiary, fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  grid: { flexDirection: "row", gap: spacing.sm },
  statTile: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statValue: { color: colors.onSurface, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  sectionEyebrow: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2.5 },
  missionCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
  },
  missionRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  missionTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "900", letterSpacing: -0.2, marginTop: 4 },
  missionSub: { color: colors.onSurfaceTertiary, fontSize: 12, fontWeight: "700", marginTop: 2 },
  missionIcon: {
    width: 52, height: 52, borderRadius: radius.md,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.brandPrimary,
  },
  missionCta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.xs, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  missionCtaText: { color: colors.brandPrimary, fontWeight: "900", letterSpacing: 1.5, fontSize: 12 },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  miniQuest: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  miniQuestTitle: { color: colors.onSurface, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  miniTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, marginTop: 4, overflow: "hidden" },
  miniFill: { height: "100%", borderRadius: radius.pill },
  miniReward: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  weeklyTitle: { color: colors.onSurface, fontSize: 18, fontWeight: "900", letterSpacing: -0.3 },
  weeklyDesc: { color: colors.onSurfaceTertiary, fontSize: 12 },
  navGrid: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  navTile: {
    flexGrow: 1, flexBasis: "46%",
    padding: spacing.md, backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", gap: spacing.xs,
  },
  navLabel: { color: colors.onSurface, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
});
