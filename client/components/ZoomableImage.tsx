import React, { useState } from "react";
import { StyleSheet, Dimensions, Platform, Modal, Pressable, View } from "react-native";
import { Image, ImageStyle } from "expo-image";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ZoomableImageProps {
  uri: string;
  headers?: Record<string, string>;
  style?: ImageStyle;
}

export function ZoomableImage({ uri, headers, style }: ZoomableImageProps) {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    resetZoom();
    setIsFullscreen(false);
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        resetZoom();
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        resetZoom();
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTapGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (Platform.OS === "web") {
    return (
      <Image
        source={{ uri, headers }}
        style={style}
        contentFit="contain"
      />
    );
  }

  return (
    <>
      <Pressable onPress={openFullscreen}>
        <Image
          source={{ uri, headers }}
          style={style}
          contentFit="contain"
        />
      </Pressable>

      <Modal
        visible={isFullscreen}
        animationType="fade"
        transparent={false}
        onRequestClose={closeFullscreen}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <Pressable
              onPress={closeFullscreen}
              style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>

            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.fullscreenImageContainer, animatedStyle]}>
                <Image
                  source={{ uri, headers }}
                  style={styles.fullscreenImage}
                  contentFit="contain"
                />
              </Animated.View>
            </GestureDetector>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  fullscreenImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
