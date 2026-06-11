import React from "react";

interface Props {
  className?: string;
  spokes?: number;
  teeth?: boolean;
}

// The Konark chariot wheel — OEA's logo mark and the sun/moon of the scene.
// Pure SVG, server-safe; stroke colors come from CSS (.konark-wheel).
export default function KonarkWheel({ className, spokes = 8, teeth = false }: Props) {
  const spokeLines = Array.from({ length: spokes }, (_, i) => {
    const a = (i / spokes) * Math.PI * 2;
    return {
      x1: 100 + Math.cos(a) * 20,
      y1: 100 + Math.sin(a) * 20,
      x2: 100 + Math.cos(a) * 84,
      y2: 100 + Math.sin(a) * 84,
    };
  });
  const teethLines = teeth
    ? Array.from({ length: 32 }, (_, i) => {
        const a = (i / 32) * Math.PI * 2;
        return {
          x1: 100 + Math.cos(a) * 86,
          y1: 100 + Math.sin(a) * 86,
          x2: 100 + Math.cos(a) * 94,
          y2: 100 + Math.sin(a) * 94,
        };
      })
    : [];

  return (
    <svg viewBox="0 0 200 200" fill="none" className={`konark-wheel ${className || ""}`}>
      <circle cx="100" cy="100" r="86" strokeWidth="5" />
      <circle cx="100" cy="100" r="70" strokeWidth="1.5" opacity=".7" />
      <circle cx="100" cy="100" r="20" strokeWidth="4" />
      <circle className="hub" cx="100" cy="100" r="8" />
      <g strokeWidth="3">
        {spokeLines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
        ))}
      </g>
      {teeth && (
        <g strokeWidth="1.5" opacity=".75">
          {teethLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
      )}
    </svg>
  );
}
