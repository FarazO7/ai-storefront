import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import CreatorApp from "@/components/CreatorApp";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Surfaces";
import TopBar from "@/components/ui/TopBar";
import { getStoreForEdit, getTaps } from "@/lib/redis";

// The edit token is in the URL: send no referrer when the creator taps an outside link, and keep the page out of search.
export const metadata: Metadata = {
  title: "Edit your store",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function EditPage({ params, searchParams }: PageProps<"/e/[slug]">) {
  return (
    <main className="min-h-dvh">
      <Suspense fallback={<p className="py-20 text-center text-ui text-text-2">Loading your store…</p>}>
        <EditLoader params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function EditLoader({ params, searchParams }: Pick<PageProps<"/e/[slug]">, "params" | "searchParams">) {
  const [{ slug }, { t }] = await Promise.all([params, searchParams]);
  const record = typeof t === "string" ? await getStoreForEdit(slug, t) : null;

  if (!record?.input || typeof t !== "string") {
    // Same layout as the 404 pages: the top bar, then the empty state in the middle of the screen.
    return (
      <div className="flex min-h-dvh flex-col">
        <TopBar />
        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <EmptyState
            level={1}
            title="This edit link doesn't work"
            action={
              <Link href="/" className={`${buttonClass({ cta: true })} pl-5`}>
                <Plus aria-hidden className="size-4!" />
                Make a Store
              </Link>
            }
          >
            It may be incomplete. Open the full link you saved when you published, or make a new store.
          </EmptyState>
        </div>
      </div>
    );
  }

  const { name, handle, bio, products, testimonials, theme, input } = record;
  const taps = await getTaps(slug); // read only after the token checks out
  return <CreatorApp initial={{ store: { name, handle, bio, products, testimonials, theme }, input, slug, token: t, taps }} />;
}
