"use client";

import { useState } from "react";

// shortcut: shows the thank-you only; Phase 3 also records the tap in Redis.
export default function InterestButton({ label, handle }: { label: string; handle: string | null }) {
  const [thanked, setThanked] = useState(false);

  if (thanked) {
    return (
      <p role="status" className="rounded-xl bg-emerald-50 p-3 text-center font-medium text-emerald-800">
        {handle ? `Thanks! Follow @${handle} for launch news` : "Thanks!"}
      </p>
    );
  }
  return (
    <button type="button" onClick={() => setThanked(true)} className="h-12 w-full rounded-xl bg-zinc-900 font-medium text-white active:bg-zinc-700">
      {label}
    </button>
  );
}
