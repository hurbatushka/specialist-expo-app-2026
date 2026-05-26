import { InteractionManager, Keyboard } from "react-native";

/** Снять фокус с TextInput перед replace/unmount (iOS 26 + Fabric). */
export function dismissKeyboardAndWait(): Promise<void> {
  Keyboard.dismiss();
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 64);
      });
    });
  });
}
