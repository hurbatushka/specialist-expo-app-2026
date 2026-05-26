import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { fetchWithAuth } from "@/lib/api";
import { HOME_ROUTE } from "@/lib/auth-routes";
import { setOnboardingDone } from "@/lib/onboarding";

export default function FirstStepsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { authApi, isSignedIn } = useAuth();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setLoadingProfile(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth("/specialist/dashboard", {}, authApi);
        if (res.ok) {
          const data = (await res.json()) as { firstName?: string | null };
          if (!cancelled) setFirstName(data.firstName ?? null);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authApi, isSignedIn]);

  const finish = useCallback(async () => {
    await setOnboardingDone();
    router.replace(HOME_ROUTE);
  }, [router]);

  if (loadingProfile) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <OnboardingWizard
      firstName={firstName}
      authApi={authApi}
      onComplete={finish}
      onSkip={finish}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.four,
  },
});
