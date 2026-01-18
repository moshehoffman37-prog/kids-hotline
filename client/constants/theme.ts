import { Platform } from "react-native";

const primaryColor = "#1A2A3A";
const backgroundColor = "#161616";

export const AccentColors = {
  yellow: "#EDE518",
  blue: "#3B82F6",
  green: "#10B981",
  purple: "#8B5CF6",
  pink: "#EC4899",
  orange: "#F97316",
  red: "#EF4444",
  teal: "#14B8A6",
} as const;

export type AccentColorName = keyof typeof AccentColors;

export function getColors(accentColor: string) {
  return {
    light: {
      text: "#161616",
      textSecondary: "#666666",
      buttonText: "#161616",
      tabIconDefault: "#666666",
      tabIconSelected: accentColor,
      link: accentColor,
      primary: primaryColor,
      accent: accentColor,
      success: "#10B981",
      warning: "#F97316",
      destructive: "#EF4444",
      border: "#E2E8F0",
      backgroundRoot: "#FFFFFF",
      backgroundDefault: "#F5F5F5",
      backgroundSecondary: "#EEEEEE",
      backgroundTertiary: "#E0E0E0",
      inputBackground: "#FFFFFF",
      inputBorder: "#CCCCCC",
      cardBackground: "#FFFFFF",
      overlay: "rgba(22, 22, 22, 0.5)",
    },
    dark: {
      text: "#FFFFFF",
      textSecondary: "#AAAAAA",
      buttonText: "#161616",
      tabIconDefault: "#888888",
      tabIconSelected: accentColor,
      link: accentColor,
      primary: accentColor,
      accent: accentColor,
      success: "#34D399",
      warning: "#FB923C",
      destructive: "#F87171",
      border: "#333333",
      backgroundRoot: backgroundColor,
      backgroundDefault: "#1E1E1E",
      backgroundSecondary: "#2A2A2A",
      backgroundTertiary: "#333333",
      inputBackground: "#1E1E1E",
      inputBorder: "#444444",
      cardBackground: "#1E1E1E",
      overlay: "rgba(0, 0, 0, 0.7)",
    },
  };
}

export const Colors = getColors(AccentColors.yellow);

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 52,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
  },
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "Georgia",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "'Open Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
