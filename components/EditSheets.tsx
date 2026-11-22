"use client";

import { Check, Copy, ExternalLink, MessageCircle, Sparkles, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import Button, { buttonClass } from "@/components/ui/Button";
import { DiscountChip, Field as FieldBlock, Input, Textarea } from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { Callout } from "@/components/ui/Status";
import { DISCOUNT_TIP, LIMITS } from "@/lib/constants";
import type { Faq, Product, Store, Testimonial } from "@/lib/schema";

export type Field = "bio" | "title" | "description" | "buttonLabel";
export type Rewrite = (field: Field, draft: Store) => Promise<string | { error: string }>;

/** Shared by every form: Cancel closes without saving, Save commits; `onDraft` lets the desktop preview follow each keystroke. */
type FormProps<T> = { onCancel: () => void; onSave: (next: T) => void; onDraft?: (store: Store) => void };

/** A text field with an optional "Rewrite with AI". The AI's version appears underneath: use it, keep yours, or try again. */
function TextField({ label, value, onChange, max, multiline = false, onRewrite }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  multiline?: boolean;
  onRewrite?: () => Promise<string | { error: string }>;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function rewrite() {
    if (!onRewrite) return;
    setBusy(true);
    setError(null);
    const result = await onRewrite();
    setBusy(false);
    if (typeof result === "string") setSuggestion(result);
    else setError(result.error);
  }

  return (
    <FieldBlock label={label} htmlFor={id}>
      {multiline ? (
        <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} rows={4} counter />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} counter />
      )}
      {onRewrite && !suggestion && (
        <Button variant="ai" size="sm" icon={<Sparkles aria-hidden />} onClick={rewrite} loading={busy} className="self-start">
          Rewrite with AI
        </Button>
      )}
      {suggestion && (
        <Callout
          tone="ai"
          title="AI suggestion"
          role="status"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="xs"
                onClick={() => {
                  onChange(suggestion.slice(0, max));
                  setSuggestion(null);
                }}
              >
                Use this
              </Button>
              <Button variant="tertiary" size="xs" onClick={rewrite} loading={busy}>
                Try again
              </Button>
              <Button variant="text" size="xs" onClick={() => setSuggestion(null)}>
                Keep mine
              </Button>
            </div>
          }
        >
          <p className="whitespace-pre-wrap">{suggestion}</p>
        </Callout>
      )}
      {error && (
        <p role="alert" className="text-ui text-text-critical">
          {error}
        </p>
      )}
    </FieldBlock>
  );
}

function FormActions({ onCancel, onSave, disabled }: { onCancel: () => void; onSave: () => void; disabled: boolean }) {
  return (
    <div className="flex justify-end gap-2 border-t border-stroke-primary pt-4">
      <Button variant="text" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={disabled}>
        Save
      </Button>
    </div>
  );
}

export function HeaderForm({ store, onCancel, onSave, onDraft, onRewrite }: { store: Store; onRewrite: Rewrite } & FormProps<{ name: string; bio: string }>) {
  const [form, setForm] = useState({ name: store.name, bio: store.bio });
  const update = (patch: Partial<typeof form>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onDraft?.({ ...store, ...next });
  };

  return (
    <div className="flex flex-col gap-5">
      <TextField label="Your name" value={form.name} onChange={(name) => update({ name })} max={LIMITS.name} />
      <TextField label="Bio" value={form.bio} onChange={(bio) => update({ bio })} max={LIMITS.bio} multiline onRewrite={() => onRewrite("bio", { ...store, ...form })} />
      <FormActions onCancel={onCancel} onSave={() => onSave({ name: form.name.trim(), bio: form.bio.trim() })} disabled={!form.bio.trim()} />
    </div>
  );
}

type ProductFields = { title: string; price: string; launchPrice: string; description: string; buttonLabel: string; faqs: Faq[] };

