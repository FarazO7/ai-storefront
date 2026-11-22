import { Check } from "lucide-react";
import type { ReactNode } from "react";

type Option<T extends string> = { value: T; label: ReactNode; description?: ReactNode };
type GroupProps<T extends string> = {
  /** Unique per page: native radios with one name form a group, so arrow keys and screen readers work for free. */
  name: string;
  legend: ReactNode;
  hideLegend?: boolean;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
};

const LEGEND = "mb-2 text-ui text-text-1";
const FOCUS = "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

/** Single-choice pills: outlined, and black when picked. */
export function ChoiceChips<T extends string>({ name, legend, hideLegend, options, value, onChange, disabled }: GroupProps<T>) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className={hideLegend ? "sr-only" : LEGEND}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`tap-44 inline-flex cursor-pointer items-center rounded-pill border border-stroke-ink bg-surface-1 px-5 py-[7px] text-ui font-medium text-text-1 transition-[background-color,color,translate] duration-(--duration-base) ui-hover:bg-ink-5 motion-safe:ui-active:translate-y-px ui-active:bg-ink-10 has-checked:border-transparent has-checked:bg-ink has-checked:text-text-inverted has-disabled:cursor-not-allowed has-disabled:opacity-50 ${FOCUS}`}
          >
            <input type="radio" className="sr-only" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Two-per-row option cards with a title, an optional description and a check circle. */
export function RadioCards<T extends string>({ name, legend, hideLegend, options, value, onChange, disabled }: GroupProps<T>) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className={hideLegend ? "sr-only" : LEGEND}>{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`group relative flex min-h-11 cursor-pointer flex-col justify-center gap-0.5 rounded-float border-[1.5px] border-stroke-primary bg-surface-1 py-3 pr-10 pl-3 transition-colors duration-(--duration-base) ui-hover:bg-surface-1-hover has-checked:border-accent has-checked:bg-surface-accent has-disabled:cursor-not-allowed has-disabled:opacity-50 ${FOCUS}`}
          >
            <input type="radio" className="sr-only" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className="text-body font-semibold text-text-1">{option.label}</span>
            {option.description && <span className="text-ui text-text-2">{option.description}</span>}
            <span
              aria-hidden
              className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-pill border-[1.5px] border-stroke-secondary text-text-inverted group-has-checked:border-accent group-has-checked:bg-accent"
            >
              <Check className="hidden size-3.5 stroke-[2.5] group-has-checked:block" />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
