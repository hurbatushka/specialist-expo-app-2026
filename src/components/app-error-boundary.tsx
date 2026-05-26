import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Корневой ErrorBoundary — ловит render-ошибки и показывает экран вместо краша.
 * Без него любой throw в render → RCTFatal → SIGABRT (особенно опасно на iOS 26).
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    if (__DEV__) {
      console.error("[AppErrorBoundary]", error, info?.componentStack);
    } else {
      console.warn(
        "[AppErrorBoundary]",
        error?.message,
        info?.componentStack ?? "",
      );
    }
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Что-то пошло не так</Text>
          <Text style={styles.message}>
            Закройте приложение и откройте снова. Если ошибка повторяется —
            напишите в поддержку.
          </Text>
          {__DEV__ ? (
            <Text style={styles.debug}>{this.state.error.message}</Text>
          ) : null}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1a1a1a",
  },
  message: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
  debug: {
    marginTop: 16,
    fontSize: 12,
    color: "#c42d26",
    textAlign: "center",
  },
});
