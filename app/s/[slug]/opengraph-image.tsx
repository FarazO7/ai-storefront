import { ImageResponse } from "next/og";
import { AVATAR_COLOURS, COVER_COLOURS, OG_COLOURS, THEMES } from "@/lib/constants";
import { FORMATS } from "@/lib/pricing";
import { getStore } from "@/lib/redis";

// The link-preview image, drawn in code like the top of the store page: the theme colour with a dark fade,
// around a white card with the creator's initials, name, bio and a chip per product format.
export const alt = "A creator's store with products coming soon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The image library can't join the letters of Indian scripts or Urdu ("प्रिया" comes out as "प्रयिा"), so such
// text stays off the image. WhatsApp still shows the name and bio as text under it.
const drawable = (text: string) => !/[؀-ۿऀ-෿]/.test(text);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const store = await getStore((await params).slug);
  const name = store?.name.trim() || "Create your store";
  const bio = store?.bio ?? "Turn a few lines about what you do into a store you can share.";
  const initials = name.split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0].toUpperCase()).join("");
  const avatar = AVATAR_COLOURS[Array.from(name).reduce((sum, ch) => sum + ch.codePointAt(0)!, 0) % AVATAR_COLOURS.length];
  const theme = THEMES[store?.theme ?? "classic"];
  const title = drawable(name) ? name : store?.handle ? `@${store.handle}` : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 48, backgroundColor: theme.button, backgroundImage: `linear-gradient(${OG_COLOURS.fade}, transparent)` }}>
        <div
          style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 56, borderRadius: 24, backgroundColor: OG_COLOURS.surface, color: OG_COLOURS.ink }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{ display: "flex", width: 112, height: 112, borderRadius: 56, backgroundColor: avatar, color: OG_COLOURS.surface, fontSize: 48, alignItems: "center", justifyContent: "center", marginRight: 32 }}
            >
              {initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {title && <div style={{ fontSize: 56 }}>{title}</div>}
              <div style={{ fontSize: 24, color: theme.accent, letterSpacing: 2 }}>COMING SOON</div>
            </div>
          </div>
          {drawable(bio) && <div style={{ display: "flex", fontSize: 32, lineHeight: 1.4, color: OG_COLOURS.muted }}>{bio}</div>}
          <div style={{ display: "flex", gap: 16 }}>
            {(store?.products ?? []).map((product) => (
              <div key={product.id} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, backgroundColor: COVER_COLOURS[product.format][1], color: OG_COLOURS.surface, fontSize: 24 }}>
                {FORMATS[product.format].label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
