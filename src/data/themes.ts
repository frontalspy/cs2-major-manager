export const THEMES = [
  { id: "navy", label: "Navy", swatch: "#3f7fe0" },
  { id: "dust", label: "Dust", swatch: "#d9922b" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "navy";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}
