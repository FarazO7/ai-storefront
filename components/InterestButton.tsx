"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { Callout } from "@/components/ui/Status";

// On the public page, each click also counts one tap (no personal data). The editor preview passes no `tap`,
// so creators trying their own buttons don't inflate the count.
export default function InterestButton({ label, handle, tap }: { label: string; handle: string | null; tap?: { slug: string; productId: string } }) {
  const [thanked, setThanked] = useState(false);

  if (thanked) {
    return (
      <Callout tone="success" role="status">
        {handle ? `Thanks! Follow @${handle} for launch news` : "Thanks!"}
      </Callout>
    );
  }
  return (
    <Button
      variant="store"
      size="checkout"
      iconRight={<ArrowRight aria-hidden />}
      onClick={() => {
        setThanked(true);
        if (tap) {
          void fetch("/api/tap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tap), keepalive: true }).catch(() => {});
        }
      }}
    >
      {label}
    </Button>
  );
}
