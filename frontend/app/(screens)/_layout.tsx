import { Stack } from "expo-router";

export default function ScreensLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0D0E12" } }} />;
}
