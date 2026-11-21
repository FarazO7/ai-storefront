import { generateStore } from "@/lib/ai";
import { generateRequestSchema } from "@/lib/schema";

// shortcut: room for one 25 s attempt; Phase 2 raises it for the retry and the backup model.
export const maxDuration = 30;

export async function POST(request: Request) {
  const parsed = generateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please check what you typed and try again.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    return Response.json(await generateStore(parsed.data));
  } catch (error) {
    console.error("[/api/generate] failed:", error);
    return Response.json({ error: "The AI is taking a break. Please try again." }, { status: 503 });
  }
}
