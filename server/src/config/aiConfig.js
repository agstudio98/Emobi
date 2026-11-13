import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cargar .env desde cwd, server/ y root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  host: process.env.HOST || '0.0.0.0',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    imageModel: 'dall-e-3',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    defaultVoiceId: process.env.ELEVENLABS_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM', // Rachel
    model: 'eleven_multilingual_v2',
  },
  replicate: {
    apiToken: process.env.REPLICATE_API_TOKEN || '',
  },
};

// Limpia y normaliza el valor de una clave
const cleanKey = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '""' || trimmed === "''") return '';
  return trimmed;
};

// Resuelve claves priorizando headers de la petición (si el usuario las configuró en la UI)
export const resolveKeys = (headers = {}) => {
  return {
    groqKey: cleanKey(headers['x-groq-key']) || config.groq.apiKey,
    groqModel: cleanKey(headers['x-groq-model']) || config.groq.model,
    geminiKey: cleanKey(headers['x-gemini-key']) || config.gemini.apiKey,
    openaiKey: cleanKey(headers['x-openai-key']) || config.openai.apiKey,
    elevenlabsKey: cleanKey(headers['x-elevenlabs-key']) || config.elevenlabs.apiKey,
    replicateToken: cleanKey(headers['x-replicate-token']) || config.replicate.apiToken,
  };
};

export const hasGroq = (key) => {
  const k = cleanKey(key) || config.groq.apiKey;
  return Boolean(k && k.length > 5);
};

export const hasGemini = (key) => {
  const k = cleanKey(key) || config.gemini.apiKey;
  return Boolean(k && k.length > 5);
};

export const hasOpenAI = (key) => {
  const k = cleanKey(key) || config.openai.apiKey;
  return Boolean(k && k.startsWith('sk-'));
};

export const hasElevenLabs = (key) => {
  const k = cleanKey(key) || config.elevenlabs.apiKey;
  return Boolean(k && k.length > 5);
};

export const hasReplicate = (key) => {
  const k = cleanKey(key) || config.replicate.apiToken;
  return Boolean(k && k.length > 5);
};
