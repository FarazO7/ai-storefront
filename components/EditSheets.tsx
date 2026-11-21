"use client";

import { useId, useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import { LIMITS } from "@/lib/constants";
import type { Product, Store } from "@/lib/schema";

export type Field = "bio" | "title" | "description" | "buttonLabel";
export type Rewrite = (field: Field, draft: Store) => Promise<string | { error: string }>;

const inputClass = "rounded-xl border border-zinc-300 px-3 text-base";
const primary = "h-12 rounded-xl bg-zinc-900 font-medium text-white disabled:opacity-40";
const secondary = "h-12 rounded-xl border border-zinc-300 font-medium";

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
  const [error, setError] = useState<string | null>(null);

  async function rewrite() {
    if (!onRewrite) return;
    setBusy(true);
    setError(null);
    const result = await onRewrite();
    setBusy(false);
    if (typeof result === "string") onChange(result);
    else setError(result.error);
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex justify-between text-sm font-medium">
        {label}
        <span className="font-normal text-zinc-500">
          {value.length} / {max}
        </span>
      </label>
      {multiline ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} rows={4} className={`${inputClass} py-2`} />
      ) : (
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={max} className={`${inputClass} h-12`} />
      )}
      {onRewrite && (
        <button
          type="button"
          onClick={rewrite}
          disabled={busy}
          className="h-11 self-start rounded-full border border-zinc-300 px-4 text-sm font-medium disabled:opacity-40"
        >
          {busy ? "Rewriting…" : "Rewrite with AI"}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function SaveRow({ onCancel, onSave, disabled }: { onCancel: () => void; onSave: () => void; disabled: boolean }) {
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onCancel} className={`flex-1 ${secondary}`}>
        Cancel
      </button>
      <button type="button" onClick={onSave} disabled={disabled} className={`flex-[2] ${primary}`}>
        Save
      </button>
    </div>
  );
}

export function HeaderSheet({ store, onClose, onSave, onRewrite }: {
  store: Store;
  onClose: () => void;
  onSave: (next: { name: string; bio: string }) => void;
  onRewrite: Rewrite;
}) {
  const [name, setName] = useState(store.name);
  const [bio, setBio] = useState(store.bio);

  return (
    <BottomSheet title="Your name and bio" onClose={onClose}>
      <TextField label="Your name" value={name} onChange={setName} max={LIMITS.name} />
      <TextField label="Bio" value={bio} onChange={setBio} max={LIMITS.bio} multiline onRewrite={() => onRewrite("bio", { ...store, name, bio })} />
      <SaveRow onCancel={onClose} onSave={() => onSave({ name: name.trim(), bio: bio.trim() })} disabled={!bio.trim()} />
    </BottomSheet>
  );
}

export function ProductSheet({ store, index, onClose, onSave, onRewrite }: {
  store: Store;
  index: number;
  onClose: () => void;
  onSave: (next: Product) => void;
  onRewrite: Rewrite;
}) {
  const priceId = useId();
  const original = store.products[index];
  const [title, setTitle] = useState(original.title);
  const [price, setPrice] = useState(String(original.price));
  const [description, setDescription] = useState(original.description);
  const [buttonLabel, setButtonLabel] = useState(original.buttonLabel);

  // Creators may set any whole-rupee price; the research bands only bind AI output.
  const priceOk = /^\d+$/.test(price) && Number(price) >= 1 && Number(price) <= LIMITS.maxPrice;
  const draft = (): Product => ({
    ...original,
    title: title.trim(),
    description: description.trim(),
    buttonLabel: buttonLabel.trim(),
    price: priceOk ? Number(price) : original.price,
  });
  const draftStore = (): Store => ({ ...store, products: store.products.map((p, i) => (i === index ? draft() : p)) });
  const complete = title.trim() !== "" && description.trim() !== "" && buttonLabel.trim() !== "" && priceOk;

  return (
    <BottomSheet title={`Product ${index + 1}`} onClose={onClose}>
      <TextField label="Title" value={title} onChange={setTitle} max={LIMITS.title} onRewrite={() => onRewrite("title", draftStore())} />
      <div className="flex flex-col gap-1">
        <label htmlFor={priceId} className="text-sm font-medium">
          Price in ₹
        </label>
        <input
          id={priceId}
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={`${inputClass} h-12`}
        />
        {!priceOk && (
          <p role="alert" className="text-sm text-red-700">
            Enter a whole number from ₹1 to ₹1,00,000.
          </p>
        )}
      </div>
      <TextField
        label="Description"
        value={description}
        onChange={setDescription}
        max={LIMITS.productDescription}
        multiline
        onRewrite={() => onRewrite("description", draftStore())}
      />
      <TextField label="Button text" value={buttonLabel} onChange={setButtonLabel} max={LIMITS.buttonLabel} onRewrite={() => onRewrite("buttonLabel", draftStore())} />
      <SaveRow onCancel={onClose} onSave={() => onSave(draft())} disabled={!complete} />
    </BottomSheet>
  );
}

function CopyLink({ label, url, note }: { label: string; url: string; note?: string }) {
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <p className="rounded-xl bg-zinc-100 p-3 text-sm break-all">{url}</p>
      {note && <p className="text-sm text-zinc-600">{note}</p>}
      <button type="button" onClick={() => navigator.clipboard.writeText(url).then(() => setCopy("copied"), () => setCopy("failed"))} className={primary}>
        {copy === "copied" ? "Copied!" : "Copy"}
      </button>
      {copy === "failed" && <p className="text-sm text-zinc-600">Couldn&apos;t copy. Press and hold the link above to copy it.</p>}
    </div>
  );
}

export function PublishedSheet({ slug, token, onClose }: { slug: string; token: string; onClose: () => void }) {
  const publicUrl = `${window.location.origin}/s/${slug}`;
  const editUrl = `${window.location.origin}/e/${slug}?t=${token}`;

  return (
    <BottomSheet title="Your store is live 🎉" onClose={onClose}>
      <CopyLink label="Public link: share it with your followers" url={publicUrl} />
      <a
        href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`}
        target="_blank"
        rel="noreferrer"
        className="flex h-12 items-center justify-center rounded-xl bg-emerald-600 font-medium text-white"
      >
        Share on WhatsApp
      </a>
      <CopyLink label="Private edit link: keep it to yourself" url={editUrl} note="Anyone with this link can change your store. Save it somewhere safe." />
      <a href={publicUrl} target="_blank" rel="noreferrer" className={`flex items-center justify-center ${secondary}`}>
        Open my store
      </a>
    </BottomSheet>
  );
}
