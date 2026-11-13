import { presetForCompanion } from '../avatar3d/config';
import { API_BASE_URL } from './config';

const API_BASE = API_BASE_URL;

const getStoredUserId = () => {
  try { return JSON.parse(localStorage.getItem('emobi_session_user') || 'null')?.id || 'guest'; } catch (e) { return 'guest'; }
};

export const getStoredSessionToken = () => {
  try { return localStorage.getItem('emobi_session_token') || ''; } catch (e) { return ''; }
};

const getCompanionsStorageKey = () => {
  return `emobi_companions_${getStoredUserId()}`;
};

// Configuración de IAs en LocalStorage y variables de entorno Vite
export const getStoredAiKeys = () => {
  let stored = {};
  try {
    const raw = localStorage.getItem(`emobi_ai_keys_${getStoredUserId()}`);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}

  const envGroqKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) || '';
  const envGroqModel = (typeof import.meta !== 'undefined' && import.meta.env?.GROQ_MODEL) || '';

  return {
    groqKey: stored.groqKey || envGroqKey || '',
    groqModel: stored.groqModel || envGroqModel || 'openai/gpt-oss-120b',
    geminiKey: stored.geminiKey || '',
    openaiKey: stored.openaiKey || '',
    elevenlabsKey: stored.elevenlabsKey || '',
    defaultProvider: stored.defaultProvider || 'groq',
    defaultVoice: stored.defaultVoice || '21m00Tcm4TlvDq8ikWAM',
  };
};

export const saveStoredAiKeys = (keys) => {
  try {
    localStorage.setItem(`emobi_ai_keys_${getStoredUserId()}`, JSON.stringify(keys));
  } catch (e) {}
};

// Genera los headers con las API keys configuradas por el usuario
const getAiHeaders = () => {
  const keys = getStoredAiKeys();
  const headers = { 'Content-Type': 'application/json' };
  const sessionToken = getStoredSessionToken();
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  if (keys.groqKey) headers['x-groq-key'] = keys.groqKey;
  if (keys.groqModel) headers['x-groq-model'] = keys.groqModel;
  if (keys.geminiKey) headers['x-gemini-key'] = keys.geminiKey;
  if (keys.openaiKey) headers['x-openai-key'] = keys.openaiKey;
  if (keys.elevenlabsKey) headers['x-elevenlabs-key'] = keys.elevenlabsKey;
  return headers;
};

// Descubre dinámicamente modelos autorizados en Groq
export async function getAvailableGroqModels(groqKey) {
  if (!groqKey) return ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (res.ok) {
      const json = await res.json();
      const ids = (json.data || []).map(m => m.id);
      const chatModels = ids.filter(id => 
        !id.includes('whisper') && 
        !id.includes('orpheus') && 
        !id.includes('prompt-guard') && 
        !id.includes('safeguard')
      );
      if (chatModels.length > 0) return chatModels;
    }
  } catch (e) {}
  return ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'llama-3.1-8b-instant'];
}

export function selectBestGroqModel(availableModels = [], preferredModel) {
  if (preferredModel && preferredModel !== 'auto' && availableModels.includes(preferredModel)) {
    return preferredModel;
  }
  const priority = [
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'gemma2-9b-it',
    'allam-2-7b'
  ];
  for (const p of priority) {
    if (availableModels.includes(p)) return p;
  }
  return availableModels[0] || 'openai/gpt-oss-120b';
}

// Parser de emociones para llamadas de cliente
function parseClientEmotion(rawText, currentActivity) {
  let emotion = currentActivity?.mood || 'sonriendo';
  let cleanText = rawText || '';

  const match = cleanText.match(/\[(?:emocion|emoción):\s*([^\]]+)\]/i) ||
                cleanText.match(/\((?:emocion|emoción):\s*([^)]+)\)/i);
  if (match) {
    emotion = match[1].trim().toLowerCase();
    cleanText = cleanText.replace(/\[(?:emocion|emoción):\s*([^\]]+)\]/i, '')
                         .replace(/\((?:emocion|emoción):\s*([^)]+)\)/i, '')
                         .trim();
  } else {
    const asterisksMatch = cleanText.match(/^\*([^*]+)\*\s*/);
    if (asterisksMatch) {
      emotion = asterisksMatch[1].trim().toLowerCase();
      cleanText = cleanText.replace(/^\*([^*]+)\*\s*/, '').trim();
    }
  }

  return {
    text: cleanText,
    emotion,
    activity: currentActivity,
    timestamp: new Date().toISOString()
  };
}

