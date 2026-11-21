"use client";

import { useId, useState, type ReactNode } from "react";
import { AI_ERROR, LIMITS } from "@/lib/constants";
import type { PolicyAnswers, PolicyDrafts, SellChecklist } from "@/lib/schema";

const primary = "h-12 rounded-xl bg-zinc-900 font-medium text-white disabled:opacity-40";
const chip = (on: boolean) => `min-h-11 rounded-full border px-4 text-sm font-medium ${on ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white"}`;

const TIPS = [
  ["bumpOffer", "Bump offer"],
  ["automatedEmail", "Automated email"],
  ["discountCoupon", "Discount coupon"],
] as const;
const POLICIES = [
  ["terms", "Terms of sale"],
  ["refund", "Refund policy"],
  ["privacy", "Privacy policy"],
] as const;
const REFUND_OPTIONS = ["No refunds", "Within 7 days", "Within 14 days", "Within 30 days"];
const ACCESS_OPTIONS = ["Lifetime access", "1 year", "6 months", "Not applicable"];

async function ask<T>(body: unknown): Promise<T | { error: string }> {
  try {
    const res = await fetch("/api/checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return await res.json();
  } catch {
    return { error: AI_ERROR };
  }
}

const Badge = ({ children }: { children: ReactNode }) => (
  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-amber-900">{children}</span>
);

function Choice({ legend, options, value, onChange }: { legend: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{legend}</p>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} type="button" role="radio" aria-checked={value === option} onClick={() => onChange(option)} className={chip(value === option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => setCopy("copied"), () => setCopy("failed"))}
      className="h-11 self-start rounded-full border border-zinc-300 px-4 text-sm font-medium"
    >
      {copy === "copied" ? "Copied!" : copy === "failed" ? "Couldn't copy: press and hold the text" : "Copy"}
    </button>
  );
}

// Edit link only: never shown to visitors and never saved. Each part is written on demand by its own AI call.
export default function ReadyToSell({ slug, token }: { slug: string; token: string }) {
  const contactId = useId();
  const [sell, setSell] = useState<SellChecklist | null>(null);
  const [sellBusy, setSellBusy] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<PolicyAnswers>({ refunds: "", access: "", contact: "" });
  const [policies, setPolicies] = useState<PolicyDrafts | null>(null);
  const [policyBusy, setPolicyBusy] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);

  async function makeChecklist() {
    setSellBusy(true);
    setSellError(null);
    const data = await ask<SellChecklist>({ part: "sell", slug, token });
    setSellBusy(false);
    if ("error" in data) setSellError(data.error);
    else setSell(data);
  }

  async function makePolicies() {
    setPolicyBusy(true);
    setPolicyError(null);
    const data = await ask<PolicyDrafts>({ part: "policies", slug, token, answers });
    setPolicyBusy(false);
    if ("error" in data) setPolicyError(data.error);
    else setPolicies(data);
  }

  const ready = answers.refunds !== "" && answers.access !== "" && answers.contact.trim() !== "";

  return (
    <section aria-labelledby="ready-to-sell" className="flex flex-col gap-6 rounded-2xl border border-zinc-200 p-4">
      <header>
        <h2 id="ready-to-sell" className="text-lg font-semibold">
          Ready to sell
        </h2>
        <p className="text-sm text-zinc-600">Only you see this. It uses your published store and isn&apos;t saved, so copy what you want to keep.</p>
      </header>

      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">Boost sales</h3>
        {!sell && (
          <button type="button" onClick={makeChecklist} disabled={sellBusy} className={primary}>
            {sellBusy ? "Writing your checklist…" : "Make my checklist"}
          </button>
        )}
        {sellError && (
          <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {sellError}
          </p>
        )}
        {sell &&
          TIPS.map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
              <p className="font-semibold text-zinc-900">{label}</p>
              <p>{sell[key].what}</p>
              <p>
                <span className="font-medium text-zinc-900">When it helps: </span>
                {sell[key].when}
              </p>
              <p>
                <span className="font-medium text-zinc-900">For your store: </span>
                {sell[key].setup}
              </p>
            </div>
          ))}
      </div>

      {sell && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold">Tracking</h3>
          {(
            [
              ["Meta Pixel", sell.metaPixel],
              ["Google Analytics", sell.googleAnalytics],
            ] as const
          ).map(([label, text]) => (
            <div key={label} className="flex flex-col gap-1 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-zinc-900">
                {label} <Badge>Not needed to start</Badge>
              </p>
              <p>{text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h3 className="font-semibold">Policies</h3>
        <p className="-mt-2 text-sm text-zinc-600">Answer three short questions, then get drafts of your terms, refund and privacy policies.</p>
        <Choice legend="Do you give refunds?" options={REFUND_OPTIONS} value={answers.refunds} onChange={(refunds) => setAnswers({ ...answers, refunds })} />
        <Choice legend="How long can buyers use what they buy?" options={ACCESS_OPTIONS} value={answers.access} onChange={(access) => setAnswers({ ...answers, access })} />
        <div className="flex flex-col gap-1">
          <label htmlFor={contactId} className="text-sm font-medium">
            How can buyers contact you?
          </label>
          <input
            id={contactId}
            value={answers.contact}
            onChange={(e) => setAnswers({ ...answers, contact: e.target.value })}
            maxLength={LIMITS.policyAnswer}
            placeholder="Email or WhatsApp number"
            autoCapitalize="none"
            className="h-12 rounded-xl border border-zinc-300 px-3 text-base"
          />
        </div>
        <button type="button" onClick={makePolicies} disabled={!ready || policyBusy} className={primary}>
          {policyBusy ? "Drafting your policies…" : policies ? "Draft them again" : "Draft my policies"}
        </button>
        {policyError && (
          <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            {policyError}
          </p>
        )}
        {policies &&
          POLICIES.map(([key, label]) => (
            <div key={key} className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3">
              <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                {label} <Badge>Draft: check before use</Badge>
              </p>
              <p className="text-sm whitespace-pre-wrap text-zinc-700">{policies[key]}</p>
              <CopyButton text={policies[key]} />
            </div>
          ))}
      </div>
    </section>
  );
}
