import { notFound } from "next/navigation";
import { Suspense } from "react";
import StoreView from "@/components/StoreView";
import { getStore } from "@/lib/redis";

// Cache Components: the Redis read happens per request, inside a Suspense boundary.
export default function PublicStorePage({ params }: PageProps<"/s/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <Suspense fallback={<p className="py-20 text-center text-zinc-500">Loading store…</p>}>
        <PublicStore params={params} />
      </Suspense>
    </main>
  );
}

async function PublicStore({ params }: { params: Promise<{ slug: string }> }) {
  const store = await getStore((await params).slug);
  if (!store) notFound();
  return <StoreView store={store} />;
}
