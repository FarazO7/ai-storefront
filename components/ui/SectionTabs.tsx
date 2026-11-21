"use client";

import { useRef, type KeyboardEvent } from "react";

/** Underlined section tabs. Arrow keys, Home and End move between them.
 *  Each panel needs id `${id}-panel-${value}`, role="tabpanel" and aria-labelledby `${id}-tab-${value}`. */
export default function SectionTabs<T extends string>({ id, label, tabs, value, onChange }: { id: string; label: string; tabs: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = tabs.findIndex((tab) => tab.value === value);

  function onKeyDown(event: KeyboardEvent) {
    const target = ({ ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 } as Record<string, number>)[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const index = (target + tabs.length) % tabs.length;
    onChange(tabs[index].value);
    refs.current[index]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex overflow-x-auto border-b border-stroke-primary">
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(element) => {
              refs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${tab.value}`}
            aria-controls={`${id}-panel-${tab.value}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            className={`-mb-px shrink-0 border-b-2 p-3 text-ui whitespace-nowrap transition-colors duration-(--duration-base) ${selected ? "border-accent font-semibold text-text-accent" : "border-transparent text-text-2 ui-hover:text-text-1"}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
