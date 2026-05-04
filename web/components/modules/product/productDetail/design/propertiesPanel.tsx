// PropertiesPanel.tsx
import React from "react";
import {
  Settings,
  LayoutTemplate,
  SlidersHorizontal,
  Droplets,
  Sun,
  Contrast,
  Palette,
  Blend,
  RotateCcw,
  Layers,
} from "lucide-react";
import { LogoLayer, cn } from "./types";
import { QUICK_POSITIONS, BLEND_MODES } from "./constants";

interface PropertiesPanelProps {
  activeLayer: LogoLayer | undefined;
  onLayerUpdate: (updates: Partial<LogoLayer>) => void;
  onResetLayer: () => void;
  onRemoveBackground: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  activeLayer,
  onLayerUpdate,
  onResetLayer,
  onRemoveBackground,
}) => {
  if (!activeLayer) {
    return (
      <div className="w-full lg:w-[340px] bg-slate-800 border-l border-slate-700 overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="h-full flex items-center justify-center p-6 lg:p-8 text-center">
          <div className="space-y-2 lg:space-y-3">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto">
              <Layers size={20} className="lg:w-6 lg:h-6 text-slate-500" />
            </div>
            <p className="text-xs lg:text-sm font-bold text-slate-500">
              Katman Seçilmedi
            </p>
            <p className="text-[10px] lg:text-xs text-slate-600">
              Düzenlemek için sol panelden bir katman seçin
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-[340px] bg-slate-800 border-l border-slate-700 overflow-y-auto max-h-[40vh] lg:max-h-none">
      <div className="p-3 lg:p-4 space-y-4 lg:space-y-6">
        {/* Transform Section */}
        <section className="space-y-2 lg:space-y-3">
          <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Settings size={11} /> Transform
          </div>

          {/* Size Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold">
                Genişlik
              </label>
              <input
                type="number"
                value={activeLayer.size.width}
                onChange={(e) =>
                  onLayerUpdate({
                    size: {
                      ...activeLayer.size,
                      width: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-slate-700 text-slate-200 px-2 py-1 rounded text-[10px] lg:text-xs border border-slate-600 focus:border-orange-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold">
                Yükseklik
              </label>
              <input
                type="number"
                value={activeLayer.size.height}
                onChange={(e) =>
                  onLayerUpdate({
                    size: {
                      ...activeLayer.size,
                      height: Number(e.target.value),
                    },
                  })
                }
                className="w-full bg-slate-700 text-slate-200 px-2 py-1 rounded text-[10px] lg:text-xs border border-slate-600 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold">
                Döndürme
              </label>
              <input
                type="number"
                min="-180"
                max="180"
                value={activeLayer.rotation}
                onChange={(e) =>
                  onLayerUpdate({ rotation: Number(e.target.value) })
                }
                className="w-14 lg:w-16 bg-slate-700 text-orange-400 px-2 py-0.5 rounded text-[8px] lg:text-[9px] font-bold border border-slate-600 focus:border-orange-500 outline-none text-right"
              />
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={activeLayer.rotation}
              onChange={(e) =>
                onLayerUpdate({ rotation: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {activeLayer && (
            <button
              onClick={() => onRemoveBackground(activeLayer.id)}
              className="w-full mt-2 lg:mt-3 bg-purple-600 hover:bg-purple-700 text-white text-[10px] lg:text-xs font-bold py-1.5 lg:py-2 rounded transition-all"
            >
              Arka Planı Kaldır
            </button>
          )}

          {/* Flip Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onLayerUpdate({ flipH: !activeLayer.flipH })}
              className={cn(
                "py-1.5 lg:py-2 text-[9px] lg:text-[10px] font-bold rounded border transition-all",
                activeLayer.flipH
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-slate-700 text-slate-300 border-slate-600",
              )}
            >
              Yatay Çevir
            </button>
            <button
              onClick={() => onLayerUpdate({ flipV: !activeLayer.flipV })}
              className={cn(
                "py-1.5 lg:py-2 text-[9px] lg:text-[10px] font-bold rounded border transition-all",
                activeLayer.flipV
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-slate-700 text-slate-300 border-slate-600",
              )}
            >
              Dikey Çevir
            </button>
          </div>
        </section>

        {/* Quick Position Section */}
        <section className="space-y-2 lg:space-y-3">
          <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <LayoutTemplate size={11} /> Hızlı Konum
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {QUICK_POSITIONS.map((pos) => (
              <button
                key={pos.name}
                onClick={() =>
                  onLayerUpdate({ position: { x: pos.x, y: pos.y } })
                }
                className="text-[8px] lg:text-[9px] py-1.5 lg:py-2 bg-slate-700 hover:bg-orange-600 text-slate-300 hover:text-white rounded font-semibold transition-all"
              >
                {pos.name}
              </button>
            ))}
          </div>
        </section>

        {/* Adjustments Section */}
        <section className="space-y-3 lg:space-y-4">
          <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal size={11} /> Ayarlamalar
          </div>

          {/* Opacity */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                <Droplets size={9} /> Opaklık
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={activeLayer.opacity}
                onChange={(e) =>
                  onLayerUpdate({ opacity: Number(e.target.value) })
                }
                className="w-14 lg:w-16 bg-slate-700 text-orange-400 px-2 py-0.5 rounded text-[8px] lg:text-[9px] font-bold border border-slate-600 focus:border-orange-500 outline-none text-right"
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={activeLayer.opacity}
              onChange={(e) =>
                onLayerUpdate({ opacity: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Brightness */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                <Sun size={9} /> Parlaklık
              </label>
              <input
                type="number"
                min="0"
                max="200"
                value={activeLayer.brightness}
                onChange={(e) =>
                  onLayerUpdate({ brightness: Number(e.target.value) })
                }
                className="w-14 lg:w-16 bg-slate-700 text-orange-400 px-2 py-0.5 rounded text-[8px] lg:text-[9px] font-bold border border-slate-600 focus:border-orange-500 outline-none text-right"
              />
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={activeLayer.brightness}
              onChange={(e) =>
                onLayerUpdate({ brightness: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                <Contrast size={9} /> Kontrast
              </label>
              <input
                type="number"
                min="0"
                max="200"
                value={activeLayer.contrast}
                onChange={(e) =>
                  onLayerUpdate({ contrast: Number(e.target.value) })
                }
                className="w-14 lg:w-16 bg-slate-700 text-orange-400 px-2 py-0.5 rounded text-[8px] lg:text-[9px] font-bold border border-slate-600 focus:border-orange-500 outline-none text-right"
              />
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={activeLayer.contrast}
              onChange={(e) =>
                onLayerUpdate({ contrast: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                <Palette size={9} /> Doygunluk
              </label>
              <input
                type="number"
                min="0"
                max="200"
                value={activeLayer.saturation}
                onChange={(e) =>
                  onLayerUpdate({ saturation: Number(e.target.value) })
                }
                className="w-14 lg:w-16 bg-slate-700 text-orange-400 px-2 py-0.5 rounded text-[8px] lg:text-[9px] font-bold border border-slate-600 focus:border-orange-500 outline-none text-right"
              />
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={activeLayer.saturation}
              onChange={(e) =>
                onLayerUpdate({ saturation: Number(e.target.value) })
              }
              className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Hue */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold">
                Renk Tonu
              </label>
              <input
                type="number"
                min="0"
                max="360"
                value={activeLayer.hue}
                onChange={(e) => onLayerUpdate({ hue: Number(e.target.value) })}
                className="w-14 lg:w-16 bg-slate-700 text-orange-400 px-2 py-0.5 rounded text-[8px] lg:text-[9px] font-bold border border-slate-600 focus:border-orange-500 outline-none text-right"
              />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={activeLayer.hue}
              onChange={(e) => onLayerUpdate({ hue: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Blur */}
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[8px] lg:text-[9px] text-slate-500 font-semibold">
                Bulanıklık
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={activeLayer.blur}
                onChange={(e) =>
                  onLayerUpdate({ blur: Number(e.target.value) })
                }
                className="w-14 lg:w-16 bg-slate-700 text-orange-400 px-2 py-0.5 rounded text-[8px] lg:text-[9px] font-bold border border-slate-600 focus:border-orange-500 outline-none text-right"
              />
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={activeLayer.blur}
              onChange={(e) => onLayerUpdate({ blur: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded appearance-none cursor-pointer accent-orange-500"
            />
          </div>
        </section>

        {/* Blend Mode Section */}
        <section className="space-y-2 lg:space-y-3">
          <div className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Blend size={11} /> Karışım Modu
          </div>
          <select
            value={activeLayer.blendMode}
            onChange={(e) => onLayerUpdate({ blendMode: e.target.value })}
            className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded text-[10px] lg:text-xs border border-slate-600 focus:border-orange-500 outline-none"
          >
            {BLEND_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.name}
              </option>
            ))}
          </select>
        </section>

        {/* Reset Button */}
        <button
          onClick={onResetLayer}
          className="w-full py-2 lg:py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded font-bold text-[10px] lg:text-xs flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw size={12} className="lg:w-3.5 lg:h-3.5" /> Tüm Ayarları
          Sıfırla
        </button>
      </div>
    </div>
  );
};
