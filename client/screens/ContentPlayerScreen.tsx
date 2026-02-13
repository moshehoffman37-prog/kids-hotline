import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  GestureResponderEvent,
  Platform,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import { Audio, AVPlaybackStatus, Video } from "expo-av";
import { WebView } from "react-native-webview";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ZoomableImage } from "@/components/ZoomableImage";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import * as api from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const AUTH_TOKEN_KEY = "@onetimeonetime_auth_token";

type ContentPlayerRouteProp = RouteProp<RootStackParamList, "ContentPlayer">;

function NativeVideoPlayer({ hlsUrl }: { hlsUrl: string }) {
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const player = useVideoPlayer(hlsUrl, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener("statusChange", (status) => {
      if (status.status === "error") {
        setError(status.error?.message || "Video playback failed");
      }
    });
    return () => subscription.remove();
  }, [player]);

  if (error) {
    return (
      <View
        style={[videoPlayerStyles.container, videoPlayerStyles.errorContainer]}
      >
        <Feather name="alert-circle" size={32} color={theme.textSecondary} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: 8 }}>
          {error}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={videoPlayerStyles.container}>
      <VideoView
        player={player}
        style={videoPlayerStyles.video}
        allowsFullscreen
        allowsPictureInPicture
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

const videoPlayerStyles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: (SCREEN_WIDTH * 9) / 16,
    backgroundColor: "#000000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function ContentPlayerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<ContentPlayerRouteProp>();
  const { item } = route.params;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPosition, setAudioPosition] = useState(0);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<string | null>(null);
  const [videoHlsUrl, setVideoHlsUrl] = useState<string | null>(null);
  const [vimeoVideoId, setVimeoVideoId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [audioStreamUrl, setAudioStreamUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const progressBarRef = useRef<View>(null);
  const documentListRef = useRef<FlatList>(null);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [zoomedPageIndex, setZoomedPageIndex] = useState<number | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showDocumentControls, setShowDocumentControls] = useState(true);

  const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  useEffect(() => {
    AsyncStorage.getItem(AUTH_TOKEN_KEY).then(setAuthToken);
  }, []);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log("Audio mode setup error:", error);
      }
    };
    setupAudio();
  }, []);

  useEffect(() => {
    if (item.type === "video" || item.type === "audio") {
      setIsLoading(true);
      setVideoError(null);
      setVimeoVideoId(null);
      setVideoHlsUrl(null);

      api.markVideoViewed(item.id).catch((error) => {
        console.log("Failed to mark as viewed:", error);
      });

      // Get stream info from API for both audio and video
      api
        .getStreamUrl(item.id, "video")
        .then((response) => {
          console.log("[Stream] API response:", JSON.stringify(response));

          // Handle audio files
          if (item.type === "audio") {
            let audioUrl =
              response.streamUrl || response.cdnUrl || response.url;
            console.log("[Audio] Raw stream URL from API:", audioUrl);

            if (audioUrl) {
              // Convert relative URLs to absolute URLs
              if (audioUrl.startsWith("/")) {
                audioUrl = `https://onetimeonetime.com${audioUrl}`;
              }
              console.log("[Audio] Absolute stream URL:", audioUrl);
              setAudioStreamUrl(audioUrl);
            } else {
              // Fallback: try /api/videos/{id}/stream endpoint directly
              const fallbackUrl = `https://onetimeonetime.com/api/videos/${item.id}/stream`;
              console.log(
                "[Audio] No streamUrl in response, using videos endpoint:",
                fallbackUrl,
              );
              setAudioStreamUrl(fallbackUrl);
            }
            setIsLoading(false);
            return;
          }

          // Handle video files
          if (response.vimeo && response.vimeoVideoId) {
            setVimeoVideoId(response.vimeoVideoId);
          } else if (response.embedUrl) {
            const accentColor = theme.accent.replace("#", "");
            const separator = response.embedUrl.includes("?") ? "&" : "?";
            const themedUrl = `${response.embedUrl}${separator}primaryColor=${accentColor}`;
            setVideoEmbedUrl(themedUrl);

            const hlsUrl = api.extractHlsUrl(response.embedUrl);
            if (hlsUrl) {
              setVideoHlsUrl(hlsUrl);
            }
          } else {
            setVideoError("Video stream not available");
          }
          setIsLoading(false);
        })
        .catch((error) => {
          setVideoError(error.message || "Failed to load content");
          setIsLoading(false);
        });
    }
  }, [item, theme.accent]);

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

  // Auto-play audio when stream URL is available
  useEffect(() => {
    if (item.type === "audio" && audioStreamUrl && !sound && authToken) {
      const loadAndPlayAudio = async () => {
        try {
          console.log("[Audio] Loading stream URL:", audioStreamUrl);
          console.log("[Audio] Auth token present:", !!authToken);
          console.log("[Audio] Platform:", Platform.OS);

          let audioUri = audioStreamUrl;

          // For web: Fetch audio as blob since HTML5 Audio doesn't support auth headers
          if (Platform.OS === "web") {
            console.log("[Audio] Web platform - fetching as blob");
            const response = await fetch(audioStreamUrl, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`,
              );
            }
            const blob = await response.blob();
            audioUri = URL.createObjectURL(blob);
            console.log(
              "[Audio] Blob URL created:",
              audioUri.substring(0, 50) + "...",
            );
          }

          const { sound: newSound } = await Audio.Sound.createAsync(
            {
              uri: audioUri,
              headers:
                Platform.OS !== "web"
                  ? { Authorization: `Bearer ${authToken}` }
                  : undefined,
              overrideFileExtensionAndroid: "mp3",
            },
            { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true },
            onAudioStatusUpdate,
          );
          console.log("[Audio] Sound created successfully");
          setSound(newSound);
          setIsPlaying(true);
        } catch (error: any) {
          console.error(
            "[Audio] Error loading:",
            error?.message || error?.toString() || JSON.stringify(error),
          );
          console.error(
            "[Audio] Full error object:",
            JSON.stringify(error, Object.getOwnPropertyNames(error)),
          );
        }
      };
      loadAndPlayAudio();
    }
  }, [audioStreamUrl, item.type, authToken]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (sound) {
      sound.unloadAsync();
    }
    navigation.goBack();
  };

  const handleAudioPlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!audioStreamUrl) {
      console.error("No audio stream URL available");
      return;
    }

    if (!sound) {
      try {
        let audioUri = audioStreamUrl;

        // For web: Fetch audio as blob since HTML5 Audio doesn't support auth headers
        if (Platform.OS === "web" && authToken) {
          const response = await fetch(audioStreamUrl, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const blob = await response.blob();
          audioUri = URL.createObjectURL(blob);
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          {
            uri: audioUri,
            headers:
              Platform.OS !== "web" && authToken
                ? { Authorization: `Bearer ${authToken}` }
                : undefined,
            overrideFileExtensionAndroid: "mp3",
          },
          { shouldPlay: true, rate: playbackRate, shouldCorrectPitch: true },
          onAudioStatusUpdate,
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

  const handleSeek = async (event: GestureResponderEvent) => {
    if (!sound || audioDuration <= 0) return;

    const width = progressBarWidth;
    if (width <= 0) return;

    const nativeEvent = event.nativeEvent as any;
    let locationX = nativeEvent.locationX;

    if (typeof locationX !== "number" || isNaN(locationX)) {
      if (nativeEvent.offsetX !== undefined) {
        locationX = nativeEvent.offsetX;
      } else {
        return;
      }
    }

    const percentage = Math.max(0, Math.min(1, locationX / width));
    const newPosition = Math.round(percentage * audioDuration);

    if (isNaN(newPosition) || !isFinite(newPosition) || newPosition < 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sound.setPositionAsync(newPosition);
    } catch (error) {
      console.log("Seek error:", error);
    }
  };

  const handleSpeedChange = async (speed: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlaybackRate(speed);
    if (sound) {
      await sound.setRateAsync(speed, true);
    }
  };

  const renderVideoPlayer = () => {
    if (isLoading) {
      return (
        <View
          style={[
            styles.videoContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ActivityIndicator size="large" color={theme.accent} />
          <ThemedText
            style={[styles.loadingText, { color: theme.textSecondary }]}
          >
            Loading video...
          </ThemedText>
        </View>
      );
    }

    if (videoError) {
      return (
        <View
          style={[
            styles.errorContainer,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <Feather name="alert-circle" size={32} color={theme.textSecondary} />
          <ThemedText
            style={[styles.errorText, { color: theme.textSecondary }]}
          >
            {videoError}
          </ThemedText>
          <ThemedText
            style={[styles.errorSubtext, { color: theme.textSecondary }]}
          >
            Please check back later
          </ThemedText>
        </View>
      );
    }

    if (vimeoVideoId) {
      const vimeoPlayerUrl = `https://player.vimeo.com/video/${vimeoVideoId}?playsinline=1&autoplay=1&muted=0&title=0&byline=0&portrait=0&controls=1`;

      if (Platform.OS === "web") {
        return (
          <View style={styles.videoContainer}>
            <iframe
              src={vimeoPlayerUrl}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </View>
        );
      }

      // HTML injection method - works around react-native-webview Vimeo bug on iOS
      const vimeoHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;background:#000;overflow:hidden}iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:none}</style>
</head>
<body>
<iframe src="${vimeoPlayerUrl}" frameborder="0" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen webkitallowfullscreen></iframe>
</body>
</html>`;

      return (
        <View style={styles.videoContainer}>
          <WebView
            source={{ html: vimeoHtml, baseUrl: "https://player.vimeo.com" }}
            style={styles.webview}
            allowsFullscreenVideo
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            scrollEnabled={false}
            bounces={false}
            originWhitelist={["*"]}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={theme.accent} />
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.log("WebView error:", nativeEvent);
              setVideoError("Could not load video player");
            }}
          />
        </View>
      );
    }

    if (videoHlsUrl) {
      return <NativeVideoPlayer hlsUrl={videoHlsUrl} />;
    }

    if (videoEmbedUrl) {
      return (
        <View style={{ height: 250 }}>
          <WebView
            source={{ uri: videoEmbedUrl }}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      );
    }

    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="alert-circle" size={32} color={theme.textSecondary} />
        <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>
          Video not available
        </ThemedText>
      </View>
    );
  };

  const renderAudioPlayer = () => {
    if (isLoading) {
      return (
        <View style={styles.audioContainer}>
          <View
            style={[
              styles.audioThumbnailPlaceholder,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
          <ThemedText
            style={[styles.loadingText, { color: theme.textSecondary }]}
          >
            Loading audio...
          </ThemedText>
        </View>
      );
    }

    const hasThumbnail = item.thumbnailUrl;
    const needsAuth = item.thumbnailRequiresAuth && authToken;
    const imageSource =
      hasThumbnail && item.thumbnailUrl
        ? {
            uri: item.thumbnailUrl,
            headers: needsAuth
              ? { Authorization: `Bearer ${authToken}` }
              : undefined,
          }
        : null;

    return (
      <View style={styles.audioContainer}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.audioThumbnail}
            contentFit="contain"
          />
        ) : (
          <View
            style={[
              styles.audioThumbnailPlaceholder,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="headphones" size={64} color={theme.accent} />
          </View>
        )}
        <View style={styles.audioControls}>
          <Pressable
            onPress={handleAudioPlayPause}
            style={[
              styles.playButton,
              {
                backgroundColor: theme.accent,
                opacity: audioStreamUrl ? 1 : 0.5,
              },
            ]}
            disabled={!audioStreamUrl}
          >
            <Feather
              name={isPlaying ? "pause" : "play"}
              size={32}
              color={theme.buttonText}
            />
          </Pressable>
          <View
            style={styles.progressContainer}
            onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
          >
            <Pressable
              ref={progressBarRef}
              onPress={handleSeek}
              style={[styles.progressBarTouchable]}
            >
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.accent,
                      width:
                        audioDuration > 0
                          ? `${(audioPosition / audioDuration) * 100}%`
                          : "0%",
                    },
                  ]}
                />
                <View
                  style={[
                    styles.progressThumb,
                    {
                      backgroundColor: theme.accent,
                      left:
                        audioDuration > 0
                          ? `${(audioPosition / audioDuration) * 100}%`
                          : "0%",
                    },
                  ]}
                />
              </View>
            </Pressable>
            <View style={styles.timeContainer}>
              <ThemedText
                style={[styles.timeText, { color: theme.textSecondary }]}
              >
                {formatTime(audioPosition)}
              </ThemedText>
              <ThemedText
                style={[styles.timeText, { color: theme.textSecondary }]}
              >
                {formatTime(audioDuration)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.speedControls}>
            <ThemedText
              style={[styles.speedLabel, { color: theme.textSecondary }]}
            >
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
                      backgroundColor:
                        playbackRate === speed
                          ? theme.accent
                          : theme.backgroundSecondary,
                      borderColor:
                        playbackRate === speed ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.speedButtonText,
                      {
                        color:
                          playbackRate === speed
                            ? theme.buttonText
                            : theme.text,
                      },
                    ]}
                  >
                    {speed}x
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const toggleDocumentControls = () => {
    setShowDocumentControls(!showDocumentControls);
  };

  const renderDocumentViewer = () => {
    if (isLoading || documentPages.length === 0) {
      return (
        <View style={[styles.fullScreenLoading, { backgroundColor: "#000" }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <ThemedText style={[styles.loadingText, { color: "#fff" }]}>
            Loading document...
          </ThemedText>
        </View>
      );
    }

    const renderDocumentPage = ({
      item: pageUrl,
      index,
    }: {
      item: string;
      index: number;
    }) => (
      <Pressable
        style={[
          styles.documentPageFullscreen,
          { width: windowWidth, height: windowHeight },
        ]}
        onPress={toggleDocumentControls}
      >
        <ZoomableImage
          uri={pageUrl}
          headers={
            authToken ? { Authorization: `Bearer ${authToken}` } : undefined
          }
          style={{ width: windowWidth, height: windowHeight }}
          resetKey={currentPageIndex}
        />
      </Pressable>
    );

    return (
      <View style={styles.fullScreenDocument}>
        <FlatList
          ref={documentListRef}
          key={`${windowWidth}-${windowHeight}`}
          data={documentPages}
          renderItem={renderDocumentPage}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / windowWidth,
            );
            if (
              index !== currentPageIndex &&
              index >= 0 &&
              index < documentPages.length
            ) {
              setCurrentPageIndex(index);
            }
          }}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: windowWidth,
            offset: windowWidth * index,
            index,
          })}
        />

        {showDocumentControls ? (
          <>
            <View
              style={[
                styles.documentHeader,
                { paddingTop: insets.top + Spacing.sm },
              ]}
            >
              <Pressable
                onPress={handleBack}
                style={styles.documentBackButton}
                hitSlop={8}
              >
                <Feather name="arrow-left" size={24} color="#fff" />
              </Pressable>
              <ThemedText style={styles.documentTitle} numberOfLines={1}>
                {item.title}
              </ThemedText>
              <View style={{ width: 40 }} />
            </View>

            {currentPageIndex > 0 ? (
              <Pressable
                style={[
                  styles.pageNavButton,
                  styles.prevButton,
                  { top: windowHeight / 2 - 24 },
                ]}
                onPress={() => {
                  const newIndex = currentPageIndex - 1;
                  setCurrentPageIndex(newIndex);
                  documentListRef.current?.scrollToIndex({
                    index: newIndex,
                    animated: true,
                  });
                }}
              >
                <Feather name="chevron-left" size={32} color="#fff" />
              </Pressable>
            ) : null}

            {currentPageIndex < documentPages.length - 1 ? (
              <Pressable
                style={[
                  styles.pageNavButton,
                  styles.nextButton,
                  { top: windowHeight / 2 - 24 },
                ]}
                onPress={() => {
                  const newIndex = currentPageIndex + 1;
                  setCurrentPageIndex(newIndex);
                  documentListRef.current?.scrollToIndex({
                    index: newIndex,
                    animated: true,
                  });
                }}
              >
                <Feather name="chevron-right" size={32} color="#fff" />
              </Pressable>
            ) : null}

            <View
              style={[
                styles.documentFooter,
                { paddingBottom: insets.bottom + Spacing.sm },
              ]}
            >
              <ThemedText style={styles.pageCounter}>
                {currentPageIndex + 1} / {documentPages.length}
              </ThemedText>
            </View>
          </>
        ) : null}
      </View>
    );
  };

  if (item.type === "document") {
    return renderDocumentViewer();
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {item.type === "video" ? renderVideoPlayer() : null}
        {item.type === "audio" ? renderAudioPlayer() : null}

        <View style={styles.infoSection}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            {item.title}
          </ThemedText>
          {item.description ? (
            <ThemedText
              style={[styles.description, { color: theme.textSecondary }]}
            >
              {item.description}
            </ThemedText>
          ) : null}
          <View style={styles.metaRow}>
            {item.category ? (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: `${theme.accent}20` },
                ]}
              >
                <ThemedText
                  style={[styles.categoryBadgeText, { color: theme.accent }]}
                >
                  {item.category}
                </ThemedText>
              </View>
            ) : null}
            {item.duration ? (
              <ThemedText
                style={[styles.duration, { color: theme.textSecondary }]}
              >
                {formatTime(item.duration * 1000)}
              </ThemedText>
            ) : null}
            {item.pageCount ? (
              <ThemedText
                style={[styles.duration, { color: theme.textSecondary }]}
              >
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
    height: (SCREEN_WIDTH * 9) / 16,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  videoLoading: {
    justifyContent: "center",
    alignItems: "center",
  },
  videoOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  playVideoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  playVideoText: {
    fontSize: 18,
    fontWeight: "600",
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
    height: (SCREEN_WIDTH * 9) / 16,
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
  audioThumbnail: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    height: SCREEN_WIDTH - Spacing.xl * 2,
    maxHeight: 300,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
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
  progressBarTouchable: {
    paddingVertical: Spacing.md,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "visible",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    position: "absolute",
    left: 0,
    top: 0,
  },
  progressThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: "absolute",
    top: -5,
    marginLeft: -8,
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
    marginTop: Spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  speedLabel: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  speedButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  speedButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  speedButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  documentScrollView: {
    flex: 1,
  },
  documentContent: {
    paddingVertical: Spacing.lg,
  },
  fullScreenDocument: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullScreenLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  documentPageFullscreen: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  documentHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  documentBackButton: {
    padding: Spacing.xs,
    width: 40,
  },
  documentTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  documentFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  pageCounter: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  pageNavButton: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: {
    left: Spacing.md,
  },
  nextButton: {
    right: Spacing.md,
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
