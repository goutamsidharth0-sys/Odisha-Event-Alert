import type { Metadata } from "next";
import CategoryLanding, { categoryMetadata } from "@/components/CategoryLanding";

// Events change daily (auto-scan + expiry); refresh the static cache every 10 min.
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  return categoryMetadata("college-fests");
}

export default function Page() {
  return <CategoryLanding slug="college-fests" />;
}
