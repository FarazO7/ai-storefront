// Shared by the browser and the server. No imports here, so the browser bundle stays small.

export const FOLLOWER_RANGES = {
  none: "No audience yet",
  under10k: "Under 10K",
  "10k-50k": "10K to 50K",
  "50k+": "50K+",
} as const;
export type FollowerRange = keyof typeof FOLLOWER_RANGES;
export const FOLLOWER_IDS = ["none", "under10k", "10k-50k", "50k+"] as const;

export const LIMITS = {
  description: 1000,
  productInMind: 150,
  instagramText: 500,
  name: 50,
  bio: 220,
  title: 75,
  rationale: 120,
  productDescription: 300,
  buttonLabel: 25,
  reason: 120,
  question: 80,
  option: 30,
  answer: 100,
  maxPrice: 100000,
  testimonialName: 50,
  testimonialText: 300,
  testimonials: 3,
  faqQuestion: 80,
  faqAnswer: 300,
  tipWhat: 200,
  tipWhen: 200,
  tipSetup: 300,
  trackingNote: 300,
  policy: 1200,
  policyAnswer: 100,
} as const;

export const DISCOUNT_TIP = "24 of 30 products in my research show a crossed-out price.";

// Colour themes, picked in the editor and saved with the store. Pages take these colours from app/tokens.css;
// the values here are plain copies for the link-preview image, and scripts/check-rules.ts checks they match.
export const THEMES = {
  classic: { label: "Classic", bg: "#ffffff", button: "#18181b", accent: "#b45309", link: "#0369a1" },
  sunset: { label: "Sunset", bg: "#fff7ed", button: "#c2410c", accent: "#be123c", link: "#c2410c" },
  ocean: { label: "Ocean", bg: "#eff6ff", button: "#1d4ed8", accent: "#0e7490", link: "#1d4ed8" },
  forest: { label: "Forest", bg: "#f0fdf4", button: "#15803d", accent: "#a16207", link: "#15803d" },
} as const;
export const THEME_IDS = ["classic", "sunset", "ocean", "forest"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

// Plain copies of the avatar and cover tokens for the link-preview image (pages use --avatar-N and data-cover).
export const AVATAR_COLOURS = ["#e11d48", "#d97706", "#059669", "#0284c7", "#7c3aed", "#0d9488"] as const;
export const COVER_COLOURS = {
  ebook: ["#fbbf24", "#ea580c"],
  template: ["#2dd4bf", "#0e7490"],
  course: ["#818cf8", "#4338ca"],
  workshop: ["#fb7185", "#be123c"],
  community: ["#34d399", "#047857"],
  call: ["#38bdf8", "#1d4ed8"],
  package: ["#a78bfa", "#7e22ce"],
} as const;
/** Plain copies of the text-1, text-2 and surface-1 tokens for the link-preview image. */
export const OG_COLOURS = { ink: "#0f0f0f", muted: "#666666", surface: "#ffffff", fade: "rgb(0 0 0 / 0.55)" } as const;

export const AI_ERROR = "The AI is taking a break. Please try again.";
export const HANDLE_ONLY_MESSAGE = "We can't read Instagram yet. Tell us in a line what you post about.";
export const EMPTY_INPUT_MESSAGE = "Tell us in a line or two what you do.";

// Letters, numbers, dots and underscores, up to 30 characters, a leading @ allowed.
export const HANDLE_PATTERN = /^@?[A-Za-z0-9._]{1,30}$/;

// "Try an example" inputs: test cases 1, 2 and 8. They only fill the form; Generate still calls the live model.
export const EXAMPLE_INPUTS = [
  { label: "Home workouts", followers: "10k-50k", description: "I post 20-minute home workouts for working women in Pune. Most followers are 25 to 35." },
  { label: "SIP and budgeting", followers: "10k-50k", description: "Main salaried logon ko SIP aur budgeting sikhata hoon, simple Hindi-English mein." },
  { label: "GST filing (CA)", followers: "none", description: "I'm a CA with 8 years' experience in GST filing for small businesses." },
] as const;
