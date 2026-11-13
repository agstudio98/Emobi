import { 
  calculateCurrentActivity, 
  generateDynamicRoutineWithAi,
  generateCompanionGreeting,
  generateChatResponse, 
  synthesizeVoice
} from '../services/aiService.js';
import { resolveKeys } from '../config/aiConfig.js';
import { database, saveDatabase } from '../services/store.js';

const getUserCompanions = (req) => {
  const userId = req.user.id;
  if (!Array.isArray(database.companions[userId])) database.companions[userId] = [];
  return database.companions[userId];
};

export const getCompanions = (req, res) => {
  const companions = getUserCompanions(req);
  const companionsWithActivity = companions.map(companion => ({
    ...companion,
    currentActivity: calculateCurrentActivity(companion.routine)
  }));
  res.json({ success: true, count: companions.length, data: companionsWithActivity });
};

export const getCompanionById = (req, res) => {
  const { id } = req.params;
  const companions = getUserCompanions(req);
  const companion = companions.find(c => c.id === id);

  if (!companion) {
    return res.status(404).json({ success: false, error: 'Compañero no encontrado' });
  }

  const currentActivity = calculateCurrentActivity(companion.routine);
  res.json({ success: true, data: { ...companion, currentActivity } });
};

export const createCompanion = async (req, res) => {
  try {
    const companions = getUserCompanions(req);
    const {
      name,
      age = 25,
      gender = 'female',
      archetype = 'Compañero Empático',
      occupation = 'Creativo',
      traits = ['Empático', 'Curioso'],
      hobbies = ['Música', 'Arte'],
      quirk = '',
      tone = 'Cálido y empático',
      avatar3d,
      voiceId
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });
    }

    const newId = `emobi-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
    const keys = resolveKeys(req.headers);

    // Generar rutina dinámica de 24 horas con IA
    const dynamicRoutine = await generateDynamicRoutineWithAi({
      name,
      archetype,
      occupation,
      hobbies,
      keys
    });

    // Generar primer mensaje o saludo inicial real con Groq AI
    const initialGreeting = await generateCompanionGreeting({
      companion: {
        name,
        age: Number(age),
        gender,
        archetype,
        occupation,
        traits: Array.isArray(traits) ? traits : [traits],
        hobbies: Array.isArray(hobbies) ? hobbies : [hobbies],
        quirk: quirk || 'Le gusta hacer preguntas profundas sobre lo que realmente sientes.',
        tone,
        routine: dynamicRoutine
      },
      keys
    });

    const newCompanion = {
      id: newId,
      name,
      age: Number(age),
      gender,
      archetype,
      occupation,
      traits: Array.isArray(traits) ? traits : [traits],
      hobbies: Array.isArray(hobbies) ? hobbies : [hobbies],
      quirk: quirk || 'Le gusta hacer preguntas profundas sobre lo que realmente sientes.',
      tone,
      avatar3d: avatar3d || {
        skinTone: gender === 'male' ? '#D69A6A' : '#E8B48C',
        hairColor: '#2B2118',
        hairStyle: gender === 'male' ? 'corto' : 'largo',
        eyeColor: '#4A3728',
        outfitColor: '#FFE600',
        accentColor: '#111111',
        faceShape: 0.5,
        jawWidth: gender === 'male' ? 0.65 : 0.45,
        eyeSize: 0.55,
        noseSize: 0.5,
        mouthWidth: 0.5,
        lipsFullness: 0.5,
        browThickness: 0.5,
        freckles: false,
        glasses: false,
        earrings: gender !== 'male',
        facialHair: false,
        expression: 'sonriendo',
      },
      voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM',
      affinity: 75,
      routine: dynamicRoutine,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'companion',
          text: initialGreeting.text,
          emotion: initialGreeting.emotion || 'sonriendo',
          activity: initialGreeting.activity,
          timestamp: initialGreeting.timestamp || new Date().toISOString()
        }
      ]
    };

    companions.unshift(newCompanion);
    saveDatabase();

    res.status(201).json({
      success: true,
      message: 'Compañero creado con éxito',
      data: {
        ...newCompanion,
        currentActivity: calculateCurrentActivity(newCompanion.routine)
      }
    });
  } catch (error) {
    console.error('Error al crear compañero:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateGreetingForCompanion = async (req, res) => {
  try {
    const { id } = req.params;
    const companions = getUserCompanions(req);
    const companion = companions.find(c => c.id === id);
    if (!companion) {
      return res.status(404).json({ success: false, error: 'Compañero no encontrado' });
    }

    const keys = resolveKeys(req.headers);
    const greeting = await generateCompanionGreeting({ companion, keys });

    const companionMsgObj = {
      id: `msg-${Date.now()}-ai-greeting`,
      sender: 'companion',
      text: greeting.text,
      emotion: greeting.emotion,
      activity: greeting.activity,
      timestamp: greeting.timestamp
    };

    companion.messages.push(companionMsgObj);
    saveDatabase();

    res.json({
      success: true,
      data: {
        message: companionMsgObj,
        currentActivity: greeting.activity
      }
    });
  } catch (error) {
    console.error('Error al generar saludo con IA:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteCompanion = (req, res) => {
  const { id } = req.params;
  const companions = getUserCompanions(req);
  const initialLength = companions.length;
  database.companions[req.user.id] = companions.filter(c => c.id !== id);

  if (companions.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Compañero no encontrado' });
  }

  saveDatabase();

  res.json({ success: true, message: 'Compañero eliminado correctamente' });
};

export const chatWithCompanion = async (req, res) => {
  try {
    const { id } = req.params;
    const companions = getUserCompanions(req);
    const { message, conversationHistory } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'El mensaje no puede estar vacío' });
    }

    const companionIndex = companions.findIndex(c => c.id === id);
    if (companionIndex === -1) {
      return res.status(404).json({ success: false, error: 'Compañero no encontrado' });
    }

    const companion = companions[companionIndex];

    // Registrar mensaje de usuario
    const userMsgObj = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };
    companion.messages.push(userMsgObj);

    // Incrementar afinidad suavemente con cada interacción (hasta 100)
    if (companion.affinity < 100) {
      companion.affinity = Math.min(100, companion.affinity + 1);
    }

    // Extraer claves dinámicas de la petición (si el usuario las configuró en la UI)
    const keys = resolveKeys(req.headers);

    // Generar respuesta con IA Avanzada
    const aiResponse = await generateChatResponse({
      companion,
      // Cada sesión mantiene su propio contexto enviado por el cliente.
      messages: Array.isArray(conversationHistory) ? conversationHistory.slice(-30) : companion.messages,
      userMessage: message,
      keys
    });

    const companionMsgObj = {
      id: `msg-${Date.now()}-ai`,
      sender: 'companion',
      text: aiResponse.text,
      emotion: aiResponse.emotion,
      activity: aiResponse.activity,
      timestamp: aiResponse.timestamp
    };

    companion.messages.push(companionMsgObj);

    // Si el historial es muy largo, mantener últimos 30 mensajes
    if (companion.messages.length > 30) {
      companion.messages = companion.messages.slice(-30);
    }
    saveDatabase();

    res.json({
      success: true,
      data: {
        message: companionMsgObj,
        affinity: companion.affinity,
        currentActivity: aiResponse.activity
      }
    });
  } catch (error) {
    console.error('Error en chat con compañero:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const speakWithCompanion = async (req, res) => {
  try {
    const { id } = req.params;
    const companions = getUserCompanions(req);
    const { text, voiceId } = req.body;

    const companion = companions.find(c => c.id === id);
    if (!companion) {
      return res.status(404).json({ success: false, error: 'Compañero no encontrado' });
    }

    const keys = resolveKeys(req.headers);
    const chosenVoice = voiceId || companion.voiceId;

    const voiceResult = await synthesizeVoice({
      text: text || 'Hola, me alegro mucho de escucharte.',
      voiceId: chosenVoice,
      gender: companion.gender || 'female',
      keys
    });

    res.json({
      success: true,
      data: voiceResult
    });
  } catch (error) {
    console.error('Error en síntesis de voz:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
