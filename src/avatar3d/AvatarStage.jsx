import React from 'react';

/**
 * Escenario 3D global (no-op para retrocompatibilidad con App.jsx).
 * Los avatares ahora gestionan su propio lienzo WebGL encapsulado con recorte
 * circular nativo, iluminación de estudio propia y cámara retratista dedicada,
 * eliminando solapamientos de z-index y artefactos rectangulares en las burbujas.
 */
export const AvatarStage = () => null;

export default AvatarStage;
