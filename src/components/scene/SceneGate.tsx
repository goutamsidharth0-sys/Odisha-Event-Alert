"use client";

import { usePathname } from "next/navigation";
import LivingScene from "./LivingScene";

// The animated scene is for the public site only — admin stays plain & fast.
export default function SceneGate() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <LivingScene />;
}
