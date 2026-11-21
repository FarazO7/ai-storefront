import { regenerate } from "@/lib/ai";
import { inMinutes, secondsUntilAllowed } from "@/lib/limits";
import { regenerateRequestSchema } from "@/lib/schema";

// Up to three 25 s attempts (main model, main again, backup model) plus overhead.
export const maxDuration = 100;

export async function POST(request: Request) {
  const parsed = regenerateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Part of this store is empty or too long. Fix it, then try again." }, { status: 400 });
  }

  const wait = await secondsUntilAllowed("regenerate", request);
  if (wait) {
    return Response.json(
      { error: `That's a lot of AI rewrites in a short time. Please try again in ${inMinutes(wait)}.`, retryAfter: wait },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  try {
    return Response.json(await regenerate(parsed.data));
  } catch (error) {
    console.error("[/api/regenerate] failed:", error);
    return Response.json({ error: "The AI is taking a break. Your version is unchanged; please try again." }, { status: 503 });
  }
}
