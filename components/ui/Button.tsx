import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "link" | "text" | "grey" | "ai" | "danger" | "store";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "checkout";

const BASE =
  "relative inline-flex shrink-0 items-center justify-center whitespace-nowrap border transition-[background-color,box-shadow,color,opacity,translate] duration-(--duration-base) ui-active:translate-y-px disabled:cursor-not-allowed [&_svg]:shrink-0";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-ink text-text-inverted ui-hover:shadow-primary-hover ui-active:shadow-none disabled:opacity-50",
  secondary: "border-transparent bg-ink-10 text-text-1 ui-hover:bg-ink-20 ui-active:bg-ink-25 disabled:bg-ink-5 disabled:text-ink-25",
  tertiary:
    "border-stroke-ink bg-surface-1 text-text-1 ui-hover:bg-ink-5 ui-active:bg-ink-10 disabled:border-disabled-border disabled:text-ink-25 disabled:[&_svg]:opacity-60",
  link: "border-transparent text-text-accent ui-hover:bg-ink-5 ui-active:bg-ink-10 disabled:opacity-50",
  text: "border-transparent text-text-1 ui-hover:bg-ink-5 ui-active:bg-ink-10 disabled:opacity-50",
  grey: "border-transparent bg-surface-3 text-text-1 ui-hover:bg-surface-4 ui-active:bg-surface-5 disabled:opacity-50",
  // Destructive actions: red words, a red wash on hover.
  danger: "border-transparent text-text-critical ui-hover:bg-surface-critical-1 ui-active:bg-surface-critical-2 disabled:opacity-50",
  // The store's own theme colour (set by themeVars on the store); white text passes AA on every theme.
  store: "border-transparent bg-(--store-button) text-text-inverted ui-hover:shadow-primary-hover ui-active:shadow-none disabled:opacity-50",
  // AI entry points: the violet-to-blue tint, a blue sparkle and a springy icon on hover.
  ai: "border-stroke-primary bg-(image:--ai-tint) text-text-1 ui-hover:bg-surface-accent ui-active:bg-surface-ai disabled:opacity-50 [&_svg]:text-ai-blue [&_svg]:transition-transform [&_svg]:duration-(--duration-spring) [&_svg]:ease-spring ui-hover:[&_svg]:-translate-y-px ui-hover:[&_svg]:rotate-12",
};

// Heights: xs 28px, sm 36px, md 40px, lg 44px (1px border included); checkout is the public page's 48px call to action.
const SIZES: Record<ButtonSize, string> = {
  xs: "gap-1 rounded-pill px-4 py-[5px] text-micro font-medium [&_svg]:size-4",
  sm: "gap-2 rounded-pill px-5 py-[7px] text-ui font-medium [&_svg]:size-5",
  md: "gap-2 rounded-pill px-6 py-[9px] text-ui font-medium [&_svg]:size-5",
  lg: "gap-2 rounded-pill px-6 py-[11px] text-ui font-medium [&_svg]:size-5",
  checkout: "w-full justify-between gap-2 rounded-card px-5 py-3 text-body font-semibold [&_svg]:size-5",
};
const ICON_ONLY: Record<ButtonSize, string> = {
  xs: "rounded-pill px-[6px] py-[5px] [&_svg]:size-4",
  sm: "rounded-pill px-2 py-[7px] [&_svg]:size-5",
  md: "rounded-pill px-[10px] py-[9px] [&_svg]:size-5",
  lg: "rounded-pill px-3 py-[11px] [&_svg]:size-5",
  checkout: "rounded-card p-3 [&_svg]:size-5",
};

/** Classes for anything that should look like a button, such as a link. */
export function buttonClass({ variant = "primary", size = "md", iconOnly = false, cta = false }: { variant?: ButtonVariant; size?: ButtonSize; iconOnly?: boolean; cta?: boolean } = {}) {
  // Smaller than 44px: touch screens get an invisible 44px tap area.
  const tap = size === "lg" || size === "checkout" ? "" : "tap-44";
  return [BASE, VARIANTS[variant], iconOnly ? ICON_ONLY[size] : SIZES[size], tap, cta ? "btn-cta" : ""].join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon; replaced by the spinner while loading. */
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  /** The gradient ring: only for the page's main create action. */
  cta?: boolean;
};

export default function Button({ variant, size, icon, iconRight, loading = false, cta, className = "", children, onClick, ...rest }: ButtonProps) {
  const spinner = <LoaderCircle aria-hidden className="animate-spin" />;
  // While loading the button keeps its width: the spinner takes the icon's place, or sits over the hidden label.
  const overlay = loading && !icon;
  return (
    <button
      type="button"
      {...rest}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (event: MouseEvent<HTMLButtonElement>) => event.preventDefault() : onClick}
      className={`${buttonClass({ variant, size, iconOnly: !children, cta })} ${className}`}
    >
      {overlay && <span className="absolute inset-0 flex items-center justify-center">{spinner}</span>}
      {loading && icon ? spinner : icon}
      {children && <span className={overlay ? "invisible" : undefined}>{children}</span>}
      {iconRight}
    </button>
  );
}
