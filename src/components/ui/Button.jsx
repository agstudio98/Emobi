import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'dark' | 'outline' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseClasses = "inline-flex items-center justify-center font-bold font-space uppercase tracking-wider transition-all duration-200 select-none rounded-full backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0";

  const sizeClasses = {
    sm: "px-4 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-3",
  };

  const variantClasses = {
    primary: "bg-emobi-yellow/85 text-emobi-black border border-emobi-black/15 shadow-glow-yellow hover:bg-emobi-yellow",
    secondary: "bg-white/70 text-emobi-black border border-emobi-black/12 shadow-glass-sm hover:bg-white/90 hover:shadow-glass",
    dark: "bg-emobi-black/85 text-white border border-emobi-yellow/25 shadow-glass hover:bg-emobi-black",
    outline: "bg-white/25 text-emobi-black border border-emobi-black/20 hover:bg-emobi-yellow/45 hover:shadow-glass-yellow",
    ghost: "bg-transparent text-emobi-black hover:bg-emobi-yellow/25 border border-transparent",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? "w-4 h-4" : size === 'lg' ? "w-5 h-5" : "w-4 h-4"} />}
      {children}
    </button>
  );
};
