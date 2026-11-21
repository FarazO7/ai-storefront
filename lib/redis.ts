import { Redis } from "@upstash/redis";
import { randomInt } from "node:crypto";
import type { Store } from "./schema.ts";

export type StoreRecord = Store & { createdAt: string; updatedAt: string };

// Made per call, so a missing env var fails the request (friendly error) instead of warning at build time.
// Reads UPSTASH_REDIS_REST_URL/TOKEN, or the KV_REST_API_URL/TOKEN names the Vercel integration adds.
const redis = () => Redis.fromEnv();

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_PATTERN = /^[a-z0-9]{8}$/;
const newSlug = () => Array.from({ length: 8 }, () => SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)]).join("");

export async function saveNewStore(store: Store): Promise<string> {
  const now = new Date().toISOString();
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = newSlug();
    const created = await redis().set(`store:${slug}`, { ...store, createdAt: now, updatedAt: now }, { nx: true });
    if (created) return slug;
  }
  throw new Error("No free slug after 3 tries");
}

export async function getStore(slug: string): Promise<StoreRecord | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  return redis().get<StoreRecord>(`store:${slug}`);
}
