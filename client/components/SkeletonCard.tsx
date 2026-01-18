import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface SkeletonCardProps {
  size?: "small" | "medium" | "large";
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function SkeletonCard({ size = "medium" }: SkeletonCardProps) {
  const { theme } = useTheme();
  const shimmerValue = useSharedValue(0);

  const cardWidth = size === "small" 
    ? (SCREEN_WIDTH - Spacing.lg * 3) / 2.5
    : size === "large"
      ? SCREEN_WIDTH - Spacing.lg * 2
      : (SCREEN_WIDTH - Spacing.lg * 3) / 2;

  const cardHeight = size === "large" ? 200 : size === "small" ? 100 : 140;

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerValue.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: theme.cardBackground,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.imagePlaceholder,
          { height: cardHeight, backgroundColor: theme.backgroundSecondary },
          animatedStyle,
        ]}
      />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.titlePlaceholder,
            { backgroundColor: theme.backgroundSecondary },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.subtitlePlaceholder,
            { backgroundColor: theme.backgroundSecondary },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
  },
  imagePlaceholder: {
    width: "100%",
  },
  content: {
    padding: Spacing.sm,
  },
  titlePlaceholder: {
    height: 16,
    borderRadius: 4,
    marginBottom: 6,
    width: "85%",
  },
  subtitlePlaceholder: {
    height: 12,
    borderRadius: 4,
    width: "60%",
  },
});
