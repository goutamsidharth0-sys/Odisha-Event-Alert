import type { Metadata } from "next";
import CategoryLanding, { categoryMetadata } from "@/components/CategoryLanding";

export async function generateMetadata(): Promise<Metadata> {
  return categoryMetadata("concerts");
}

export default function Page() {
  return <CategoryLanding slug="concerts" />;
}
