import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

import { useProgress } from "@/src/store/progress";
import { registerPush } from "@/src/store/api";

// Requests permission, fetches the native device token and registers it with the
// backend relay. Runs on every app open once the local deviceId is known.
export async function registerForPush(userId: string): Promise<void> {
  if (Platform.OS === "web" || !Device.isDevice) return;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;
  const tokenResp = await Notifications.getDevicePushTokenAsync();
  await registerPush(userId, Platform.OS, String(tokenResp.data));
}

export function PushRegistrar() {
  const { state } = useProgress();
  useEffect(() => {
    if (Platform.OS === "web" || !state?.deviceId) return;
    registerForPush(state.deviceId).catch(() => {});
  }, [state?.deviceId]);
  return null;
}
