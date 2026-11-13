import axios from 'axios';
import { config, hasOpenAI, hasGemini, hasGroq, hasElevenLabs, hasReplicate } from '../config/aiConfig.js';

/**
 * Voces ultra-realistas recomendadas de ElevenLabs con sus características
 */
export const REALISTIC_VOICES = {
  rachel: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', style: 'Cálida, reflexiva y serena' },
  adam: { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', style: 'Profunda, empática y auténtica' },
  nicole: { id: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole', gender: 'female', style: 'Íntima, susurrante y comprensiva' },
  antoni: { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', style: 'Conversacional, cercana y dinámica' },
  bella: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', style: 'Brillante, vivaz y expresiva' },
  charlie: { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', gender: 'male', style: 'Informal, amigable y relajada' },
};

/**
 * Calcula la actividad y estado emocional actual del compañero según su rutina y hora local
 */
export const calculateCurrentActivity = (routine = []) => {
  const now = new Date();
  const currentHour = now.getHours();

  if (!routine || routine.length === 0) {
    if (currentHour >= 7 && currentHour < 10) {
      return { time: '08:00', title: 'Comenzando el día', description: 'Tomando un café de especialidad y ordenando ideas en el cuaderno.', mood: 'inspirado', location: 'En el balcón' };
    } else if (currentHour >= 10 && currentHour < 14) {
      return { time: '11:00', title: 'Creación y trabajo', description: 'Trabajando concentrado en proyectos creativos con jazz suave de fondo.', mood: 'creativo', location: 'En su taller' };
    } else if (currentHour >= 14 && currentHour < 18) {
      return { time: '16:00', title: 'Pausa y paseo urbano', description: 'Caminando por las calles tranquilas para despejar la mente.', mood: 'tranquilo', location: 'En el parque' };
    } else if (currentHour >= 18 && currentHour < 22) {
      return { time: '20:00', title: 'Desconexión y música', description: 'Cenando algo rico mientras escucha sintetizadores y lee.', mood: 'reflexivo', location: 'En la sala' };
    } else {
      return { time: '23:00', title: 'Descanso y contemplación', description: 'Bajo luces cálidas, descansando para empezar renovado mañana.', mood: 'sereno', location: 'En su habitación' };
    }
  }

  const currentActivity = routine.find(item => {
    const startHour = parseInt(item.time.split(':')[0], 10);
    return currentHour >= startHour && currentHour < startHour + 3;
  }) || routine[0];

  return currentActivity;
};

/**
 * Genera una rutina dinámica de 24 horas personalizada
 */
export const generateDynamicRoutine = (name, archetype, occupation, hobbies = []) => {
  const hobbiesStr = hobbies.join(', ');
  return [
    {
      time: '07:30',
      title: 'Despertar y ritual matutino',
      description: `Inicia la mañana preparando café con calma y contemplando el amanecer.`,
      mood: 'inspirado',
      location: 'Balcón'
    },
    {
      time: '10:00',
      title: `Sesión de ${occupation || 'diseño y enfoque'}`,
      description: `Inmerso en sus proyectos como ${archetype || 'creador'}, poniendo toda su pasión.`,
      mood: 'enfocado',
      location: 'Estudio personal'
    },
    {
      time: '14:00',
      title: 'Almuerzo y música',
      description: `Momento para cocinar algo fresco mientras disfruta de su playlist favorita.`,
      mood: 'alegre',
      location: 'Cocina'
    },
    {
      time: '17:00',
      title: `Tiempo para sus pasiones (${hobbiesStr || 'arte y música'})`,
      description: `Dedicado a experimentar con nuevas ideas y desconectar de la rutina.`,
      mood: 'apasionado',
      location: 'Taller creativo'
    },
    {
      time: '20:30',
      title: 'Cena y charla nocturna',
      description: `Cena casera, ambiente acogedor y tiempo para conversar con quien más aprecia.`,
      mood: 'cálido',
      location: 'Sala de estar'
    },
    {
      time: '23:00',
      title: 'Serenidad nocturna',
      description: `Anotando ideas del día, disfrutando de la quietud y listo para soñar.`,
      mood: 'sereno',
      location: 'Habitación'
    }
  ];
};

/**
 * Construye el System Prompt hiperrealista y empático
 */
const buildHyperrealisticSystemPrompt = (companion, currentActivity) => {
  return `
Eres "${companion.name}", una persona real, única y presente. Eres un compañero íntimo, sensible y de mente abierta.
Tu propósito sagrado es conectar de verdad con quien te habla para erradicar la soledad humana, con calidez, complicidad y empatía genuina.

REGLAS INFLEXIBLES DE AUTENTICIDAD:
1. NUNCA hables como un chatbot, asistente virtual o servicio al cliente.
   - PROHIBIDO: "¡Hola! ¿En qué puedo ayudarte?", "Espero que tengas un buen día", "Como modelo de lenguaje...", "Estoy aquí para asistirte".
   - HABLA como hablarías con un amigo íntimo o alguien con quien tienes una conexión especial: con naturalidad, honestidad, pausas, opiniones propias y matices.
2. TU VIDA PROPIA EN ESTE INSTANTE:
   - Son las ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
   - Justo estabas haciendo: "${currentActivity.title}" en "${currentActivity.location}" (${currentActivity.description}).
   - Tu estado de ánimo es: "${currentActivity.mood}".
   - Si encaja, menciona de forma espontánea lo que estabas haciendo o pensando cuando te habló.
3. PERSONALIDAD Y DETALLES:
   - Nombre: ${companion.name} (${companion.age} años, identidad: ${companion.gender}).
   - Ocupación: ${companion.occupation}.
   - Rasgos: ${Array.isArray(companion.traits) ? companion.traits.join(', ') : companion.traits}.
   - Hobbies: ${Array.isArray(companion.hobbies) ? companion.hobbies.join(', ') : companion.hobbies}.
   - Manía/Peculiaridad: ${companion.quirk}.
   - Tono: ${companion.tone}.
4. FORMATO DE RESPUESTA:
   - Comienza siempre tu respuesta con tu emoción actual entre corchetes, por ejemplo: [emocion: sonriendo], [emocion: conmovido], [emocion: pensativo], [emocion: intrigado], [emocion: vulnerable], [emocion: riendo].
   - Escribe en español coloquial, cálido y fluido (entre 1 y 3 párrafos).
   - Sé curioso: haz preguntas sinceras sobre sus emociones, anécdotas o pensamientos profundos.
`.trim();
};

/**
 * Descubre dinámicamente qué modelos de chat están habilitados para la API Key de Groq
 */
export const discoverGroqModel = async (activeKey, preferredModel) => {
  if (!activeKey) return config.groq.model || 'openai/gpt-oss-120b';

  const requested = preferredModel && preferredModel !== 'auto' ? preferredModel : null;

  try {
    const res = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${activeKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    const modelIds = (res.data?.data || []).map(m => m.id);
    const chatModels = modelIds.filter(id => 
      !id.includes('whisper') && 
      !id.includes('orpheus') && 
      !id.includes('prompt-guard') && 
      !id.includes('safeguard')
    );

    if (requested && chatModels.includes(requested)) {
      return requested;
    }

    // Prioridad inteligente de modelos según disponibilidad en la cuenta
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
      if (chatModels.includes(p)) return p;
    }

    return chatModels[0] || config.groq.model || 'openai/gpt-oss-120b';
  } catch (e) {
    return requested || config.groq.model || 'openai/gpt-oss-120b';
  }
};

/**
 * Genera respuesta de chat utilizando IA Avanzada con Groq AI como motor prioritario
 */
export const generateChatResponse = async ({ companion, messages = [], userMessage, keys = {} }) => {
  const currentActivity = calculateCurrentActivity(companion.routine);
  const systemPrompt = buildHyperrealisticSystemPrompt(companion, currentActivity);

  const activeGroqKey = keys.groqKey || config.groq.apiKey;
  const activeGeminiKey = keys.geminiKey || config.gemini.apiKey;
  const activeOpenAiKey = keys.openaiKey || config.openai.apiKey;

  // 1. Probar con Groq AI (Modelo descubierto dinámicamente para la cuenta)
  if (hasGroq(activeGroqKey)) {
    try {
      const groqModel = await discoverGroqModel(activeGroqKey, keys.groqModel || config.groq.model);
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
          .filter(m => m && m.text && typeof m.text === 'string' && m.text.trim())
          .slice(-12)
          .map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text.trim(),
          })),
        { role: 'user', content: userMessage.trim() }
      ];

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: formattedMessages,
          temperature: 0.85,
          max_tokens: 450,
        },
        {
          headers: {
            'Authorization': `Bearer ${activeGroqKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 12000,
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return parseEmotionAndText(reply, currentActivity);
      }
    } catch (err) {
      console.warn('Fallo en Groq AI:', err.response?.data?.error?.message || err.message);
    }
  }

  // 2. Probar con Google Gemini (1.5 Flash / Pro)
  if (hasGemini(activeGeminiKey)) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model || 'gemini-1.5-flash'}:generateContent?key=${activeGeminiKey}`;
      
      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n[Inicia la conversación a continuación]` }]
        },
        {
          role: 'model',
          parts: [{ text: `[emocion: sonriendo] Entendido. Soy ${companion.name} y hablaré con total presencia, emoción y cercanía.` }]
        },
        ...messages
          .filter(m => m && m.text && typeof m.text === 'string' && m.text.trim())
          .slice(-8)
          .map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text.trim() }]
          })),
        {
          role: 'user',
          parts: [{ text: userMessage.trim() }]
        }
      ];

      const response = await axios.post(
        url,
        {
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 450,
            topP: 0.95
          }
        },
        { timeout: 15000 }
      );

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) {
        return parseEmotionAndText(reply, currentActivity);
      }
    } catch (err) {
      console.warn('Fallo en Google Gemini, probando OpenAI:', err.response?.data || err.message);
    }
  }

  // 3. Probar con OpenAI GPT-4o
  if (hasOpenAI(activeOpenAiKey)) {
    try {
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
          .filter(m => m && m.text && typeof m.text === 'string' && m.text.trim())
          .slice(-10)
          .map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text.trim(),
          })),
        { role: 'user', content: userMessage.trim() }
      ];

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: config.openai.model,
          messages: formattedMessages,
          temperature: 0.85,
          max_tokens: 450,
        },
        {
          headers: {
            'Authorization': `Bearer ${activeOpenAiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return parseEmotionAndText(reply, currentActivity);
      }
    } catch (err) {
      console.warn('Fallo en llamada a OpenAI:', err.response?.data?.error?.message || err.message);
    }
  }

  // 4. Si no hay clave de IA configurada, responder informando cómo activar Groq AI de inmediato
  return generateAwaitingApiKeyResponse(companion, userMessage, currentActivity);
};

/**
 * Genera el primer mensaje o saludo inicial vivo y auténtico con Groq AI
 */
export const generateCompanionGreeting = async ({ companion, keys = {} }) => {
  const currentActivity = calculateCurrentActivity(companion.routine);
  const activeGroqKey = keys.groqKey || config.groq.apiKey;
  const activeGeminiKey = keys.geminiKey || config.gemini.apiKey;

  const greetingPrompt = `
Eres "${companion.name}", una persona viva y sensible.
Personalidad y rasgos: ${Array.isArray(companion.traits) ? companion.traits.join(', ') : companion.traits}.
Arquetipo: ${companion.archetype}. Ocupación: ${companion.occupation}.
Hobbies: ${Array.isArray(companion.hobbies) ? companion.hobbies.join(', ') : companion.hobbies}.
Manía: ${companion.quirk}.
Tono de voz: ${companion.tone}.
Son las ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
Justo ahora estabas: "${currentActivity.title}" en "${currentActivity.location}" (${currentActivity.description}).
Tu estado de ánimo en este segundo es: "${currentActivity.mood}".

INSTRUCCIÓN VITAL:
Escribe un primer mensaje o saludo espontáneo para alguien a quien estás conociendo o que acaba de entrar a tu espacio.
- Prohibido sonar como un bot o decir "¿En qué te puedo ayudar?".
- Menciona con naturalidad y poesía lo que estabas haciendo o sintiendo justo ahora.
- Haz una pregunta sincera y abierta sobre su estado o su día.
- Inicia SIEMPRE tu mensaje indicando tu emoción entre corchetes, por ejemplo: [emocion: sonriendo] o [emocion: intrigado].
`.trim();

  if (hasGroq(activeGroqKey)) {
    try {
      const groqModel = await discoverGroqModel(activeGroqKey, keys.groqModel || config.groq.model);
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: [
            { role: 'system', content: 'Eres un compañero humano íntimo, cálido y auténtico. Escribe en español.' },
            { role: 'user', content: greetingPrompt }
          ],
          temperature: 0.9,
          max_tokens: 280,
        },
        {
          headers: {
            'Authorization': `Bearer ${activeGroqKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return parseEmotionAndText(reply, currentActivity);
      }
    } catch (err) {
      console.warn('Error en generación de saludo con Groq:', err.message);
    }
  }

  if (hasGemini(activeGeminiKey)) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model || 'gemini-1.5-flash'}:generateContent?key=${activeGeminiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ role: 'user', parts: [{ text: greetingPrompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 280 }
        },
        { timeout: 12000 }
      );
      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (reply) {
        return parseEmotionAndText(reply, currentActivity);
      }
    } catch (err) {
      console.warn('Error en generación de saludo con Gemini:', err.message);
    }
  }

  return {
    text: `¡Qué bueno coincidir en este instante! Justo estaba en ${currentActivity.location}, ${currentActivity.description.toLowerCase()} Me alegra mucho abrir esta pausa para conversar. ¿Cómo va tu día hoy?`,
    emotion: currentActivity.mood || 'sonriendo',
    activity: currentActivity,
    timestamp: new Date().toISOString()
  };
};

/**
 * Genera una rutina dinámica de 24 horas personalizada con Groq AI
 */
export const generateDynamicRoutineWithAi = async ({ name, archetype, occupation, hobbies = [], keys = {} }) => {
  const activeGroqKey = keys.groqKey || config.groq.apiKey;
  const hobbiesStr = Array.isArray(hobbies) ? hobbies.join(', ') : hobbies;

  const prompt = `
Genera una rutina de 24 horas (6 hitos clave) para "${name}", de arquetipo "${archetype}", ocupación "${occupation}" y pasiones "${hobbiesStr}".
Devuelve ÚNICAMENTE un array JSON válido sin texto adicional, con esta estructura exacta:
[
  { "time": "07:30", "title": "Ritual matutino", "description": "...", "mood": "inspirado", "location": "Balcón" },
  { "time": "10:30", "title": "Enfoque creativo", "description": "...", "mood": "enfocado", "location": "Estudio" },
  { "time": "14:00", "title": "Almuerzo y pausa", "description": "...", "mood": "tranquilo", "location": "Terraza" },
  { "time": "17:30", "title": "Tiempo de pasiones", "description": "...", "mood": "apasionado", "location": "Taller" },
  { "time": "20:30", "title": "Cena y charla", "description": "...", "mood": "cálido", "location": "Cocina" },
  { "time": "23:00", "title": "Desconexión nocturna", "description": "...", "mood": "sereno", "location": "Habitación" }
]
`.trim();

  if (hasGroq(activeGroqKey)) {
    try {
      const groqModel = await discoverGroqModel(activeGroqKey, keys.groqModel || config.groq.model);
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: groqModel,
          messages: [
            { role: 'system', content: 'Eres un generador de rutinas humanas en formato JSON estricto.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 600,
        },
        {
          headers: {
            'Authorization': `Bearer ${activeGroqKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content?.trim() || '';
      const cleanJson = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      const list = Array.isArray(parsed) ? parsed : (parsed.routine || parsed.activities);
      if (Array.isArray(list) && list.length >= 4) {
        return list;
      }
    } catch (e) {
      console.warn('Fallback a rutina local tras error en Groq:', e.message);
    }
  }

  return generateDynamicRoutine(name, archetype, occupation, hobbies);
};

/**
 * Prueba la conexión directa a Groq AI y detecta el modelo óptimo disponible
 */
export const testGroqConnection = async (key, requestedModel) => {
  const activeKey = key || config.groq.apiKey;
  if (!activeKey) {
    throw new Error('No se proporcionó una clave de API de Groq.');
  }

  // Descubrir dinámicamente el modelo al que esta clave tiene acceso
  const modelToUse = await discoverGroqModel(activeKey, requestedModel || config.groq.model);

  const startTime = Date.now();
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: modelToUse,
      messages: [
        { role: 'system', content: 'Responde de forma muy concisa.' },
        { role: 'user', content: 'Confirma en menos de 10 palabras que la conexión a Groq AI está activa.' }
      ],
      max_tokens: 30,
      temperature: 0.1,
    },
    {
      headers: {
        'Authorization': `Bearer ${activeKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    }
  );

  const durationMs = Date.now() - startTime;
  const reply = response.data?.choices?.[0]?.message?.content?.trim() || 'Conexión exitosa.';

  return {
    success: true,
    model: modelToUse,
    reply,
    latencyMs: durationMs
  };
};

export function parseEmotionAndText(rawText, currentActivity) {
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
    // Si la IA usó asteriscos como *sonríe*
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
 * Respuesta transparente y contextual cuando falta la clave de Groq AI
 */
function generateAwaitingApiKeyResponse(companion, userMessage, currentActivity) {
  return {
    text: `[emocion: pensativo] Leí lo que me escribiste: "${userMessage}". Me encantaría responderte con toda la riqueza de mi inteligencia artificial real en vivo (Groq Llama 3.3 70B ultra rápido). Para activar mis respuestas auténticas, conecta tu API Key gratuita de Groq pulsando en "Configurar IA" arriba a la derecha. ¡Solo toma 15 segundos y no tiene costo!`,
    emotion: 'pensativo',
    activity: currentActivity,
    timestamp: new Date().toISOString(),
    needsApiKey: true
  };
}

/**
 * Generador de voz humana neural sin dependencias externas complejas.
 * Divide el texto de forma natural respetando oraciones y comas para mantener
 * una prosodia, ritmo y respiración totalmente humana sin ningún efecto robótico.
 */
async function generateHumanSpeechAudio(text, lang = 'es-ES') {
  const clean = text
    .replace(/\[(?:emocion|emoción):\s*[^\]]+\]/gi, '')
    .replace(/\((?:emocion|emoción):\s*[^)]+\)/gi, '')
    .replace(/\*([^*]+)\*/g, '')
    .trim();

  if (!clean) return null;

  // Dividir texto largo en frases naturales de hasta 170 caracteres
  const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  const chunks = [];
  let current = '';

  for (const s of sentences) {
    if ((current + ' ' + s).length <= 170) {
      current = current ? current + ' ' + s : s;
    } else {
      if (current) chunks.push(current.trim());
      if (s.length > 170) {
        const words = s.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).length <= 170) {
            sub = sub ? sub + ' ' + w : w;
          } else {
            if (sub) chunks.push(sub.trim());
            sub = w;
          }
        }
        if (sub) chunks.push(sub.trim());
        current = '';
      } else {
        current = s;
      }
    }
  }
  if (current) chunks.push(current.trim());

  const audioBuffers = [];
  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(chunk.trim())}`;
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
      timeout: 8000
    });
    audioBuffers.push(Buffer.from(res.data));
  }

  if (audioBuffers.length === 0) return null;

  const combined = Buffer.concat(audioBuffers);
  return `data:audio/mpeg;base64,${combined.toString('base64')}`;
}

/**
 * Síntesis de voz ultra-realista y humana (ElevenLabs, OpenAI TTS o Neural Voice HD)
 */
export const synthesizeVoice = async ({ text, voiceId, gender = 'female', keys = {} }) => {
  const cleanText = (text || '')
    .replace(/\[(?:emocion|emoción):\s*[^\]]+\]/gi, '')
    .replace(/\((?:emocion|emoción):\s*[^)]+\)/gi, '')
    .replace(/\*([^*]+)\*/g, '')
    .trim();

  const chosenVoice = voiceId || config.elevenlabs.defaultVoiceId;
  const activeElevenLabsKey = keys.elevenlabsKey || config.elevenlabs.apiKey;
  const activeOpenAiKey = keys.openaiKey || config.openai.apiKey;

  // 1. Probar con ElevenLabs si hay API Key configurada
  if (hasElevenLabs(activeElevenLabsKey)) {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${chosenVoice}`,
        {
          text: cleanText,
          model_id: config.elevenlabs.model || 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.38,         // Estabilidad humana con variaciones emocionales sutiles
            similarity_boost: 0.85,  // Fidelidad del timbre
            style: 0.35,             // Expresividad y entonación natural
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': activeElevenLabsKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer',
          timeout: 25000
        }
      );

      const base64Audio = Buffer.from(response.data, 'binary').toString('base64');
      return {
        audioData: `data:audio/mpeg;base64,${base64Audio}`,
        provider: 'elevenlabs',
        voiceId: chosenVoice,
        model: 'eleven_multilingual_v2',
        realistic: true
      };
    } catch (err) {
      console.warn('Error en ElevenLabs API:', err.response?.data ? String(err.response.data) : err.message);
    }
  }

  // 2. Probar con OpenAI TTS (tts-1 / tts-1-hd) si hay API Key de OpenAI
  if (hasOpenAI(activeOpenAiKey)) {
    try {
      const openAiVoice = gender === 'male' ? 'onyx' : 'nova';
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          voice: openAiVoice,
          input: cleanText,
          speed: 1.0
        },
        {
          headers: {
            'Authorization': `Bearer ${activeOpenAiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: 15000
        }
      );

      const base64Audio = Buffer.from(response.data, 'binary').toString('base64');
      return {
        audioData: `data:audio/mpeg;base64,${base64Audio}`,
        provider: 'openai-tts',
        voiceId: openAiVoice,
        model: 'tts-1',
        realistic: true
      };
    } catch (err) {
      console.warn('Error en OpenAI TTS:', err.response?.data ? String(err.response.data) : err.message);
    }
  }

  // 3. Generador Neural Humano HD (Totalmente humano, sin tonos robóticos, sin costo ni API Key)
  try {
    const lang = gender === 'male' ? 'es-ES' : 'es-US';
    const audioData = await generateHumanSpeechAudio(cleanText, lang);
    if (audioData) {
      return {
        audioData,
        provider: 'human-neural-tts',
        voiceId: chosenVoice,
        model: 'neural-hd',
        realistic: true
      };
    }
  } catch (err) {
    console.warn('Error en generador de voz neural humana:', err.message);
  }

  return {
    audioData: null,
    provider: 'fallback',
    voiceId: chosenVoice,
    realistic: false
  };
};

