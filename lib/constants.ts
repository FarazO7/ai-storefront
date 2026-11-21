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
} as const;

export const DISCOUNT_TIP = "24 of 30 products in my research show a crossed-out price.";

// Colour themes, picked in the editor and saved with the store. Covers keep one colour per format.
// White button text on each `button` colour meets the 4.5:1 contrast minimum.
export const THEMES = {
  classic: { label: "Classic", bg: "#ffffff", button: "#18181b", accent: "#b45309", link: "#0369a1" },
  sunset: { label: "Sunset", bg: "#fff7ed", button: "#c2410c", accent: "#be123c", link: "#c2410c" },
  ocean: { label: "Ocean", bg: "#eff6ff", button: "#1d4ed8", accent: "#0e7490", link: "#1d4ed8" },
  forest: { label: "Forest", bg: "#f0fdf4", button: "#15803d", accent: "#a16207", link: "#15803d" },
} as const;
export const THEME_IDS = ["classic", "sunset", "ocean", "forest"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/** CSS variables for a theme; components read them as bg-(--store-bg), text-(--store-accent) and so on. */
export const themeVars = (id: ThemeId = "classic"): Record<string, string> => ({
  "--store-bg": THEMES[id].bg,
  "--store-button": THEMES[id].button,
  "--store-accent": THEMES[id].accent,
  "--store-link": THEMES[id].link,
});

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
