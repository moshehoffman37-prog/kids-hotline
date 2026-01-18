import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  isPassword = false,
  value,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderColor = useSharedValue(theme.inputBorder);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = (e: any) => {
    setIsFocused(true);
    borderColor.value = withTiming(theme.primary, { duration: 150 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    borderColor.value = withTiming(
      error ? theme.destructive : theme.inputBorder,
      { duration: 150 }
    );
    onBlur?.(e);
  };

  const hasValue = value && value.length > 0;
  const isLabelFloating = isFocused || hasValue;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.inputBackground },
          animatedBorderStyle,
          error ? { borderColor: theme.destructive } : null,
        ]}
      >
        <ThemedText
          style={[
            styles.label,
            {
              color: error
                ? theme.destructive
                : isFocused
                  ? theme.primary
                  : theme.textSecondary,
              top: isLabelFloating ? 8 : 16,
              fontSize: isLabelFloating ? 12 : 16,
            },
          ]}
        >
          {label}
        </ThemedText>
        <TextInput
          value={value}
          style={[
            styles.input,
            { color: theme.text, paddingTop: 24 },
          ]}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        <ThemedText style={[styles.error, { color: theme.destructive }]}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.sm,
    position: "relative",
    minHeight: Spacing.inputHeight + 8,
  },
  label: {
    position: "absolute",
    left: Spacing.lg,
    fontWeight: "500",
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    fontSize: 16,
    minHeight: Spacing.inputHeight + 8,
  },
  eyeButton: {
    position: "absolute",
    right: Spacing.lg,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  error: {
    fontSize: 12,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
