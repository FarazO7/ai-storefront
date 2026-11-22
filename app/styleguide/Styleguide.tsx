"use client";

import { ArrowRight, Check, ChevronDown, Copy, ExternalLink, Info, LoaderCircle, MousePointerClick, Plus, Share2, Sparkles, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import Button, { type ButtonVariant } from "@/components/ui/Button";
import { ChoiceChips, RadioCards } from "@/components/ui/Choice";
import { DiscountChip, Field, Input, Textarea } from "@/components/ui/Field";
import InfoTip from "@/components/ui/InfoTip";
import Logo from "@/components/ui/Logo";
import Modal, { ModalPanel } from "@/components/ui/Modal";
import { DeviceFrame, PreviewCanvas, type Device } from "@/components/ui/Preview";
import SectionTabs from "@/components/ui/SectionTabs";
import { Badge, Callout, MetricChip } from "@/components/ui/Status";
import { Card, EmptyState, Skeleton } from "@/components/ui/Surfaces";

// Class names are written out in full so Tailwind generates them.
const SWATCHES: { group: string; items: [token: string, className: string][] }[] = [
  {
    group: "Surfaces",
    items: [
      ["surface-1", "bg-surface-1"],
      ["surface-1-hover", "bg-surface-1-hover"],
      ["surface-2", "bg-surface-2"],
      ["surface-3", "bg-surface-3"],
      ["surface-inverted", "bg-surface-inverted"],
      ["surface-accent", "bg-surface-accent"],
      ["surface-ai", "bg-surface-ai"],
      ["shell", "bg-shell"],
    ],
  },
  {
    group: "Status fills",
    items: [
      ["surface-success-1", "bg-surface-success-1"],
      ["surface-warning-1", "bg-surface-warning-1"],
      ["surface-critical-1", "bg-surface-critical-1"],
      ["stroke-success", "bg-stroke-success"],
      ["stroke-warning", "bg-stroke-warning"],
      ["stroke-critical", "bg-stroke-critical"],
    ],
  },
  {
    group: "Strokes and accent",
    items: [
      ["stroke-primary", "bg-stroke-primary"],
      ["stroke-secondary", "bg-stroke-secondary"],
      ["stroke-tertiary", "bg-stroke-tertiary"],
      ["stroke-ink", "bg-stroke-ink"],
      ["accent", "bg-accent"],
      ["ai-blue", "bg-ai-blue"],
    ],
  },
];

const TEXT_COLOURS: [token: string, className: string][] = [
  ["text-1", "text-text-1"],
  ["text-2", "text-text-2"],
  ["text-3", "text-text-3"],
  ["text-4 (placeholders only)", "text-text-4"],
  ["text-accent", "text-text-accent"],
  ["text-success", "text-text-success"],
  ["text-warning", "text-text-warning"],
  ["text-critical", "text-text-critical"],
];

const TYPE: [role: string, className: string][] = [
  ["Display 40/44 · 700 (public page title)", "text-display font-bold"],
  ["Hero 40/38 · 600 (title on the gradient)", "text-hero font-semibold"],
  ["Stat 26/38 · 600", "text-stat font-semibold"],
  ["Title 20 · 600", "text-title font-semibold"],
  ["Section heading 16/22 · 600", "text-body font-semibold"],
  ["Body and inputs 16/22 · 400", "text-body"],
  ["UI default 14/20 · 400", "text-ui"],
  ["Buttons and row titles 14/20 · 500", "text-ui font-medium"],
  ["SECTION LABEL 14/20 · 500", "text-ui font-medium tracking-label text-text-3 uppercase"],
  ["MICRO LABEL 12/16 · 600", "text-micro font-semibold text-text-2 uppercase"],
];

const RADII: [token: string, className: string][] = [
  ["2", "rounded-2"],
  ["4", "rounded-4"],
  ["field 5", "rounded-field"],
  ["6", "rounded-6"],
  ["card 8", "rounded-card"],
  ["10", "rounded-10"],
  ["float 12", "rounded-float"],
  ["page 16", "rounded-page"],
  ["pill", "rounded-pill"],
];

const SHADOWS: [token: string, className: string][] = [
  ["hairline", "shadow-hairline"],
  ["card", "shadow-card"],
  ["raised", "shadow-raised"],
  ["popover", "shadow-popover"],
  ["primary-hover", "shadow-primary-hover"],
  ["checkout", "shadow-checkout"],
];

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "tertiary", "link", "text", "grey", "ai"];
const STATES = ["default", "hover", "focus", "active", "disabled", "loading"] as const;

