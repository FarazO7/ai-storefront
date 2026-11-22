"use client";

import "./globals.css";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { EmptyState } from "@/components/ui/Surfaces";

// Replaces the root layout when even the layout fails, so it brings its own <html> and <body>.
// The self-hosted font comes from the layout, so this page uses the font token's system fallback.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <title>Something went wrong</title>
        <div className="flex min-h-dvh flex-col">
          <div className="flex h-14 items-center border-b border-stroke-primary px-4 md:px-12">
            <Logo />
          </div>
          <main className="flex flex-1 items-center justify-center px-4 py-12">
            <EmptyState
              level={1}
              title="Something went wrong on our side"
              action={
                <Button size="lg" className="w-full" onClick={() => retry()}>
                  Try again
                </Button>
              }
            >
              What you typed is saved on this phone. Please try again.
            </EmptyState>
          </main>
        </div>
      </body>
    </html>
  );
}
