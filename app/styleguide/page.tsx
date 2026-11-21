import type { Metadata } from "next";
import Styleguide from "./Styleguide";

// A review page for the design system: unlinked, and kept out of search results.
export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

export default function StyleguidePage() {
  return <Styleguide />;
}
