import { useMemo, useContext } from "react";
import { getColors, AccentColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SettingsContext } from "@/contexts/SettingsContext";

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const settings = useContext(SettingsContext);
  const accentColor = settings?.accentColor ?? AccentColors.yellow;
  
  const theme = useMemo(() => {
    const colors = getColors(accentColor);
    return colors[colorScheme ?? "light"];
  }, [colorScheme, accentColor]);

  return {
    theme,
    isDark,
  };
}
