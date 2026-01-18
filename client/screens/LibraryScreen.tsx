import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ContentCard } from "@/components/ContentCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ContentItem, getFavorites, getHistory, HistoryItem } from "@/lib/content";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { queryClient } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 3) / NUM_COLUMNS;

type Tab = "favorites" | "history";

export default function LibraryScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTab, setActiveTab] = useState<Tab>("favorites");

  const {
    data: favoritesData,
    isLoading: favoritesLoading,
    refetch: refetchFavorites,
    isRefetching: isRefetchingFavorites,
  } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/favorites"],
    enabled: activeTab === "favorites",
  });

  const {
    data: historyItems,
    isLoading: historyLoading,
    refetch: refetchHistory,
    isRefetching: isRefetchingHistory,
  } = useQuery<HistoryItem[]>({
    queryKey: ["local-history"],
    queryFn: getHistory,
    enabled: activeTab === "history",
  });

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "favorites") {
        refetchFavorites();
      } else {
        refetchHistory();
      }
    }, [activeTab, refetchFavorites, refetchHistory])
  );

  const handleTabChange = (tab: Tab) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      Haptics.selectionAsync();
    }
  };

  const handleContentPress = useCallback(
    (item: ContentItem) => {
      navigation.navigate("ContentDetail", { item });
    },
    [navigation]
  );

  const isLoading = activeTab === "favorites" ? favoritesLoading : historyLoading;
  const isRefetching = activeTab === "favorites" ? isRefetchingFavorites : isRefetchingHistory;
  const data = activeTab === "favorites" ? favoritesData : historyItems;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.gridContainer}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} size="medium" />
          ))}
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <EmptyState
          image={require("../../assets/images/empty-library.png")}
          title={
            activeTab === "favorites"
              ? "No Favorites Yet"
              : "No Watch History"
          }
          description={
            activeTab === "favorites"
              ? "Tap the heart icon on any content to save it here for easy access."
              : "Content you watch will appear here so you can easily find it again."
          }
        />
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        renderItem={({ item }) => (
          <View style={{ width: CARD_WIDTH, marginRight: Spacing.lg }}>
            <ContentCard
              item={item}
              onPress={() => handleContentPress(item)}
              size="medium"
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={activeTab === "favorites" ? refetchFavorites : refetchHistory}
            tintColor={theme.primary}
          />
        }
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot,
          paddingTop: headerHeight + Spacing.lg,
        },
      ]}
    >
      <View style={styles.tabsContainer}>
        <View
          style={[
            styles.tabsWrapper,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Pressable
            onPress={() => handleTabChange("favorites")}
            style={[
              styles.tab,
              activeTab === "favorites" && {
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "favorites"
                      ? theme.primary
                      : theme.textSecondary,
                },
              ]}
            >
              Favorites
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => handleTabChange("history")}
            style={[
              styles.tab,
              activeTab === "history" && {
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "history"
                      ? theme.primary
                      : theme.textSecondary,
                },
              ]}
            >
              History
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1, paddingBottom: tabBarHeight }}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tabsWrapper: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.xs,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
