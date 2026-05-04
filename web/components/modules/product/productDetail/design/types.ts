// types.ts
export interface LogoLayer {
  id: string;
  image: string;
  size: { width: number; height: number };
  position: { x: number; y: number };
  rotation: number;
  opacity: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  blendMode: string;
  flipH: boolean;
  flipV: boolean;
  visible: boolean;
  locked: boolean;
  name: string;
  backgroundRemoved?: boolean;
}

export interface DesignPanelProps {
  productImage: string;
  onClose: () => void;
}

export interface QuickPosition {
  name: string;
  x: number;
  y: number;
}

export interface BlendMode {
  name: string;
  value: string;
}

// Utility function
export const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
