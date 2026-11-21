import { createHash, timingSafeEqual } from "node:crypto";
import { streamStore, type ForceFail, type GenerateEvent } from "@/lib/ai";
import { AI_ERROR, EMPTY_INPUT_MESSAGE, HANDLE_ONLY_MESSAGE } from "@/lib/constants";
import { inMinutes, secondsUntilAllowed } from "@/lib/limits";
import { generateRequestSchema } from "@/lib/schema";

// Up to three 25 s attempts (main model, main again, backup model) plus overhead.
export const maxDuration = 100;

export async function POST(request: Request) {
  const parsed = generateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Please check what you typed and try again." }, { status: 400 });
  }
  const { handle, ...input } = parsed.data;

  // Empty or whitespace-only text never reaches the model.
  if (!input.description) {
    return ndjson(once({ type: "done", result: { status: "rejected", reason: handle ? HANDLE_ONLY_MESSAGE : EMPTY_INPUT_MESSAGE } }));
  }

  const wait = await secondsUntilAllowed("generate", request);
  if (wait) {
    return Response.json(
      { error: `You've made a lot of stores in a short time. Please try again in ${inMinutes(wait)}.`, retryAfter: wait },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  return ndjson(streamStore(input, forceFailFrom(request)));
}

async function* once(event: GenerateEvent) {
  yield event;
}

// One JSON event per line, so the page can show each block as soon as it passes the checks.
function ndjson(events: AsyncGenerator<GenerateEvent>): Response {
  const encoder = new TextEncoder();
  let cancelled = false;
  const body = new ReadableStream({
    async start(controller) {
      const send = (event: GenerateEvent) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        for await (const event of events) {
          if (cancelled) break; // the creator left; stop paying for tokens
          send(event);
        }
      } catch (error) {
        console.error("[/api/generate] failed:", error);
        if (!cancelled) send({ type: "error", message: AI_ERROR });
      }
      if (!cancelled) controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  return new Response(body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}

// Test-only switch for the demo video. Off unless the request carries FORCE_FAIL_SECRET; it only ever forces failures.
function forceFailFrom(request: Request): ForceFail | null {
  const secret = process.env.FORCE_FAIL_SECRET;
  const given = request.headers.get("x-force-fail");
  if (!secret || !given) return null;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(given), digest(secret))) return null;
  return {
    mode: request.headers.get("x-force-fail-mode") === "invalid" ? "invalid" : "timeout",
    scope: request.headers.get("x-force-fail-scope") === "all" ? "all" : "main",
  };
}
