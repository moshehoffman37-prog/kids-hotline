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
import * as api from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: content, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["all-content"],
    queryFn: api.getAllContent,
  });

  const categories = content ? api.getCategories(content) : [];
  const recent = content?.slice(0, 4) || [];
  
  const filteredContent = selectedCategory
    ? content?.filter((item) => item.category === selectedCategory) || []
    : content || [];

  const handleCategoryPress = (category: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(selectedCategory === category ? null : category);
  };

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

  const renderRecentItem = ({ item }: { item: api.ContentItem }) => (
    <ContentCard
      item={item}
      onPress={() => handleContentPress(item)}
      size="small"
    />
  );

  const renderContentItem = ({ item }: { item: api.ContentItem }) => (
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
        data={filteredContent}
        keyExtractor={(item) => `${item.type}-${item.id}`}
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
            tintColor={theme.accent}
          />
        }
        ListHeaderComponent={
          <>
            {recent.length > 0 ? (
              <View style={styles.recentSection}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                  Recent
                </ThemedText>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={recent}
                  keyExtractor={(item) => `recent-${item.type}-${item.id}`}
                  renderItem={renderRecentItem}
                  contentContainerStyle={styles.recentList}
                />
              </View>
            ) : null}

            {categories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesContainer}
                contentContainerStyle={styles.categoriesList}
              >
                {categories.map((category) => {
                  const isSelected = selectedCategory === category;
                  const isDocuments = category.toLowerCase().includes("document");
                  return (
                    <Pressable
                      key={category}
                      onPress={() => handleCategoryPress(category)}
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isSelected
                            ? theme.accent
                            : theme.backgroundDefault,
                          borderColor: isSelected
                            ? theme.accent
                            : theme.border,
                        },
                      ]}
                    >
                      {isDocuments ? (
                        <Feather
                          name="file-text"
                          size={14}
                          color={isSelected ? theme.buttonText : theme.text}
                          style={styles.categoryIcon}
                        />
                      ) : null}
                      <ThemedText
                        style={[
                          styles.categoryText,
                          { color: isSelected ? theme.buttonText : theme.text },
                        ]}
                      >
                        {category}
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
