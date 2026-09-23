import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RankBadge } from "@/src/components/rank-badge";
import { addFriend, fetchFriends, FriendsResp, removeFriend } from "@/src/store/api";
import { rankForXp } from "@/src/data/ranks";
import { colors, radius, spacing } from "@/src/theme";

export function FriendsPanel({ deviceId }: { deviceId: string }) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<FriendsResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true); setError(null);
    try {
      setData(await fetchFriends(deviceId));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load squad");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { load(); }, [load]);

  const onAdd = useCallback(async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    setAdding(true);
    try {
      const added = await addFriend(deviceId, c);
      setCode("");
      await load();
      Alert.alert("Squad up!", `${added.username} joined your squad.`);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      Alert.alert("Couldn't add", msg.includes("404") ? "No athlete with that code." : msg.includes("400") ? "Already in your squad (or your own code)." : "Try again.");
    } finally {
      setAdding(false);
    }
  }, [code, deviceId, load]);

  const onRemove = useCallback((friendId: string, name: string) => {
    Alert.alert("Remove from squad?", `Remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: async () => {
          try { await removeFriend(deviceId, friendId); await load(); } catch {}
        },
      },
    ]);
  }, [deviceId, load]);

  const myCode = data?.me.friend_code ?? "";

  const onShare = useCallback(() => {
    if (!myCode) return;
    Share.share({ message: `Join my squad on Ascend RPG! Add me with friend code: ${myCode}` }).catch(() => {});
  }, [myCode]);

  if (loading && !data) {
    return <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.brandPrimary} />;
  }
  if (error) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={load} style={styles.retryBtn}><Text style={styles.retryTxt}>RETRY</Text></Pressable>
      </View>
    );
  }

  const squad = data?.friends ?? [];
  const friendsOnly = squad.filter((m) => !m.is_you);

  return (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing["3xl"] }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Friend code card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>YOUR FRIEND CODE</Text>
        <Text style={styles.code} testID="my-friend-code">{myCode || "…"}</Text>
        <Pressable onPress={onShare} style={styles.shareBtn} testID="share-code-btn">
          <Ionicons name="share-social" size={16} color={colors.onBrandPrimary} />
          <Text style={styles.shareTxt}>SHARE INVITE</Text>
        </Pressable>
      </View>

      {/* Add friend */}
      <View style={styles.addRow}>
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ENTER CODE"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          style={styles.input}
          testID="friend-code-input"
        />
        <Pressable onPress={onAdd} disabled={adding || code.trim().length < 4} style={[styles.addBtn, (adding || code.trim().length < 4) && { opacity: 0.5 }]} testID="add-friend-btn">
          {adding ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.addTxt}>ADD</Text>}
        </Pressable>
      </View>

      {/* Squad power card */}
      <View style={styles.squadCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.squadLabel}>SQUAD POWER</Text>
          <Text style={styles.squadXp} testID="squad-xp">{(data?.squad_xp ?? 0).toLocaleString()} XP</Text>
          <Text style={styles.squadSub}>{data?.squad_size ?? 1} member{(data?.squad_size ?? 1) === 1 ? "" : "s"} · you rank #{data?.my_squad_rank ?? 1} in squad</Text>
        </View>
        <Ionicons name="people" size={40} color={colors.brandPrimary} />
      </View>

      {/* Rival chase (XP race) */}
      {data?.rival ? (
        <View style={styles.raceCard}>
          <Ionicons name="flash" size={18} color={colors.warning} />
          <Text style={styles.raceTxt}>
            Catch <Text style={styles.raceName}>{data.rival.username}</Text> — {data.rival.gap.toLocaleString()} XP to overtake
          </Text>
        </View>
      ) : friendsOnly.length > 0 ? (
        <View style={styles.raceCard}>
          <Ionicons name="trophy" size={18} color="#FFD54F" />
          <Text style={styles.raceTxt}>You lead the squad. Stay on top! 🔥</Text>
        </View>
      ) : null}

      {/* Squad ranking */}
      <Text style={styles.sectionLbl}>SQUAD RANKING</Text>
      {friendsOnly.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="person-add" size={30} color={colors.muted} />
          <Text style={styles.emptyTxt}>No squad yet. Share your code or add a friend's code to start an XP race.</Text>
        </View>
      )}
      {squad.map((m) => {
        const rank = rankForXp(m.xp).current;
        return (
          <View key={m.id} style={[styles.row, m.is_you && styles.rowMe]} testID={`squad-row-${m.squad_rank}`}>
            <Text style={[styles.pos, m.squad_rank === 1 && styles.posTop]}>#{m.squad_rank}</Text>
            <RankBadge rank={rank} size="sm" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, m.is_you && { color: colors.brandPrimary }]}>{m.is_you ? "YOU" : m.username}</Text>
              <Text style={styles.meta}>{rank.name} · {m.xp.toLocaleString()} XP · {m.streak}d</Text>
            </View>
            {m.squad_rank === 1 && <Ionicons name="trophy" size={18} color="#FFD54F" />}
            {!m.is_you && (
              <Pressable onPress={() => onRemove(m.id, m.username)} hitSlop={8} style={styles.removeBtn} testID={`remove-${m.id}`}>
                <Ionicons name="close" size={16} color={colors.muted} />
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  codeCard: { alignItems: "center", padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  codeLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  code: { color: colors.onSurface, fontSize: 36, fontWeight: "900", letterSpacing: 8, marginLeft: 8 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.brandPrimary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, marginTop: spacing.xs },
  shareTxt: { color: colors.onBrandPrimary, fontWeight: "900", letterSpacing: 1.5, fontSize: 12 },
  addRow: { flexDirection: "row", gap: spacing.sm },
  input: { flex: 1, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.onSurface, fontSize: 16, fontWeight: "900", letterSpacing: 3, height: 48 },
  addBtn: { backgroundColor: colors.brandPrimary, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, minWidth: 72 },
  addTxt: { color: colors.onBrandPrimary, fontWeight: "900", letterSpacing: 1.5 },
  squadCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandPrimary },
  squadLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  squadXp: { color: colors.brandPrimary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 },
  squadSub: { color: colors.onSurfaceTertiary, fontSize: 11, fontWeight: "700", marginTop: 2 },
  raceCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceTertiary, borderRadius: radius.md },
  raceTxt: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "600", flex: 1 },
  raceName: { color: colors.warning, fontWeight: "900" },
  sectionLbl: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginTop: spacing.sm },
  empty: { alignItems: "center", gap: spacing.sm, padding: spacing.xl },
  emptyTxt: { color: colors.onSurfaceTertiary, fontSize: 13, textAlign: "center", lineHeight: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  rowMe: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  pos: { color: colors.onSurface, fontSize: 14, fontWeight: "900", minWidth: 34 },
  posTop: { color: "#FFD54F" },
  name: { color: colors.onSurface, fontSize: 13, fontWeight: "900" },
  meta: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 2 },
  removeBtn: { padding: 4 },
  errorWrap: { padding: spacing.xl, alignItems: "center", gap: spacing.md },
  errorText: { color: colors.error, textAlign: "center" },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.brandPrimary, borderRadius: radius.md },
  retryTxt: { color: colors.onBrandPrimary, fontWeight: "900", letterSpacing: 1.5 },
});
