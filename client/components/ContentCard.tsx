import React from "react";
import { StyleSheet, View, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { ContentItem, ContentType } from "@/lib/content";

interface ContentCardProps {
  item: ContentItem;
  onPress: () => void;
  size?: "small" | "medium" | "large";
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const getIconForType = (type: ContentType): keyof typeof Feather.glyphMap => {
  switch (type) {
    case "video":
      return "play-circle";
    case "audio":
      return "headphones";
    case "photo":
      return "image";
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ContentCard({ item, onPress, size = "medium" }: ContentCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const cardWidth = size === "small" 
    ? (SCREEN_WIDTH - Spacing.lg * 3) / 2.5
    : size === "large"
      ? SCREEN_WIDTH - Spacing.lg * 2
      : (SCREEN_WIDTH - Spacing.lg * 3) / 2;

  const cardHeight = size === "large" ? 200 : size === "small" ? 100 : 140;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: theme.cardBackground,
        },
        Shadows.card,
        animatedStyle,
      ]}
    >
      <View style={[styles.imageContainer, { height: cardHeight }]}>
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <View style={styles.typeIcon}>
            <Feather
              name={getIconForType(item.type)}
              size={24}
              color="#FFFFFF"
            />
          </View>
        </View>
        {item.duration ? (
          <View style={styles.duration}>
            <ThemedText style={styles.durationText}>
              {formatDuration(item.duration)}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <ThemedText
          numberOfLines={2}
          style={[styles.title, { color: theme.text }]}
        >
          {item.title}
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          style={[styles.category, { color: theme.textSecondary }]}
        >
          {item.category}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginRight: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
    justifyContent: "center",
    alignItems: "center",
  },
  typeIcon: {
    position: "absolute",
    opacity: 0.9,
  },
  duration: {
    position: "absolute",
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
  },
});