const ICONS: [name: string, icon: ReactNode][] = [
  ["Plus", <Plus key="plus" />],
  ["ArrowRight", <ArrowRight key="arrow" />],
  ["Sparkles", <Sparkles key="sparkles" />],
  ["X", <X key="x" />],
  ["Info", <Info key="info" />],
  ["Check", <Check key="check" />],
  ["Copy", <Copy key="copy" />],
  ["Share2", <Share2 key="share" />],
  ["ExternalLink", <ExternalLink key="external" />],
  ["ChevronDown", <ChevronDown key="chevron" />],
  ["MousePointerClick", <MousePointerClick key="tap" />],
  ["LoaderCircle", <LoaderCircle key="loader" />],
];

function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-stroke-primary pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-title font-semibold">{title}</h2>
        {note && <p className="text-ui text-text-2">{note}</p>}
      </div>
      {children}
    </section>
  );
}

const Caption = ({ children }: { children: ReactNode }) => <span className="text-micro font-semibold text-text-3 uppercase">{children}</span>;

function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      {children}
      <Caption>{caption}</Caption>
    </div>
  );
}

export default function Styleguide() {
  const [title, setTitle] = useState("Your product title");
  const [price, setPrice] = useState("1299");
  const [about, setAbout] = useState("");
  const [chip, setChip] = useState<string | null>("10k-50k");
  const [card, setCard] = useState<string | null>("none");
  const [tab, setTab] = useState("profile");
  const [device, setDevice] = useState<Device>("mobile");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 bg-surface-1 px-4 py-8 text-text-1 md:px-12">
      <header className="flex flex-col gap-4">
        <Logo />
        <h1 className="text-hero font-semibold">Styleguide</h1>
        <p className="max-w-prose text-body text-text-2">
          Every part of the new design, in every state. Rows marked hover, focus and active are forced so they show on a phone; everything else is live, so hover it, tap it or press Tab.
        </p>
      </header>

      <Section title="Colour" note="Ink on white. Colour only carries meaning: blue for interactive and selected, green, amber and red for status, violet-to-blue for AI.">
        {SWATCHES.map(({ group, items }) => (
          <div key={group} className="flex flex-col gap-2">
            <Caption>{group}</Caption>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map(([token, className]) => (
                <div key={token} className="flex items-center gap-3">
                  <span className={`size-10 shrink-0 rounded-card border border-stroke-primary ${className}`} />
                  <span className="text-ui break-all">{token}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <Caption>Text</Caption>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TEXT_COLOURS.map(([token, className]) => (
              <span key={token} className={`text-ui font-medium ${className}`}>
                {token}
              </span>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Type" note="Hind Madurai at 400, 500 and 600; 700 only for the public page title. Inputs are always 16px.">
        <div className="flex flex-col gap-3">
          {TYPE.map(([role, className]) => (
            <p key={role} className={className}>
              {role}
            </p>
          ))}
        </div>
      </Section>

      <Section title="Shape and elevation">
        <div className="flex flex-wrap gap-4">
          {RADII.map(([token, className]) => (
            <Sample key={token} caption={token}>
              <span className={`block size-14 border border-stroke-secondary bg-surface-2 ${className}`} />
            </Sample>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SHADOWS.map(([token, className]) => (
            <Sample key={token} caption={token}>
              {/* Room below for the shadow, so it doesn't sit behind the caption */}
              <span className={`mb-6 block h-16 w-full rounded-card bg-surface-1 ${className}`} />
            </Sample>
          ))}
        </div>
      </Section>

      <Section title="Buttons" note="Pills at 28, 36, 40 and 44px. On touch screens the smaller ones get an invisible 44px tap area.">
        {VARIANTS.map((variant) => (
          <div key={variant} className="flex flex-col gap-2">
            <Caption>{variant}</Caption>
            <div className="flex flex-wrap gap-x-4 gap-y-3">
              {STATES.map((state) => (
                <Sample key={state} caption={state}>
                  <Button
                    variant={variant}
                    size="sm"
                    icon={variant === "ai" ? <Sparkles aria-hidden /> : undefined}
                    data-state={state === "hover" || state === "focus" || state === "active" ? state : undefined}
                    disabled={state === "disabled"}
                    loading={state === "loading"}
                    className="mb-5"
                  >
                    {variant === "ai" ? "Rewrite with AI" : "Button"}
                  </Button>
                </Sample>
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <Caption>Sizes</Caption>
          <div className="flex flex-wrap items-end gap-3">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Button variant="tertiary" size="xs" icon={<Plus aria-hidden />} aria-label="Add (extra small)" />
            <Button variant="tertiary" size="sm" icon={<Plus aria-hidden />} aria-label="Add (small)" />
            <Button variant="tertiary" size="md" icon={<Plus aria-hidden />} aria-label="Add (medium)" />
            <Button variant="tertiary" size="lg" icon={<Plus aria-hidden />} aria-label="Add (large)" />
            <Button variant="tertiary" size="sm" icon={<Copy aria-hidden />}>
              With an icon
            </Button>
            <Button variant="grey" size="xs">
              Grey pill
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Caption>Main create action (the only gradient ring)</Caption>
          <div>
            <Button cta icon={<Plus aria-hidden className="size-4!" />} className="pl-5">
              Create Store
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Caption>Public page call to action</Caption>
          <div className="w-full max-w-sm">
            <Button size="checkout" iconRight={<ArrowRight aria-hidden />}>
              Notify me
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Fields" note="Border-only focus, a red border and message when invalid, a grey fill when disabled.">
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Product title" htmlFor="sg-title" hint="Up to 75 characters." required>
            <Input id="sg-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={75} counter />
          </Field>
          <Field label="Placeholder" htmlFor="sg-placeholder">
            <Input id="sg-placeholder" placeholder="e.g. A 4-week beginner plan" />
          </Field>
          <Field label="Focus (forced)" htmlFor="sg-focus">
            <Input id="sg-focus" defaultValue="Focused field" data-state="focus" />
          </Field>
          <Field label="Invalid" htmlFor="sg-invalid" error="Please keep it under 75 characters.">
            <Input id="sg-invalid" defaultValue="Too long" invalid />
          </Field>
          <Field label="Disabled" htmlFor="sg-disabled">
            <Input id="sg-disabled" defaultValue="Can't change this" disabled />
          </Field>
          <Field label="Price in ₹" htmlFor="sg-price">
            <Input id="sg-price" prefix="₹" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Launch price" htmlFor="sg-launch" hint="Shown next to the crossed-out regular price.">
            <Input id="sg-launch" prefix="₹" inputMode="numeric" defaultValue="999" suffix={<DiscountChip price="₹999" regular="₹1,299" percent={23} />} />
          </Field>
          <div className="flex flex-col gap-3">
            <Caption>Sizes: 36, 40 (44 on phones) and 44px</Caption>
            <Input aria-label="Small field" fieldSize="sm" placeholder="Small" />
            <Input aria-label="Medium field" placeholder="Medium" />
            <Input aria-label="Large field" fieldSize="lg" placeholder="Large" />
          </div>
          <div className="md:col-span-2">
            <Field label="What do you do?" htmlFor="sg-about" hint="Type past 1,000 characters and the counter turns red.">
              <Textarea id="sg-about" rows={4} value={about} onChange={(event) => setAbout(event.target.value)} limit={1000} counter placeholder="I teach home workouts to working women." />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Choices" note="Native radio buttons underneath, so arrow keys and screen readers work.">
        <ChoiceChips
          name="sg-followers"
          legend="How many followers do you have?"
          options={[
            { value: "none", label: "No audience yet" },
            { value: "under10k", label: "Under 10K" },
            { value: "10k-50k", label: "10K to 50K" },
            { value: "50k+", label: "50K+" },
          ]}
          value={chip}
          onChange={setChip}
        />
        <ChoiceChips name="sg-disabled-chips" legend="Disabled" options={[{ value: "a", label: "Picked" }, { value: "b", label: "Not picked" }]} value="a" onChange={() => {}} disabled />
        <RadioCards
          name="sg-cards"
          legend="Radio cards"
          options={[
            { value: "none", label: "No audience yet", description: "Starting from zero" },
            { value: "under10k", label: "Under 10K", description: "A small, close following" },
            { value: "10k-50k", label: "10K to 50K" },
            { value: "50k+", label: "50K+" },
          ]}
          value={card}
          onChange={setCard}
        />
        <div className="flex flex-col gap-2">
          <Caption>One-tap chips (outlined small buttons)</Caption>
          <div className="flex flex-wrap gap-2">
            <Button variant="tertiary" size="sm">
              Example one
            </Button>
            <Button variant="tertiary" size="sm">
              Example two
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Status">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="accent">Coming soon</Badge>
          <Badge tone="success">
            <Check aria-hidden />
            Published
          </Badge>
          <Badge tone="warning">Draft: check before use</Badge>
          <Badge tone="critical">Failed</Badge>
          <MetricChip icon={<MousePointerClick aria-hidden />}>12 taps</MetricChip>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Callout
            title="Info"
            action={
              <a href="#" className="tap-44 font-medium text-text-1 underline">
                Learn more
              </a>
            }
          >
            Short helper copy with an inline link.
          </Callout>
          <Callout tone="success" title="Success">
            Your store is live.
          </Callout>
          <Callout tone="warning" title="Warning">
            Check this before you use it.
          </Callout>
          <Callout tone="critical" title="Something went wrong" role="alert">
            The AI is taking a break. Please try again.
          </Callout>
          <Callout tone="ai" title="AI">
            Suggestions written on demand.
          </Callout>
        </div>
      </Section>

      <Section title="Surfaces">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-ui font-medium">Card</p>
            <p className="text-ui text-text-2">White, a hairline border and a whisper of shadow.</p>
          </Card>
          <Card raised>
            <p className="text-ui font-medium">Raised card</p>
            <p className="text-ui text-text-2">For things that float over the page.</p>
          </Card>
        </div>
        <div className="flex flex-col gap-2">
          <Caption>Loading skeletons</Caption>
          <div className="flex items-center gap-3">
            <Skeleton circle className="size-12" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Caption>Empty state</Caption>
          <Card className="py-8">
            <EmptyState title="Nothing here yet" action={<Button variant="tertiary" size="sm">Go to the home page</Button>}>
              One or two lines that say what to do next.
            </EmptyState>
          </Card>
        </div>
      </Section>

      <Section title="Navigation and help">
        <SectionTabs
          id="sg-tabs"
          label="Editor sections"
          tabs={[
            { value: "profile", label: "Profile" },
            { value: "products", label: "Products" },
            { value: "extras", label: "Extras" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div role="tabpanel" id={`sg-tabs-panel-${tab}`} aria-labelledby={`sg-tabs-tab-${tab}`} className="text-ui text-text-2">
          The {tab} panel. Arrow keys move between tabs.
        </div>
        <div className="flex flex-wrap items-center gap-8 pt-14">
          <span className="flex items-center gap-1 text-micro font-medium text-text-3 uppercase">
            Interest taps
            <InfoTip label="What interest taps are" open>
              People who tapped Notify me on this product.
            </InfoTip>
          </span>
          <span className="flex items-center gap-1 text-ui text-text-2">
            Hover or focus me
            <InfoTip label="About this tooltip">Shows on hover and keyboard focus; Escape hides it.</InfoTip>
          </span>
        </div>
      </Section>

      <Section title="Modal" note="A bottom sheet on phones, a centred 500px dialog from 768px.">
        <div className="max-w-[500px] overflow-hidden rounded-float border border-stroke-primary shadow-popover">
          <ModalPanel
            title="Unsaved changes"
            onClose={() => {}}
            footer={
              <>
                <Button variant="text" size="sm">
                  Don&apos;t save
                </Button>
                <Button size="sm">Save Changes</Button>
              </>
            }
          >
            You have changes that aren&apos;t published yet.
          </ModalPanel>
        </div>
        <div>
          <Button variant="tertiary" size="sm" onClick={() => setModalOpen(true)}>
            Open the real dialog
          </Button>
        </div>
        {modalOpen && (
          <Modal
            title="Unsaved changes"
            onClose={() => setModalOpen(false)}
            footer={
              <>
                <Button variant="text" size="sm" onClick={() => setModalOpen(false)}>
                  Don&apos;t save
                </Button>
                <Button size="sm" onClick={() => setModalOpen(false)}>
                  Save Changes
                </Button>
              </>
            }
          >
            You have changes that aren&apos;t published yet.
          </Modal>
        )}
      </Section>

      <Section title="Preview canvas" note="The desktop editor's live preview. Switch between the phone and browser frames.">
        <div className="-mx-4 overflow-hidden md:mx-0 md:rounded-float">
          <PreviewCanvas device={device} onDeviceChange={setDevice}>
            <DeviceFrame device={device} url="your-store.example/s/abc123">
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <Skeleton circle className="size-14" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            </DeviceFrame>
          </PreviewCanvas>
        </div>
      </Section>

      <Section title="Icons" note="lucide at a 1.5px stroke.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {ICONS.map(([name, icon]) => (
            <span key={name} className="flex items-center gap-2 text-ui [&_svg]:size-5">
              {icon}
              {name}
            </span>
          ))}
        </div>
      </Section>
    </main>
  );
}
