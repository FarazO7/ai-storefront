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
  maxPrice: 100000,
} as const;

// Letters, numbers, dots and underscores, up to 30 characters, a leading @ allowed.
export const HANDLE_PATTERN = /^@?[A-Za-z0-9._]{1,30}$/;

// "Try an example" inputs: test cases 1, 2 and 8. They only fill the form; Generate still calls the live model.
export const EXAMPLE_INPUTS = [
  { label: "Home workouts", followers: "10k-50k", description: "I post 20-minute home workouts for working women in Pune. Most followers are 25 to 35." },
  { label: "SIP and budgeting", followers: "10k-50k", description: "Main salaried logon ko SIP aur budgeting sikhata hoon, simple Hindi-English mein." },
  { label: "GST filing (CA)", followers: "none", description: "I'm a CA with 8 years' experience in GST filing for small businesses." },
] as const;
