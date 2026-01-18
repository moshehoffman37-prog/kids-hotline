import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccentColorName, AccentColors } from "@/constants/theme";

const ACCENT_COLOR_KEY = "@onetimeonetime_accent_color";

interface SettingsContextType {
  accentColorName: AccentColorName;
  accentColor: string;
  setAccentColor: (colorName: AccentColorName) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [accentColorName, setAccentColorName] = useState<AccentColorName>("yellow");

  useEffect(() => {
    loadStoredSettings();
  }, []);

  const loadStoredSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(ACCENT_COLOR_KEY);
      if (stored && stored in AccentColors) {
        setAccentColorName(stored as AccentColorName);
      }
    } catch {
    }
  };

  const setAccentColor = useCallback(async (colorName: AccentColorName) => {
    setAccentColorName(colorName);
    try {
      await AsyncStorage.setItem(ACCENT_COLOR_KEY, colorName);
    } catch {
    }
  }, []);

  const value: SettingsContextType = {
    accentColorName,
    accentColor: AccentColors[accentColorName],
    setAccentColor,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
