import type { Metadata } from "next";
import CategoryLanding, { categoryMetadata } from "@/components/CategoryLanding";

// Events change daily (auto-scan + expiry); refresh the static cache every 10 min.
export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return categoryMetadata(slug);
}

export default async function CategoryLandingPage({ params }: Props) {
  const { slug } = await params;
  return <CategoryLanding slug={slug} />;
}
