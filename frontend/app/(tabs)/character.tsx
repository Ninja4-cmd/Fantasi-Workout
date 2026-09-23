import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CharacterSvg } from "@/src/components/character-svg";
import { RankBadge } from "@/src/components/rank-badge";
import { XpBar } from "@/src/components/xp-bar";
import { XpToast } from "@/src/components/xp-toast";
import { rankForXp, RANKS } from "@/src/data/ranks";
import { TITLES } from "@/src/data/game";
import { useProgress, metrics } from "@/src/store/progress";
import { usesNativeTabs } from "@/src/navigation";
import { colors, radius, spacing } from "@/src/theme";

// Character level = 1 + floor(totalXpEver / 500)
function levelForXp(xp: number) {
  return 1 + Math.floor(xp / 500);
}

const HAIR_LABELS = ["Black", "Brown", "Blond", "Silver", "Coral"];
const OUTFIT_LABELS = ["Operator", "Vanguard", "Titan", "Apex", "Dominator"];
const AURA_LABELS = ["None", "Faint", "Charged", "Blazing", "Legendary"];
const BADGE_LABELS = ["None", "Bronze", "Silver", "Gold", "Cosmic"];

export default function CharacterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { state, setCharacter, setUsername, setTitle } = useProgress();
  const [editName, setEditName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [titlePicker, setTitlePicker] = useState(false);

  const xp = state?.xp ?? 0;
  const total = state?.totalXpEver ?? 0;
  const level = levelForXp(total);
  const nextLevel = level + 1;
  const xpIntoLevel = total % 500;
  const { current } = rankForXp(xp);
  // Highest rank ever reached (totalXpEver is monotonic) lights up the collection.
  const earnedIndex = rankForXp(Math.max(xp, total)).current.index;
  const m = state ? metrics(state) : null;

  const unlocked = useMemo(() => ({
    aura: [true, level >= 5, level >= 10, level >= 20, level >= 30],
    outfit: [true, level >= 3, level >= 8, level >= 15, level >= 25],
    hair: [true, true, level >= 4, level >= 12, level >= 20],
    badge: [true, level >= 2, level >= 6, level >= 12, level >= 18],
  }), [level]);

  const saveName = async () => {
    if (tempName.trim()) await setUsername(tempName.trim());
    setEditName(false);
  };

  return (
    <View style={styles.root} testID="character-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: bottomChrome + spacing.xl,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>YOUR CHARACTER</Text>
            <Pressable onPress={() => { setTempName(state?.username ?? ""); setEditName(true); }} testID="edit-username">
              <Text style={styles.username}>
                {state?.username ?? "Athlete"} <Ionicons name="pencil" size={16} color={colors.brandPrimary} />
              </Text>
            </Pressable>
            <Pressable onPress={() => setTitlePicker(true)} testID="edit-title">
              <Text style={[styles.title, { color: current.color }]}>
                {state?.title ? `"${state.title}"` : "TAP TO SET TITLE"}
              </Text>
            </Pressable>
          </View>
          <RankBadge rank={current} size="md" />
        </View>

        {/* Character canvas */}
        <View style={styles.canvas}>
          <CharacterSvg custom={state?.character ?? { hair: 0, outfit: 0, aura: 0, badge: 0 }} rankColor={current.color} size={220} />
        </View>

        {/* Level */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.levelLabel}>CHARACTER LEVEL</Text>
              <Text style={styles.levelValue} testID="character-level">LVL {level}</Text>
            </View>
            <Text style={styles.levelNext}>{500 - xpIntoLevel} XP TO LVL {nextLevel}</Text>
          </View>
          <View style={styles.track}><View style={[styles.fill, { width: `${Math.round((xpIntoLevel / 500) * 100)}%` }]} /></View>
        </View>

        {/* Rank XP */}
        <View style={styles.rankCard}>
          <Text style={styles.rankLabel}>RANK PROGRESS</Text>
          <Text style={[styles.rankName, { color: current.color }]}>{current.name}</Text>
          <XpBar xp={xp} />
        </View>

        {/* Badge Shelf / Rank Collection */}
        <View style={styles.shelfCard}>
          <View style={styles.shelfHeader}>
            <Text style={styles.customTitle}>RANK COLLECTION</Text>
            <Text style={styles.shelfCount} testID="badges-unlocked">{earnedIndex} / {RANKS.length}</Text>
          </View>
          <View style={styles.shelfGrid}>
            {RANKS.map((r) => {
              const earned = r.index <= earnedIndex;
              return (
                <View key={r.index} style={styles.shelfCell} testID={`shelf-${r.index}${earned ? "-earned" : "-locked"}`}>
                  <View style={styles.shelfBadgeWrap}>
                    <View style={!earned && styles.lockedBadge}>
                      <RankBadge rank={r} size="sm" glow={earned} />
                    </View>
                    {!earned ? (
                      <View style={styles.lockOverlay} pointerEvents="none">
                        <Ionicons name="lock-closed" size={13} color={colors.onSurfaceSecondary} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.shelfName, { color: earned ? r.color : colors.muted }]} numberOfLines={1}>
                    {r.family.slice(0, 3)}{r.tier ? ` ${r.tier}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.unlockHint}>Earn XP to climb the ladder and light up every badge</Text>
        </View>

        {/* Character stat summary */}
        <View style={styles.gridRow}>
          <MiniStat label="STREAK" value={`${state?.streak ?? 0}d`} />
          <MiniStat label="WORKOUTS" value={String(m?.workoutsCompleted ?? 0)} />
          <MiniStat label="TOTAL XP" value={fmt(total)} />
        </View>

        {/* Customization */}
        <View style={styles.customCard}>
          <Text style={styles.customTitle}>CUSTOMIZE</Text>
          <CustomRow label="OUTFIT" options={OUTFIT_LABELS} value={state?.character.outfit ?? 0} onChange={(v) => setCharacter({ outfit: v })} unlocked={unlocked.outfit} testIdPrefix="outfit" />
          <CustomRow label="HAIR" options={HAIR_LABELS} value={state?.character.hair ?? 0} onChange={(v) => setCharacter({ hair: v })} unlocked={unlocked.hair} testIdPrefix="hair" />
          <CustomRow label="AURA" options={AURA_LABELS} value={state?.character.aura ?? 0} onChange={(v) => setCharacter({ aura: v })} unlocked={unlocked.aura} testIdPrefix="aura" />
          <CustomRow label="BADGE" options={BADGE_LABELS} value={state?.character.badge ?? 0} onChange={(v) => setCharacter({ badge: v })} unlocked={unlocked.badge} testIdPrefix="badge" />
          <Text style={styles.unlockHint}>Level up to unlock more cosmetics · Character grows through effects, not body</Text>
        </View>

        <Pressable
          testID="view-leaderboard"
          onPress={() => router.push("/(screens)/leaderboard")}
          style={styles.linkCard}
        >
          <Ionicons name="podium" size={22} color={colors.brandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.linkTitle}>VIEW GLOBAL LEADERBOARD</Text>
            <Text style={styles.linkSub}>See your rank among all athletes</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </Pressable>
      </ScrollView>

      {/* Username edit modal */}
      <Modal transparent visible={editName} animationType="fade" onRequestClose={() => setEditName(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>YOUR NAME</Text>
            <TextInput
              testID="username-input"
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter your name"
              placeholderTextColor={colors.muted}
              style={styles.input}
              maxLength={20}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable onPress={() => setEditName(false)} style={[styles.mBtn, { backgroundColor: colors.surfaceTertiary }]}><Text style={styles.mBtnTxt}>CANCEL</Text></Pressable>
              <Pressable testID="username-save" onPress={saveName} style={[styles.mBtn, { backgroundColor: colors.brandPrimary }]}><Text style={[styles.mBtnTxt, { color: colors.onBrandPrimary }]}>SAVE</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Title picker */}
      <Modal transparent visible={titlePicker} animationType="fade" onRequestClose={() => setTitlePicker(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>PICK YOUR TITLE</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              <Pressable onPress={() => { setTitle(null); setTitlePicker(false); }} style={styles.titleRow}>
                <Text style={styles.titleTxt}>— NONE —</Text>
              </Pressable>
              {TITLES.map((t) => (
                <Pressable
                  key={t}
                  testID={`title-${t.toLowerCase().replace(/\s+/g, "-")}`}
                  onPress={() => { setTitle(t); setTitlePicker(false); }}
                  style={styles.titleRow}
                >
                  <Text style={styles.titleTxt}>{t}</Text>
                  {state?.title === t ? <Ionicons name="checkmark" size={16} color={colors.brandPrimary} /> : null}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setTitlePicker(false)} style={[styles.mBtn, { backgroundColor: colors.surfaceTertiary }]}><Text style={styles.mBtnTxt}>CLOSE</Text></Pressable>
          </View>
        </View>
      </Modal>

      <XpToast />
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniTile}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function CustomRow({
  label, options, value, onChange, unlocked, testIdPrefix,
}: {
  label: string;
  options: string[];
  value: number;
  onChange: (v: number) => void;
  unlocked: boolean[];
  testIdPrefix: string;
}) {
  return (
    <View style={styles.customRow}>
      <Text style={styles.customLabel}>{label}</Text>
      <View style={styles.customPills}>
        {options.map((opt, i) => {
          const isLocked = !unlocked[i];
          const active = value === i;
          return (
            <Pressable
              key={opt}
              testID={`${testIdPrefix}-${i}`}
              disabled={isLocked}
              onPress={() => onChange(i)}
              style={[styles.pill, active && styles.pillActive, isLocked && styles.pillLocked]}
            >
              {isLocked ? <Ionicons name="lock-closed" size={10} color={colors.muted} /> : null}
              <Text style={[styles.pillText, active && styles.pillTextActive, isLocked && { color: colors.muted }]}>{opt.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function fmt(n: number): string { return n.toLocaleString(); }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
  eyebrow: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2.5 },
  username: { color: colors.onSurface, fontSize: 24, fontWeight: "900", marginTop: 2 },
  title: { fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginTop: 4 },
  canvas: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  levelCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  levelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  levelLabel: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  levelValue: { color: colors.onSurface, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  levelNext: { color: colors.brandPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.brandPrimary, borderRadius: radius.pill },
  rankCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  rankLabel: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  rankName: { fontSize: 22, fontWeight: "900", letterSpacing: 1.5 },
  shelfCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  shelfHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shelfCount: { color: colors.brandPrimary, fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  shelfGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  shelfCell: { width: "22%", alignItems: "center", gap: 4 },
  shelfBadgeWrap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  lockedBadge: { opacity: 0.28 },
  lockOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  shelfName: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  gridRow: { flexDirection: "row", gap: spacing.sm },
  miniTile: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  miniValue: { color: colors.onSurface, fontSize: 18, fontWeight: "900" },
  miniLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 2 },
  customCard: { backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  customTitle: { color: colors.brandPrimary, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  customRow: { gap: 6 },
  customLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  customPills: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceTertiary },
  pillActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  pillLocked: { opacity: 0.5 },
  pillText: { color: colors.onSurface, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  pillTextActive: { color: colors.brandPrimary },
  unlockHint: { color: colors.onSurfaceTertiary, fontSize: 11, fontStyle: "italic", marginTop: spacing.xs },
  linkCard: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  linkTitle: { color: colors.onSurface, fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
  linkSub: { color: colors.onSurfaceTertiary, fontSize: 11, marginTop: 2 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  modal: { width: "100%", maxWidth: 400, backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  input: { backgroundColor: colors.surfaceTertiary, color: colors.onSurface, padding: spacing.md, borderRadius: radius.md, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  mBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: "center" },
  mBtnTxt: { color: colors.onSurface, fontWeight: "900", letterSpacing: 1.5, fontSize: 13 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleTxt: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
});
