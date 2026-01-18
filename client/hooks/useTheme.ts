import { useMemo, useContext } from "react";
import { getColors, AccentColors } from "@/constants/theme";
import { SettingsContext } from "@/contexts/SettingsContext";

export function useTheme() {
  const settings = useContext(SettingsContext);
  const accentColor = settings?.accentColor ?? AccentColors.yellow;
  
  const theme = useMemo(() => {
    const colors = getColors(accentColor);
    return colors.dark;
  }, [accentColor]);

  return {
    theme,
    isDark: true,
  };
}
