import { Plus } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Surfaces";
import TopBar from "@/components/ui/TopBar";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <EmptyState
          level={1}
          title="This page doesn't exist"
          action={
            <Link href="/" className={`${buttonClass({ cta: true })} pl-5`}>
              <Plus aria-hidden className="size-4!" />
              Make your own store
            </Link>
          }
        >
          The link may be mistyped or out of date.
        </EmptyState>
      </main>
    </div>
  );
}
