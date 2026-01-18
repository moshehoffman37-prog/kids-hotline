import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ListItemProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  iconColor?: string;
  destructive?: boolean;
}

export function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  iconColor,
  destructive = false,
}: ListItemProps) {
  const { theme } = useTheme();

  const textColor = destructive ? theme.destructive : theme.text;
  const finalIconColor = iconColor || (destructive ? theme.destructive : theme.primary);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? theme.backgroundSecondary
            : theme.cardBackground,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${finalIconColor}15` },
        ]}
      >
        <Feather name={icon} size={20} color={finalIconColor} />
      </View>
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: textColor }]}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
