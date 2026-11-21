import { inMinutes, secondsUntilAllowed } from "@/lib/limits";
import { createStore, updateStore } from "@/lib/redis";
import { publishRequestSchema } from "@/lib/schema";

export async function POST(request: Request) {
  const parsed = publishRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const isName = issue?.path[0] === "store" && issue.path[1] === "name";
    return Response.json({ error: isName ? issue.message : "Part of your store is empty or too long. Check each block and try again." }, { status: 400 });
  }

  const wait = await secondsUntilAllowed("publish", request);
  if (wait) {
    return Response.json(
      { error: `You've published a lot in a short time. Please try again in ${inMinutes(wait)}.`, retryAfter: wait },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  const { store, input, slug, token } = parsed.data;
  try {
    if (slug && token) {
      const updated = await updateStore(slug, token, store, input);
      return updated
        ? Response.json({ slug })
        : Response.json({ error: "This edit link doesn't work any more, so we couldn't update the store." }, { status: 403 });
    }
    return Response.json(await createStore(store, input));
  } catch (error) {
    console.error("[/api/publish] failed:", error);
    return Response.json({ error: "We couldn't publish just now. Your store is still here; please try again." }, { status: 503 });
  }
}
