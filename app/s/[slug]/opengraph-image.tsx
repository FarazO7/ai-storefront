import { ImageResponse } from "next/og";
import { THEMES } from "@/lib/constants";
import { FORMATS } from "@/lib/pricing";
import { getStore } from "@/lib/redis";

// The link-preview image, drawn in code: the creator's initials, name, bio and a chip per product format.
export const alt = "A creator's store with products coming soon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same palettes as StoreView, as plain colours.
const AVATAR = ["#e11d48", "#d97706", "#059669", "#0284c7", "#7c3aed", "#0d9488"];
const FORMAT_COLOUR: Record<string, string> = {
  ebook: "#ea580c",
  template: "#0e7490",
  course: "#4338ca",
  workshop: "#be123c",
  community: "#047857",
  call: "#1d4ed8",
  package: "#7e22ce",
};

// The image library can't join the letters of Indian scripts or Urdu ("प्रिया" comes out as "प्रयिा"), so such
// text stays off the image. WhatsApp still shows the name and bio as text under it.
const drawable = (text: string) => !/[\u0600-\u06FF\u0900-\u0DFF]/.test(text);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const store = await getStore((await params).slug);
  const name = store?.name.trim() || "Create your store";
  const bio = store?.bio ?? "Turn a few lines about what you do into a store you can share.";
  const initials = name.split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0].toUpperCase()).join("");
  const avatar = AVATAR[Array.from(name).reduce((sum, ch) => sum + ch.codePointAt(0)!, 0) % AVATAR.length];
  const theme = THEMES[store?.theme ?? "classic"];
  const title = drawable(name) ? name : store?.handle ? `@${store.handle}` : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, backgroundColor: theme.bg, color: "#18181b" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{ display: "flex", width: 128, height: 128, borderRadius: 64, backgroundColor: avatar, color: "#ffffff", fontSize: 56, alignItems: "center", justifyContent: "center", marginRight: 36 }}
          >
            {initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {title && <div style={{ fontSize: 64 }}>{title}</div>}
            <div style={{ fontSize: 28, color: theme.accent, letterSpacing: 2 }}>COMING SOON</div>
          </div>
        </div>
        {drawable(bio) && <div style={{ display: "flex", fontSize: 36, lineHeight: 1.4, color: "#3f3f46" }}>{bio}</div>}
        <div style={{ display: "flex", gap: 16 }}>
          {(store?.products ?? []).map((product) => (
            <div key={product.id} style={{ display: "flex", padding: "12px 24px", borderRadius: 999, backgroundColor: FORMAT_COLOUR[product.format], color: "#ffffff", fontSize: 26 }}>
              {FORMATS[product.format].label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
