import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { View } from "react-native";

import { colors } from "@/src/theme";
import { CharacterCustom } from "@/src/store/progress";

type Props = {
  custom: CharacterCustom;
  rankColor: string;
  size?: number;
};

// Procedural "operator" silhouette that gains cosmetic effects via unlocks.
// No image assets required; scales infinitely.
export function CharacterSvg({ custom, rankColor, size = 260 }: Props) {
  const w = size;
  const h = size * 1.3;
  const auraOn = custom.aura > 0;
  const outfit = OUTFIT_COLORS[custom.outfit % OUTFIT_COLORS.length];
  const hair = HAIR_COLORS[custom.hair % HAIR_COLORS.length];
  const badgeColor = BADGE_COLORS[custom.badge % BADGE_COLORS.length];

  return (
    <View style={{ width: w, height: h, alignItems: "center", justifyContent: "center" }}>
      <Svg width={w} height={h} viewBox="0 0 200 260">
        <Defs>
          <RadialGradient id="floor" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={rankColor} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={rankColor} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="body" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={outfit[0]} />
            <Stop offset="1" stopColor={outfit[1]} />
          </LinearGradient>
          <LinearGradient id="aura" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={rankColor} stopOpacity="0.9" />
            <Stop offset="1" stopColor={rankColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Aura halo */}
        {auraOn && (
          <Ellipse cx="100" cy="120" rx="86" ry="110" fill="url(#aura)" opacity={0.55} />
        )}

        {/* Floor glow */}
        <Ellipse cx="100" cy="235" rx="70" ry="12" fill="url(#floor)" />

        {/* Legs */}
        <Rect x="80" y="160" width="16" height="70" rx="6" fill={outfit[2]} />
        <Rect x="104" y="160" width="16" height="70" rx="6" fill={outfit[2]} />
        {/* Shoes */}
        <Rect x="76" y="224" width="24" height="10" rx="4" fill="#111" />
        <Rect x="100" y="224" width="24" height="10" rx="4" fill="#111" />

        {/* Torso */}
        <Path
          d="M60 90 Q60 78 72 74 L128 74 Q140 78 140 90 L140 160 Q125 168 100 168 Q75 168 60 160 Z"
          fill="url(#body)"
        />
        {/* Chest badge */}
        <Rect x="86" y="110" width="28" height="28" rx="6" fill={badgeColor} opacity={0.85} />
        <Rect x="86" y="110" width="28" height="28" rx="6" stroke={rankColor} strokeWidth={2} fill="none" />

        {/* Arms */}
        <Rect x="42" y="86" width="18" height="70" rx="9" fill={outfit[0]} />
        <Rect x="140" y="86" width="18" height="70" rx="9" fill={outfit[0]} />
        {/* Gloves */}
        <Rect x="42" y="148" width="18" height="16" rx="6" fill="#111" />
        <Rect x="140" y="148" width="18" height="16" rx="6" fill="#111" />

        {/* Neck */}
        <Rect x="92" y="66" width="16" height="12" rx="4" fill="#d0a084" />

        {/* Head */}
        <Circle cx="100" cy="52" r="22" fill="#e0b48a" />
        {/* Hair */}
        <Path d="M78 48 Q82 26 100 24 Q118 26 122 48 Q122 38 100 34 Q78 40 78 48 Z" fill={hair} />
        {/* Eyes */}
        <Circle cx="92" cy="54" r="2.2" fill="#1a1a1a" />
        <Circle cx="108" cy="54" r="2.2" fill="#1a1a1a" />
        {/* Visor if outfit >=2 */}
        {custom.outfit >= 2 && (
          <Rect x="80" y="48" width="40" height="8" rx="3" fill={rankColor} opacity={0.75} />
        )}

        {/* Shoulder pads (outfit 3+) */}
        {custom.outfit >= 3 && (
          <>
            <Path d="M56 84 Q64 74 80 74 L80 96 L56 96 Z" fill={rankColor} opacity={0.9} />
            <Path d="M144 84 Q136 74 120 74 L120 96 L144 96 Z" fill={rankColor} opacity={0.9} />
          </>
        )}

        {/* Cape (outfit 4) */}
        {custom.outfit >= 4 && (
          <Path d="M64 78 L52 220 L100 200 L148 220 L136 78 Z" fill={rankColor} opacity={0.4} />
        )}

        {/* Extra aura sparks */}
        {custom.aura >= 2 && (
          <>
            <Circle cx="40" cy="120" r="3" fill={rankColor} />
            <Circle cx="160" cy="140" r="3" fill={rankColor} />
            <Circle cx="30" cy="180" r="2" fill={rankColor} />
            <Circle cx="170" cy="90" r="2" fill={rankColor} />
          </>
        )}
      </Svg>
    </View>
  );
}

// Outfit tuple: [top, top2, pants]
const OUTFIT_COLORS: [string, string, string][] = [
  ["#3A3D4A", "#252731", "#1A1B22"], // default operator
  ["#004d40", "#00332a", "#012a24"], // vanguard green
  ["#0d47a1", "#0a2e5c", "#071e3a"], // titan blue
  ["#6a1b9a", "#3f0d63", "#26063d"], // apex purple
  ["#b71c1c", "#7a1212", "#4a0b0b"], // dominator red
];

const HAIR_COLORS = ["#1a1a1a", "#5c3a21", "#c8a165", "#e0e0e0", "#ff5a36"];
const BADGE_COLORS = ["#252731", "#CD7F32", "#C0C0C0", "#FFD54F", "#7C4DFF"];
