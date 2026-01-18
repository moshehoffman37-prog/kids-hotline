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

  const { data: sections, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["content-by-categories"],
    queryFn: api.getContentByCategories,
  });

  const { data: subscription } = useQuery({
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
    return !subscription.hasActiveSubscription;
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

  const filteredItems = useMemo(() => {
    if (!selectedCategory || !sections) return [];
    const section = sections.find((s) => s.id === selectedCategory);
    return section ? section.items : [];
  }, [selectedCategory, sections]);

  const handleContentPress = useCallback(
    (item: api.ContentItem) => {
      navigation.navigate("ContentPlayer", { item });
    },
    [navigation]
  );

  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleSettingsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettingsVisible(true);
  };

  const handleUpdateSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL("https://onetimeonetime.com/account");
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
        >
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
                  <View key={item.id} style={styles.gridItem}>
                    <ContentCard
                      item={item}
                      onPress={() => handleContentPress(item)}
                      size="medium"
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
    width: "50%",
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
});
