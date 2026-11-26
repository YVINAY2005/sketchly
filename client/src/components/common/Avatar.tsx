import React from 'react';

export const AVATAR_OPTIONS = [
  '🎨', '🦊', '🚀', '🐱', '🐶', '🦁', '🐼', '🍕', '⚡', '💎', '👾', '🦄', '🥑', '🍩', '🎸', '⭐'
] as const;

export interface AvatarProps {
  emoji?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isHost?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  emoji = '🎨',
  name,
  size = 'md',
  className = '',
  isHost = false,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-10 h-10 text-xl',
    lg: 'w-14 h-14 text-3xl',
    xl: 'w-20 h-20 text-4xl',
  };

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={`inline-flex items-center justify-center rounded-2xl bg-amber-50/90 border-2 border-slate-900 shadow-tactile-sm select-none transition-transform ${sizeMap[size]} ${className}`}
        title={name}
      >
        <span>{emoji}</span>
      </div>
      {isHost && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 border-2 border-slate-900 text-[10px] font-bold text-amber-950 shadow-tactile-sm animate-bounce"
          title="Room Host"
        >
          👑
        </span>
      )}
    </div>
  );
};

export interface AvatarPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 py-2">
      {AVATAR_OPTIONS.map((emoji) => {
        const isSelected = selected === emoji;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all cursor-pointer active:translate-y-0.5 ${
              isSelected
                ? 'bg-amber-300 border-2 border-slate-900 shadow-tactile scale-110 -translate-y-1'
                : 'bg-white hover:bg-amber-50 border-2 border-slate-800 shadow-tactile-sm hover:-translate-y-0.5'
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
};

