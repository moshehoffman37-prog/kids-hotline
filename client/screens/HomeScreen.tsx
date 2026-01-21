import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ContentCard } from "@/components/ContentCard";
import { SettingsModal } from "@/components/SettingsModal";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as api from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTrending, setShowTrending] = useState(true);
  const { width: windowWidth } = useWindowDimensions();
  
  const gridConfig = useMemo(() => {
    const padding = Spacing.lg * 2;
    const gap = Spacing.xs * 2;
    const availableWidth = windowWidth - padding;
    let numColumns = 3;
    if (windowWidth < 400) {
      numColumns = 2;
    } else if (windowWidth >= 1024) {
      numColumns = 5;
    } else if (windowWidth >= 768) {
      numColumns = 4;
    }
    const cardWidth = (availableWidth - gap * (numColumns - 1)) / numColumns;
    return { numColumns, cardWidth };
  }, [windowWidth]);

  const { data: sections, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["content-by-categories"],
    queryFn: api.getContentByCategories,
  });

  const { data: subscription, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: api.checkSubscription,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const isSubscriptionInactive = useMemo(() => {
    if (!subscription) return false;
    if (subscription.isWhitelisted) return false;
    return !subscription.active;
  }, [subscription]);

  const allItems = useMemo(() => {
    if (!sections) return [];
    return sections.flatMap((s) => s.items);
  }, [sections]);

  const recentItems = useMemo(() => {
    return [...allItems]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [allItems]);

  const categories = useMemo(() => {
    if (!sections) return [];
    return sections.map((s) => ({ id: s.id, name: s.name }));
  }, [sections]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (sections) {
      sections.forEach((s) => {
        s.items.forEach((item) => {
          map[item.id] = s.name;
        });
      });
    }
    return map;
  }, [sections]);

  const trendingItems = useMemo(() => {
    if (!allItems.length) return [];
    return [...allItems]
      .filter((item) => item.type === "video")
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10);
  }, [allItems]);

  const fuzzySearch = (query: string, text: string): boolean => {
    if (!query) return true;
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    if (textLower.includes(queryLower)) return true;
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allItems.filter((item) => fuzzySearch(searchQuery, item.title));
  }, [searchQuery, allItems]);

  const filteredItems = useMemo(() => {
    if (!selectedCategory || !sections) return [];
    const section = sections.find((s) => s.id === selectedCategory);
    return section ? section.items : [];
  }, [selectedCategory, sections]);

  const handleContentPress = useCallback(
    (item: api.ContentItem) => {
      if (item.type === "album") {
        navigation.navigate("AlbumDetail", { item });
      } else {
        navigation.navigate("ContentPlayer", { item });
      }
    },
    [navigation]
  );

  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleToggleTrending = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTrending(!showTrending);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettingsVisible(true);
  };

  const handleUpdateSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("https://onetimeonetime.com");
  };

  const handleRefreshStatus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetchSubscription();
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
          onPress={handleSettingsPress}
          style={({ pressed }) => [
            styles.settingsButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          hitSlop={8}
          testID="button-settings"
        >
          <Feather name="settings" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />

      {isSubscriptionInactive ? (
        <View style={[styles.inactiveContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.inactiveCard, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="alert-circle" size={48} color={theme.warning} />
            <ThemedText style={[styles.inactiveTitle, { color: theme.text }]}>
              Subscription Inactive
            </ThemedText>
            <ThemedText style={[styles.inactiveMessage, { color: theme.textSecondary }]}>
              Your subscription is no longer active. Please visit onetimeonetime.com to update your subscription and continue accessing content.
            </ThemedText>
            <Pressable
              onPress={handleUpdateSubscription}
              style={({ pressed }) => [
                styles.updateButton,
                { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <ThemedText style={[styles.updateButtonText, { color: theme.buttonText }]}>
                Update Subscription
              </ThemedText>
              <Feather name="external-link" size={16} color={theme.buttonText} style={{ marginLeft: Spacing.sm }} />
            </Pressable>
            <Pressable
              onPress={handleRefreshStatus}
              style={({ pressed }) => [
                styles.refreshButton,
                { borderColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Feather name="refresh-cw" size={16} color={theme.textSecondary} style={{ marginRight: Spacing.sm }} />
              <ThemedText style={[styles.refreshButtonText, { color: theme.textSecondary }]}>
                Refresh Status
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.accent}
            />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchSection}>
            <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Feather name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search videos..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                testID="input-search"
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={handleClearSearch} hitSlop={8} testID="button-clear-search">
                  <Feather name="x" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {searchQuery.trim().length > 0 ? (
            <View style={styles.searchResultsSection}>
              <View style={styles.sectionHeader}>
                <Feather name="search" size={18} color={theme.accent} style={styles.sectionIcon} />
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                  Search Results ({searchResults.length})
                </ThemedText>
              </View>
              {searchResults.length > 0 ? (
                <View style={styles.contentGrid}>
                  {searchResults.map((item) => (
                    <View key={item.id} style={[styles.gridItem, { width: gridConfig.cardWidth + Spacing.xs * 2 }]}>
                      <View style={styles.searchResultCard}>
                        <ContentCard
                          item={item}
                          onPress={() => handleContentPress(item)}
                          size="medium"
                          cardWidth={gridConfig.cardWidth}
                        />
                        {categoryMap[item.id] ? (
                          <View style={[styles.categoryBadge, { backgroundColor: theme.accent }]}>
                            <ThemedText style={[styles.categoryBadgeText, { color: theme.buttonText }]}>
                              {categoryMap[item.id]}
                            </ThemedText>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptySearch}>
                  <Feather name="search" size={32} color={theme.textSecondary} />
                  <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No results found for "{searchQuery}"
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <>
              <View style={styles.recentSection}>
                <View style={styles.sectionHeader}>
                  <Feather name="clock" size={18} color={theme.accent} style={styles.sectionIcon} />
                  <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                    Recent
                  </ThemedText>
                </View>
                {recentItems.length > 0 ? (
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={recentItems}
                    keyExtractor={(item) => `recent-${item.id}`}
                    renderItem={({ item }) => (
                      <ContentCard
                        item={item}
                        onPress={() => handleContentPress(item)}
                        size="small"
                      />
                    )}
                    contentContainerStyle={styles.recentItems}
                  />
                ) : (
                  <View style={styles.emptyRecent}>
                    <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No recent content
                    </ThemedText>
                  </View>
                )}
              </View>

              {trendingItems.length > 0 ? (
                <View style={styles.trendingSection}>
                  <Pressable onPress={handleToggleTrending} style={styles.trendingHeader}>
                    <View style={styles.sectionHeader}>
                      <Feather name="trending-up" size={18} color={theme.accent} style={styles.sectionIcon} />
                      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                        Trending
                      </ThemedText>
                    </View>
                    <Feather
                      name={showTrending ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </Pressable>
                  {showTrending ? (
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      data={trendingItems}
                      keyExtractor={(item) => `trending-${item.id}`}
                      renderItem={({ item }) => (
                        <ContentCard
                          item={item}
                          onPress={() => handleContentPress(item)}
                          size="small"
                        />
                      )}
                      contentContainerStyle={styles.trendingItems}
                    />
                  ) : null}
                </View>
              ) : null}

              <View style={styles.categoriesSection}>
                <View style={styles.sectionHeader}>
                  <Feather name="folder" size={18} color={theme.accent} style={styles.sectionIcon} />
                  <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                    Categories
                  </ThemedText>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryChips}
                >
                  {categories.map((category) => {
                    const isSelected = category.id === selectedCategory;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => handleCategoryPress(category.id)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected ? theme.accent : theme.backgroundSecondary,
                            borderColor: isSelected ? theme.accent : theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.categoryChipText,
                            { color: isSelected ? theme.buttonText : theme.text },
                          ]}
                        >
                          {category.name}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {selectedCategory ? (
                <View style={styles.filteredContent}>
                  <View style={styles.contentGrid}>
                    {filteredItems.map((item) => (
                      <View key={item.id} style={[styles.gridItem, { width: gridConfig.cardWidth + Spacing.xs * 2 }]}>
                        <ContentCard
                          item={item}
                          onPress={() => handleContentPress(item)}
                          size="medium"
                          cardWidth={gridConfig.cardWidth}
                        />
                      </View>
                    ))}
                  </View>
                  {filteredItems.length === 0 ? (
                    <View style={styles.emptyCategory}>
                      <Feather name="inbox" size={32} color={theme.textSecondary} />
                      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No content in this category
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View style={styles.selectCategoryHint}>
                  <Feather name="arrow-up" size={24} color={theme.textSecondary} />
                  <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>
                    Select a category to browse content
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
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
  settingsButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  recentSection: {
    paddingTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  recentItems: {
    paddingHorizontal: Spacing.lg,
  },
  emptyRecent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  categoriesSection: {
    marginBottom: Spacing.lg,
  },
  categoryChips: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filteredContent: {
    paddingHorizontal: Spacing.lg,
  },
  contentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.xs,
  },
  gridItem: {
    paddingHorizontal: Spacing.xs,
  },
  emptyCategory: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  selectCategoryHint: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  hintText: {
    marginTop: Spacing.md,
    fontSize: 15,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  inactiveContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  inactiveCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    alignItems: "center",
    maxWidth: 340,
    width: "100%",
  },
  inactiveTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  inactiveMessage: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  searchResultsSection: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  searchResultCard: {
    position: "relative",
  },
  categoryBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  emptySearch: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  trendingSection: {
    paddingTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  trendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  trendingItems: {
    paddingHorizontal: Spacing.lg,
  },
});
