import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

// Spec: generation 10 per 10 minutes per IP. Agreed in Phase 0: redo and rewrite 30 per 10 minutes, publish 20 per hour.
const WINDOWS = {
  generate: { tokens: 10, window: "10 m" },
  regenerate: { tokens: 30, window: "10 m" },
  publish: { tokens: 20, window: "1 h" },
} as const;
export type LimitKind = keyof typeof WINDOWS;

const limiters = new Map<LimitKind, Ratelimit>();
function limiter(kind: LimitKind): Ratelimit {
  let found = limiters.get(kind);
  if (!found) {
    const { tokens, window } = WINDOWS[kind];
    found = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(tokens, window), prefix: `rl:${kind}` });
    limiters.set(kind, found);
  }
  return found;
}

/** Seconds until this IP may try again, or 0 when the request can go ahead. Fails open if Redis is unreachable. */
export async function secondsUntilAllowed(kind: LimitKind, request: Request): Promise<number> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // shortcut: plain SHA-256 of the IP, no secret salt; keys expire with the window. Add a salt before keeping hashes longer.
  const id = createHash("sha256").update(`ai-storefront:${ip}`).digest("hex");
  try {
    const { success, reset } = await limiter(kind).limit(id);
    return success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  } catch (error) {
    console.error(`[ratelimit] ${kind} check failed; letting the request through:`, error);
    return 0;
  }
}

export const inMinutes = (seconds: number) => (seconds <= 60 ? "a minute" : `${Math.ceil(seconds / 60)} minutes`);
