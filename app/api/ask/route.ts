import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

// Lets Vercel run this route for up to 30 s, so our own 25 s timeout always fires first.
export const maxDuration = 30;

const FRIENDLY_ERROR = "The AI is taking a break, please try again";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!question) {
    return Response.json({ error: "Please type a question first." }, { status: 400 });
  }
  if (question.length > 500) {
    return Response.json(
      { error: "Please keep your question to 500 characters or fewer." },
      { status: 400 },
    );
  }

  try {
    const { text, finishReason } = await generateText({
      model: openai(process.env.OPENAI_MODEL || "gpt-6-luna"),
      instructions: "Reply in plain text, without Markdown formatting.",
      prompt: question,
      maxOutputTokens: 1000,
      // Reasoning tokens count toward maxOutputTokens; the default (medium) can leave little room for the answer.
      reasoning: "low",
      timeout: 25_000,
    });
    if (!text.trim()) throw new Error(`Model returned no text (finishReason: ${finishReason})`);
    return Response.json({ answer: text });
  } catch (error) {
    console.error("[/api/ask] AI call failed:", error);
    return Response.json({ error: FRIENDLY_ERROR }, { status: 503 });
  }
}
