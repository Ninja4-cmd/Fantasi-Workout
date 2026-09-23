import { Stack, useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RankBadge } from "@/src/components/rank-badge";
import { fetchLeaderboard, LeaderboardResp, LeaderboardRow } from "@/src/store/api";
import { rankForXp } from "@/src/data/ranks";
import { useProgress } from "@/src/store/progress";
import { colors, radius, spacing } from "@/src/theme";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useProgress();
  const [tab, setTab] = useState<"GLOBAL" | "NEARBY">("GLOBAL");
  const [data, setData] = useState<LeaderboardResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!state?.deviceId) return;
    setLoading(true); setError(null);
    try {
      const d = await fetchLeaderboard(state.deviceId, 100);
      setData(d);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [state?.deviceId]);

  useEffect(() => { load(); }, [load]);

  const rows: LeaderboardRow[] = tab === "GLOBAL" ? (data?.top ?? []) : (data?.nearby ?? []);
  const myPosition = data?.my_position ?? null;
  const totalUsers = data?.total_users ?? 0;
  const myRank = rankForXp(state?.xp ?? 0).current;
  const reachedImmortal = myRank.family === "IMMORTAL";

  return (
    <View style={styles.root} testID="leaderboard-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>LEADERBOARD</Text>
        <Pressable testID="refresh-btn" onPress={load}><Ionicons name="refresh" size={22} color={colors.brandPrimary} /></Pressable>
      </View>

      {/* My position banner */}
      {myPosition != null && (
        <View style={[styles.meBanner, reachedImmortal && styles.meBannerImmortal]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.meLabel}>{reachedImmortal ? "GLOBAL IMMORTAL RANK" : "GLOBAL POSITION"}</Text>
            <Text style={[styles.mePosition, reachedImmortal && { color: "#FFD54F" }]} testID="my-position">
              #{myPosition.toLocaleString()}
            </Text>
            <Text style={styles.meSub}>
              {reachedImmortal ? `#${myPosition} IN THE WORLD` : `Reach IMMORTAL to unlock world ranking`}
            </Text>
          </View>
          <RankBadge rank={myRank} size="md" />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["GLOBAL", "NEARBY"] as const).map((t) => (
          <Pressable
            key={t}
            testID={`tab-${t.toLowerCase()}`}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.brandPrimary} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load} style={styles.retryBtn}><Text style={styles.retryTxt}>RETRY</Text></Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xs, paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
          <Text style={styles.totalLbl}>{totalUsers.toLocaleString()} ATHLETES ACTIVE</Text>
          {rows.map((r) => {
            const rank = rankForXp(r.xp).current;
            return (
              <View
                key={r.id}
                testID={`row-${r.rank}`}
                style={[styles.row, r.is_you && styles.rowMe]}
              >
                <Text style={[styles.pos, r.rank <= 3 && styles.posTop]}>#{r.rank}</Text>
                <RankBadge rank={rank} size="sm" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, r.is_you && { color: colors.brandPrimary }]}>
                    {r.is_you ? "YOU" : r.username}
                    {r.is_npc ? " ·" : ""}
                    {r.title ? <Text style={styles.titleTag}>  "{r.title}"</Text> : null}
                  </Text>
                  <Text style={styles.meta}>
                    {rank.name} · {r.xp.toLocaleString()} XP · {r.streak}d streak
                  </Text>
                </View>
                {r.rank === 1 && <Ionicons name="trophy" size={20} color="#FFD54F" />}
                {r.rank === 2 && <Ionicons name="medal" size={20} color="#C0C0C0" />}
                {r.rank === 3 && <Ionicons name="medal" size={20} color="#CD7F32" />}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  meBanner: { flexDirection: "row", alignItems: "center", gap: spacing.md, margin: spacing.lg, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandPrimary },
  meBannerImmortal: { borderColor: "#FFD54F", backgroundColor: "#FFD54F22" },
  meLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  mePosition: { color: colors.brandPrimary, fontSize: 32, fontWeight: "900", letterSpacing: -1, marginTop: 2 },
  meSub: { color: colors.onSurfaceTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginTop: 2 },
  tabs: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: "center", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.brandTertiary, borderColor: colors.brandPrimary },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  tabTextActive: { color: colors.brandPrimary },
  totalLbl: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  rowMe: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  pos: { color: colors.onSurface, fontSize: 14, fontWeight: "900", minWidth: 42, letterSpacing: 0.5 },
  posTop: { color: "#FFD54F" },
  name: { color: colors.onSurface, fontSize: 13, fontWeight: "900" },
  titleTag: { color: colors.onSurfaceTertiary, fontSize: 11, fontStyle: "italic" },
  meta: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 2 },
  errorWrap: { padding: spacing.xl, alignItems: "center", gap: spacing.md },
  errorText: { color: colors.error, textAlign: "center" },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.brandPrimary, borderRadius: radius.md },
  retryTxt: { color: colors.onBrandPrimary, fontWeight: "900", letterSpacing: 1.5 },
});
