import { CircleAlert, CircleCheck, Info, Sparkles, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "critical";

const BADGE: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text-2",
  accent: "bg-surface-accent text-(--blue-700)", // blue-600 is only 4.3:1 on this fill
  success: "bg-surface-success-1 text-text-success",
  warning: "bg-surface-warning-1 text-text-warning",
  critical: "bg-surface-critical-1 text-text-critical",
};

/** A small tinted label: status, "Draft", "Not needed to start". */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-4 px-2 py-1 text-micro font-semibold whitespace-nowrap [&_svg]:size-3.5 ${BADGE[tone]}`}>{children}</span>;
}

/** A count with an icon, such as interest taps. */
export function MetricChip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-pill bg-surface-2 px-2 text-micro font-medium text-text-1 whitespace-nowrap [&_svg]:size-4">
      {icon}
      {children}
    </span>
  );
}

type CalloutTone = "info" | "success" | "warning" | "critical" | "ai";

const CALLOUT: Record<CalloutTone, { className: string; icon: ReactNode }> = {
  info: { className: "bg-surface-accent text-text-1 [&>svg]:text-accent", icon: <Info aria-hidden /> },
  success: { className: "bg-surface-success-1 text-text-success", icon: <CircleCheck aria-hidden /> },
  warning: { className: "bg-surface-warning-1 text-text-warning", icon: <TriangleAlert aria-hidden /> },
  critical: { className: "bg-surface-critical-1 text-text-critical", icon: <CircleAlert aria-hidden /> },
  ai: { className: "border border-stroke-primary bg-(image:--ai-tint) text-text-1 [&>svg]:text-ai-blue", icon: <Sparkles aria-hidden /> },
};

/** A tinted note: info, success, warning, critical, or the AI treatment. Pass role="alert" for errors that appear after an action. */
export function Callout({ tone = "info", title, children, action, role }: { tone?: CalloutTone; title?: ReactNode; children?: ReactNode; action?: ReactNode; role?: "alert" | "status" }) {
  const { className, icon } = CALLOUT[tone];
  return (
    <div role={role} className={`flex gap-3 rounded-card px-4 py-3 text-ui [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 ${className}`}>
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
}
