import React from 'react';
import { Undo2, Trash2, Eraser, Paintbrush } from 'lucide-react';
import { BRUSH_SIZES, DEFAULT_PALETTE } from '../../constants/game';
import { socket } from '../../services/socket';

export interface DrawingToolbarProps {
  color: string;
  size: number;
  isEraser: boolean;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onEraserToggle: (isEraser: boolean) => void;
  disabled?: boolean;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  color,
  size,
  isEraser,
  onColorChange,
  onSizeChange,
  onEraserToggle,
  disabled = false,
}) => {
  const handleUndo = () => {
    if (disabled) return;
    socket.emit('draw:undo');
  };

  const handleClear = () => {
    if (disabled) return;
    if (window.confirm('Are you sure you want to clear the entire canvas?')) {
      socket.emit('draw:clear');
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 bg-white rounded-3xl border-3 border-slate-900 shadow-tactile-md">
      {/* Left: Tool Selection & Brush Sizes */}
      <div className="flex items-center gap-2">
        {/* Brush Tool */}
        <button
          type="button"
          onClick={() => onEraserToggle(false)}
          disabled={disabled}
          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer ${!isEraser
              ? 'bg-amber-400 text-slate-950 border-slate-900 shadow-tactile-sm scale-105'
              : 'bg-white text-slate-700 hover:bg-amber-50 border-slate-900/60 shadow-sm'
            }`}
          title="Brush"
          aria-label="Brush tool"
        >
          <Paintbrush className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Eraser Tool */}
        <button
          type="button"
          onClick={() => onEraserToggle(true)}
          disabled={disabled}
          className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer ${isEraser
              ? 'bg-amber-400 text-slate-950 border-slate-900 shadow-tactile-sm scale-105'
              : 'bg-white text-slate-700 hover:bg-amber-50 border-slate-900/60 shadow-sm'
            }`}
          title="Eraser"
          aria-label="Eraser tool"
        >
          <Eraser className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="h-6 w-0.5 bg-slate-900/20 mx-1" />

        {/* Brush Sizes */}
        <div className="flex items-center gap-1.5 bg-amber-50/80 p-1 rounded-xl border-2 border-slate-900 shadow-tactile-sm">
          {BRUSH_SIZES.map((bSize) => {
            const isSelected = size === bSize;
            return (
              <button
                key={bSize}
                type="button"
                onClick={() => onSizeChange(bSize)}
                disabled={disabled}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isSelected
                    ? 'bg-amber-300 border-2 border-slate-900 shadow-sm scale-110'
                    : 'hover:bg-amber-200/60 text-slate-800'
                  }`}
                title={`Brush size ${bSize}px`}
              >
                <span
                  className="rounded-full bg-slate-950"
                  style={{
                    width: Math.min(18, Math.max(4, bSize * 0.7)),
                    height: Math.min(18, Math.max(4, bSize * 0.7)),
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: Color Palette */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {DEFAULT_PALETTE.map((paletteColor) => {
          const isSelected = !isEraser && color.toLowerCase() === paletteColor.toLowerCase();
          return (
            <button
              key={paletteColor}
              type="button"
              onClick={() => {
                onColorChange(paletteColor);
                if (isEraser) onEraserToggle(false);
              }}
              disabled={disabled}
              className={`w-7 h-7 rounded-lg transition-all cursor-pointer active:scale-90 border-2 ${isSelected
                  ? 'scale-125 border-slate-950 ring-2 ring-amber-400 shadow-tactile-sm -translate-y-1 z-10'
                  : 'border-slate-900/80 hover:scale-110 shadow-sm'
                }`}
              style={{ backgroundColor: paletteColor }}
              title={paletteColor}
            />
          );
        })}

        {/* Native Custom Color Picker */}
        <label
          className="relative w-7 h-7 rounded-lg border-2 border-slate-900 bg-white cursor-pointer overflow-hidden flex items-center justify-center hover:scale-110 transition-transform shadow-tactile-sm"
          title="Custom color"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => {
              onColorChange(e.target.value);
              if (isEraser) onEraserToggle(false);
            }}
            disabled={disabled}
            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
          />
          <span className="text-xs font-bold select-none">🎨</span>
        </label>
      </div>

      {/* Right: Undo & Clear */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 shadow-tactile-sm active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 cursor-pointer"
          title="Undo last stroke"
        >
          <Undo2 className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">UNDO</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-100 hover:bg-rose-200 text-rose-950 border-2 border-slate-900 shadow-tactile-sm active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 cursor-pointer"
          title="Clear canvas"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5] text-rose-700" />
          <span className="hidden sm:inline">CLEAR</span>
        </button>
      </div>
    </div>
  );
};

