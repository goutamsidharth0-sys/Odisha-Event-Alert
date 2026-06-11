"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Pill slider toggle: the knob carries a moon at night and a sun at dawn.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Avoid hydration mismatch: false during SSR/hydration, true after
  const mounted = React.useSyncExternalStore(
    React.useCallback(() => () => {}, []),
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div
        className="w-[60px] h-8 rounded-full border opacity-50"
        style={{ background: "var(--chip)", borderColor: "var(--card-line)" }}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-[60px] h-8 rounded-full border cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40 shrink-0"
      style={{ background: "var(--chip)", borderColor: "var(--card-line)" }}
      aria-label="Switch theme"
    >
      <span
        className="absolute top-[3px] left-[3px] w-6 h-6 rounded-full bg-brand-accent grid place-items-center text-white transition-transform duration-[450ms]"
        style={{
          transform: isDark ? "translateX(0)" : "translateX(28px)",
          transitionTimingFunction: "cubic-bezier(.3,1.4,.4,1)",
        }}
      >
        {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