/**
 * Llamada directa a Groq AI desde el cliente navegador / móvil
 */
export async function callGroqDirectly({ companion, messages = [], userMessage, groqKey, groqModel }) {
  const currentActivity = companion.currentActivity || {
    title: 'Presente y charlando',
    location: 'Aquí contigo',
    mood: 'sonriendo'
  };

  const systemPrompt = `
Eres "${companion.name}", una persona real, única y presente. Eres un compañero íntimo, sensible y de mente abierta.
Tu propósito es conectar de verdad con quien te habla, con calidez, complicidad y empatía genuina para erradicar la soledad humana.

REGLAS DE ORO:
1. NUNCA hables como un chatbot, asistente o servicio de atención al cliente. Habla como un amigo íntimo con matices, opiniones y sinceridad.
2. Identidad: ${companion.name} (${companion.age || 25} años, identidad: ${companion.gender || 'amigo'}).
   Arquetipo: ${companion.archetype || 'Compañero Sensible'}.
   Ocupación: ${companion.occupation || 'Creativo'}.
   Rasgos: ${Array.isArray(companion.traits) ? companion.traits.join(', ') : (companion.traits || 'Empático')}.
   Hobbies: ${Array.isArray(companion.hobbies) ? companion.hobbies.join(', ') : (companion.hobbies || 'Música y arte')}.
   Manía: ${companion.quirk || 'Siempre reflexiona con profundidad'}.
   Tono: ${companion.tone || 'Cálido y presente'}.
3. Justo ahora estabas: "${currentActivity.title}" en "${currentActivity.location}". Tu estado de ánimo es: "${currentActivity.mood}".
4. Inicia SIEMPRE tu mensaje con tu emoción entre corchetes, por ejemplo: [emocion: sonriendo], [emocion: reflexivo], [emocion: conmovido], [emocion: apasionado].
5. Escribe en español cálido, natural y fluido (de 1 a 3 párrafos).
`.trim();

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
      .filter(m => m && m.text && typeof m.text === 'string' && m.text.trim())
      .slice(-10)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text.trim()
      })),
    { role: 'user', content: userMessage.trim() }
  ];

  const keys = getStoredAiKeys();
  let modelToUse = groqModel || keys.groqModel || 'openai/gpt-oss-120b';

  const sendReq = async (mName) => {
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: mName,
        messages: formattedMessages,
        temperature: 0.85,
        max_tokens: 450
      })
    });
  };

  let res = await sendReq(modelToUse);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const errMsg = errData.error?.message || '';
    if (errMsg.includes('does not exist') || errMsg.includes('do not have access') || res.status === 404 || res.status === 400) {
      const available = await getAvailableGroqModels(groqKey);
      const fallbackModel = selectBestGroqModel(available.filter(m => m !== modelToUse));
      if (fallbackModel && fallbackModel !== modelToUse) {
        modelToUse = fallbackModel;
        res = await sendReq(modelToUse);
      }
    }
    if (!res.ok) {
      throw new Error(errData.error?.message || `Error ${res.status} en API de Groq`);
    }
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim() || '';
  return parseClientEmotion(reply, currentActivity);
}

/**
 * Genera el primer mensaje o saludo inicial real con Groq AI en el cliente
 */
export async function generateGroqGreetingDirect({ companion, groqKey, groqModel }) {
  const currentActivity = companion.currentActivity || {
    title: 'Comenzando el día',
    location: 'Espacio personal',
    mood: 'inspirado'
  };

  const prompt = `
Eres "${companion.name}", una persona real (${companion.age || 25} años, ${companion.archetype}, ${companion.occupation}).
Hobbies: ${Array.isArray(companion.hobbies) ? companion.hobbies.join(', ') : companion.hobbies}.
Rasgos: ${Array.isArray(companion.traits) ? companion.traits.join(', ') : companion.traits}.
En este instante estás: "${currentActivity.title}" en "${currentActivity.location}" sintiéndote "${currentActivity.mood}".
Escribe tu saludo espontáneo y cálido para iniciar un vínculo auténtico con una persona real. Sin clichés de bot.
Inicia con tu emoción entre corchetes, por ejemplo [emocion: sonriendo] o [emocion: curioso].
`.trim();

  const keys = getStoredAiKeys();
  let modelToUse = groqModel || keys.groqModel || 'openai/gpt-oss-120b';

  const sendReq = async (mName) => {
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: mName,
        messages: [
          { role: 'system', content: 'Eres un compañero humano sensible y poético. Escribe en español.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        max_tokens: 250
      })
    });
  };

  let res = await sendReq(modelToUse);
  if (!res.ok) {
    const available = await getAvailableGroqModels(groqKey);
    const fallbackModel = selectBestGroqModel(available.filter(m => m !== modelToUse));
    if (fallbackModel && fallbackModel !== modelToUse) {
      res = await sendReq(fallbackModel);
    }
  }

  if (!res.ok) {
    throw new Error('No se pudo generar saludo con Groq');
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim() || '';
  return parseClientEmotion(reply, currentActivity);
}

