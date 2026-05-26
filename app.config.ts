import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? base.extra?.eas?.projectId;

  return {
    ...base,
    extra: {
      ...base.extra,
      eas: {
        ...base.extra?.eas,
        projectId,
      },
    },
  };
};