export function ProductForm({ store, index, onCancel, onSave, onDraft, onRewrite }: { store: Store; index: number; onRewrite: Rewrite } & FormProps<Product>) {
  const priceId = useId();
  const launchId = useId();
  const original = store.products[index];
  const [form, setForm] = useState<ProductFields>({
    title: original.title,
    price: String(original.price),
    launchPrice: original.launchPrice ? String(original.launchPrice) : "",
    description: original.description,
    buttonLabel: original.buttonLabel,
    faqs: original.faqs ?? [],
  });

  // Creators may set any whole-rupee price; the research bands only bind AI output.
  const checks = (f: ProductFields) => {
    const priceOk = /^\d+$/.test(f.price) && Number(f.price) >= 1 && Number(f.price) <= LIMITS.maxPrice;
    const launchOk = f.launchPrice === "" || (/^\d+$/.test(f.launchPrice) && Number(f.launchPrice) >= 1 && Number(f.launchPrice) < Number(f.price));
    return { priceOk, launchOk, faqsOk: f.faqs.every((faq) => faq.question.trim() !== "" && faq.answer.trim() !== "") };
  };
  const draft = (f: ProductFields): Product => {
    const { priceOk, launchOk } = checks(f);
    return {
      ...original,
      title: f.title.trim(),
      description: f.description.trim(),
      buttonLabel: f.buttonLabel.trim(),
      price: priceOk ? Number(f.price) : original.price,
      launchPrice: f.launchPrice && launchOk && priceOk ? Number(f.launchPrice) : undefined,
      faqs: f.faqs.map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() })),
    };
  };
  const draftStore = (f: ProductFields): Store => ({ ...store, products: store.products.map((p, i) => (i === index ? draft(f) : p)) });
  const update = (patch: Partial<ProductFields>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onDraft?.(draftStore(next));
  };
  const setFaq = (j: number, patch: Partial<Faq>) => update({ faqs: form.faqs.map((faq, k) => (k === j ? { ...faq, ...patch } : faq)) });

  const { priceOk, launchOk, faqsOk } = checks(form);
  const complete = form.title.trim() !== "" && form.description.trim() !== "" && form.buttonLabel.trim() !== "" && priceOk && launchOk && faqsOk;
  const percentOff = launchOk && priceOk && form.launchPrice ? Math.round((1 - Number(form.launchPrice) / Number(form.price)) * 100) : null;
  const rupees = (value: string) => `₹${Number(value).toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col gap-5">
      <TextField label="Title" value={form.title} onChange={(title) => update({ title })} max={LIMITS.title} onRewrite={() => onRewrite("title", draftStore(form))} />
      <FieldBlock label="Price" htmlFor={priceId} error={priceOk ? undefined : "Enter a whole number from ₹1 to ₹1,00,000."}>
        <Input id={priceId} inputMode="numeric" prefix="₹" value={form.price} invalid={!priceOk} onChange={(e) => update({ price: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
      </FieldBlock>
      <FieldBlock
        label="Launch price (optional)"
        htmlFor={launchId}
        hint={`${DISCOUNT_TIP} Your regular price shows crossed out next to it.`}
        error={launchOk ? undefined : "Make the launch price lower than the regular price."}
      >
        <Input
          id={launchId}
          inputMode="numeric"
          prefix="₹"
          value={form.launchPrice}
          invalid={!launchOk}
          onChange={(e) => update({ launchPrice: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          placeholder="Leave empty for no discount"
          suffix={percentOff !== null ? <DiscountChip price={rupees(form.launchPrice)} regular={rupees(form.price)} percent={percentOff} /> : undefined}
        />
      </FieldBlock>
      <TextField
        label="Description"
        value={form.description}
        onChange={(description) => update({ description })}
        max={LIMITS.productDescription}
        multiline
        onRewrite={() => onRewrite("description", draftStore(form))}
      />
      <TextField label="Button text" value={form.buttonLabel} onChange={(buttonLabel) => update({ buttonLabel })} max={LIMITS.buttonLabel} onRewrite={() => onRewrite("buttonLabel", draftStore(form))} />
      {form.faqs.map((faq, j) => (
        <fieldset key={j} className="flex flex-col gap-4 rounded-card border border-stroke-primary p-4">
          <legend className="px-1 text-ui font-semibold">Question {j + 1}</legend>
          <TextField label="Question" value={faq.question} onChange={(question) => setFaq(j, { question })} max={LIMITS.faqQuestion} />
          <TextField label="Answer" value={faq.answer} onChange={(answer) => setFaq(j, { answer })} max={LIMITS.faqAnswer} multiline />
          <Button variant="danger" size="sm" icon={<Trash2 aria-hidden />} onClick={() => update({ faqs: form.faqs.filter((_, k) => k !== j) })} className="self-start">
            Remove this question
          </Button>
        </fieldset>
      ))}
      {!faqsOk && (
        <p role="alert" className="text-ui text-text-critical">
          Fill in each question and answer, or remove it.
        </p>
      )}
      <FormActions onCancel={onCancel} onSave={() => onSave(draft(form))} disabled={!complete} />
    </div>
  );
}

// Testimonials are only ever typed by the creator; AI never writes them.
export function TestimonialForm({ store, index, onCancel, onSave, onDraft, onRemove }: { store: Store; index: number | null; onRemove?: () => void } & FormProps<Testimonial>) {
  const initial = index === null ? null : (store.testimonials?.[index] ?? null);
  const [form, setForm] = useState({ name: initial?.name ?? "", text: initial?.text ?? "" });
  const update = (patch: Partial<typeof form>) => {
    const next = { ...form, ...patch };
    setForm(next);
    const list = store.testimonials ?? [];
    onDraft?.({ ...store, testimonials: index === null ? [...list, next] : list.map((t, i) => (i === index ? next : t)) });
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-ui text-text-2">For creators who already sell elsewhere. Only add words a real customer said about you.</p>
      <TextField label="Their name" value={form.name} onChange={(name) => update({ name })} max={LIMITS.testimonialName} />
      <TextField label="What they said" value={form.text} onChange={(text) => update({ text })} max={LIMITS.testimonialText} multiline />
      {onRemove && (
        <Button variant="danger" icon={<Trash2 aria-hidden />} onClick={onRemove} className="self-start">
          Remove this testimonial
        </Button>
      )}
      <FormActions onCancel={onCancel} onSave={() => onSave({ name: form.name.trim(), text: form.text.trim() })} disabled={!form.name.trim() || !form.text.trim()} />
    </div>
  );
}

function CopyLink({ label, url }: { label: string; url: string }) {
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <div className="flex flex-col gap-2">
      <p className="text-ui font-medium">{label}</p>
      <p className="rounded-field border border-stroke-primary bg-surface-2 px-3 py-2.5 text-ui break-all">{url}</p>
      <Button
        variant="tertiary"
        icon={copy === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
        onClick={() => navigator.clipboard.writeText(url).then(() => setCopy("copied"), () => setCopy("failed"))}
        className="self-start"
      >
        {copy === "copied" ? "Copied!" : "Copy"}
      </Button>
      {copy === "failed" && <p className="text-ui text-text-2">Couldn&apos;t copy. Press and hold the link above to copy it.</p>}
    </div>
  );
}

export function PublishedSheet({ slug, token, onClose }: { slug: string; token: string; onClose: () => void }) {
  const publicUrl = `${window.location.origin}/s/${slug}`;
  const editUrl = `${window.location.origin}/e/${slug}?t=${token}`;

  return (
    <Modal title="Your store is live 🎉" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <CopyLink label="Public link: share it with your followers" url={publicUrl} />
        <a href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`} target="_blank" rel="noreferrer" className={`${buttonClass({ variant: "secondary", size: "lg" })} w-full`}>
          <MessageCircle aria-hidden />
          Share on WhatsApp
        </a>
        <CopyLink label="Private edit link: keep it to yourself" url={editUrl} />
        <Callout tone="warning">Anyone with this link can change your store. Save it somewhere safe.</Callout>
        <a href={publicUrl} target="_blank" rel="noreferrer" className={`${buttonClass({ variant: "tertiary", size: "lg" })} w-full`}>
          Open my store
          <ExternalLink aria-hidden />
        </a>
      </div>
    </Modal>
  );
}
