"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LivingScene from "./LivingScene";

// The animated scene is for the public site only — admin stays plain & fast.
// Mounted after first paint (idle) so it never competes with LCP/hydration;
// the body's sky gradient shows until then, so there is no visual flash.
export default function SceneGate() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!ready || pathname?.startsWith("/admin")) return null;
  return <LivingScene />;
}
