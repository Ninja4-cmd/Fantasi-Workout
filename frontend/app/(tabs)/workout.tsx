import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RankUpModal } from "@/src/components/rank-up-modal";
import { XpToast, pushXpToast } from "@/src/components/xp-toast";
import { WORKOUT_PLAN, getWorkoutFor, isoDate, weekStart } from "@/src/data/workouts";
import { XP_REWARDS } from "@/src/data/xp";
import { useProgress } from "@/src/store/progress";
import { usesNativeTabs } from "@/src/navigation";
import { colors, radius, spacing } from "@/src/theme";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const { state, toggleExercise, claimFullWorkout, acknowledgeRankUp } = useProgress();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const monday = useMemo(() => weekStart(selectedDate), [selectedDate]);
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [monday]);
  const [weekOffset, setWeekOffset] = useState(0);

  const workout = getWorkoutFor(selectedDate);
  const dateIso = isoDate(selectedDate);
  const todayIso = isoDate(new Date());
  const isToday = dateIso === todayIso;
  const isPast = dateIso < todayIso;
  const isFuture = dateIso > todayIso;

  const completed = state?.completedExercises[dateIso] ?? [];
  const allDone = workout.exercises.length > 0 && workout.exercises.every((e) => completed.includes(e.id));
  const alreadyClaimed = state?.workoutFullCompleteDays.includes(dateIso) ?? false;
  const doneCount = workout.exercises.filter((e) => completed.includes(e.id)).length;

  const handleExercise = async (id: string, name: string) => {
    if (!isToday) return; // only allow marking today's exercises
    const done = await toggleExercise(id);
    if (done) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      pushXpToast(`+${XP_REWARDS.EXERCISE_COMPLETE} XP · ${name}`);
    }
  };

  const handleFull = async () => {
    if (!isToday) return;
    if (await claimFullWorkout()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const bonus = workout.difficulty === "HARD" ? XP_REWARDS.DIFFICULT_WORKOUT_COMPLETE : XP_REWARDS.WORKOUT_COMPLETE;
      pushXpToast(`MISSION COMPLETE · +${bonus} XP`);
    }
  };

  const shiftWeek = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta * 7);
    setSelectedDate(d);
    setWeekOffset(weekOffset + delta);
  };

  return (
    <View style={styles.root} testID="workout-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: workout.isRest ? bottomChrome + spacing.xl : bottomChrome + 160,
          gap: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Week header */}
        <View style={styles.weekHeader}>
          <Pressable onPress={() => shiftWeek(-1)} testID="prev-week"><Ionicons name="chevron-back" size={20} color={colors.onSurface} /></Pressable>
          <Text style={styles.weekLabel}>{weekOffset === 0 ? "THIS WEEK" : weekOffset > 0 ? `+${weekOffset} WEEK${weekOffset === 1 ? "" : "S"}` : `${weekOffset} WEEK${weekOffset === -1 ? "" : "S"}`}</Text>
          <Pressable onPress={() => shiftWeek(1)} testID="next-week"><Ionicons name="chevron-forward" size={20} color={colors.onSurface} /></Pressable>
        </View>

        {/* Weekly calendar */}
        <View style={styles.calendar}>
          {weekDates.map((d, i) => {
            const iso = isoDate(d);
            const wk = WORKOUT_PLAN.find((w) => w.weekday === d.getDay())!;
            const done = state?.workoutFullCompleteDays.includes(iso) ?? false;
            const isSel = iso === dateIso;
            const isTodayDate = iso === todayIso;
            return (
              <Pressable
                key={i}
                testID={`day-${i}`}
                onPress={() => setSelectedDate(d)}
                style={[styles.calDay, isSel && styles.calDaySel]}
              >
                <Text style={[styles.calLabel, isSel && styles.calLabelSel]}>{DAY_LABELS[i]}</Text>
                <Text style={[styles.calDate, isSel && styles.calDateSel]}>{d.getDate()}</Text>
                <View style={styles.calMarkWrap}>
                  {done ? (
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                  ) : isTodayDate ? (
                    <Ionicons name="flame" size={12} color={colors.brandPrimary} />
                  ) : wk.isRest ? (
                    <View style={[styles.dot, { backgroundColor: colors.surfaceTertiary }]} />
                  ) : iso < todayIso ? (
                    <Ionicons name="lock-closed" size={10} color={colors.muted} />
                  ) : (
                    <Ionicons name="lock-closed" size={10} color={colors.borderStrong} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Header */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>
            {isToday ? "TODAY · " : isPast ? "PAST · " : "UPCOMING · "}
            {DAY_NAMES[(selectedDate.getDay() + 6) % 7]}
          </Text>
          <Text style={styles.title} testID="workout-title">{workout.title}</Text>
          <Text style={styles.subtitle}>{workout.subtitle}</Text>
          {!workout.isRest && (
            <View style={styles.progressRow}>
              <Text style={styles.progressText} testID="workout-progress">{doneCount} / {workout.exercises.length} EXERCISES</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(doneCount / workout.exercises.length) * 100}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Exercise list */}
        {workout.isRest ? (
          <View style={styles.restCard} testID="rest-state">
            <Ionicons name="bed" size={48} color={colors.brandPrimary} />
            <Text style={styles.restTitle}>REST DAY</Text>
            <Text style={styles.restSub}>Sleep 8-10 hours. Refuel. Come back stronger.</Text>
          </View>
        ) : isFuture ? (
          <View style={styles.previewCard} testID="preview-state">
            <Ionicons name="lock-closed" size={24} color={colors.muted} />
            <Text style={styles.previewTitle}>UPCOMING WORKOUT</Text>
            {workout.exercises.map((ex) => (
              <View key={ex.id} style={styles.previewRow}>
                <Text style={styles.previewName}>{ex.name}</Text>
                <Text style={styles.previewSets}>{ex.sets} × {ex.reps}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {workout.exercises.map((ex) => {
              const done = completed.includes(ex.id);
              return (
                <Pressable
                  key={ex.id}
                  testID={`exercise-row-${ex.id}`}
                  onPress={() => handleExercise(ex.id, ex.name)}
                  disabled={!isToday}
                  style={[styles.exerciseRow, done && styles.exerciseRowDone]}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.exName, done && styles.exNameDone]}>{ex.name}</Text>
                    <View style={styles.exMeta}>
                      <Text style={styles.exMetaItem}>{ex.sets} SETS</Text>
                      <Text style={styles.exMetaSep}>·</Text>
                      <Text style={styles.exMetaItem}>{ex.reps} REPS</Text>
                      <Text style={styles.exMetaSep}>·</Text>
                      <Text style={styles.exMetaItem}>{ex.restSec}s REST</Text>
                    </View>
                  </View>
                  <View testID={`exercise-check-${ex.id}`} style={[styles.check, done && styles.checkDone]}>
                    {done ? <Ionicons name="checkmark" size={20} color={colors.onSuccess} /> : <Text style={styles.checkXp}>+{XP_REWARDS.EXERCISE_COMPLETE}</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {!workout.isRest && isToday && (
        <View style={[styles.stickyWrap, { paddingBottom: bottomChrome + spacing.md }]}>
          <Pressable
            testID="complete-workout-button"
            disabled={!allDone || alreadyClaimed}
            onPress={handleFull}
            style={[styles.stickyBtn, (!allDone || alreadyClaimed) && styles.stickyBtnDisabled]}
          >
            <Ionicons name={alreadyClaimed ? "checkmark-circle" : "flash"} size={20} color={colors.onBrandPrimary} />
            <Text style={styles.stickyBtnText}>
              {alreadyClaimed
                ? "MISSION LOGGED TODAY"
                : allDone
                  ? `MISSION COMPLETE · +${workout.difficulty === "HARD" ? XP_REWARDS.DIFFICULT_WORKOUT_COMPLETE : XP_REWARDS.WORKOUT_COMPLETE} XP`
                  : `FINISH ALL ${workout.exercises.length} EXERCISES`}
            </Text>
          </Pressable>
        </View>
      )}

      <XpToast />
      <RankUpModal
        fromIndex={state?.pendingRankUp?.fromIndex ?? null}
        toIndex={state?.pendingRankUp?.toIndex ?? null}
        onDismiss={() => { void acknowledgeRankUp(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  weekHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  weekLabel: { color: colors.onSurface, fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  calendar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  calDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: 4,
  },
  calDaySel: { backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.brandPrimary },
  calLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  calLabelSel: { color: colors.brandPrimary },
  calDate: { color: colors.onSurface, fontSize: 16, fontWeight: "900" },
  calDateSel: { color: colors.brandPrimary },
  calMarkWrap: { height: 14, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  titleBlock: { gap: 4 },
  eyebrow: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: colors.onSurface, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: colors.onSurfaceTertiary, fontSize: 13, fontWeight: "700" },
  progressRow: { marginTop: spacing.sm, gap: 6 },
  progressText: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceTertiary, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brandPrimary, borderRadius: radius.pill },
  exerciseRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: spacing.md, backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  exerciseRowDone: { borderColor: colors.success },
  exName: { color: colors.onSurface, fontSize: 15, fontWeight: "900", letterSpacing: 0.4 },
  exNameDone: { color: colors.onSurfaceTertiary, textDecorationLine: "line-through" },
  exMeta: { flexDirection: "row", gap: 6, marginTop: 2, alignItems: "center", flexWrap: "wrap" },
  exMetaItem: { color: colors.brandPrimary, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  exMetaSep: { color: colors.muted, fontSize: 11 },
  check: {
    width: 46, height: 46, borderRadius: radius.pill, borderWidth: 2,
    borderColor: colors.borderStrong, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkXp: { color: colors.brandPrimary, fontSize: 11, fontWeight: "900" },
  restCard: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: "center", gap: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  restTitle: { color: colors.onSurface, fontSize: 22, fontWeight: "900", letterSpacing: 3 },
  restSub: { color: colors.onSurfaceTertiary, fontSize: 13, textAlign: "center", lineHeight: 20 },
  previewCard: {
    backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md,
    gap: spacing.sm, borderWidth: 1, borderColor: colors.border, alignItems: "flex-start",
  },
  previewTitle: { color: colors.muted, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: spacing.xs },
  previewRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewName: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  previewSets: { color: colors.brandPrimary, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  stickyWrap: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
  },
  stickyBtn: {
    backgroundColor: colors.brandPrimary, paddingVertical: spacing.md,
    borderRadius: radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
  },
  stickyBtnDisabled: { backgroundColor: colors.surfaceTertiary },
  stickyBtnText: { color: colors.onBrandPrimary, fontWeight: "900", letterSpacing: 1.2, fontSize: 13 },
});
