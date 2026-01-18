import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ContentCard } from "@/components/ContentCard";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import { ContentItem } from "@/lib/content";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

interface ContentSection {
  id: string;
  title: string;
  items: ContentItem[];
}

export default function BrowseScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, refetch, isRefetching } = useQuery<ContentSection[]>({
    queryKey: ["/api/content/sections"],
  });

  const handleContentPress = useCallback(
    (item: ContentItem) => {
      navigation.navigate("ContentDetail", { item });
    },
    [navigation]
  );

  const renderSection = useCallback(
    ({ item: section }: { item: ContentSection }) => (
      <View style={styles.section}>
        <SectionHeader title={section.title} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={section.items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ContentCard
              item={item}
              onPress={() => handleContentPress(item)}
              size="medium"
            />
          )}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    ),
    [handleContentPress]
  );

  const renderSkeletonSection = () => (
    <View style={styles.section}>
      <View style={styles.skeletonHeader}>
        <View style={[styles.skeletonTitle, { backgroundColor: theme.backgroundSecondary }]} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.horizontalList}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} size="medium" />
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const isEmpty = !isLoading && (!data || data.length === 0 || data.every(s => s.items.length === 0));

  if (isLoading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
        }}
      >
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>{renderSkeletonSection()}</React.Fragment>
        ))}
      </ScrollView>
    );
  }

  if (isEmpty) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundRoot,
            paddingTop: headerHeight,
            paddingBottom: tabBarHeight,
          },
        ]}
      >
        <EmptyState
          image={require("../../assets/images/empty-browse.png")}
          title="No Content Available"
          description="Check back soon for new videos, audio, and photos to enjoy."
          actionLabel="Refresh"
          onAction={refetch}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
      data={data}
      keyExtractor={(section) => section.id}
      renderItem={renderSection}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={theme.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  horizontalList: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  skeletonHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  skeletonTitle: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
});
