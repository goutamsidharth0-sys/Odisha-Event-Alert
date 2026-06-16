import type { Metadata } from "next";
import CityLanding, { cityMetadata } from "@/components/CityLanding";

export async function generateMetadata(): Promise<Metadata> {
  return cityMetadata("puri");
}

export default function Page() {
  return <CityLanding slug="puri" />;
}
