// constants.ts
import { QuickPosition, BlendMode } from "./types";

export const QUICK_POSITIONS: QuickPosition[] = [
  { name: "Sol Üst", x: 80, y: 80 },
  { name: "Üst Merkez", x: 210, y: 80 },
  { name: "Sağ Üst", x: 340, y: 80 },
  { name: "Sol Göğüs", x: 100, y: 140 },
  { name: "Merkez", x: 210, y: 200 },
  { name: "Sağ Göğüs", x: 320, y: 140 },
  { name: "Sol Alt", x: 100, y: 340 },
  { name: "Alt Merkez", x: 210, y: 340 },
  { name: "Sağ Alt", x: 320, y: 340 },
];

export const BLEND_MODES: BlendMode[] = [
  { name: "Normal", value: "normal" },
  { name: "Multiply", value: "multiply" },
  { name: "Screen", value: "screen" },
  { name: "Overlay", value: "overlay" },
  { name: "Darken", value: "darken" },
  { name: "Lighten", value: "lighten" },
  { name: "Color Dodge", value: "color-dodge" },
  { name: "Color Burn", value: "color-burn" },
  { name: "Hard Light", value: "hard-light" },
  { name: "Soft Light", value: "soft-light" },
  { name: "Difference", value: "difference" },
  { name: "Exclusion", value: "exclusion" },
  { name: "Hue", value: "hue" },
  { name: "Saturation", value: "saturation" },
  { name: "Color", value: "color" },
  { name: "Luminosity", value: "luminosity" },
];

export const DEFAULT_LAYER_VALUES = {
  size: { width: 120, height: 120 },
  position: { x: 190, y: 190 },
  rotation: 0,
  opacity: 100,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  blendMode: "normal",
  flipH: false,
  flipV: false,
  visible: true,
  locked: false,
};
