"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useId, useState } from "react";
import Button from "@/components/ui/Button";
import { ChoiceChips } from "@/components/ui/Choice";
import { Field, Input } from "@/components/ui/Field";
import { Badge, Callout } from "@/components/ui/Status";
import { Card } from "@/components/ui/Surfaces";
import { AI_ERROR, LIMITS } from "@/lib/constants";
import type { PolicyAnswers, PolicyDrafts, SellChecklist } from "@/lib/schema";

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
const REFUND_OPTIONS = ["No refunds", "Within 7 days", "Within 14 days", "Within 30 days"].map((value) => ({ value, label: value }));
const ACCESS_OPTIONS = ["Lifetime access", "1 year", "6 months", "Not applicable"].map((value) => ({ value, label: value }));

async function ask<T>(body: unknown): Promise<T | { error: string }> {
  try {
    const res = await fetch("/api/checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return await res.json();
  } catch {
    return { error: AI_ERROR };
  }
}

function CopyButton({ text }: { text: string }) {
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="tertiary"
        size="sm"
        icon={copy === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
        onClick={() => navigator.clipboard.writeText(text).then(() => setCopy("copied"), () => setCopy("failed"))}
        className="self-start"
      >
        {copy === "copied" ? "Copied!" : "Copy"}
      </Button>
      {copy === "failed" && <p className="text-ui text-text-2">Couldn&apos;t copy: press and hold the text.</p>}
    </div>
  );
}

const Heading = ({ children }: { children: string }) => <h3 className="text-body font-semibold text-text-1">{children}</h3>;

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
    <section aria-labelledby="ready-to-sell" className="flex flex-col gap-6 rounded-float border border-stroke-primary bg-surface-1 p-4">
      <header className="-m-4 mb-0 flex flex-col gap-1 rounded-t-float bg-(image:--ai-tint) p-4">
        <h2 id="ready-to-sell" className="flex items-center gap-2 text-title font-semibold text-text-1">
          <Sparkles aria-hidden className="size-5 text-ai-blue" />
          Ready to sell
        </h2>
        <p className="text-ui text-text-2">Only you see this. It uses your published store and isn&apos;t saved, so copy what you want to keep.</p>
      </header>

      <div className="flex flex-col gap-3">
        <Heading>Boost sales</Heading>
        {!sell && (
          <Button variant="ai" size="lg" icon={<Sparkles aria-hidden />} onClick={makeChecklist} loading={sellBusy} className="w-full">
            {sellBusy ? "Writing your checklist…" : "Make my checklist"}
          </Button>
        )}
        {sellError && (
          <Callout tone="critical" role="alert">
            {sellError}
          </Callout>
        )}
        {sell &&
          TIPS.map(([key, label]) => (
            <Card key={key} className="flex flex-col gap-1 text-ui text-text-2">
              <p className="font-semibold text-text-1">{label}</p>
              <p>{sell[key].what}</p>
              <p>
                <span className="font-medium text-text-1">When it helps: </span>
                {sell[key].when}
              </p>
              <p>
                <span className="font-medium text-text-1">For your store: </span>
                {sell[key].setup}
              </p>
            </Card>
          ))}
      </div>

      {sell && (
        <div className="flex flex-col gap-3">
          <Heading>Tracking</Heading>
          {(
            [
              ["Meta Pixel", sell.metaPixel],
              ["Google Analytics", sell.googleAnalytics],
            ] as const
          ).map(([label, text]) => (
            <Card key={label} className="flex flex-col gap-2 text-ui text-text-2">
              <p className="flex flex-wrap items-center gap-2 font-semibold text-text-1">
                {label} <Badge>Not needed to start</Badge>
              </p>
              <p>{text}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Heading>Policies</Heading>
          <p className="text-ui text-text-2">Answer three short questions, then get drafts of your terms, refund and privacy policies.</p>
        </div>
        <ChoiceChips name="refunds" legend="Do you give refunds?" options={REFUND_OPTIONS} value={answers.refunds || null} onChange={(refunds) => setAnswers({ ...answers, refunds })} />
        <ChoiceChips name="access" legend="How long can buyers use what they buy?" options={ACCESS_OPTIONS} value={answers.access || null} onChange={(access) => setAnswers({ ...answers, access })} />
        <Field label="How can buyers contact you?" htmlFor={contactId}>
          <Input
            id={contactId}
            value={answers.contact}
            onChange={(e) => setAnswers({ ...answers, contact: e.target.value })}
            maxLength={LIMITS.policyAnswer}
            placeholder="Email or WhatsApp number"
            autoCapitalize="none"
          />
        </Field>
        <Button variant="ai" size="lg" icon={<Sparkles aria-hidden />} onClick={makePolicies} disabled={!ready && !policyBusy} loading={policyBusy} className="w-full">
          {policyBusy ? "Drafting your policies…" : policies ? "Draft them again" : "Draft my policies"}
        </Button>
        {policyError && (
          <Callout tone="critical" role="alert">
            {policyError}
          </Callout>
        )}
        {policies &&
          POLICIES.map(([key, label]) => (
            <Card key={key} className="flex flex-col gap-3">
              <p className="flex flex-wrap items-center justify-between gap-2 text-ui font-semibold text-text-1">
                {label} <Badge tone="warning">Draft: check before use</Badge>
              </p>
              <p className="text-ui whitespace-pre-wrap text-text-2">{policies[key]}</p>
              <CopyButton text={policies[key]} />
            </Card>
          ))}
      </div>
    </section>
  );
}
