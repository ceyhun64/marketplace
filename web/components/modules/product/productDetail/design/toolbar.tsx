// Toolbar.tsx
import React from "react";
import {
  HardHat,
  Undo,
  Redo,
  Move,
  Hand,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Download,
  Check,
  X,
  PanelLeftClose,
  PanelRightClose,
  PanelLeftOpen,
  PanelRightOpen,
} from "lucide-react";
import { cn } from "./types";

interface ToolbarProps {
  historyIndex: number;
  historyLength: number;
  tool: "select" | "pan";
  zoom: number;
  showGrid: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToolChange: (tool: "select" | "pan") => void;
  onZoomChange: (zoom: number) => void;
  onGridToggle: () => void;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onExport: () => void;
  onClose: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  historyIndex,
  historyLength,
  tool,
  zoom,
  showGrid,
  showLeftPanel,
  showRightPanel,
  onUndo,
  onRedo,
  onToolChange,
  onZoomChange,
  onGridToggle,
  onToggleLeftPanel,
  onToggleRightPanel,
  onExport,
  onClose,
}) => {
  return (
    <div className="bg-slate-800 border-b border-slate-700 px-2 sm:px-4 py-2 flex items-center justify-between overflow-x-auto">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Brand */}
        <div className="hidden sm:flex items-center gap-2 text-orange-500">
          <HardHat size={18} />
          <span className="font-black text-sm tracking-wider">
            PROFESSIONAL DESIGN STUDIO
          </span>
        </div>
        <div className="sm:hidden flex items-center gap-2 text-orange-500">
          <HardHat size={16} />
          <span className="font-black text-xs">STUDIO</span>
        </div>

        {/* Panel Toggles - Desktop only */}
        <div className="hidden lg:flex items-center gap-1 border-l border-slate-700 pl-4">
          <button
            onClick={onToggleLeftPanel}
            className="p-2 text-slate-300 hover:bg-slate-700 rounded transition-colors"
            title="Sol Paneli Aç/Kapat"
          >
            {showLeftPanel ? (
              <PanelLeftClose size={16} />
            ) : (
              <PanelLeftOpen size={16} />
            )}
          </button>
          <button
            onClick={onToggleRightPanel}
            className="p-2 text-slate-300 hover:bg-slate-700 rounded transition-colors"
            title="Sağ Paneli Aç/Kapat"
          >
            {showRightPanel ? (
              <PanelRightClose size={16} />
            ) : (
              <PanelRightOpen size={16} />
            )}
          </button>
        </div>

        {/* History Controls */}
        <div className="flex items-center gap-1 border-l border-slate-700 pl-2 sm:pl-4">
          <button
            onClick={onUndo}
            disabled={historyIndex <= 0}
            className={cn(
              "p-1.5 sm:p-2 rounded hover:bg-slate-700 transition-colors",
              historyIndex <= 0
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-300",
            )}
            title="Geri Al (Ctrl+Z)"
          >
            <Undo size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={historyIndex >= historyLength - 1}
            className={cn(
              "p-1.5 sm:p-2 rounded hover:bg-slate-700 transition-colors",
              historyIndex >= historyLength - 1
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-300",
            )}
            title="İleri Al (Ctrl+Y)"
          >
            <Redo size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1 border-l border-slate-700 pl-2 sm:pl-4">
          <button
            onClick={() => onToolChange("select")}
            className={cn(
              "p-1.5 sm:p-2 rounded transition-colors",
              tool === "select"
                ? "bg-orange-600 text-white"
                : "text-slate-300 hover:bg-slate-700",
            )}
            title="Seçim Aracı (V)"
          >
            <Move size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => onToolChange("pan")}
            className={cn(
              "p-1.5 sm:p-2 rounded transition-colors",
              tool === "pan"
                ? "bg-orange-600 text-white"
                : "text-slate-300 hover:bg-slate-700",
            )}
            title="El Aracı (H)"
          >
            <Hand size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-1 sm:gap-2 border-l border-slate-700 pl-2 sm:pl-4">
          <button
            onClick={() => onZoomChange(Math.max(25, zoom - 25))}
            className="p-1.5 sm:p-2 text-slate-300 hover:bg-slate-700 rounded transition-colors"
          >
            <ZoomOut size={14} className="sm:w-4 sm:h-4" />
          </button>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 min-w-[40px] sm:min-w-[50px] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(400, zoom + 25))}
            className="p-1.5 sm:p-2 text-slate-300 hover:bg-slate-700 rounded transition-colors"
          >
            <ZoomIn size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onGridToggle}
            className={cn(
              "p-1.5 sm:p-2 rounded transition-colors ml-1 sm:ml-2",
              showGrid
                ? "bg-orange-600 text-white"
                : "text-slate-300 hover:bg-slate-700",
            )}
          >
            <Grid3x3 size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onExport}
          className="hidden sm:flex px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-all items-center gap-2 text-[10px] sm:text-xs font-bold"
        >
          <Download size={12} className="sm:w-3.5 sm:h-3.5" />
          <span className="hidden md:inline">Export PNG</span>
        </button>
        <button
          onClick={onClose}
          className="px-3 sm:px-6 py-1.5 sm:py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-all flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold"
        >
          <Check size={12} className="sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">Kaydet & Kapat</span>
          <span className="sm:hidden">Kaydet</span>
        </button>
        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-white transition-colors"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};
