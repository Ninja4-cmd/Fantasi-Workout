import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProgress } from "@/src/store/progress";
import { colors, radius, spacing } from "@/src/theme";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, markNotificationsSeen } = useProgress();

  useEffect(() => {
    // On unmount, mark seen
    return () => { void markNotificationsSeen(); };
  }, [markNotificationsSeen]);

  const items = state?.notifications ?? [];

  return (
    <View style={styles.root} testID="notifications-screen">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} testID="back-btn"><Ionicons name="chevron-back" size={24} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        <View style={{ width: 24 }} />
      </View>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off" size={40} color={colors.muted} />
          <Text style={styles.emptyText}>No notifications yet.{"\n"}Start a workout to earn XP.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: insets.bottom + spacing.xl }}>
          {items.map((n) => (
            <View key={n.id} style={[styles.row, !n.seen && styles.rowUnread]} testID={`notif-${n.id}`}>
              <View style={styles.icon}><Ionicons name={n.icon as any} size={20} color={colors.brandPrimary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>{new Date(n.ts).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.onSurface, fontSize: 16, fontWeight: "900", letterSpacing: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  emptyText: { color: colors.muted, textAlign: "center", fontSize: 14, lineHeight: 22 },
  row: { flexDirection: "row", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  rowUnread: { borderColor: colors.brandPrimary },
  icon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.brandPrimary },
  title: { color: colors.onSurface, fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  body: { color: colors.onSurfaceTertiary, fontSize: 12, marginTop: 2, lineHeight: 17 },
  time: { color: colors.muted, fontSize: 10, marginTop: 4, letterSpacing: 0.5 },
});
