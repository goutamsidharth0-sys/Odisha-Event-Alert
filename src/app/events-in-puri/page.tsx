import type { Metadata } from "next";
import CityLanding, { cityMetadata } from "@/components/CityLanding";

// Events change daily (auto-scan + expiry); refresh the static cache every 10 min.
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return cityMetadata("puri");
}

export default function Page() {
  return <CityLanding slug="puri" />;
}
