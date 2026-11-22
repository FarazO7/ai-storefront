"use client";

import { useEffect } from "react";
import Button, { buttonClass } from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { EmptyState } from "@/components/ui/Surfaces";

// The 500 page: friendly words, a retry and a way home. The draft lives in this phone's storage, so nothing is lost.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex h-14 items-center border-b border-stroke-primary px-4 md:px-12">
        <Logo />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <EmptyState
          level={1}
          title="Something went wrong on our side"
          action={
            <div className="flex w-full flex-col gap-2">
              <Button size="lg" className="w-full" onClick={() => retry()}>
                Try Again
              </Button>
              {/* A full page load: the editor lives on the home page, so a client-side link would leave this error showing. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className={`${buttonClass({ variant: "tertiary", size: "lg" })} w-full`}>
                Go to the home page
              </a>
            </div>
          }
        >
          What you typed is saved on this phone. Try again, or start from the home page.
        </EmptyState>
      </main>
    </div>
  );
}
