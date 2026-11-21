import { secondsUntilAllowed } from "@/lib/limits";
import { recordTap } from "@/lib/redis";
import { tapRequestSchema } from "@/lib/schema";

// Visitors never see this reply: the thank-you shows on the page whatever happens here.
export async function POST(request: Request) {
  const parsed = tapRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ counted: false }, { status: 400 });
  if (await secondsUntilAllowed("tap", request)) return Response.json({ counted: false }, { status: 429 });
  try {
    return Response.json({ counted: await recordTap(parsed.data.slug, parsed.data.productId) });
  } catch (error) {
    console.error("[/api/tap] failed:", error);
    return Response.json({ counted: false }, { status: 503 });
  }
}
