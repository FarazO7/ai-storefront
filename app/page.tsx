"use client";

import { useState, type FormEvent } from "react";

const FRIENDLY_ERROR = "The AI is taking a break, please try again";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAnswer("");
    setError("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.answer) setAnswer(data.answer);
      else setError(data.error || FRIENDLY_ERROR);
    } catch {
      // Network failure or a non-JSON response (e.g. a hosting error page).
      setError(FRIENDLY_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold">AI Storefront Generator</h1>

      <form onSubmit={ask} className="mt-6 flex flex-col gap-3">
        <label htmlFor="question" className="font-medium">
          Ask the AI anything
        </label>
        <textarea
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          placeholder="e.g. Suggest one digital product a fitness coach in Pune could sell, with a price in INR."
          className="w-full rounded-lg border border-zinc-300 bg-transparent p-3 text-base dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-foreground px-4 py-3 text-base font-medium text-background disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      <section aria-live="polite" className="mt-6">
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        {answer && <p className="whitespace-pre-wrap break-words">{answer}</p>}
      </section>
    </main>
  );
}