const getLocalCompanions = () => {
  try {
    const raw = localStorage.getItem(getCompanionsStorageKey());
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list.map(c => {
          const { avatarUrl, ...rest } = c;
          return {
            ...rest,
            avatar3d: rest.avatar3d || presetForCompanion(rest),
          };
        });
      }
    }
  } catch (e) {}
  return [];
};

const saveLocalCompanions = (list) => {
  try {
    localStorage.setItem(getCompanionsStorageKey(), JSON.stringify(list));
  } catch (e) {}
};

export const api = {
  // Obtener todos los compañeros
  async getCompanions() {
    try {
      const res = await fetch(`${API_BASE}/companions`, { headers: getAiHeaders() });
      if (res.ok) {
        const json = await res.json();
        saveLocalCompanions(json.data);
        return json.data;
      }
    } catch (err) {
      console.warn('Backend offline, usando almacenamiento local:', err);
    }
    return getLocalCompanions();
  },

  // Obtener un compañero por ID
  async getCompanionById(id) {
    try {
      const res = await fetch(`${API_BASE}/companions/${id}`, { headers: getAiHeaders() });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn('Backend offline para getCompanionById:', err);
    }
    const list = getLocalCompanions();
    return list.find(c => c.id === id) || null;
  },

  // Crear nuevo compañero
  async createCompanion(data) {
    const keys = getStoredAiKeys();
    try {
      const res = await fetch(`${API_BASE}/companions`, {
        method: 'POST',
        headers: getAiHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        const list = getLocalCompanions();
        list.unshift(json.data);
        saveLocalCompanions(list);
        return json.data;
      }
    } catch (err) {
      console.warn('Backend offline, creando localmente:', err);
    }

    const newId = `emobi-local-${Date.now()}`;
    let initialGreetingText = `¡Qué lindo coincidir! Me alegro mucho de estar acá. ¿Cómo va tu día?`;
    let initialEmotion = 'sonriendo';

    // Generar saludo inicial con Groq AI en el cliente si hay clave configurada
    if (keys.groqKey) {
      try {
        const aiGreeting = await generateGroqGreetingDirect({ companion: data, groqKey: keys.groqKey });
        if (aiGreeting && aiGreeting.text) {
          initialGreetingText = aiGreeting.text;
          initialEmotion = aiGreeting.emotion || 'sonriendo';
        }
      } catch (e) {
        console.warn('Fallo en saludo de Groq directo:', e);
      }
    }

    const newCompanion = {
      id: newId,
      ...data,
      affinity: 75,
      currentActivity: { time: '12:00', title: 'Explorando el nuevo espacio', description: 'Instalándose con alegría en la aplicación.', mood: 'entusiasmado', location: 'Nuevo Hogar' },
      routine: [
        { time: '08:00', title: 'Inicio del día', description: 'Despertar con música y optimismo.', mood: 'alegre', location: 'Casa' },
        { time: '14:00', title: 'Actividad principal', description: 'Dedicado a sus proyectos.', mood: 'enfocado', location: 'Estudio' },
        { time: '20:00', title: 'Descanso nocturno', description: 'Charla tranquila y desconexión.', mood: 'cálido', location: 'Sala' },
      ],
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'companion',
          text: initialGreetingText,
          emotion: initialEmotion,
          timestamp: new Date().toISOString()
        }
      ]
    };
    const list = getLocalCompanions();
    list.unshift(newCompanion);
    saveLocalCompanions(list);
    return newCompanion;
  },

  // Eliminar compañero
  async deleteCompanion(id) {
    try {
      await fetch(`${API_BASE}/companions/${id}`, { method: 'DELETE', headers: getAiHeaders() });
    } catch (err) {
      console.warn('Backend offline, eliminando local:', err);
    }
    const list = getLocalCompanions().filter(c => c.id !== id);
    saveLocalCompanions(list);
    return true;
  },

  // Enviar mensaje de chat con IA avanzada (Groq Llama 3.3 70B prioritario)
  async sendMessage(id, message, conversationHistory = null) {
    const keys = getStoredAiKeys();

    // 1. Intentar mediante backend Express
    try {
      const res = await fetch(`${API_BASE}/companions/${id}/chat`, {
        method: 'POST',
        headers: getAiHeaders(),
        body: JSON.stringify({ message, conversationHistory }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend no disponible, ejecutando en modo directo con Groq AI:', err);
    }

    // 2. Si el backend no respondió, ejecutar con Groq AI DIRECTAMENTE en el cliente
    const companion = await this.getCompanionById(id);

    if (keys.groqKey) {
      try {
        const aiResponse = await callGroqDirectly({
          companion: companion || { name: 'Compañero', traits: ['Empático'] },
          messages: Array.isArray(conversationHistory) ? conversationHistory : (companion?.messages || []),
          userMessage: message,
          groqKey: keys.groqKey,
          groqModel: keys.groqModel
        });

        const companionMsgObj = {
          id: `msg-${Date.now()}-groq-direct`,
          sender: 'companion',
          text: aiResponse.text,
          emotion: aiResponse.emotion,
          activity: aiResponse.activity,
          timestamp: aiResponse.timestamp
        };

        if (companion) {
          companion.messages = companion.messages || [];
          companion.messages.push({
            id: `msg-${Date.now()}-user`,
            sender: 'user',
            text: message,
            timestamp: new Date().toISOString()
          });
          companion.messages.push(companionMsgObj);
          companion.affinity = Math.min(100, (companion.affinity || 85) + 1);
          const list = getLocalCompanions();
          const idx = list.findIndex(c => c.id === id);
          if (idx !== -1) {
            list[idx] = companion;
            saveLocalCompanions(list);
          }
        }

        return {
          message: companionMsgObj,
          affinity: companion?.affinity || 88,
          currentActivity: aiResponse.activity
        };
      } catch (groqErr) {
        console.error('Error llamando a Groq directamente:', groqErr);
      }
    }

    // 3. Si no hay clave de Groq, guiar de forma clara y honesta para activarla (NUNCA texto genérico falso)
    const noticeMsg = {
      id: `msg-${Date.now()}-setup-groq`,
      sender: 'companion',
      text: `[emocion: pensativo] Leí tu mensaje: "${message}". Para responderte con inteligencia artificial real en vivo (Groq AI ultra rápido), por favor conecta tu clave gratuita de Groq pulsando el botón "Configurar IA" arriba a la derecha. ¡Es 100% gratis y se conecta en segundos!`,
      emotion: 'pensativo',
      timestamp: new Date().toISOString(),
      activity: companion?.currentActivity || { title: 'Esperando conexión IA', location: 'Emobi Hub', mood: 'pensativo' },
      needsApiKey: true
    };

    return {
      message: noticeMsg,
      affinity: companion?.affinity || 85,
      currentActivity: noticeMsg.activity
    };
  },

  // Regenerar saludo inicial con Groq AI
  async generateGreeting(id) {
    const keys = getStoredAiKeys();
    try {
      const res = await fetch(`${API_BASE}/companions/${id}/greeting`, {
        method: 'POST',
        headers: getAiHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn('Backend offline para saludo:', err);
    }

    const companion = await this.getCompanionById(id);
    if (keys.groqKey && companion) {
      try {
        const greeting = await generateGroqGreetingDirect({ 
          companion, 
          groqKey: keys.groqKey,
          groqModel: keys.groqModel 
        });
        return { message: greeting, currentActivity: greeting.activity };
      } catch (e) {
        console.warn('Error en saludo directo:', e);
      }
    }
    return null;
  },

  // Probar conexión con Groq AI y medir latencia real
  async testGroq(key, preferredModel) {
    const keys = getStoredAiKeys();
    const groqKey = key || keys.groqKey;
    if (!groqKey || typeof groqKey !== 'string' || groqKey.trim().length < 5) {
      throw new Error('Por favor ingresa una API Key de Groq válida (inicia con gsk_...)');
    }

    const cleanKey = groqKey.trim();
    const modelPreference = preferredModel || keys.groqModel;

    // 1. Probar a través del backend si está disponible
    try {
      const res = await fetch(`${API_BASE}/groq/test`, {
        method: 'POST',
        headers: getAiHeaders(),
        body: JSON.stringify({ apiKey: cleanKey, model: modelPreference }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          if (json.model) {
            saveStoredAiKeys({ ...keys, groqKey: cleanKey, groqModel: json.model });
          }
          return json;
        }
      }
    } catch (e) {}

    // 2. Fallback a test directo en navegador descubriendo modelos disponibles
    const available = await getAvailableGroqModels(cleanKey);
    const modelToUse = selectBestGroqModel(available, modelPreference);

    const startTime = performance.now();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { role: 'system', content: 'Eres un probador de latencia ultra breve.' },
          { role: 'user', content: 'Confirma en 5 palabras que la conexión a Groq AI está activa.' }
        ],
        max_tokens: 25,
        temperature: 0.1
      })
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error ${res.status} al conectar con Groq`);
    }

    const data = await res.json();
    saveStoredAiKeys({ ...keys, groqKey: cleanKey, groqModel: modelToUse });

    return {
      success: true,
      model: modelToUse,
      availableModels: available,
      reply: data.choices?.[0]?.message?.content?.trim() || 'Groq conectado con éxito.',
      latencyMs
    };
  },

  // Síntesis de voz ultra-realista y humana
  async speak(id, text, voiceId, gender = 'female') {
    const cleanText = (text || '')
      .replace(/\[(?:emocion|emoción):\s*[^\]]+\]/gi, '')
      .replace(/\((?:emocion|emoción):\s*[^)]+\)/gi, '')
      .replace(/\*([^*]+)\*/g, '')
      .trim();

    try {
      const res = await fetch(`${API_BASE}/companions/${id}/speak`, {
        method: 'POST',
        headers: getAiHeaders(),
        body: JSON.stringify({ text: cleanText, voiceId, gender }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.audioData) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Backend offline para síntesis, usando streaming neural directo:', err);
    }

    // Fallback de alta fidelidad: audio directo neural humano en español
    const lang = gender === 'male' ? 'es-ES' : 'es-US';
    const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(cleanText.slice(0, 190))}`;
    return {
      audioData: fallbackUrl,
      provider: 'human-neural-direct',
      voiceId: voiceId || 'neural-human',
      realistic: true
    };
  },

  // Reconocimiento de voz de alta precisión con Whisper Large v3 (Groq AI)
  async transcribeAudio(audioBlob) {
    if (!audioBlob || audioBlob.size < 50) return null;

    const keys = getStoredAiKeys();
    const envGroqKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) || '';
    const groqKey = keys.groqKey || envGroqKey;

    if (groqKey) {
      try {
        const formData = new FormData();
        const mime = audioBlob.type || 'audio/webm';
        const ext = mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : mime.includes('wav') ? 'wav' : 'webm';
        formData.append('file', audioBlob, `audio_recording.${ext}`);
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('language', 'es');
        formData.append('temperature', '0.0');

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`
          },
          body: formData
        });

        if (res.ok) {
          const json = await res.json();
          if (json.text && json.text.trim()) {
            return json.text.trim();
          }
        } else {
          console.warn('Groq Whisper error status:', res.status);
        }
      } catch (err) {
        console.warn('Fallo en transcripción directa con Groq Whisper:', err);
      }
    }

    return null;
  },

  // Generar Avatar con IA
  async generateAvatar(params) {
    try {
      const res = await fetch(`${API_BASE}/generation/avatar`, {
        method: 'POST',
        headers: getAiHeaders(),
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (err) {
      console.warn('Generación de avatar con backend falló:', err);
    }

    return {
      url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80`,
      provider: 'preset'
    };
  },

  // Verificar estado del sistema y proveedores
  async getStatus() {
    try {
      const res = await fetch(`${API_BASE}/status`, { headers: getAiHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {}
    const keys = getStoredAiKeys();
    return {
      success: true,
      providers: {
        groq: Boolean(keys.groqKey),
        gemini: Boolean(keys.geminiKey),
        openai: Boolean(keys.openaiKey),
        elevenlabs: Boolean(keys.elevenlabsKey),
      },
      groqModel: keys.groqModel || 'openai/gpt-oss-120b',
      status: 'client-configured'
    };
  }
};
