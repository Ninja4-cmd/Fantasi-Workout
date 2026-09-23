import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Modal } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { XpToast, pushXpToast } from "@/src/components/xp-toast";
import { MEAL_OPTIONS, MEAL_SLOT_ORDER, MEAL_TIMES, HYDRATION_GOAL_ML, HYDRATION_STEP_ML, MealSlot } from "@/src/data/meals";
import { XP_REWARDS } from "@/src/data/xp";
import { useProgress, todayISO } from "@/src/store/progress";
import { usesNativeTabs } from "@/src/navigation";
import { colors, radius, spacing } from "@/src/theme";

export default function FuelScreen() {
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { state, toggleMeal, addHydration } = useProgress();
  const [pickerSlot, setPickerSlot] = useState<MealSlot | null>(null);

  const today = todayISO();
  const eaten = state?.completedMeals[today] ?? [];
  const water = state?.hydrationMl[today] ?? 0;
  const waterPct = Math.min(100, Math.round((water / HYDRATION_GOAL_ML) * 100));

  const selectedBySlot = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const s of MEAL_SLOT_ORDER) map[s] = null;
    for (const m of eaten) map[m.slot] = m.mealId;
    return map;
  }, [eaten]);

  const handlePickMeal = async (slot: MealSlot, mealId: string) => {
    const nowChecked = await toggleMeal(slot, mealId);
    if (nowChecked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      pushXpToast(`+${XP_REWARDS.MEAL_COMPLETE} XP · ${slot.toUpperCase()}`);
    }
    setPickerSlot(null);
  };

  const handleHydration = async () => {
    await addHydration(HYDRATION_STEP_ML);
    Haptics.selectionAsync().catch(() => {});
  };

  return (
    <View style={styles.root} testID="fuel-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: bottomChrome + spacing.xl,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.eyebrow}>DAILY FUEL</Text>
          <Text style={styles.title}>Fuel Plan</Text>
        </View>

        {/* Hydration */}
        <View style={styles.hydroCard} testID="hydration-card">
          <View style={styles.hydroHeader}>
            <View style={styles.hydroLeft}>
              <Ionicons name="water" size={22} color="#4FC3F7" />
              <View>
                <Text style={styles.hydroLabel}>HYDRATION</Text>
                <Text style={styles.hydroValue} testID="hydration-value">
                  {(water / 1000).toFixed(1)}L / {(HYDRATION_GOAL_ML / 1000).toFixed(1)}L
                </Text>
              </View>
            </View>
            <Pressable testID="hydration-add" onPress={handleHydration} style={styles.hydroBtn}>
              <Ionicons name="add" size={22} color={colors.onBrandPrimary} />
              <Text style={styles.hydroBtnText}>+{HYDRATION_STEP_ML}ml</Text>
            </Pressable>
          </View>
          <View style={styles.hydroTrack}>
            <View style={[styles.hydroFill, { width: `${waterPct}%` }]} />
          </View>
          <Text style={styles.hydroHint}>{waterPct}% of daily goal · +{XP_REWARDS.HYDRATION_GOAL} XP when complete</Text>
        </View>

        {/* Meal slots */}
        {MEAL_SLOT_ORDER.map((slot) => {
          const picked = selectedBySlot[slot];
          const pickedMeal = picked ? MEAL_OPTIONS[slot].find((o) => o.id === picked) : null;
          return (
            <View key={slot} style={styles.mealCard} testID={`meal-slot-${slot}`}>
              <View style={styles.mealHeader}>
                <View>
                  <Text style={styles.mealSlot}>{slot.toUpperCase()}</Text>
                  <Text style={styles.mealTime}>{MEAL_TIMES[slot]}</Text>
                </View>
                {pickedMeal ? (
                  <View style={[styles.mealStatus, styles.mealStatusDone]}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.onSuccess} />
                    <Text style={styles.mealStatusText}>EATEN</Text>
                  </View>
                ) : (
                  <View style={styles.mealStatus}>
                    <Ionicons name="ellipse-outline" size={16} color={colors.muted} />
                    <Text style={[styles.mealStatusText, { color: colors.muted }]}>PLAN IT</Text>
                  </View>
                )}
              </View>

              {pickedMeal ? (
                <View style={styles.pickedBody}>
                  <Text style={styles.pickedTitle}>{pickedMeal.emoji}  {pickedMeal.title}</Text>
                  <Text style={styles.pickedItems}>{pickedMeal.items.join(" · ")}</Text>
                  <View style={styles.pickedRow}>
                    <Pressable
                      testID={`meal-swap-${slot}`}
                      onPress={() => setPickerSlot(slot)}
                      style={styles.linkBtn}
                    >
                      <Ionicons name="swap-horizontal" size={14} color={colors.brandPrimary} />
                      <Text style={styles.linkBtnText}>SWAP</Text>
                    </Pressable>
                    <Pressable
                      testID={`meal-uncheck-${slot}`}
                      onPress={() => toggleMeal(slot, pickedMeal.id)}
                      style={styles.linkBtn}
                    >
                      <Ionicons name="close" size={14} color={colors.error} />
                      <Text style={[styles.linkBtnText, { color: colors.error }]}>UNDO</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  testID={`meal-choose-${slot}`}
                  onPress={() => setPickerSlot(slot)}
                  style={styles.chooseBtn}
                >
                  <Text style={styles.chooseBtnText}>CHOOSE MEAL</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.brandPrimary} />
                </Pressable>
              )}
            </View>
          );
        })}

        <View style={styles.tipCard}>
          <Ionicons name="leaf" size={20} color={colors.brandPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>BALANCED NUTRITION</Text>
            <Text style={styles.tipText}>
              Focus on balanced meals, hydration, energy and recovery — not restriction.
              Milk with meals if you like it. No supplements needed.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Picker Modal */}
      <Modal
        visible={pickerSlot != null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerSlot(null)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard} testID="meal-picker">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PICK YOUR {pickerSlot?.toUpperCase()}</Text>
              <Pressable testID="meal-picker-close" onPress={() => setPickerSlot(null)}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: spacing.sm, padding: spacing.md }}>
              {pickerSlot && MEAL_OPTIONS[pickerSlot].map((opt) => (
                <Pressable
                  key={opt.id}
                  testID={`meal-option-${opt.id}`}
                  onPress={() => handlePickMeal(pickerSlot, opt.id)}
                  style={styles.optRow}
                >
                  <Text style={styles.optEmoji}>{opt.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optTitle}>{opt.title}</Text>
                    <Text style={styles.optItems}>{opt.items.join(" · ")}</Text>
                    <Text style={styles.optFocus}>{opt.focus.toUpperCase()}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.brandPrimary} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <XpToast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  eyebrow: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2.5 },
  title: { color: colors.onSurface, fontSize: 30, fontWeight: "900", letterSpacing: -0.5, marginTop: 2 },
  hydroCard: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  hydroHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hydroLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  hydroLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  hydroValue: { color: colors.onSurface, fontSize: 20, fontWeight: "900", marginTop: 2 },
  hydroBtn: {
    backgroundColor: "#4FC3F7", paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, flexDirection: "row", alignItems: "center", gap: 4,
  },
  hydroBtnText: { color: colors.onBrandPrimary, fontWeight: "900", letterSpacing: 1, fontSize: 12 },
  hydroTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  hydroFill: { height: "100%", backgroundColor: "#4FC3F7", borderRadius: radius.pill },
  hydroHint: { color: colors.onSurfaceTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  mealCard: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  mealHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mealSlot: { color: colors.onSurface, fontSize: 16, fontWeight: "900", letterSpacing: 1.5 },
  mealTime: { color: colors.brandPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 2 },
  mealStatus: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary },
  mealStatusDone: { backgroundColor: colors.success },
  mealStatusText: { color: colors.onSuccess, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  pickedBody: { gap: spacing.xs },
  pickedTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "800" },
  pickedItems: { color: colors.onSurfaceTertiary, fontSize: 12, lineHeight: 17 },
  pickedRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  linkBtnText: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  chooseBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.brandPrimary,
    borderRadius: radius.md, gap: 6,
  },
  chooseBtnText: { color: colors.brandPrimary, fontWeight: "900", letterSpacing: 1.2, fontSize: 12 },
  tipCard: {
    flexDirection: "row", gap: spacing.sm, alignItems: "center",
    padding: spacing.md, backgroundColor: colors.brandTertiary,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.brandPrimary,
  },
  tipTitle: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  tipText: { color: colors.onSurface, fontSize: 12, lineHeight: 17, marginTop: 2 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { color: colors.onSurface, fontSize: 14, fontWeight: "900", letterSpacing: 2 },
  optRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  optEmoji: { fontSize: 28 },
  optTitle: { color: colors.onSurface, fontSize: 15, fontWeight: "900" },
  optItems: { color: colors.onSurfaceTertiary, fontSize: 12, marginTop: 2, lineHeight: 16 },
  optFocus: { color: colors.brandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 4 },
});
