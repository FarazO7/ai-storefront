import type { Metadata, Viewport } from "next";
import { Hind_Madurai } from "next/font/google";
import "./globals.css";

// Self-hosted at build time, so visitors never contact Google. Exposed as --font-hind for the font-sans token.
const hind = Hind_Madurai({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-hind", display: "swap" });

export const metadata: Metadata = {
  title: "AI Storefront Generator",
  description: "Turn a few lines about what you do into a store you can share.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={hind.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
