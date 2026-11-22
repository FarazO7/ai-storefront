"use client";

import { ArrowLeft, Plus, X } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import StoreView, { BlockActions, EditorNotes, type EditControls, type ViewStore } from "@/components/StoreView";
import ThemePicker from "@/components/ThemePicker";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { DeviceFrame, PreviewCanvas, type Device } from "@/components/ui/Preview";
import SectionTabs from "@/components/ui/SectionTabs";
import { Badge } from "@/components/ui/Status";
import { Card, Skeleton } from "@/components/ui/Surfaces";
import { themeVars, type ThemeId } from "@/lib/constants";
import { FORMATS } from "@/lib/pricing";

type Tab = "profile" | "products" | "extras" | "sell";

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const Label = ({ children }: { children: ReactNode }) => <p className="text-micro font-semibold text-text-3 uppercase">{children}</p>;
const SectionHeading = ({ children }: { children: ReactNode }) => <h2 className="text-body font-semibold text-text-1">{children}</h2>;

export type DesktopEditorProps = {
  /** What the panel lists: the store, or the part that has streamed in while generating. */
  store: ViewStore;
  /** What the preview shows: the open form's unsaved draft, or the store. */
  preview: ViewStore;
  pending: boolean;
  editLink: boolean;
  /** Generating and error callouts. */
  status: ReactNode;
  /** The open form, shown in place of the tabs. */
  form: { title: string; node: ReactNode; onCancel: () => void } | null;
  onBack: () => void;
  edit: EditControls;
  theme: ThemeId;
  onTheme: (theme: ThemeId) => void;
  readyToSell: ReactNode;
  onRedoAll: () => void;
  onPublish: () => void;
  publishing: boolean;
  blocked: boolean;
  publicUrl: string | null;
};

