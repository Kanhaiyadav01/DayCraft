import type { Database } from "@/integrations/supabase/types";

export type PlantStage = Database["public"]["Enums"]["plant_stage"];

export const SPECIES = ["flower", "tree", "succulent", "mushroom", "clover"] as const;
export type Species = (typeof SPECIES)[number];

/** Map session minutes → plant stage. Longer sessions = more mature plant. */
export function stageForMinutes(minutes: number): PlantStage {
  if (minutes >= 90) return "tree";
  if (minutes >= 50) return "bloom";
  if (minutes >= 25) return "bud";
  if (minutes >= 10) return "sprout";
  return "seed";
}

export function randomSpecies(): Species {
  return SPECIES[Math.floor(Math.random() * SPECIES.length)];
}

/** Pick a non-overlapping grid cell (0..cols-1, 0..rows-1). */
export function pickPosition(
  taken: Array<{ position_x: number; position_y: number }>,
  cols = 8,
  rows = 5,
): { x: number; y: number } {
  const set = new Set(taken.map((p) => `${p.position_x},${p.position_y}`));
  const free: Array<[number, number]> = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) if (!set.has(`${x},${y}`)) free.push([x, y]);
  if (free.length === 0) {
    return { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
  }
  const [x, y] = free[Math.floor(Math.random() * free.length)];
  return { x, y };
}

export const STAGE_LABEL: Record<PlantStage, string> = {
  seed: "Seed",
  sprout: "Sprout",
  bud: "Bud",
  bloom: "Bloom",
  tree: "Tree",
};
