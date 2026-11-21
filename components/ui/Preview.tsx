import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export type Device = "mobile" | "desktop";

/** The editor's dark preview canvas: a title, the device switch, then the framed store. */
export function PreviewCanvas({ device, onDeviceChange, children }: { device: Device; onDeviceChange: (device: Device) => void; children: ReactNode }) {
  return (
    <section aria-label="Preview" className="preview-grid flex min-h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title font-semibold text-text-inverted">Preview</h2>
        <label className="relative">
          <span className="sr-only">Preview size</span>
          <select
            value={device}
            onChange={(event) => onDeviceChange(event.target.value as Device)}
            className="h-10 appearance-none rounded-card border border-stroke-inverted bg-surface-10 pr-9 pl-3 text-body text-text-inverted"
          >
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
          <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-text-inverted" />
        </label>
      </div>
      <div className="flex flex-1 justify-center">{children}</div>
    </section>
  );
}

/** A phone or browser frame around the store. */
export function DeviceFrame({ device, url, children }: { device: Device; url: string; children: ReactNode }) {
  if (device === "mobile") {
    return (
      <div className="w-[390px] max-w-full shrink-0 overflow-hidden rounded-device border-8 border-shell bg-surface-1 shadow-raised">
        <div className="h-[720px] max-h-[75dvh] overflow-y-auto">{children}</div>
      </div>
    );
  }
  return (
    <div className="w-full overflow-hidden rounded-float bg-surface-1 shadow-raised">
      <div aria-hidden className="flex items-center gap-2 border-b border-stroke-primary bg-surface-2 px-3 py-2">
        <span className="size-3 rounded-pill bg-stroke-critical" />
        <span className="size-3 rounded-pill bg-stroke-warning" />
        <span className="size-3 rounded-pill bg-stroke-success" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-pill bg-surface-1 px-3 py-1 text-micro text-text-2">{url}</span>
      </div>
      <div className="h-[720px] max-h-[75dvh] overflow-y-auto">{children}</div>
    </div>
  );
}
