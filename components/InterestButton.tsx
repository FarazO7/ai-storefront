"use client";

import { useState } from "react";

// On the public page, each click also counts one tap (no personal data). The editor preview passes no `tap`,
// so creators trying their own buttons don't inflate the count.
export default function InterestButton({ label, handle, tap }: { label: string; handle: string | null; tap?: { slug: string; productId: string } }) {
  const [thanked, setThanked] = useState(false);

  if (thanked) {
    return (
      <p role="status" className="rounded-xl bg-emerald-50 p-3 text-center font-medium text-emerald-800">
        {handle ? `Thanks! Follow @${handle} for launch news` : "Thanks!"}
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={() => {
        setThanked(true);
        if (tap) {
          void fetch("/api/tap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tap), keepalive: true }).catch(() => {});
        }
      }}
      className="h-12 w-full rounded-xl bg-(--store-button) font-medium text-white active:opacity-80"
    >
      {label}
    </button>
  );
}
