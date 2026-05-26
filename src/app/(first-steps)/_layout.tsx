import { Stack } from "expo-router";

export default function FirstStepsLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          gestureEnabled: false,
          contentStyle: { backgroundColor: "#000" },
        }}
      />
    </>
  );
}
