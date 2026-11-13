import React from 'react';

/**
 * Fondo ambiental para la estética glassmorfista.
 * Usa manchas translúcidas difusas con la paleta Emobi (amarillo neón + negro)
 * para que las superficies de cristal tengan algo que desenfocar.
 */
export const CubistGridPattern = ({ className = "opacity-60" }) => (
  <div className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
    <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emobi-yellow/40 blur-3xl animate-aurora" />
    <div className="absolute top-1/4 -right-24 w-[24rem] h-[24rem] rounded-full bg-emobi-yellow-warm/35 blur-3xl animate-aurora" style={{ animationDelay: '-6s' }} />
    <div className="absolute bottom-0 left-1/3 w-[26rem] h-[26rem] rounded-full bg-emobi-black/10 blur-3xl animate-aurora" style={{ animationDelay: '-11s' }} />

    {/* Retícula sutil, apenas perceptible tras el cristal */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="emobi-grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#111111" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#emobi-grid)" />
    </svg>
  </div>
);

export const CubistAccentShape = ({ size = 64, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="emobi-accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFE600" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#FFD000" stopOpacity="0.45" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#emobi-accent)" />
    <circle cx="32" cy="32" r="30" stroke="#111111" strokeOpacity="0.15" />
    <circle cx="23" cy="26" r="7" fill="#FFFFFF" fillOpacity="0.75" />
  </svg>
);

export const CubistStar = ({ size = 32, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M16 0L20 12L32 16L20 20L16 32L12 20L0 16L12 12L16 0Z"
      fill="#FFE600"
      fillOpacity="0.85"
      stroke="#111111"
      strokeOpacity="0.15"
      strokeWidth="1.5"
    />
  </svg>
);
