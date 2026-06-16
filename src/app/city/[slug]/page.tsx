import type { Metadata } from "next";
import CityLanding, { cityMetadata } from "@/components/CityLanding";

// Events change daily (auto-scan + expiry); refresh the static cache every 10 min.
export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return cityMetadata(slug);
}

export default async function CityLandingPage({ params }: Props) {
  const { slug } = await params;
  return <CityLanding slug={slug} />;
}
