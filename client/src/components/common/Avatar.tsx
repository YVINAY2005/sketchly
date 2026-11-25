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
        className={`inline-flex items-center justify-center rounded-2xl bg-slate-100 border border-slate-200/80 shadow-sm select-none ${sizeMap[size]} ${className}`}
        title={name}
      >
        <span>{emoji}</span>
      </div>
      {isHost && (
        <span
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-950 shadow-sm"
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
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-transform active:scale-95 ${
              isSelected
                ? 'bg-brand-100 border-2 border-brand-600 scale-105 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
};
