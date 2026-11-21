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
  const record = await getStore((await params).slug);
  if (!record) notFound();
  // Only what visitors see: never the token hash, the creator's input or the price rationale.
  const { name, handle, bio, products } = record;
  return <StoreView store={{ name, handle, bio, products }} />;
}
