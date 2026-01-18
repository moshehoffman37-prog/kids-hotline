import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ContentItem, addToHistory } from "@/lib/content";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type ContentPlayerRouteProp = RouteProp<RootStackParamList, "ContentPlayer">;

export default function ContentPlayerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<ContentPlayerRouteProp>();
  const { item } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);

  React.useEffect(() => {
    addToHistory(item);
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [item, sound]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleAudioPlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: item.mediaUrl },
        { shouldPlay: true },
        onAudioStatusUpdate
      );
      setSound(newSound);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const onAudioStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setAudioDuration(status.durationMillis || 0);
      setAudioPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setAudioPosition(0);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderVideoPlayer = () => (
    <View style={styles.videoContainer}>
      {isLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.backgroundSecondary }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : null}
      <Video
        source={{ uri: item.mediaUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        onLoad={handleVideoLoad}
      />
    </View>
  );

  const renderAudioPlayer = () => (
    <View style={styles.audioContainer}>
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.audioThumbnail}
        contentFit="cover"
      />
      <View style={styles.audioControls}>
        <Pressable
          onPress={handleAudioPlayPause}
          style={[styles.playButton, { backgroundColor: theme.primary }]}
        >
          <Feather
            name={isPlaying ? "pause" : "play"}
            size={32}
            color="#FFFFFF"
          />
        </Pressable>
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.primary,
                  width: audioDuration > 0
                    ? `${(audioPosition / audioDuration) * 100}%`
                    : "0%",
                },
              ]}
            />
          </View>
          <View style={styles.timeContainer}>
            <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
              {formatTime(audioPosition)}
            </ThemedText>
            <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
              {formatTime(audioDuration)}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPhotoViewer = () => (
    <ScrollView
      style={styles.photoScrollView}
      contentContainerStyle={styles.photoContainer}
      maximumZoomScale={3}
      minimumZoomScale={1}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={{ uri: item.mediaUrl }}
        style={styles.photo}
        contentFit="contain"
        onLoad={() => setIsLoading(false)}
      />
      {isLoading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: theme.backgroundSecondary }]}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : null}
    </ScrollView>
  );

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
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <ThemedText
            numberOfLines={1}
            style={[styles.headerTitle, { color: theme.text }]}
          >
            {item.title}
          </ThemedText>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {item.type === "video" ? renderVideoPlayer() : null}
        {item.type === "audio" ? renderAudioPlayer() : null}
        {item.type === "photo" ? renderPhotoViewer() : null}

        <View style={styles.infoSection}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            {item.title}
          </ThemedText>
          {item.description ? (
            <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
              {item.description}
            </ThemedText>
          ) : null}
          <View style={styles.metaRow}>
            <View style={[styles.categoryBadge, { backgroundColor: `${theme.primary}15` }]}>
              <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
                {item.category}
              </ThemedText>
            </View>
            {item.duration ? (
              <ThemedText style={[styles.duration, { color: theme.textSecondary }]}>
                {formatTime(item.duration * 1000)}
              </ThemedText>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 9 / 16,
    backgroundColor: "#000000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  audioContainer: {
    padding: Spacing.xl,
  },
  audioThumbnail: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    height: SCREEN_WIDTH - Spacing.xl * 2,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  audioControls: {
    alignItems: "center",
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  progressContainer: {
    width: "100%",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  timeText: {
    fontSize: 12,
  },
  photoScrollView: {
    flex: 1,
  },
  photoContainer: {
    flexGrow: 1,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.6,
  },
  infoSection: {
    padding: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  duration: {
    fontSize: 13,
    marginLeft: Spacing.md,
  },
});
