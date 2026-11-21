import { Redis } from "@upstash/redis";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { Store, StoredInput } from "./schema.ts";

// tokenHash: SHA-256 of the private edit token. The token itself is never stored.
export type StoreRecord = Store & { input?: StoredInput; tokenHash?: string; createdAt: string; updatedAt: string };

// Made per call, so a missing env var fails the request (friendly error) instead of warning at build time.
// Reads UPSTASH_REDIS_REST_URL/TOKEN, or the KV_REST_API_URL/TOKEN names the Vercel integration adds.
const redis = () => Redis.fromEnv();
const key = (slug: string) => `store:${slug}`;

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_PATTERN = /^[a-z0-9]{8}$/;
const newSlug = () => Array.from({ length: 8 }, () => SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)]).join("");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function tokenMatches(token: string, tokenHash: string | undefined): boolean {
  if (!tokenHash) return false;
  const given = Buffer.from(hashToken(token), "hex");
  const stored = Buffer.from(tokenHash, "hex");
  return given.length === stored.length && timingSafeEqual(given, stored);
}

export async function createStore(store: Store, input: StoredInput): Promise<{ slug: string; token: string }> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date().toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = newSlug();
    const created = await redis().set(key(slug), { ...store, input, tokenHash: hashToken(token), createdAt: now, updatedAt: now }, { nx: true });
    if (created) return { slug, token };
  }
  throw new Error("No free slug after 3 tries");
}

export async function getStore(slug: string): Promise<StoreRecord | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  return redis().get<StoreRecord>(key(slug));
}

export async function getStoreForEdit(slug: string, token: string): Promise<StoreRecord | null> {
  const record = await getStore(slug);
  return record && tokenMatches(token, record.tokenHash) ? record : null;
}

const tapsKey = (slug: string) => `taps:${slug}`;

/** One tap per click on a product's interest button. Only a counter per product: no IP, no visitor data. */
export async function recordTap(slug: string, productId: string): Promise<boolean> {
  const store = await getStore(slug);
  if (!store?.products.some((p) => p.id === productId)) return false;
  await redis().hincrby(tapsKey(slug), productId, 1);
  return true;
}

export async function getTaps(slug: string): Promise<Record<string, number>> {
  return (await redis().hgetall<Record<string, number>>(tapsKey(slug))) ?? {};
}

/** Republishing from an edit link keeps the same slug. Returns false when the token doesn't match. */
export async function updateStore(slug: string, token: string, store: Store, input: StoredInput): Promise<boolean> {
  const record = await getStoreForEdit(slug, token);
  if (!record) return false;
  await redis().set(key(slug), { ...store, input, tokenHash: record.tokenHash, createdAt: record.createdAt, updatedAt: new Date().toISOString() });
  return true;
}
