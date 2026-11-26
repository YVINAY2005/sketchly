import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon,
}) => {
  const variantStyles = {
    brand: 'bg-amber-100 text-amber-950 border-slate-900 font-extrabold',
    success: 'bg-emerald-100 text-emerald-950 border-slate-900 font-extrabold',
    warning: 'bg-amber-100 text-amber-950 border-slate-900 font-extrabold',
    danger: 'bg-rose-100 text-rose-950 border-slate-900 font-extrabold',
    neutral: 'bg-slate-100 text-slate-900 border-slate-900 font-bold',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 border-2 shadow-tactile-sm',
    md: 'text-xs px-2.5 py-1 gap-1.5 border-2 shadow-tactile-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-lg border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

