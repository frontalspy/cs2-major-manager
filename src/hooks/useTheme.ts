import { useEffect, useState } from "react";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "../data/themes";

const KEY = "cs2-major-simulator:theme";

function readStored(): ThemeId {
  try {
    const value = window.localStorage.getItem(KEY);
    return isThemeId(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

// Palette choice, kept in localStorage and applied as data-theme on <html>.
export function useTheme(): [ThemeId, (id: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>(readStored);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      // storage unavailable: the choice just won't persist
    }
  }, [theme]);

  return [theme, setTheme];
}
