import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-extrabold rounded-xl transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-1 active:shadow-none hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:active:translate-y-0 disabled:shadow-none cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 border-2 shadow-tactile-sm',
    md: 'text-sm px-4.5 py-2.5 gap-2 border-2 shadow-tactile',
    lg: 'text-base px-6 py-3.5 gap-2.5 border-2 shadow-tactile-md',
  };

  const variantStyles = {
    primary:
      'bg-amber-400 hover:bg-amber-300 text-slate-950 border-slate-900 focus-visible:ring-amber-500',
    secondary:
      'bg-white hover:bg-amber-50 text-slate-900 border-slate-900 focus-visible:ring-slate-400',
    danger:
      'bg-rose-500 hover:bg-rose-400 text-white border-slate-900 focus-visible:ring-rose-500',
    outline:
      'bg-white hover:bg-slate-100 text-slate-900 border-slate-900 focus-visible:ring-slate-400',
    ghost:
      'bg-transparent hover:bg-slate-200/60 text-slate-800 border-transparent shadow-none active:translate-y-0 focus-visible:ring-slate-400',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};

