import React from "react";
import { StyleSheet, Dimensions, Platform, View } from "react-native";
import { Image, ImageStyle } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ZoomableImageProps {
  uri: string;
  headers?: Record<string, string>;
  style?: ImageStyle;
}

export function ZoomableImage({ uri, headers, style }: ZoomableImageProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const isZoomed = useDerivedValue(() => scale.value > 1);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
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
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
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
    zIndex: isZoomed.value ? 1000 : 1,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: isZoomed.value ? 1 : 0,
    pointerEvents: isZoomed.value ? "auto" as const : "none" as const,
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
    <View style={styles.wrapper}>
      <Animated.View style={[styles.overlay, { backgroundColor: theme.background }, overlayStyle]} />
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <Image
            source={{ uri, headers }}
            style={style}
            contentFit="contain"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
  },
  container: {
    width: SCREEN_WIDTH,
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: -SCREEN_HEIGHT,
    left: -SCREEN_WIDTH / 2,
    width: SCREEN_WIDTH * 2,
    height: SCREEN_HEIGHT * 3,
    zIndex: 999,
  },
});
