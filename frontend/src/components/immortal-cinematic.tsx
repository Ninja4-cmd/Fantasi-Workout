import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { RankBadge } from "@/src/components/rank-badge";
import { RANKS } from "@/src/data/ranks";
import { spacing, radius } from "@/src/theme";

const GOLD = "#FFD54F";
const GOLD_HOT = "#FFF176";
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const RING_MAX = Math.max(SCREEN_W, SCREEN_H) * 1.6;
const RAYS = 16;

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

// The dark-screen mega reveal that plays the moment an athlete hits IMMORTAL (rank 27).
export function ImmortalCinematic({ visible, onDismiss }: Props) {
  const immortal = RANKS[RANKS.length - 1];

  const bg = useRef(new Animated.Value(0)).current;        // dark screen fade-in
  const flash = useRef(new Animated.Value(0)).current;     // white energy flash
  const badgeScale = useRef(new Animated.Value(0.2)).current;
  const badgeSpin = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.4)).current;    // pulsing halo
  const rayRotate = useRef(new Animated.Value(0)).current; // rotating sunburst
  const textFade = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;

  // expanding energy rings
  const rings = useMemo(() => [0, 1, 2, 3].map(() => new Animated.Value(0)), []);

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    bg.setValue(0); flash.setValue(0); badgeScale.setValue(0.2); badgeSpin.setValue(0);
    textFade.setValue(0); btnFade.setValue(0);

    // 1. Dark screen fades in
    Animated.timing(bg, { toValue: 1, duration: 550, useNativeDriver: true }).start(() => {
      // 2. Energy flash + badge burst
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(flash, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
        Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 55 }),
        Animated.timing(badgeSpin, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

      // 3. Text + button reveal
      Animated.stagger(220, [
        Animated.timing(textFade, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
        Animated.timing(btnFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    });

    // Looping expanding energy rings (staggered)
    const ringAnims = rings.map((r, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 550),
          Animated.timing(r, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    ringAnims.forEach((a) => a.start());

    // pulsing halo
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1100, useNativeDriver: true }),
      ]),
    );
    glowAnim.start();

    // rotating rays
    const rayAnim = Animated.loop(
      Animated.timing(rayRotate, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true }),
    );
    rayAnim.start();

    return () => {
      ringAnims.forEach((a) => a.stop());
      glowAnim.stop();
      rayAnim.stop();
    };
  }, [visible]);

  if (!visible) return null;

  const spin = badgeSpin.interpolate({ inputRange: [0, 1], outputRange: ["-90deg", "0deg"] });
  const rayDeg = rayRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.root, { opacity: bg }]} testID="immortal-cinematic">
        {/* deep radial-ish backdrop */}
        <LinearGradient
          colors={["#151007", "#000000"]}
          style={StyleSheet.absoluteFill}
        />

        {/* rotating gold sunburst */}
        <Animated.View style={[styles.center, { transform: [{ rotate: rayDeg }] }]} pointerEvents="none">
          {Array.from({ length: RAYS }).map((_, i) => (
            <View
              key={i}
              style={[styles.ray, { transform: [{ rotate: `${(360 / RAYS) * i}deg` }] }]}
            >
              <LinearGradient
                colors={["transparent", GOLD + "00", GOLD + "55", "transparent"]}
                style={styles.rayInner}
              />
            </View>
          ))}
        </Animated.View>

        {/* expanding energy rings */}
        {rings.map((r, i) => {
          const scale = r.interpolate({ inputRange: [0, 1], outputRange: [0.1, RING_MAX / 120] });
          const opacity = r.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.7, 0] });
          return (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[styles.ring, { opacity, transform: [{ scale }] }]}
            />
          );
        })}

        {/* pulsing halo behind badge */}
        <Animated.View pointerEvents="none" style={[styles.halo, { opacity: glow }]} />

        {/* Badge */}
        <Animated.View style={{ transform: [{ scale: badgeScale }, { rotate: spin }] }}>
          <RankBadge rank={immortal} size="xl" glow={false} testID="immortal-badge" />
        </Animated.View>

        {/* Text */}
        <Animated.View style={{ opacity: textFade, alignItems: "center" }}>
          <Text style={styles.eyebrow}>ASCENSION COMPLETE</Text>
          <Text style={styles.title}>IMMORTAL</Text>
          <Text style={styles.sub}>RANK 27 · THE FINAL FORM</Text>
          <Text style={styles.blurb}>
            155,000 XP conquered. You now stand among the world's greatest.
          </Text>
        </Animated.View>

        {/* white flash overlay */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />

        {/* Continue */}
        <Animated.View style={[styles.btnWrap, { opacity: btnFade }]}>
          <Pressable testID="immortal-dismiss" onPress={onDismiss} style={styles.btn}>
            <LinearGradient colors={[GOLD_HOT, GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGrad}>
              <Text style={styles.btnText}>ENTER THE PANTHEON</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  ray: { position: "absolute", width: 3, height: RING_MAX },
  rayInner: { flex: 1, width: 3, borderRadius: 2 },
  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: GOLD,
  },
  halo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: GOLD + "22",
  },
  flash: { backgroundColor: "#FFFFFF" },
  eyebrow: { color: GOLD, fontSize: 12, fontWeight: "900", letterSpacing: 5, marginTop: spacing.xl },
  title: { color: GOLD, fontSize: 52, fontWeight: "900", letterSpacing: 6, marginTop: spacing.sm, textShadowColor: GOLD + "AA", textShadowRadius: 24, textShadowOffset: { width: 0, height: 0 } },
  sub: { color: GOLD_HOT, fontSize: 13, fontWeight: "900", letterSpacing: 3, marginTop: spacing.xs },
  blurb: { color: "#E8DCC0", fontSize: 13, fontWeight: "600", letterSpacing: 0.5, marginTop: spacing.md, textAlign: "center", maxWidth: 300, lineHeight: 20 },
  btnWrap: { position: "absolute", bottom: spacing["3xl"] + spacing.lg, width: "100%", alignItems: "center", paddingHorizontal: spacing.xl },
  btn: { width: "100%", maxWidth: 360, borderRadius: radius.pill, overflow: "hidden" },
  btnGrad: { paddingVertical: spacing.md + 2, alignItems: "center", borderRadius: radius.pill },
  btnText: { color: "#1A1200", fontWeight: "900", letterSpacing: 2, fontSize: 15 },
});
