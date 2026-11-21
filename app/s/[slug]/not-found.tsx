import Link from "next/link";

export default function StoreNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">This store doesn&apos;t exist</h1>
      <p className="text-zinc-600">The link may be mistyped, or the store was never published.</p>
      <Link href="/" className="flex h-12 items-center rounded-xl bg-zinc-900 px-6 font-medium text-white">
        Make your own store
      </Link>
    </main>
  );
}