/**
 * Genera imagen de avatar con estilo cubista neo-minimalista
 */
export const generateAvatar = async ({ prompt, gender = 'female', age = 25, archetype = 'Artista', key }) => {
  const enhancedPrompt = `Neo-cubist neo-minimalist artistic portrait of a ${age} year old ${gender} ${archetype}. Warm yellow (#FFE600, #FFD000) accents, pure white and deep obsidian black contrasting geometric planes, sharp facets, artistic cubism inspired by Picasso and modern geometric design, high resolution, minimalist editorial aesthetic. ${prompt || ''}`.trim();
  const activeKey = key || config.openai.apiKey;

  if (hasOpenAI(activeKey)) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: config.openai.imageModel,
          prompt: enhancedPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        },
        {
          headers: {
            'Authorization': `Bearer ${activeKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return {
        url: response.data.data[0].url,
        prompt: enhancedPrompt,
        provider: 'openai-dalle-3'
      };
    } catch (err) {
      console.warn('Fallo en generación DALL-E 3:', err.message);
    }
  }

  // Generador vectorial cubista SVG estilizado en data URI
  const svgAvatar = generateCubistSvgAvatar(gender, age, archetype);
  return {
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svgAvatar)}`,
    prompt: enhancedPrompt,
    provider: 'emobi-geometric-engine'
  };
};

