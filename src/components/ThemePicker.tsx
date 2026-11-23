import { THEMES, type ThemeId } from "../data/themes";

export function ThemePicker({ theme, onChange }: { theme: ThemeId; onChange: (id: ThemeId) => void }) {
  return (
    <div className="themes" role="group" aria-label="Colour theme">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className="theme-dot"
          style={{ background: t.swatch }}
          aria-label={t.label}
          title={t.label}
          aria-pressed={theme === t.id}
          onClick={() => onChange(t.id)}
        />
      ))}
    </div>
  );
}
