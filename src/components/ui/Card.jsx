import React from 'react';

export const Card = ({
  children,
  className = '',
  variant = 'default', // 'default' | 'yellow' | 'dark' | 'outline'
  shadow = true,
  cutCorner = false,
  badge,
  ...props
}) => {
  const variantStyles = {
    default: 'glass text-emobi-black',
    yellow: 'glass-yellow text-emobi-black',
    dark: 'glass-dark text-white',
    outline: 'bg-white/25 backdrop-blur-md border border-emobi-black/15 text-emobi-black',
  };

  const shadowClass = shadow
    ? (variant === 'dark' ? 'shadow-glow-yellow' : 'shadow-glass')
    : 'shadow-inner-glass';

  // El radio redondeado es parte de la estética glassmorfista
  const radiusClass = cutCorner ? 'rounded-[2rem]' : 'rounded-3xl';

  return (
    <div
      className={`relative ${variantStyles[variant]} ${shadowClass} ${radiusClass} ${className}`}
      {...props}
    >
      {badge && (
        <div className="absolute -top-3 left-5 glass-yellow px-3 py-0.5 rounded-full text-xs font-bold font-unbounded uppercase tracking-wider shadow-glass-sm">
          {badge}
        </div>
      )}
      {children}
    </div>
  );
};
