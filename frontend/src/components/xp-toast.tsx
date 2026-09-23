import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "@/src/theme";

type ToastState = { id: number; text: string } | null;

let pushImpl: ((t: string) => void) | null = null;

export function pushXpToast(text: string) {
  pushImpl?.(text);
}

export function XpToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    pushImpl = (text: string) => setToast({ id: Date.now(), text });
    return () => {
      pushImpl = null;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 220, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, 1100);
    return () => clearTimeout(t);
  }, [toast, opacity, translateY]);

  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      testID="xp-toast"
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
    >
      <Text style={styles.text}>{toast.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    top: 80,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    zIndex: 100,
    elevation: 12,
  },
  text: {
    color: colors.onBrandPrimary,
    fontWeight: "900",
    letterSpacing: 1,
    fontSize: 14,
  },
});
