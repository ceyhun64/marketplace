// Canvas.tsx
import React from "react";
import { Rnd } from "react-rnd";
import { Maximize } from "lucide-react";
import { LogoLayer, cn } from "./types";

interface CanvasProps {
  productImage: string;
  layers: LogoLayer[];
  activeLayerId: string | null;
  zoom: number;
  showGrid: boolean;
  showGuides: boolean;
  tool: "select" | "pan";
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onLayerUpdate: (id: string, updates: Partial<LogoLayer>) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  productImage,
  layers,
  activeLayerId,
  zoom,
  showGrid,
  showGuides,
  tool,
  canvasRef,
  onLayerUpdate,
}) => {
  return (
    <div className="flex-1 bg-[#2a2e35] flex items-center justify-center overflow-hidden relative">
      {/* Grid */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      )}

      {/* Canvas Container */}
      <div
        ref={canvasRef}
        className="relative shadow-2xl"
        style={{
          width: `${375 * (zoom / 100)}px`,
          height: `${500 * (zoom / 100)}px`,
        }}
      >
        <div
          id="design-area"
          className="relative w-full h-full bg-white overflow-hidden border-2 border-slate-700"
        >
          {/* Product Image */}
          <img
            src={productImage}
            alt="Product"
            className="w-full h-full object-contain p-12 select-none pointer-events-none"
          />

          {/* Smart Guides */}
          {showGuides && layers.length > 0 && (
            <div className="absolute inset-0 pointer-events-none export-hide-guides">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/40" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/40" />
            </div>
          )}

          {/* Layers */}
          {layers.map((layer) => {
            if (!layer.visible) return null;

            return (
              <Rnd
                key={layer.id}
                className={cn(
                  "export-layer",
                  activeLayerId === layer.id && "is-active",
                )}
                size={{
                  width: layer.size.width,
                  height: layer.size.height,
                }}
                position={{ x: layer.position.x, y: layer.position.y }}
                onDragStop={(e, d) =>
                  onLayerUpdate(layer.id, { position: { x: d.x, y: d.y } })
                }
                onResizeStop={(e, direction, ref, delta, pos) => {
                  onLayerUpdate(layer.id, {
                    size: {
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                    },
                    position: pos,
                  });
                }}
                bounds="parent"
                style={{ outline: "none" }}
                lockAspectRatio={true}
                disableDragging={layer.locked || tool === "pan"}
                enableResizing={!layer.locked && tool === "select"}
              >
                <div
                  className={cn(
                    "group relative w-full h-full transition-all",
                    activeLayerId === layer.id &&
                      !layer.locked &&
                      "ring-2 ring-transparent selection-ring",
                  )}
                  style={{
                    opacity: layer.opacity / 100,
                    transform: `rotate(${layer.rotation}deg) scaleX(${layer.flipH ? -1 : 1}) scaleY(${layer.flipV ? -1 : 1})`,
                    filter: `brightness(${layer.brightness}%) contrast(${layer.contrast}%) saturate(${layer.saturation}%) hue-rotate(${layer.hue}deg) blur(${layer.blur}px)`,
                    mixBlendMode: layer.blendMode as any,
                  }}
                >
                  <img
                    src={layer.image}
                    alt={layer.name}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-lg"
                  />

                  {activeLayerId === layer.id && !layer.locked && (
                    <>
                      <div className="absolute -top-3 -right-3 w-6 h-6 bg-orange-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center scale-0 group-hover:scale-100 transition-transform export-hide-handles">
                        <Maximize size={12} className="text-white" />
                      </div>
                      <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-orange-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center scale-0 group-hover:scale-100 transition-transform export-hide-handles">
                        <Maximize size={12} className="text-white" />
                      </div>
                    </>
                  )}
                </div>
              </Rnd>
            );
          })}
        </div>
      </div>
    </div>
  );
};
