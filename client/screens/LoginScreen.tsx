import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError("");
    setIsLoading(true);

    const result = await login(email.trim(), password);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Login failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing["5xl"],
          paddingBottom: insets.bottom + Spacing["2xl"],
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/logo.webp")}
          style={styles.logo}
          contentFit="contain"
        />
        <ThemedText style={[styles.tagline, { color: theme.textSecondary }]}>
          Sign in to access your content
        </ThemedText>
      </View>

      <View style={styles.formContainer}>
        {error ? (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: `${theme.destructive}15` },
            ]}
          >
            <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          editable={!isLoading}
          testID="input-email"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          isPassword
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          editable={!isLoading}
          testID="input-password"
        />

        <Button
          onPress={handleLogin}
          disabled={isLoading}
          style={[styles.loginButton, { backgroundColor: theme.accent }]}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.buttonText} size="small" />
          ) : (
            "Sign In"
          )}
        </Button>
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          Create and manage your account at
        </ThemedText>
        <ThemedText style={[styles.websiteText, { color: theme.accent }]}>
          onetimeonetime.com
        </ThemedText>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: Spacing.lg,
  },
  tagline: {
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  footer: {
    alignItems: "center",
    paddingTop: Spacing["2xl"],
  },
  footerText: {
    fontSize: 13,
    textAlign: "center",
  },
  websiteText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
});
