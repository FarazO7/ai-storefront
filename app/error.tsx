"use client";

import Link from "next/link";
import { useEffect } from "react";

// The 500 page: friendly words, a retry and a way home. The draft lives in this phone's storage, so nothing is lost.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong on our side</h1>
      <p className="text-zinc-600">What you typed is saved on this phone. Try again, or start from the home page.</p>
      <button type="button" onClick={() => retry()} className="h-12 w-full rounded-xl bg-zinc-900 font-medium text-white">
        Try again
      </button>
      <Link href="/" className="flex h-12 w-full items-center justify-center rounded-xl border border-zinc-300 font-medium">
        Go to the home page
      </Link>
    </main>
  );
}
