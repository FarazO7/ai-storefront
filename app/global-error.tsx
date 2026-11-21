"use client";

import "./globals.css";

// Replaces the root layout when even the layout fails, so it brings its own <html> and <body>.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <title>Something went wrong</title>
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong on our side</h1>
          <p className="text-zinc-600">What you typed is saved on this phone. Please try again.</p>
          <button type="button" onClick={() => retry()} className="h-12 w-full rounded-xl bg-zinc-900 font-medium text-white">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
