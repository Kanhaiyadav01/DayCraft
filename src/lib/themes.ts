export type ThemeId =
  | "classic"
  | "midnight"
  | "sakura"
  | "matcha"
  | "lavender"
  | "ocean"
  | "forest"
  | "sunset";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  /** Swatches for preview cards: paper, ink, accent, tape */
  swatches: { paper: string; ink: string; accent: string; tape: string };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "classic",
    name: "DayCraft Classic",
    emoji: "✏️",
    tagline: "Warm cream paper, fountain-pen blue.",
    swatches: { paper: "#f6f0dc", ink: "#1f2540", accent: "#4f6bd6", tape: "#f0d98a" },
  },
  {
    id: "midnight",
    name: "Midnight Sketch",
    emoji: "🌙",
    tagline: "Late-night study session.",
    swatches: { paper: "#1f2440", ink: "#f1ecd6", accent: "#a48cff", tape: "#5d4ea0" },
  },
  {
    id: "sakura",
    name: "Sakura Journal",
    emoji: "🌸",
    tagline: "Soft pink, cherry blossom calm.",
    swatches: { paper: "#fbeef0", ink: "#5b2540", accent: "#e87a99", tape: "#f4cdd4" },
  },
  {
    id: "matcha",
    name: "Kyoto Matcha",
    emoji: "🍵",
    tagline: "Quiet café, slow deep work.",
    swatches: { paper: "#eef0d8", ink: "#2f4a30", accent: "#6b8e4e", tape: "#d8c98a" },
  },
  {
    id: "lavender",
    name: "Lavender Dreams",
    emoji: "💜",
    tagline: "Soft lilac, dreamy focus.",
    swatches: { paper: "#efe6f7", ink: "#3d2a5e", accent: "#9b72cf", tape: "#d6c2ec" },
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    emoji: "🌊",
    tagline: "Pale aqua, salt-air clarity.",
    swatches: { paper: "#e2ecf3", ink: "#1d2c4c", accent: "#3d7fb8", tape: "#bcd3e4" },
  },
  {
    id: "forest",
    name: "Forest Cabin",
    emoji: "🌲",
    tagline: "Beige paper, pine ink, kraft tape.",
    swatches: { paper: "#e8dec3", ink: "#2c3a25", accent: "#4d7a47", tape: "#c39a5b" },
  },
  {
    id: "sunset",
    name: "Sunset Sketch",
    emoji: "🌅",
    tagline: "Peach paper, terracotta warmth.",
    swatches: { paper: "#fbe3cf", ink: "#5e2b18", accent: "#e07a3a", tape: "#f1b48a" },
  },
];

export const DEFAULT_THEME: ThemeId = "classic";
