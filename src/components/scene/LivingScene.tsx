"use client";

import React, { useEffect, useRef } from "react";
import KonarkWheel from "./KonarkWheel";

// Deterministic PRNG so star/diya positions match between server and client render.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const starRand = mulberry32(20260611);
const STARS = Array.from({ length: 60 }, () => ({
  left: starRand() * 100,
  top: starRand() * 100,
  delay: starRand() * 3,
  opacity: 0.3 + starRand() * 0.7,
}));

const diyaRand = mulberry32(1936);
const DIYAS = Array.from({ length: 8 }, () => ({
  left: 5 + diyaRand() * 90,
  delay: diyaRand() * 4,
  scale: 0.7 + diyaRand() * 0.6,
}));

const CLOUDS = [
  { top: 14, w: 120, h: 34, dur: 80, delay: 0 },
  { top: 26, w: 90, h: 26, dur: 120, delay: -28 },
  { top: 8, w: 160, h: 44, dur: 150, delay: -56 },
  { top: 20, w: 70, h: 20, dur: 95, delay: -84 },
];

const WAVE_PATHS = [
  "M0 80 Q150 40 300 80 T600 80 T900 80 T1200 80 T1500 80 T1800 80 T2100 80 T2400 80 T2700 80 T3000 80 T3300 80 T3600 80 L3600 200 L0 200 Z",
  "M0 90 Q200 50 400 90 T800 90 T1200 90 T1600 90 T2000 90 T2400 90 T2800 90 T3200 90 T3600 90 L3600 200 L0 200 Z",
  "M0 100 Q250 65 500 100 T1000 100 T1500 100 T2000 100 T2500 100 T3000 100 T3500 100 L3600 100 L3600 200 L0 200 Z",
];

const SKYLINE_FAR =
  "M0 260 L0 230 L60 230 L60 210 L120 210 L120 230 L200 230 L230 160 L250 120 L270 160 L300 230 L380 230 L380 215 L430 215 L430 230 L520 230 L560 140 L575 100 L590 140 L630 230 L760 230 L800 170 L815 135 L830 170 L870 230 L1000 230 L1000 212 L1060 212 L1060 230 L1140 230 L1180 150 L1196 110 L1212 150 L1252 230 L1380 230 L1420 180 L1432 150 L1444 180 L1484 230 L1600 230 L1600 260 Z";

const SKYLINE_NEAR =
  "M0 260 L0 238 L90 238 L100 200 L150 200 L160 238 L260 238 L300 190 Q330 60 360 30 L360 14 L382 22 L362 32 Q392 64 420 190 L460 238 L600 238 L610 205 Q640 150 670 140 Q700 150 730 205 L740 238 L880 238 L890 200 L950 200 L960 238 L1040 238 L1080 185 Q1108 70 1134 42 L1134 26 L1154 34 L1136 44 Q1162 74 1188 185 L1228 238 L1340 238 L1350 208 Q1378 160 1404 152 Q1430 160 1458 208 L1468 238 L1600 238 L1600 260 Z";

export default function LivingScene() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    const touch = window.matchMedia("(hover: none)").matches;
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;
    let raf = 0;
    const t0 = performance.now();

    const onMove = (ev: PointerEvent) => {
      tx = ev.clientX / window.innerWidth - 0.5;
      ty = ev.clientY / window.innerHeight - 0.5;
    };
    if (!touch) window.addEventListener("pointermove", onMove, { passive: true });

    const loop = (now: number) => {
      if (touch) {
        // gentle auto-sway so the 3D depth is visible without a cursor
        const t = (now - t0) / 1000;
        tx = Math.sin(t * 0.3) * 0.18;
        ty = Math.cos(t * 0.22) * 0.1;
      }
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      for (const layer of layers) {
        const z = parseFloat(layer.dataset.depth || "1");
        layer.style.transform = `translate3d(${-cx * z * 18}px, ${-cy * z * 10}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      if (!touch) window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="scene" aria-hidden="true">
      {/* sky layer: stars (night) + clouds (day) */}
      <div className="depth" data-depth="0.4">
        <div className="scene-stars">
          {STARS.map((s, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                animationDelay: `${s.delay}s`,
                opacity: s.opacity,
              }}
            />
          ))}
        </div>
        <div className="scene-clouds">
          {CLOUDS.map((c, i) => (
            <span
              key={i}
              className="cloud"
              style={{
                top: `${c.top}%`,
                width: c.w,
                height: c.h,
                animationDuration: `${c.dur}s`,
                animationDelay: `${c.delay}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* the Konark wheel sun/moon */}
      <div className="depth" data-depth="0.9">
        <div className="scene-wheel">
          <KonarkWheel teeth />
        </div>
      </div>

      {/* birds */}
      <div className="depth" data-depth="1.4">
        <svg className="scene-bird" style={{ top: "16%", animationDuration: "34s" }} width="46" height="18" viewBox="0 0 46 18">
          <path d="M2 12 Q 12 2 23 12 Q 34 2 44 12" />
        </svg>
        <svg className="scene-bird" style={{ top: "23%", animationDuration: "46s", animationDelay: "-18s" }} width="34" height="14" viewBox="0 0 46 18">
          <path d="M2 12 Q 12 2 23 12 Q 34 2 44 12" />
        </svg>
        <svg className="scene-bird" style={{ top: "11%", animationDuration: "55s", animationDelay: "-30s" }} width="28" height="12" viewBox="0 0 46 18">
          <path d="M2 12 Q 12 2 23 12 Q 34 2 44 12" />
        </svg>
      </div>

      {/* far skyline: Konark + smaller deuls */}
      <div className="depth" data-depth="2">
        <div className="scene-skyline far">
          <svg viewBox="0 0 1600 260" preserveAspectRatio="none">
            <path d={SKYLINE_FAR} />
          </svg>
        </div>
      </div>

      {/* near skyline: Jagannath-style shikhara with flag */}
      <div className="depth" data-depth="3.2">
        <div className="scene-skyline near">
          <svg viewBox="0 0 1600 260" preserveAspectRatio="none">
            <path d={SKYLINE_NEAR} />
          </svg>
        </div>
      </div>

      {/* sea, shimmer and diyas */}
      <div className="depth" data-depth="4.5">
        <div className="scene-shimmer" />
        <div className="scene-sea">
          {WAVE_PATHS.map((d, i) => (
            <div key={i} className={`scene-wave w${i + 1}`}>
              <svg viewBox="0 0 3600 200" preserveAspectRatio="none">
                <path d={d} />
              </svg>
            </div>
          ))}
        </div>
        <div className="scene-diyas">
          {DIYAS.map((d, i) => (
            <span
              key={i}
              className="diya"
              style={{
                left: `${d.left}%`,
                animationDelay: `${d.delay}s`,
                transform: `scale(${d.scale})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
