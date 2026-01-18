import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Audio, AVPlaybackStatus } from "expo-av";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as api from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const AUTH_TOKEN_KEY = "@onetimeonetime_auth_token";

type AlbumDetailRouteProp = RouteProp<RootStackParamList, "AlbumDetail">;

export default function AlbumDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<AlbumDetailRouteProp>();
  const { item } = route.params;

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [album, setAlbum] = useState<api.AlbumItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  useEffect(() => {
    AsyncStorage.getItem(AUTH_TOKEN_KEY).then(setAuthToken);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    api.getAlbumById(item.id)
      .then((data) => {
        setAlbum(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load album:", error);
        setIsLoading(false);
      });
  }, [item.id]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

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

  const playTrack = async (track: api.AlbumTrack) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }

    try {
      const streamUrl = api.getAlbumTrackStreamUrl(item.id, track.id);
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: streamUrl, headers },
        { shouldPlay: true, rate: playbackRate },
        onAudioStatusUpdate
      );
      setSound(newSound);
      setCurrentTrackId(track.id);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing track:", error);
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const handleSpeedChange = async (speed: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlaybackRate(speed);
    if (sound) {
      await sound.setRateAsync(speed, true);
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const hasThumbnail = item.thumbnailUrl;
  const needsAuth = item.thumbnailRequiresAuth && authToken;
  const imageSource = hasThumbnail
    ? {
        uri: item.thumbnailUrl,
        headers: needsAuth ? { Authorization: `Bearer ${authToken}` } : undefined,
      }
    : null;

  const renderTrack = useCallback(({ item: track }: { item: api.AlbumTrack }) => {
    const isCurrentTrack = currentTrackId === track.id;
    
    return (
      <Pressable
        onPress={() => playTrack(track)}
        style={({ pressed }) => [
          styles.trackItem,
          {
            backgroundColor: isCurrentTrack ? theme.backgroundSecondary : "transparent",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.trackNumber}>
          {isCurrentTrack && isPlaying ? (
            <Feather name="volume-2" size={16} color={theme.accent} />
          ) : (
            <ThemedText style={[styles.trackNumberText, { color: theme.textSecondary }]}>
              {track.trackNumber}
            </ThemedText>
          )}
        </View>
        <View style={styles.trackInfo}>
          <ThemedText
            numberOfLines={1}
            style={[
              styles.trackTitle,
              { color: isCurrentTrack ? theme.accent : theme.text },
            ]}
          >
            {track.title}
          </ThemedText>
        </View>
        <ThemedText style={[styles.trackDuration, { color: theme.textSecondary }]}>
          {formatDuration(track.duration)}
        </ThemedText>
      </Pressable>
    );
  }, [currentTrackId, isPlaying, theme, authToken, item.id, playbackRate]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>
          {item.title}
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: currentTrackId ? 180 : insets.bottom + Spacing.xl },
        ]}
      >
        <View style={styles.albumHeader}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.albumArt}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.albumArtPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="disc" size={64} color={theme.textSecondary} />
            </View>
          )}
          <ThemedText style={[styles.albumTitle, { color: theme.text }]}>
            {item.title}
          </ThemedText>
          {item.description ? (
            <ThemedText style={[styles.albumDescription, { color: theme.textSecondary }]}>
              {item.description}
            </ThemedText>
          ) : null}
          <ThemedText style={[styles.trackCount, { color: theme.textSecondary }]}>
            {album?.tracks?.length || item.trackCount || 0} tracks
          </ThemedText>
        </View>

        <View style={styles.trackList}>
          {album?.tracks?.map((track) => (
            <View key={track.id}>
              {renderTrack({ item: track })}
            </View>
          ))}
        </View>
      </ScrollView>

      {currentTrackId ? (
        <View
          style={[
            styles.nowPlaying,
            {
              backgroundColor: theme.backgroundDefault,
              borderTopColor: theme.border,
              paddingBottom: insets.bottom + Spacing.md,
            },
          ]}
        >
          <View style={styles.nowPlayingContent}>
            <Pressable
              onPress={handlePlayPause}
              style={[styles.playButton, { backgroundColor: theme.accent }]}
            >
              <Feather
                name={isPlaying ? "pause" : "play"}
                size={24}
                color={theme.buttonText}
              />
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.backgroundSecondary }]}>
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
          <View style={styles.speedControls}>
            <ThemedText style={[styles.speedLabel, { color: theme.textSecondary }]}>
              Speed
            </ThemedText>
            <View style={styles.speedButtons}>
              {playbackSpeeds.map((speed) => (
                <Pressable
                  key={speed}
                  onPress={() => handleSpeedChange(speed)}
                  style={[
                    styles.speedButton,
                    {
                      backgroundColor: playbackRate === speed ? theme.accent : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.speedButtonText,
                      { color: playbackRate === speed ? theme.buttonText : theme.text },
                    ]}
                  >
                    {speed}x
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : null}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  albumHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  albumArtPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  albumTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  albumDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  trackCount: {
    fontSize: 14,
  },
  trackList: {
    marginTop: Spacing.md,
  },
  trackItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  trackNumber: {
    width: 32,
    alignItems: "center",
  },
  trackNumberText: {
    fontSize: 14,
    fontWeight: "500",
  },
  trackInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  trackDuration: {
    fontSize: 14,
    marginLeft: Spacing.md,
  },
  nowPlaying: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
  },
  nowPlayingContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  timeText: {
    fontSize: 12,
  },
  speedControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  speedLabel: {
    fontSize: 12,
    marginRight: Spacing.sm,
  },
  speedButtons: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  speedButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  speedButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
