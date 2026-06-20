import * as React from "react";
import { motion } from "framer-motion";
import type { PlantStage, Species } from "@/lib/garden";

interface PlantProps {
  species: Species;
  stage: PlantStage;
  size?: number;
  delay?: number;
}

/** Hand-drawn SVG plants on a transparent background. */
export function Plant({ species, stage, size = 72, delay = 0 }: PlantProps) {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.6, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", damping: 12, stiffness: 220 }}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="var(--ink)"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="50" cy="88" rx="28" ry="5" fill="color-mix(in oklab, var(--ink) 12%, transparent)" stroke="none" />
      {render(species, stage)}
    </motion.svg>
  );
}

function render(s: Species, stage: PlantStage) {
  // Soil mound
  const soil = (
    <path
      d="M22 86 Q50 76 78 86"
      stroke="var(--ink)"
      fill="color-mix(in oklab, var(--coral) 35%, var(--paper-2))"
    />
  );

  if (stage === "seed") {
    return (
      <>
        {soil}
        <circle cx="50" cy="80" r="3.5" fill="var(--ink)" />
        <path d="M44 70 q6 -4 12 0" />
      </>
    );
  }

  if (stage === "sprout") {
    return (
      <>
        {soil}
        <path d="M50 86 V64" />
        <path d="M50 70 q-12 -2 -16 -12" fill="var(--mint)" />
        <path d="M50 64 q10 -2 14 -12" fill="var(--mint)" />
      </>
    );
  }

  if (s === "tree" || stage === "tree") {
    return (
      <>
        {soil}
        <path d="M48 86 V46" />
        <path d="M52 86 V52" />
        <circle cx="50" cy="36" r="22" fill="var(--mint)" />
        <circle cx="36" cy="42" r="12" fill="var(--mint)" />
        <circle cx="64" cy="42" r="12" fill="var(--mint)" />
        <circle cx="44" cy="34" r="1.5" fill="var(--coral)" />
        <circle cx="58" cy="30" r="1.5" fill="var(--coral)" />
      </>
    );
  }

  if (s === "mushroom") {
    return (
      <>
        {soil}
        <rect x="42" y="56" width="16" height="22" rx="3" fill="var(--paper-2)" />
        <path d="M26 56 Q50 22 74 56 Z" fill="var(--coral)" />
        <circle cx="38" cy="48" r="3" fill="var(--paper)" />
        <circle cx="56" cy="42" r="2.5" fill="var(--paper)" />
        <circle cx="62" cy="52" r="2" fill="var(--paper)" />
      </>
    );
  }

  if (s === "succulent") {
    return (
      <>
        {soil}
        <rect x="34" y="58" width="32" height="22" rx="3" fill="var(--tape)" />
        <path d="M50 58 q-10 -10 -14 -22 q10 4 14 14 q4 -10 14 -14 q-4 12 -14 22 Z" fill="var(--mint)" />
        <path d="M50 58 q0 -16 0 -22" />
      </>
    );
  }

  if (s === "clover") {
    return (
      <>
        {soil}
        <path d="M50 86 V58" />
        <circle cx="50" cy="46" r="9" fill="var(--mint)" />
        <circle cx="38" cy="54" r="9" fill="var(--mint)" />
        <circle cx="62" cy="54" r="9" fill="var(--mint)" />
        <circle cx="50" cy="62" r="9" fill="var(--mint)" />
      </>
    );
  }

  // flower default — stage bud/bloom
  const petalFill = stage === "bloom" ? "var(--coral)" : "var(--highlight)";
  return (
    <>
      {soil}
      <path d="M50 86 V52" />
      <path d="M50 70 q-12 -2 -14 -12" fill="var(--mint)" />
      <path d="M50 64 q10 -2 14 -12" fill="var(--mint)" />
      <circle cx="50" cy="38" r="6" fill={petalFill} />
      <circle cx="40" cy="44" r="6" fill={petalFill} />
      <circle cx="60" cy="44" r="6" fill={petalFill} />
      <circle cx="44" cy="32" r="6" fill={petalFill} />
      <circle cx="56" cy="32" r="6" fill={petalFill} />
      <circle cx="50" cy="38" r="3" fill="var(--tape)" />
    </>
  );
}
