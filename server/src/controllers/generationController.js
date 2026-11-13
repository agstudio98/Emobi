import { 
  generateAvatar, 
  generateDynamicRoutine,
  generateDynamicRoutineWithAi,
  testGroqConnection,
  REALISTIC_VOICES
} from '../services/aiService.js';
import { 
  hasOpenAI, 
  hasGemini, 
  hasGroq,
  hasElevenLabs, 
  hasReplicate,
  resolveKeys,
  config
} from '../config/aiConfig.js';

export const generateAvatarEndpoint = async (req, res) => {
  try {
    const { prompt, gender = 'female', age = 25, archetype = 'Creativo' } = req.body;
    const keys = resolveKeys(req.headers);
    const result = await generateAvatar({ prompt, gender, age, archetype, key: keys.openaiKey });
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generando avatar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateRoutineEndpoint = async (req, res) => {
  try {
    const { name, archetype, occupation, hobbies } = req.body;
    const keys = resolveKeys(req.headers);
    const routine = await generateDynamicRoutineWithAi({ name, archetype, occupation, hobbies, keys });
    res.json({
      success: true,
      data: routine
    });
  } catch (error) {
    console.error('Error generando rutina con IA:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const testGroqEndpoint = async (req, res) => {
  try {
    const keys = resolveKeys(req.headers);
    const { apiKey, model } = req.body || {};
    const keyToTest = apiKey || keys.groqKey;

    if (!keyToTest) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó API Key de Groq'
      });
    }

    const testResult = await testGroqConnection(keyToTest, model || keys.groqModel);
    res.json(testResult);
  } catch (error) {
    console.error('Error en prueba de Groq:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
};

export const getSystemStatus = (req, res) => {
  const keys = resolveKeys(req.headers);
  res.json({
    success: true,
    providers: {
      groq: hasGroq(keys.groqKey),
      gemini: hasGemini(keys.geminiKey),
      openai: hasOpenAI(keys.openaiKey),
      elevenlabs: hasElevenLabs(keys.elevenlabsKey),
      replicate: hasReplicate(keys.replicateToken),
    },
    groqModel: keys.groqModel || config.groq.model || 'openai/gpt-oss-120b',
    voices: REALISTIC_VOICES,
    version: '1.3.0',
    mode: 'Neo-Cubist Cognitive AI & Groq Neural Hub',
    status: 'online'
  });
};
