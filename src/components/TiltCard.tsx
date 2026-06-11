"use client";

import React, { useRef } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}

// 3D tilt-with-glare wrapper. Pass-through on touch devices and reduced motion.
export default function TiltCard({ children, className, maxTilt = 8, glare = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const interactiveRef = useRef<boolean | null>(null);

  // Lazily decide once, on first pointer interaction (client-only by definition).
  const isInteractive = () => {
    if (interactiveRef.current === null) {
      interactiveRef.current =
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        !window.matchMedia("(hover: none)").matches;
    }
    return interactiveRef.current;
  };

  const onMouseMove = (ev: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !isInteractive()) return;
    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width;
    const py = (ev.clientY - r.top) / r.height;
    el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * maxTilt * 1.6}deg) rotateX(${(0.5 - py) * maxTilt * 1.4}deg) translateZ(6px)`;
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <div
      ref={ref}
      className={`tilt-card relative transition-shadow duration-300 will-change-transform ${className || ""}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
      {glare && <div className="tilt-glare" />}
    </div>
  );
}
