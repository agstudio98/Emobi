/**
 * Configuración del avatar 3D procedural de Emobi.
 *
 * El modelo no depende de archivos .glb externos: se genera con geometría
 * de Three.js, por lo que siempre está disponible (web y Android).
 *
 * Todos los campos son serializables (números, strings, booleanos) para que
 * puedan viajar dentro del objeto del compañero y persistirse igual que el resto.
 */

export const DEFAULT_AVATAR_3D = {
  skinTone: '#E8B48C',      // Tono de piel
  hairColor: '#2B2118',     // Color de cabello
  hairStyle: 'corto',       // 'corto' | 'largo' | 'recogido' | 'calvo' | 'punk'
  eyeColor: '#4A3728',      // Color de ojos
  outfitColor: '#FFE600',   // Color de ropa (por defecto amarillo Emobi)
  accentColor: '#111111',   // Color de acento (detalles)
  faceShape: 0.5,           // 0 = alargada, 1 = redonda
  jawWidth: 0.5,            // 0 = fina, 1 = ancha
  eyeSize: 0.5,             // 0 = pequeños, 1 = grandes
  noseSize: 0.5,
  mouthWidth: 0.5,
  lipsFullness: 0.5,
  browThickness: 0.5,
  freckles: false,
  glasses: false,
  earrings: false,
  facialHair: false,
  expression: 'neutral',    // 'neutral' | 'sonriendo' | 'pensativo' | 'sorprendido'
};

/**
 * Paletas con la que el usuario elige de forma rápida.
 */
export const SKIN_TONES = ['#F7E0CE', '#E8B48C', '#D69A6A', '#B87A4B', '#8D5524', '#5C3A21', '#F0C8A8'];
export const HAIR_COLORS = ['#2B2118', '#111111', '#5A3A22', '#A9682F', '#D9B26A', '#C0392B', '#7C4DFF', '#3FA9F5', '#ECECEC'];
export const EYE_COLORS = ['#4A3728', '#2B2118', '#3E7CB1', '#4E9A51', '#8B6F47', '#7A7A7A'];
export const OUTFIT_COLORS = ['#FFE600', '#FFD000', '#111111', '#FFFFFF', '#4E9A51', '#3E7CB1', '#C0392B', '#7C4DFF'];

export const HAIR_STYLES = [
  { value: 'corto', label: 'Corto' },
  { value: 'largo', label: 'Largo' },
  { value: 'recogido', label: 'Recogido' },
  { value: 'punk', label: 'Punk' },
  { value: 'calvo', label: 'Calvo' },
];

export const EXPRESSIONS = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'sonriendo', label: 'Sonriendo' },
  { value: 'pensativo', label: 'Pensativo' },
  { value: 'sorprendido', label: 'Sorprendido' },
];

/**
 * Mezcla la configuración guardada con los valores por defecto, de forma que
 * compañeros antiguos (sin avatar3d) sigan funcionando.
 */
export const normalizeAvatar3D = (partial) => ({
  ...DEFAULT_AVATAR_3D,
  ...(partial || {}),
});

/**
 * Preset automático según género y arquetipo, para que un compañero nuevo
 * ya nazca con un rostro 3D coherente con su personalidad.
 */
export const presetForCompanion = ({ gender, archetype } = {}) => {
  const base = { ...DEFAULT_AVATAR_3D };

  // Ajustes por género
  if (gender === 'male') {
    base.hairStyle = 'corto';
    base.hairColor = '#2B2118';
    base.jawWidth = 0.68;
    base.faceShape = 0.42;
    base.facialHair = false;
  } else if (gender === 'non-binary') {
    base.hairStyle = 'punk';
    base.hairColor = '#7C4DFF';
    base.jawWidth = 0.5;
    base.faceShape = 0.5;
  } else {
    base.hairStyle = 'largo';
    base.hairColor = '#5A3A22';
    base.jawWidth = 0.4;
    base.faceShape = 0.6;
    base.eyeSize = 0.6;
  }

  // Ajustes por arquetipo
  switch (archetype) {
    case 'Arquitecta Sensorial':
      base.outfitColor = '#FFE600';
      base.glasses = true;
      break;
    case 'Filósofo Tecnológico':
      base.outfitColor = '#111111';
      base.glasses = true;
      base.facialHair = gender === 'male';
      break;
    case 'Espíritu Libre y Artista':
      base.hairStyle = 'punk';
      base.hairColor = '#C0392B';
      base.outfitColor = '#4E9A51';
      base.earrings = true;
      break;
    case 'Mentor Afectuoso':
      base.outfitColor = '#3E7CB1';
      base.hairStyle = gender === 'female' ? 'recogido' : 'corto';
      break;
    case 'Poeta Nocturno':
      base.hairColor = '#111111';
      base.outfitColor = '#7C4DFF';
      base.facialHair = gender === 'male';
      break;
    default:
      break;
  }

  return base;
};
