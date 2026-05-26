import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

const EDGE_WIDTH = 28;
const SWIPE_THRESHOLD = 56;

type Props = {
  enabled: boolean;
  onBack?: () => void;
};

/** Жест «назад» с левого края (замена stack gesture при layout на Slot). */
export function EdgeBackSwipe({ enabled, onBack }: Props) {
  const router = useRouter();

  if (!enabled) return null;

  const goBack = () => (onBack ? onBack() : router.back());

  const gesture = Gesture.Pan()
    .activeOffsetX(12)
    .failOffsetY([-24, 24])
    .onEnd((e) => {
      if (e.translationX >= SWIPE_THRESHOLD) {
        runOnJS(goBack)();
      }
    });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.edge} pointerEvents="box-only" />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    zIndex: 50,
  },
});
