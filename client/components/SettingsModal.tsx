import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, AccentColors, AccentColorName } from "@/constants/theme";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const colorOptions: { name: AccentColorName; label: string }[] = [
  { name: "yellow", label: "Yellow" },
  { name: "blue", label: "Blue" },
  { name: "green", label: "Green" },
  { name: "purple", label: "Purple" },
  { name: "pink", label: "Pink" },
  { name: "orange", label: "Orange" },
  { name: "red", label: "Red" },
  { name: "teal", label: "Teal" },
];

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { accentColorName, setAccentColor } = useSettings();
  const { logout } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleColorSelect = (colorName: AccentColorName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccentColor(colorName);
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      setShowSignOutConfirm(true);
    } else {
      Alert.alert(
        "Sign Out",
        "You are about to sign out. You will need to enter your password again to access your content.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: async () => {
              onClose();
              await logout();
            },
          },
        ]
      );
    }
  };

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false);
    onClose();
    await logout();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Settings
          </ThemedText>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            hitSlop={8}
          >
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
        >
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Theme Color
            </ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              Choose your preferred accent color
            </ThemedText>
            <View style={styles.colorGrid}>
              {colorOptions.map((option) => {
                const isSelected = option.name === accentColorName;
                const color = AccentColors[option.name];
                return (
                  <Pressable
                    key={option.name}
                    onPress={() => handleColorSelect(option.name)}
                    style={[
                      styles.colorOption,
                      {
                        backgroundColor: theme.backgroundSecondary,
                        borderColor: isSelected ? color : theme.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: color }]}>
                      {isSelected ? (
                        <Feather name="check" size={16} color="#FFFFFF" />
                      ) : null}
                    </View>
                    <ThemedText style={[styles.colorLabel, { color: theme.text }]}>
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Account
            </ThemedText>
            <Pressable
              onPress={handleSignOut}
              style={[
                styles.signOutButton,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.destructive },
              ]}
            >
              <Feather name="log-out" size={20} color={theme.destructive} />
              <ThemedText style={[styles.signOutText, { color: theme.destructive }]}>
                Sign Out
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {showSignOutConfirm ? (
        <View style={[styles.confirmOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.confirmBox, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={[styles.confirmTitle, { color: theme.text }]}>
              Sign Out
            </ThemedText>
            <ThemedText style={[styles.confirmMessage, { color: theme.textSecondary }]}>
              You are about to sign out. You will need to enter your password again to access your content.
            </ThemedText>
            <View style={styles.confirmButtons}>
              <Pressable
                onPress={() => setShowSignOutConfirm(false)}
                style={[styles.confirmButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText style={[styles.confirmButtonText, { color: theme.text }]}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={confirmSignOut}
                style={[styles.confirmButton, { backgroundColor: theme.destructive }]}
              >
                <ThemedText style={[styles.confirmButtonText, { color: "#FFFFFF" }]}>
                  Sign Out
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  closeButton: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.md,
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  colorOption: {
    width: 72,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  colorLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  confirmBox: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
