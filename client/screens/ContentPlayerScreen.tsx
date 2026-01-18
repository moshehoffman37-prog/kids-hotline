import React, { useState, useEffect } from "react";
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
import { Audio, AVPlaybackStatus } from "expo-av";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as api from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AUTH_TOKEN_KEY = "@onetimeonetime_auth_token";

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
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_TOKEN_KEY).then(setAuthToken);
  }, []);

  useEffect(() => {
    if (item.type === "video") {
      setIsLoading(true);
      setVideoError(null);
      api.getVideoStreamUrl(item.id)
        .then((response) => {
          if (response.embedUrl) {
            setVideoEmbedUrl(response.embedUrl);
          } else {
            setVideoError("Video stream not available");
          }
          setIsLoading(false);
        })
        .catch((error) => {
          setVideoError(error.message || "Failed to load video");
          setIsLoading(false);
        });
    }
  }, [item]);

  useEffect(() => {
    if (item.type === "document" && item.pageCount && authToken) {
      const pages: string[] = [];
      for (let i = 1; i <= item.pageCount; i++) {
        pages.push(api.getDocumentPageUrl(item.id, i));
      }
      setDocumentPages(pages);
      setIsLoading(false);
    }
  }, [item, authToken]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sound) {
      sound.unloadAsync();
    }
    navigation.goBack();
  };

  const handleAudioPlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const streamUrl = api.getAudioStreamUrl(item.id);
    
    if (!sound) {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { 
            uri: streamUrl,
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          },
          { shouldPlay: true },
          onAudioStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      } catch (error) {
        console.error("Error loading audio:", error);
      }
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

  const renderVideoPlayer = () => {
    if (isLoading) {
      return (
        <View style={[styles.videoContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading video...
          </ThemedText>
        </View>
      );
    }

    if (videoError || !videoEmbedUrl) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="alert-circle" size={32} color={theme.textSecondary} />
          <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
            {videoError || "Video is processing or not yet available"}
          </ThemedText>
          <ThemedText style={[styles.errorSubtext, { color: theme.textSecondary }]}>
            Please check back later
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: videoEmbedUrl }}
          style={styles.webview}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
        />
      </View>
    );
  };

  const renderAudioPlayer = () => (
    <View style={styles.audioContainer}>
      <View style={[styles.audioThumbnailPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="headphones" size={64} color={theme.accent} />
      </View>
      <View style={styles.audioControls}>
        <Pressable
          onPress={handleAudioPlayPause}
          style={[styles.playButton, { backgroundColor: theme.accent }]}
        >
          <Feather
            name={isPlaying ? "pause" : "play"}
            size={32}
            color={theme.buttonText}
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
                  backgroundColor: theme.accent,
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

  const renderDocumentViewer = () => {
    if (isLoading || documentPages.length === 0) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading document...
          </ThemedText>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.documentScrollView}
        contentContainerStyle={styles.documentContent}
      >
        {documentPages.map((pageUrl, index) => (
          <View key={index} style={styles.documentPage}>
            <Image
              source={{ 
                uri: pageUrl,
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
              }}
              style={styles.pageImage}
              contentFit="contain"
            />
            <ThemedText style={[styles.pageNumber, { color: theme.textSecondary }]}>
              Page {index + 1} of {documentPages.length}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    );
  };

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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {item.type === "video" ? renderVideoPlayer() : null}
        {item.type === "audio" ? renderAudioPlayer() : null}
        {item.type === "document" ? renderDocumentViewer() : null}

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
            {item.category ? (
              <View style={[styles.categoryBadge, { backgroundColor: `${theme.accent}20` }]}>
                <ThemedText style={[styles.categoryBadgeText, { color: theme.accent }]}>
                  {item.category}
                </ThemedText>
              </View>
            ) : null}
            {item.duration ? (
              <ThemedText style={[styles.duration, { color: theme.textSecondary }]}>
                {formatTime(item.duration * 1000)}
              </ThemedText>
            ) : null}
            {item.pageCount ? (
              <ThemedText style={[styles.duration, { color: theme.textSecondary }]}>
                {item.pageCount} pages
              </ThemedText>
            ) : null}
          </View>
        </View>
      </ScrollView>
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
  contentContainer: {
    flexGrow: 1,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 9 / 16,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  loadingContainer: {
    width: SCREEN_WIDTH,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  errorContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 9 / 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorSubtext: {
    marginTop: Spacing.xs,
    fontSize: 13,
  },
  audioContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  audioThumbnailPlaceholder: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    height: SCREEN_WIDTH - Spacing.xl * 2,
    maxHeight: 300,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  audioControls: {
    width: "100%",
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
  documentScrollView: {
    flex: 1,
  },
  documentContent: {
    paddingVertical: Spacing.lg,
  },
  documentPage: {
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  pageImage: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    height: (SCREEN_WIDTH - Spacing.lg * 2) * 1.4,
  },
  pageNumber: {
    marginTop: Spacing.sm,
    fontSize: 12,
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
    flexWrap: "wrap",
  },
  categoryBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  duration: {
    fontSize: 13,
  },
});
