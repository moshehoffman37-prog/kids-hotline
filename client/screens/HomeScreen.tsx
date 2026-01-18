import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
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
import { ContentItem } from "@/lib/content";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface HomeData {
  recent: ContentItem[];
  categories: Category[];
  allContent: ContentItem[];
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout, user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery<HomeData>({
    queryKey: ["/api/content/home"],
  });

  const handleCategoryPress = (categoryId: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleContentPress = useCallback(
    (item: ContentItem) => {
      navigation.navigate("ContentPlayer", { item });
    },
    [navigation]
  );

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  };

  const filteredContent = selectedCategory
    ? data?.allContent.filter((item) => item.category === selectedCategory) || []
    : data?.allContent || [];

  const renderRecentItem = ({ item }: { item: ContentItem }) => (
    <ContentCard
      item={item}
      onPress={() => handleContentPress(item)}
      size="small"
    />
  );

  const renderContentItem = ({ item }: { item: ContentItem }) => (
    <View style={styles.gridItem}>
      <ContentCard
        item={item}
        onPress={() => handleContentPress(item)}
        size="medium"
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
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
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={[styles.appTitle, { color: theme.text }]}>
            Kids' Hotline
          </ThemedText>
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
        data={filteredContent}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderContentItem}
        contentContainerStyle={[
          styles.contentList,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        ListHeaderComponent={
          <>
            {data?.recent && data.recent.length > 0 ? (
              <View style={styles.recentSection}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                  Recent
                </ThemedText>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={data.recent}
                  keyExtractor={(item) => `recent-${item.id}`}
                  renderItem={renderRecentItem}
                  contentContainerStyle={styles.recentList}
                />
              </View>
            ) : null}

            {data?.categories && data.categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesList}
              >
                {data.categories.map((category) => {
                  const isSelected = selectedCategory === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => handleCategoryPress(category.id)}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isSelected
                            ? "#F97316"
                            : theme.backgroundDefault,
                          borderColor: isSelected
                            ? "#F97316"
                            : theme.border,
                        },
                      ]}
                    >
                      {category.icon ? (
                        <Feather
                          name={category.icon as any}
                          size={14}
                          color={isSelected ? "#FFFFFF" : theme.text}
                          style={styles.categoryIcon}
                        />
                      ) : null}
                      <ThemedText
                        style={[
                          styles.categoryText,
                          { color: isSelected ? "#FFFFFF" : theme.text },
                        ]}
                      >
                        {category.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </>
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
    width: 36,
    height: 36,
    marginRight: Spacing.sm,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "700",
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
  recentSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recentList: {
    paddingHorizontal: Spacing.lg,
  },
  categoriesContainer: {
    marginBottom: Spacing.lg,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  categoryIcon: {
    marginRight: Spacing.xs,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  contentList: {
    paddingTop: Spacing.lg,
  },
  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
  },
  gridItem: {
    width: (SCREEN_WIDTH - Spacing.lg * 3) / 2,
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
