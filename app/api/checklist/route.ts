import { draftPolicies, sellChecklist } from "@/lib/ai";
import { AI_ERROR } from "@/lib/constants";
import { inMinutes, secondsUntilAllowed } from "@/lib/limits";
import { getStoreForEdit } from "@/lib/redis";
import { checklistRequestSchema } from "@/lib/schema";

// "Ready to sell" checklist, generated on demand. Only the store's edit link can ask for it.
// Up to three 25 s attempts (main model, main again, backup model) plus overhead.
export const maxDuration = 100;

export async function POST(request: Request) {
  const parsed = checklistRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json({ error: issue?.path[0] === "answers" ? issue.message : "Something is missing. Refresh the page and try again." }, { status: 400 });
  }

  const wait = await secondsUntilAllowed("regenerate", request);
  if (wait) {
    return Response.json(
      { error: `That's a lot of AI requests in a short time. Please try again in ${inMinutes(wait)}.`, retryAfter: wait },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  try {
    const record = await getStoreForEdit(parsed.data.slug, parsed.data.token);
    if (!record) return Response.json({ error: "This edit link doesn't work any more." }, { status: 403 });
    const result = parsed.data.part === "sell" ? await sellChecklist(record) : await draftPolicies(record, parsed.data.answers);
    return Response.json(result);
  } catch (error) {
    console.error("[/api/checklist] failed:", error);
    return Response.json({ error: AI_ERROR }, { status: 503 });
  }
}
