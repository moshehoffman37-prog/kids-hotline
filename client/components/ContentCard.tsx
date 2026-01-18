import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as api from "@/lib/api";

const AUTH_TOKEN_KEY = "@onetimeonetime_auth_token";

interface ContentCardProps {
  item: api.ContentItem;
  onPress: () => void;
  size?: "small" | "medium" | "large";
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function ContentCard({ item, onPress, size = "medium" }: ContentCardProps) {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (item.thumbnailRequiresAuth) {
      AsyncStorage.getItem(AUTH_TOKEN_KEY).then(setAuthToken);
    }
  }, [item.thumbnailRequiresAuth]);

  const cardWidth = size === "small" 
    ? 140
    : size === "large"
      ? SCREEN_WIDTH - Spacing.lg * 2
      : "100%";

  const cardHeight = size === "large" ? 200 : size === "small" ? 90 : 120;

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTypeIcon = (): keyof typeof Feather.glyphMap => {
    switch (item.type) {
      case "video":
        return "play-circle";
      case "audio":
        return "headphones";
      case "document":
        return "file-text";
      default:
        return "file";
    }
  };

  const thumbnailUrl = item.thumbnailUrl;
  const needsAuth = item.thumbnailRequiresAuth && authToken;
  const showPlaceholder = !thumbnailUrl || imageError || (item.thumbnailRequiresAuth && !authToken);

  const imageSource = thumbnailUrl
    ? {
        uri: thumbnailUrl,
        headers: needsAuth ? { Authorization: `Bearer ${authToken}` } : undefined,
      }
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          marginRight: size === "small" ? Spacing.md : 0,
          marginBottom: Spacing.md,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.imageContainer, { height: cardHeight, borderRadius: BorderRadius.xs }]}>
        {showPlaceholder ? (
          <View style={[styles.placeholderImage, { backgroundColor: theme.backgroundSecondary, borderRadius: BorderRadius.xs }]}>
            <Feather name={getTypeIcon()} size={32} color={theme.textSecondary} />
          </View>
        ) : (
          <Image
            source={imageSource}
            style={[styles.image, { borderRadius: BorderRadius.xs }]}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
          />
        )}
        {item.duration ? (
          <View style={styles.duration}>
            <ThemedText style={styles.durationText}>
              {formatDuration(item.duration)}
            </ThemedText>
          </View>
        ) : null}
        {item.pageCount ? (
          <View style={styles.duration}>
            <ThemedText style={styles.durationText}>
              {item.pageCount} pages
            </ThemedText>
          </View>
        ) : null}
        <View style={styles.typeIcon}>
          <Feather name={getTypeIcon()} size={16} color="#FFFFFF" />
        </View>
        {item.isNew ? (
          <View style={styles.newBadge}>
            <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText
        numberOfLines={2}
        style={[styles.title, { color: theme.text }]}
      >
        {item.title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  duration: {
    position: "absolute",
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  typeIcon: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 4,
    borderRadius: 4,
  },
  newBadge: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: "#EDE518",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: "#161616",
    fontSize: 10,
    fontWeight: "700",
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: Spacing.sm,
  },
});
