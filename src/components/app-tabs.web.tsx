import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from "expo-router/ui";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, useColorScheme, View, StyleSheet } from "react-native";

import {
  TAB_VECTOR_ICONS,
  type TabVectorIconName,
} from "@/components/tab-vector-icon";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import {
  BorderRadius,
  CardShadow,
  Colors,
  MaxContentWidth,
  Spacing,
} from "@/constants/theme";

function TabLabelWithIcon({
  tab,
  label,
  isFocused,
}: {
  tab: TabVectorIconName;
  label: string;
  isFocused: boolean;
}) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const ion = TAB_VECTOR_ICONS[tab];
  return (
    <View style={styles.tabWithIcon}>
      <Ionicons
        name={isFocused ? ion.filled : ion.outline}
        size={20}
        color={isFocused ? "#fff" : colors.textSecondary}
      />
      <ThemedText
        type="small"
        themeColor={isFocused ? "text" : "textSecondary"}
        style={isFocused ? { color: "#fff" } : undefined}
      >
        {label}
      </ThemedText>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>
              {(isFocused: boolean) => (
                <View style={styles.tabWithIcon}>
                  <Image
                    source={require("@/assets/images/logo_fav.png")}
                    style={styles.tabIcon}
                  />
                  <ThemedText
                    type="small"
                    themeColor={isFocused ? "text" : "textSecondary"}
                    style={isFocused ? { color: "#fff" } : undefined}
                  >
                    БлагоДети
                  </ThemedText>
                </View>
              )}
            </TabButton>
          </TabTrigger>
          <TabTrigger name="schedule" href="/schedule" asChild>
            <TabButton>
              {(isFocused) => (
                <TabLabelWithIcon
                  tab="schedule"
                  label="Расписание"
                  isFocused={!!isFocused}
                />
              )}
            </TabButton>
          </TabTrigger>
          <TabTrigger name="subscriptions" href="/subscriptions" asChild>
            <TabButton>
              {(isFocused) => (
                <TabLabelWithIcon
                  tab="subscriptions"
                  label="Абонементы"
                  isFocused={!!isFocused}
                />
              )}
            </TabButton>
          </TabTrigger>
          <TabTrigger name="menu" href="/menu" asChild>
            <TabButton>
              {(isFocused) => (
                <TabLabelWithIcon tab="menu" label="Меню" isFocused={!!isFocused} />
              )}
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const content =
    typeof children === "string" ? (
      <ThemedText
        type="small"
        themeColor={isFocused ? "text" : "textSecondary"}
        style={isFocused ? { color: "#fff" } : undefined}
      >
        {children}
      </ThemedText>
    ) : typeof children === "function" ? (
      children(!!isFocused)
    ) : (
      children
    );
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View
        style={[
          styles.tabButtonView,
          isFocused && { backgroundColor: colors.primary },
        ]}
      >
        {content}
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          БлагоДети
        </ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: BorderRadius.card,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    ...CardShadow,
  },
  brandText: {
    marginRight: "auto",
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: BorderRadius.button,
  },
  tabWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
});