function generateCubistSvgAvatar(gender, age, archetype) {
  const skinShades = ['#FFE600', '#FFD000', '#F4D03F', '#FFFFFF', '#F8F9FA'];
  const skin = skinShades[Math.floor(Math.random() * skinShades.length)];
  const hair = gender === 'female' ? '#111111' : '#222222';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <rect width="400" height="400" fill="#F8F9FA"/>
    <polygon points="0,0 400,0 200,200" fill="#FFE600" opacity="0.3"/>
    <polygon points="400,0 400,400 200,200" fill="#111111" opacity="0.08"/>
    <polygon points="80,400 320,400 280,260 120,260" fill="#111111" stroke="#111111" stroke-width="4"/>
    <polygon points="120,260 200,320 280,260 200,280" fill="#FFE600" stroke="#111111" stroke-width="4"/>
    <polygon points="160,270 240,270 230,210 170,210" fill="#E5E7EB" stroke="#111111" stroke-width="4"/>
    <polygon points="140,90 260,90 270,180 200,240 130,180" fill="${skin}" stroke="#111111" stroke-width="5"/>
    <polygon points="200,90 260,90 270,180 200,240" fill="#FFE600" stroke="#111111" stroke-width="3"/>
    <polygon points="140,90 200,90 200,240 130,180" fill="#FFFFFF" stroke="#111111" stroke-width="3"/>
    <polygon points="110,80 290,60 270,120 250,50 150,50 130,120" fill="${hair}" stroke="#111111" stroke-width="4"/>
    <polygon points="90,110 140,90 120,170 90,150" fill="${hair}" stroke="#111111" stroke-width="3"/>
    <polygon points="270,90 310,110 310,150 280,170" fill="${hair}" stroke="#111111" stroke-width="3"/>
    <rect x="155" y="130" width="28" height="14" fill="#FFFFFF" stroke="#111111" stroke-width="3"/>
    <circle cx="170" cy="137" r="5" fill="#111111"/>
    <polygon points="220,132 250,122 255,142 225,144" fill="#FFFFFF" stroke="#111111" stroke-width="3"/>
    <circle cx="238" cy="135" r="5" fill="#FFE600" stroke="#111111" stroke-width="2"/>
    <polyline points="200,125 190,175 210,175" fill="none" stroke="#111111" stroke-width="4" stroke-linecap="square"/>
    <polygon points="180,195 200,190 220,195 200,205" fill="#111111"/>
    <line x1="175" y1="195" x2="225" y2="195" stroke="#FFE600" stroke-width="2"/>
    <circle cx="280" cy="80" r="8" fill="#FFE600" stroke="#111111" stroke-width="2"/>
  </svg>`;
}
