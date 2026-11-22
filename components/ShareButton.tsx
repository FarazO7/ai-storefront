"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";

/** Shares the store's public link through the phone's share sheet, or copies it where there's no share sheet. */
export default function ShareButton({ path, title }: { path: string; title: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // The visitor closed the share sheet.
      }
      return;
    }
    navigator.clipboard.writeText(url).then(() => setState("copied"), () => setState("failed"));
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button variant="tertiary" size="lg" icon={state === "copied" ? <Check aria-hidden /> : <Link2 aria-hidden />} onClick={share} className="w-full">
        {state === "copied" ? "Link copied" : "Share this store"}
      </Button>
      {state === "failed" && <p className="text-ui text-text-2">Couldn&apos;t copy. Copy the address from your browser bar.</p>}
    </div>
  );
}
