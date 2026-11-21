// Creator pricing research, 30 public SuperProfile and Topmate price points, collected 21 Nov 2026.
// Data only. Don't change these numbers without the research owner's OK.

export const FORMAT_IDS = ["ebook", "template", "course", "workshop", "community", "call", "package"] as const;
export type Format = (typeof FORMAT_IDS)[number];

type Band = {
  label: string;
  plural: string; // used in the fallback rationale sentence
  superProfileType: string;
  lowest: number;
  median: number;
  highest: number;
  n: number;
  confidence: string;
  lowConfidence: boolean;
};

export const FORMATS: Record<Format, Band> = {
  ebook: { label: "Ebook / guide", plural: "Ebooks and guides", superProfileType: "Digital product", lowest: 49, median: 99, highest: 799, n: 7, confidence: "ok", lowConfidence: false },
  template: { label: "Template pack", plural: "Template packs", superProfileType: "Digital product", lowest: 199, median: 224.5, highest: 250, n: 2, confidence: "low", lowConfidence: true },
  course: { label: "Recorded course", plural: "Recorded courses", superProfileType: "Course", lowest: 549, median: 599, highest: 2999, n: 5, confidence: "ok", lowConfidence: false },
  workshop: { label: "Live workshop", plural: "Live workshops", superProfileType: "Event or webinar", lowest: 99, median: 99, highest: 99, n: 1, confidence: "low", lowConfidence: true },
  community: { label: "Community", plural: "Communities", superProfileType: "Telegram community", lowest: 99, median: 199, highest: 899, n: 3, confidence: "low (mixes monthly and one-off prices)", lowConfidence: true },
  call: { label: "1:1 call", plural: "1:1 calls", superProfileType: "1-on-1 session", lowest: 399, median: 1099, highest: 5999, n: 9, confidence: "ok", lowConfidence: false },
  package: { label: "Coaching package", plural: "Coaching packages", superProfileType: "1-on-1 session", lowest: 1499, median: 3999, highest: 8000, n: 3, confidence: "low", lowConfidence: true },
};

// Anonymised examples for the rationale, by niche: [format, price in ₹, detail].
export const EXAMPLES: Record<string, ReadonlyArray<readonly [Format, number, string]>> = {
  fitness: [["call", 1099, "30 min"], ["call", 1999, "60 min"], ["ebook", 397, ""], ["course", 599, ""], ["course", 599, ""], ["community", 199, "lifetime"]],
  "personal finance": [["call", 5999, "60 min"], ["call", 499, "20 min"], ["course", 549, "18 lessons"], ["ebook", 49, ""], ["template", 199, ""], ["community", 99, "a month"]],
  cooking: [["ebook", 99, "one recipe"], ["call", 799, "60 min"], ["course", 999, ""], ["call", 4700, "90 min"], ["ebook", 99, "30 recipes"], ["ebook", 149, "40+ recipes"]],
  "exam prep": [["call", 399, "30 min"], ["ebook", 99, "notes"], ["package", 3999, "strategy calls and mock interviews"], ["call", 800, "60 min"], ["workshop", 99, "90 min, live"], ["community", 899, "lifetime"]],
  design: [["call", 3299, "60 min"], ["ebook", 799, "roadmap and templates"], ["course", 2999, ""], ["package", 1499, "3 x 30-min sessions"], ["package", 8000, "includes 2 calls"], ["template", 250, ""]],
};

// For calls, the median across the 9 calls is ₹33 a minute (range ₹13 to ₹100).
export const CALL_RUPEES_PER_MINUTE = { median: 33, lowest: 13, highest: 100 } as const;

// Source: SuperProfile's sign-up paywall and About page, 21 Nov 2026.
export const CREATOR_PLAN_MONTHLY_RUPEES = 499;
export const SHARE_AFTER_FEE = 0.95; // after its 5% fee
