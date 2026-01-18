import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";

const WEBSITE_URL = "https://onetimeonetime.com";

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

  const handleForgotPassword = async () => {
    await WebBrowser.openBrowserAsync(`${WEBSITE_URL}/forgot-password`);
  };

  const handleCreateAccount = async () => {
    await WebBrowser.openBrowserAsync(`${WEBSITE_URL}/signup`);
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
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="h2" style={[styles.appName, { color: theme.text }]}>
          Kids' Hotline
        </ThemedText>
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
          style={styles.loginButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            "Sign In"
          )}
        </Button>

        <View style={styles.linksContainer}>
          <Pressable
            onPress={handleForgotPassword}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            testID="button-forgot-password"
          >
            <ThemedText style={[styles.link, { color: theme.primary }]}>
              Forgot Password?
            </ThemedText>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <Pressable
            onPress={handleCreateAccount}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            testID="button-create-account"
          >
            <ThemedText style={[styles.link, { color: theme.primary }]}>
              Create Account
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          Use your onetimeonetime.com credentials
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
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  appName: {
    marginBottom: Spacing.xs,
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
  linksContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  link: {
    fontSize: 15,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: Spacing.lg,
  },
  footer: {
    alignItems: "center",
    paddingTop: Spacing["2xl"],
  },
  footerText: {
    fontSize: 13,
  },
});
