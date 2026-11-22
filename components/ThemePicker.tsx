import { THEME_IDS, THEMES, type ThemeId } from "@/lib/constants";

/** The store's colour theme: four swatches on native radios; the picked one gets a 2px ink outline. */
export default function ThemePicker({ value, onChange, disabled }: { value: ThemeId; onChange: (theme: ThemeId) => void; disabled: boolean }) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-2 text-ui text-text-1">Colour theme</legend>
      <div className="grid grid-cols-4 gap-2">
        {THEME_IDS.map((id) => (
          <label key={id} className="flex cursor-pointer flex-col items-center gap-1.5 text-micro font-medium text-text-1 has-disabled:cursor-not-allowed has-disabled:opacity-50">
            <input type="radio" name="theme" value={id} checked={value === id} onChange={() => onChange(id)} className="peer sr-only" />
            <span
              aria-hidden
              data-store-theme={id}
              className="flex h-12 w-full items-center justify-center rounded-card border border-stroke-secondary bg-(--store-bg) transition-shadow duration-(--duration-base) peer-checked:border-ink peer-checked:ring-1 peer-checked:ring-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
            >
              <span className="size-5 rounded-pill bg-(--store-button)" />
            </span>
            {THEMES[id].label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
