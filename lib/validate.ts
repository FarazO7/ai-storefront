import { FORMATS, type Format } from "./pricing.ts";

/** Clamp into the format's band, then move to the nearest price ending in 49 or 99 inside the band (ties go down). */
export function fixPrice(format: Format, price: number): number {
  const { lowest, highest } = FORMATS[format];
  const clamped = Math.min(Math.max(Math.round(price), lowest), highest);
  let best = clamped;
  let bestDistance = Infinity;
  for (let hundred = Math.floor(lowest / 100) * 100; hundred <= highest; hundred += 100) {
    for (const candidate of [hundred + 49, hundred + 99]) {
      if (candidate < lowest || candidate > highest) continue;
      const distance = Math.abs(candidate - clamped);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best;
}

/** Last-resort shortening: cut at the last space that keeps the text within `max` characters. */
export function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const lastSpace = text.slice(0, max + 1).lastIndexOf(" ");
  return (lastSpace > 0 ? text.slice(0, lastSpace) : text.slice(0, max)).trimEnd();
}
