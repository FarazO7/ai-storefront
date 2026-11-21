import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import StoreView from "@/components/StoreView";
import { getStore } from "@/lib/redis";

// Link previews (WhatsApp, X and others). The image comes from opengraph-image.tsx next to this file.
// WhatsApp's crawler is on Next's list of bots that get this metadata in the <head>, not streamed.
export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) return { title: "Store not found" };
  const title = `${store.name}'s store`;
  return {
    title,
    description: store.bio,
    openGraph: { title, description: store.bio, type: "website" },
    twitter: { card: "summary_large_image", title, description: store.bio, images: [`/s/${slug}/opengraph-image`] },
  };
}

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
  const { slug } = await params;
  const record = await getStore(slug);
  if (!record) notFound();
  // Only what visitors see: never the token hash, the creator's input or the price rationale.
  const { name, handle, bio, products, testimonials } = record;
  return (
    <StoreView
      slug={slug}
      store={{ name, handle, bio, testimonials, products: products.map(({ id, format, title, price, launchPrice, description, buttonLabel }) => ({ id, format, title, price, launchPrice, description, buttonLabel })) }}
    />
  );
}
