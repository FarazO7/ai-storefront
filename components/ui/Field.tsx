import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type FieldSize = "sm" | "md" | "lg";

/** Label above the control, then a hint or an error. The error replaces the hint. */
export function Field({ label, htmlFor, required, hint, error, children }: { label: ReactNode; htmlFor: string; required?: boolean; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-ui text-text-1">
        {label}
        {required && (
          <span aria-hidden className="text-stroke-critical">
            {" "}*
          </span>
        )}
      </label>
      {children}
      {error ? <p className="text-ui text-text-critical">{error}</p> : hint && <p className="text-ui text-text-2">{hint}</p>}
    </div>
  );
}

// Inputs are 16px so iOS doesn't zoom. md is 44px tall on phones (the tap-target minimum) and 40px from 768px.
const HEIGHTS: Record<FieldSize, string> = { sm: "h-9", md: "h-11 md:h-10", lg: "h-11" };
const FRAME =
  "rounded-field border bg-surface-1 transition-[border-color,box-shadow] duration-(--duration-fast) ease-in-out ui-focus:border-accent";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> & {
  fieldSize?: FieldSize;
  invalid?: boolean;
  /** Before the text, such as ₹. */
  prefix?: ReactNode;
  /** After the text, such as a unit or a discount chip. */
  suffix?: ReactNode;
  /** Shows "used/max" inside the field; needs maxLength. */
  counter?: boolean;
  "data-state"?: string;
};

export function Input({ fieldSize = "md", invalid, prefix, suffix, counter, disabled, "data-state": state, ...rest }: InputProps) {
  const used = String(rest.value ?? "").length;
  return (
    <div
      data-field
      data-state={state}
      className={`flex items-center gap-2 px-3 ${FRAME} ${HEIGHTS[fieldSize]} ${invalid ? "border-stroke-critical" : "border-stroke-primary"} ${disabled ? "bg-surface-3" : ""}`}
    >
      {prefix && <span className="text-body text-text-3">{prefix}</span>}
      <input
        {...rest}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        // Runs over the frame's 1px borders, so a tap anywhere on the 44px field lands on the input.
        className="-my-px h-[calc(100%+2px)] min-w-0 flex-1 bg-transparent text-body text-text-1 outline-none placeholder:text-text-4 disabled:cursor-not-allowed disabled:text-text-4"
      />
      {suffix}
      {counter && rest.maxLength !== undefined && (
        <span aria-hidden className="text-ui font-medium text-text-3 tabular-nums">
          {used}/{rest.maxLength}
        </span>
      )}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
  counter?: boolean;
  /** Counts toward this without blocking typing (the counter turns red past it); defaults to maxLength. */
  limit?: number;
  "data-state"?: string;
};

export function Textarea({ invalid, counter, limit, disabled, "data-state": state, ...rest }: TextareaProps) {
  const used = String(rest.value ?? "").length;
  const max = limit ?? rest.maxLength;
  return (
    <div className="flex flex-col gap-1">
      <textarea
        {...rest}
        disabled={disabled}
        data-field
        data-state={state}
        aria-invalid={invalid || undefined}
        className={`w-full px-3 py-[9px] text-body text-text-1 outline-none placeholder:text-text-4 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-text-4 ${FRAME} ${invalid ? "border-stroke-critical" : "border-stroke-primary"}`}
      />
      {counter && max !== undefined && (
        <span aria-hidden className={`self-end text-ui font-medium tabular-nums ${used > max ? "text-text-critical" : "text-text-3"}`}>
          {used.toLocaleString("en-IN")}/{max.toLocaleString("en-IN")}
        </span>
      )}
    </div>
  );
}

/** Suffix for a discounted price: the launch price, the struck regular price and the saving. */
export function DiscountChip({ price, regular, percent }: { price: string; regular: string; percent: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-2 bg-suffix-chip px-1 py-0.5 text-ui whitespace-nowrap">
      <span className="text-text-1">{price}</span>
      <s className="text-text-2">{regular}</s>
      <span className="text-discount">({percent}% off)</span>
    </span>
  );
}
