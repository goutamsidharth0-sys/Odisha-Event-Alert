import type { Metadata } from "next";
import CityLanding, { cityMetadata } from "@/components/CityLanding";

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
