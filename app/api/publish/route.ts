import { saveNewStore } from "@/lib/redis";
import { storeSchema } from "@/lib/schema";

export async function POST(request: Request) {
  const parsed = storeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check your store and try again.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    return Response.json({ slug: await saveNewStore(parsed.data) });
  } catch (error) {
    console.error("[/api/publish] failed:", error);
    return Response.json({ error: "We couldn't publish just now. Your store is still here; please try again." }, { status: 503 });
  }
}
