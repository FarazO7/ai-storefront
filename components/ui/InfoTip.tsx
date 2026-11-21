"use client";

import { Info } from "lucide-react";
import { useId, type ReactNode } from "react";

/** An (i) button that shows a one-sentence explanation on hover and on keyboard focus. Escape hides it. */
export default function InfoTip({ label, children, open }: { label: string; children: ReactNode; open?: boolean }) {
  const id = useId();
  return (
    <span className="group relative inline-flex align-middle" data-state={open ? "open" : undefined}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        onKeyDown={(event) => event.key === "Escape" && event.currentTarget.blur()}
        className="tap-44 inline-flex size-5 items-center justify-center rounded-pill text-text-3 transition-colors duration-(--duration-base) ui-hover:text-text-1"
      >
        <Info aria-hidden className="size-3.5" />
      </button>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-4 bg-tooltip p-3 text-center text-ui font-normal tracking-normal text-text-inverted normal-case opacity-0 transition-opacity duration-(--duration-fast) group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 group-data-[state=open]:visible group-data-[state=open]:opacity-100"
      >
        {children}
        <span aria-hidden className="absolute top-full left-1/2 -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-tooltip" />
      </span>
    </span>
  );
}