/** From 992px: the form panel on the left and the live store preview on the right. */
export default function DesktopEditor(props: DesktopEditorProps) {
  const { store, preview, pending, editLink, status, form, edit } = props;
  const [tab, setTab] = useState<Tab>("products");
  const [device, setDevice] = useState<Device>("mobile");
  const tabs: { value: Tab; label: string }[] = [
    { value: "profile", label: "Profile" },
    { value: "products", label: "Products" },
    { value: "extras", label: "Extras" },
    ...(props.readyToSell ? [{ value: "sell" as const, label: "Ready to sell" }] : []),
  ];
  const testimonials = store.testimonials ?? [];

  return (
    <div className="grid h-dvh grid-cols-[minmax(420px,43%)_1fr]">
      <aside className="flex min-h-0 flex-col border-r border-stroke-primary bg-surface-1">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-stroke-primary px-4">
          {editLink ? <Logo /> : <Button variant="text" icon={<X aria-hidden />} aria-label="Change my details" onClick={props.onBack} disabled={pending} />}
          <span aria-hidden className="h-5 w-px bg-stroke-primary" />
          <p className="min-w-0 truncate text-ui font-medium">{store.name.trim() || "Your store"}</p>
        </header>

        {form ? (
          <>
            <div className="flex shrink-0 items-center gap-2 border-b border-stroke-primary py-2 pr-4 pl-2">
              <Button variant="text" size="sm" icon={<ArrowLeft aria-hidden />} onClick={form.onCancel}>
                Back
              </Button>
              <h2 className="text-body font-semibold">{form.title}</h2>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
              {status}
              {form.node}
            </div>
          </>
        ) : (
          <>
            <div className="shrink-0 px-2">
              <SectionTabs id="editor" label="Editor sections" tabs={tabs} value={tab} onChange={setTab} />
            </div>
            <div role="tabpanel" id={`editor-panel-${tab}`} aria-labelledby={`editor-tab-${tab}`} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
              {status}

              {tab === "profile" && (
                <>
                  <SectionHeading>Name and bio</SectionHeading>
                  <Card className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <Label>Name</Label>
                      <p className="text-ui">{store.name.trim() || <span className="text-text-3">Not added yet. You need one to publish.</span>}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label>Bio</Label>
                      {store.bio ? <p className="text-ui text-text-2">{store.bio}</p> : <Skeleton className="h-10 w-full" />}
                    </div>
                    {store.handle && (
                      <div className="flex flex-col gap-1">
                        <Label>Instagram</Label>
                        <p className="text-ui text-text-2">@{store.handle}</p>
                      </div>
                    )}
                    <BlockActions block="bio" edit={edit} align="start" />
                  </Card>
                </>
              )}

              {tab === "products" && (
                <>
                  <SectionHeading>Products</SectionHeading>
                  {store.products.map((product, index) => (
                    <Card key={product.id ?? index} className={`flex flex-col gap-3 ${edit.busy === index ? "opacity-60" : ""}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Label>{FORMATS[product.format].label}</Label>
                        {FORMATS[product.format].lowConfidence && <Badge tone="warning">Based on few examples</Badge>}
                      </div>
                      <p className="text-body font-semibold">{product.title}</p>
                      <p className="flex items-baseline gap-2 text-ui">
                        <span className="font-semibold">{rupees(product.launchPrice ?? product.price)}</span>
                        {product.launchPrice !== undefined && <s className="text-text-3">{rupees(product.price)}</s>}
                      </p>
                      <p className="line-clamp-2 text-ui text-text-2">{product.description}</p>
                      {!pending && <EditorNotes product={product} taps={edit.taps && product.id ? (edit.taps[product.id] ?? 0) : undefined} />}
                      {!pending && <BlockActions block={index} edit={edit} align="start" />}
                    </Card>
                  ))}
                  {pending && (
                    <Card className="flex flex-col gap-3">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-10 w-full" />
                    </Card>
                  )}
                </>
              )}

              {tab === "extras" && (
                <>
                  <SectionHeading>Look</SectionHeading>
                  <ThemePicker value={props.theme} onChange={props.onTheme} disabled={props.blocked} />
                  <SectionHeading>Testimonials</SectionHeading>
                  {testimonials.length === 0 && <p className="text-ui text-text-2">None yet. Only add words a real customer said about you.</p>}
                  {testimonials.map((testimonial, index) => (
                    <Card key={index} className="flex flex-col gap-2">
                      <p className="text-ui text-text-2">&ldquo;{testimonial.text}&rdquo;</p>
                      <p className="text-ui font-medium">{testimonial.name}</p>
                      <Button variant="tertiary" size="sm" onClick={() => edit.onTestimonial(index)} disabled={edit.disabled} className="self-start">
                        Edit
                      </Button>
                    </Card>
                  ))}
                  {testimonials.length < 3 && (
                    <Button variant="tertiary" icon={<Plus aria-hidden />} onClick={() => edit.onTestimonial(null)} disabled={edit.disabled} className="self-start border-dashed">
                      Add a testimonial
                    </Button>
                  )}
                </>
              )}

              {tab === "sell" && props.readyToSell}
            </div>

            <footer className="flex shrink-0 justify-end gap-2 border-t border-stroke-primary px-6 py-3">
              <Button variant="tertiary" onClick={props.onRedoAll} disabled={props.blocked}>
                Redo all
              </Button>
              <Button onClick={props.onPublish} disabled={props.blocked && !props.publishing} loading={props.publishing}>
                Publish
              </Button>
            </footer>
          </>
        )}
      </aside>

      <div className="min-h-0 overflow-y-auto">
        <PreviewCanvas device={device} onDeviceChange={setDevice}>
          <DeviceFrame device={device} url={props.publicUrl ?? "Not published yet"}>
            {/* The same page visitors get: the theme background, then the store. */}
            <div style={themeVars(preview.theme) as CSSProperties} className="min-h-full bg-(--store-bg) px-4 py-6">
              <div className="mx-auto max-w-md">
                <StoreView store={preview} pending={pending} />
              </div>
            </div>
          </DeviceFrame>
        </PreviewCanvas>
      </div>
    </div>
  );
}
