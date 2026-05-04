// LayerItem.tsx
import React from "react";
import { Eye, EyeOff, Lock, Unlock, Copy, Trash2 } from "lucide-react";
import { LogoLayer, cn } from "./types";

interface LayerItemProps {
  layer: LogoLayer;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<LogoLayer>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isActive,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative p-3 rounded border transition-all cursor-pointer group",
        isActive
          ? "bg-orange-600/20 border-orange-600"
          : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
      )}
    >
      <div className="flex items-center gap-2">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded bg-slate-900 border border-slate-600 overflow-hidden flex-shrink-0">
          <img
            src={layer.image}
            alt={layer.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <input
            value={layer.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full bg-transparent text-xs font-semibold text-slate-200 border-none outline-none"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] text-slate-500">
              {layer.size.width}×{layer.size.height}
            </span>
            {!layer.visible && (
              <span className="text-[8px] text-red-400 font-bold">GIZLI</span>
            )}
            {layer.locked && <Lock size={8} className="text-slate-500" />}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ visible: !layer.visible });
            }}
            className="p-1 hover:bg-slate-600 rounded"
          >
            {layer.visible ? (
              <Eye size={12} className="text-slate-400" />
            ) : (
              <EyeOff size={12} className="text-slate-600" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ locked: !layer.locked });
            }}
            className="p-1 hover:bg-slate-600 rounded"
          >
            {layer.locked ? (
              <Lock size={12} className="text-orange-500" />
            ) : (
              <Unlock size={12} className="text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-600">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          className="flex-1 text-[9px] py-1 bg-slate-600 hover:bg-slate-500 rounded transition-colors text-slate-300"
        >
          ↑
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          className="flex-1 text-[9px] py-1 bg-slate-600 hover:bg-slate-500 rounded transition-colors text-slate-300"
        >
          ↓
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 bg-slate-600 hover:bg-slate-500 rounded transition-colors"
        >
          <Copy size={12} className="text-slate-300" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 bg-red-600/20 hover:bg-red-600 rounded transition-colors"
        >
          <Trash2 size={12} className="text-red-400" />
        </button>
      </div>
    </div>
  );
};