import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import CreatorApp from "@/components/CreatorApp";
import { getStoreForEdit, getTaps } from "@/lib/redis";

// The edit token is in the URL: send no referrer when the creator taps an outside link, and keep the page out of search.
export const metadata: Metadata = {
  title: "Edit your store",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function EditPage({ params, searchParams }: PageProps<"/e/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <Suspense fallback={<p className="py-20 text-center text-zinc-500">Loading your store…</p>}>
        <EditLoader params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function EditLoader({ params, searchParams }: Pick<PageProps<"/e/[slug]">, "params" | "searchParams">) {
  const [{ slug }, { t }] = await Promise.all([params, searchParams]);
  const record = typeof t === "string" ? await getStoreForEdit(slug, t) : null;

  if (!record?.input || typeof t !== "string") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">This edit link doesn&apos;t work</h1>
        <p className="text-zinc-600">It may be incomplete. Open the full link you saved when you published, or make a new store.</p>
        <Link href="/" className="flex h-12 items-center rounded-xl bg-zinc-900 px-6 font-medium text-white">
          Make a store
        </Link>
      </div>
    );
  }

  const { name, handle, bio, products, testimonials, theme, input } = record;
  const taps = await getTaps(slug); // read only after the token checks out
  return <CreatorApp initial={{ store: { name, handle, bio, products, testimonials, theme }, input, slug, token: t, taps }} />;
}
