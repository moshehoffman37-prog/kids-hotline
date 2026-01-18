import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ContentCard } from "@/components/ContentCard";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as api from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

function CategoryRow({
  section,
  onItemPress,
}: {
  section: api.CategorySection;
  onItemPress: (item: api.ContentItem) => void;
}) {
  const { theme } = useTheme();

  const getTypeIcon = (): keyof typeof Feather.glyphMap => {
    switch (section.type) {
      case "video":
        return "video";
      case "audio":
        return "headphones";
      case "document":
        return "file-text";
      default:
        return "folder";
    }
  };

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Feather
          name={getTypeIcon()}
          size={18}
          color={theme.accent}
          style={styles.categoryIcon}
        />
        <ThemedText style={[styles.categoryTitle, { color: theme.text }]}>
          {section.name}
        </ThemedText>
        <ThemedText style={[styles.itemCount, { color: theme.textSecondary }]}>
          {section.items.length}
        </ThemedText>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={section.items}
        keyExtractor={(item) => `${section.id}-${item.id}`}
        renderItem={({ item }) => (
          <ContentCard
            item={item}
            onPress={() => onItemPress(item)}
            size="small"
          />
        )}
        contentContainerStyle={styles.categoryItems}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();

  const { data: sections, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["content-by-categories"],
    queryFn: api.getContentByCategories,
  });

  const handleContentPress = useCallback(
    (item: api.ContentItem) => {
      navigation.navigate("ContentPlayer", { item });
    },
    [navigation]
  );

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            backgroundColor: theme.backgroundDefault,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/logo.webp")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          hitSlop={8}
          testID="button-logout"
        >
          <Feather name="log-out" size={18} color={theme.textSecondary} />
          <ThemedText style={[styles.logoutText, { color: theme.textSecondary }]}>
            Logout
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(section) => section.id}
        renderItem={({ item: section }) => (
          <CategoryRow section={section} onItemPress={handleContentPress} />
        )}
        contentContainerStyle={[
          styles.contentList,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No content available
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  logoutText: {
    fontSize: 14,
    marginLeft: Spacing.xs,
  },
  contentList: {
    paddingTop: Spacing.lg,
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoryIcon: {
    marginRight: Spacing.sm,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
  },
  categoryItems: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
});
