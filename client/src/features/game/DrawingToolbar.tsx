import React from 'react';
import { Undo2, Trash2, Eraser, Paintbrush } from 'lucide-react';
import { BRUSH_SIZES, DEFAULT_PALETTE } from '@sketchly/shared';
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
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Left: Tool Selection & Brush Sizes */}
      <div className="flex items-center gap-2">
        {/* Brush Tool */}
        <button
          type="button"
          onClick={() => onEraserToggle(false)}
          disabled={disabled}
          className={`p-2 rounded-xl transition-all ${
            !isEraser
              ? 'bg-brand-50 text-brand-700 border-2 border-brand-600 shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
          title="Brush"
          aria-label="Brush tool"
        >
          <Paintbrush className="w-4 h-4" />
        </button>

        {/* Eraser Tool */}
        <button
          type="button"
          onClick={() => onEraserToggle(true)}
          disabled={disabled}
          className={`p-2 rounded-xl transition-all ${
            isEraser
              ? 'bg-brand-50 text-brand-700 border-2 border-brand-600 shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
          title="Eraser"
          aria-label="Eraser tool"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Brush Sizes */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {BRUSH_SIZES.map((bSize) => {
            const isSelected = size === bSize;
            return (
              <button
                key={bSize}
                type="button"
                onClick={() => onSizeChange(bSize)}
                disabled={disabled}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-white shadow-sm border border-slate-300'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
                title={`Brush size ${bSize}px`}
              >
                <span
                  className="rounded-full bg-slate-800"
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
              className={`w-6 h-6 rounded-lg transition-transform active:scale-90 border ${
                isSelected
                  ? 'scale-115 ring-2 ring-brand-500 ring-offset-1 border-slate-400'
                  : 'border-slate-300 hover:scale-105'
              }`}
              style={{ backgroundColor: paletteColor }}
              title={paletteColor}
            />
          );
        })}

        {/* Native Custom Color Picker */}
        <label
          className="relative w-6 h-6 rounded-lg border border-slate-300 cursor-pointer overflow-hidden flex items-center justify-center hover:scale-105 transition-transform"
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
            className="absolute -top-4 -left-4 w-14 h-14 cursor-pointer opacity-0"
          />
          <span className="text-[10px] font-bold text-slate-500">🎨</span>
        </label>
      </div>

      {/* Right: Undo & Clear */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95 disabled:opacity-40"
          title="Undo last stroke"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Undo</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all active:scale-95 disabled:opacity-40"
          title="Clear canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </div>
  );
};
