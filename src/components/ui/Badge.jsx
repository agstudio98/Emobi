import React from 'react';

export const Badge = ({
  children,
  variant = 'yellow', // 'yellow' | 'black' | 'white' | 'gray' | 'neon'
  size = 'sm',        // 'sm' | 'md'
  className = '',
  icon: Icon,
  cut = false,
}) => {
  const base = 'inline-flex items-center font-bold font-unbounded tracking-wider uppercase select-none rounded-full backdrop-blur-md border';

  const variantStyles = {
    yellow: 'bg-emobi-yellow/70 text-emobi-black border-emobi-black/10 shadow-glass-sm',
    black: 'bg-emobi-black/85 text-white border-black/20 shadow-glass-sm',
    white: 'bg-white/70 text-emobi-black border-emobi-black/10 shadow-glass-sm',
    gray: 'bg-white/45 text-emobi-black/85 border-emobi-black/10',
    neon: 'bg-emobi-yellow/80 text-emobi-black border-emobi-black/15 shadow-glow-yellow',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[11px] gap-1',
    md: 'px-3.5 py-1 text-xs gap-1.5',
  };

  return (
    <span className={`${base} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};
