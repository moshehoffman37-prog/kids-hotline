import React from "react";
import { StyleSheet, Dimensions, Platform } from "react-native";
import { Image, ImageStyle } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ZoomableImageProps {
  uri: string;
  headers?: Record<string, string>;
  style?: ImageStyle;
  onZoomStart?: () => void;
  onZoomEnd?: () => void;
}

export function ZoomableImage({ uri, headers, style, onZoomStart, onZoomEnd }: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const isZoomed = useSharedValue(false);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      if (!isZoomed.value && onZoomStart) {
        isZoomed.value = true;
        runOnJS(onZoomStart)();
      }
    })
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        if (isZoomed.value && onZoomEnd) {
          isZoomed.value = false;
          runOnJS(onZoomEnd)();
        }
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
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
        if (isZoomed.value && onZoomEnd) {
          isZoomed.value = false;
          runOnJS(onZoomEnd)();
        }
      } else {
        if (!isZoomed.value && onZoomStart) {
          isZoomed.value = true;
          runOnJS(onZoomStart)();
        }
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: scale.value > 1 ? 1000 : 1,
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
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Image
          source={{ uri, headers }}
          style={style}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    alignItems: "center",
  },
});
