import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Cpu, 
  Volume2, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Zap,
  ShieldCheck,
  Play
} from 'lucide-react';
import { getStoredAiKeys, saveStoredAiKeys, api, getAvailableGroqModels } from '../services/api';
import { voiceService } from '../services/voiceService';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { Badge } from './ui/Badge';

const REALISTIC_VOICE_OPTIONS = [
  { value: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (ElevenLabs - Femenina, cálida y serena)' },
  { value: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (ElevenLabs - Masculina, profunda y empática)' },
  { value: 'piTKgcLEGmPE4e6mEKli', label: 'Nicole (ElevenLabs - Femenina, íntima y suave)' },
  { value: 'ErXwobaYiN019PkySvjV', label: 'Antoni (ElevenLabs - Masculina, dinámica y cercana)' },
  { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (ElevenLabs - Femenina, vivaz y alegre)' },
  { value: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie (ElevenLabs - Masculina, relajada y casual)' },
  { value: 'browser-natural-female', label: 'Voz Neural del Navegador (Español Natural Femenino)' },
  { value: 'browser-natural-male', label: 'Voz Neural del Navegador (Español Natural Masculino)' },
];

export const AiSettingsModal = ({ isOpen, onClose, onSaved, embedded = false }) => {
  const [keys, setKeys] = useState({
    geminiKey: '',
    groqKey: '',
    groqModel: 'openai/gpt-oss-120b',
    openaiKey: '',
    elevenlabsKey: '',
    defaultVoice: '21m00Tcm4TlvDq8ikWAM',
  });
  const [availableGroqModels, setAvailableGroqModels] = useState([]);
  const [testingVoice, setTestingVoice] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredAiKeys();
      setKeys(prev => ({
        ...prev,
        ...stored,
        groqModel: stored.groqModel || 'openai/gpt-oss-120b',
        defaultVoice: stored.defaultVoice || '21m00Tcm4TlvDq8ikWAM'
      }));
      setGroqTestResult(null);
      setSaveSuccess(false);

      if (stored.groqKey) {
        getAvailableGroqModels(stored.groqKey).then(models => {
          if (Array.isArray(models) && models.length > 0) {
            setAvailableGroqModels(models);
          }
        }).catch(() => {});
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setKeys(prev => ({ ...prev, [field]: value }));
    if (field === 'groqKey') {
      setGroqTestResult(null);
      if (value && value.trim().length > 10) {
        getAvailableGroqModels(value.trim()).then(models => {
          if (Array.isArray(models) && models.length > 0) {
            setAvailableGroqModels(models);
          }
        }).catch(() => {});
      }
    }
  };

  const handleTestGroq = async () => {
    if (!keys.groqKey || keys.groqKey.trim().length < 5) {
      setGroqTestResult({ error: 'Ingresa primero tu clave de Groq (comienza con gsk_...)' });
      return;
    }
    setTestingGroq(true);
    setGroqTestResult(null);
    try {
      const res = await api.testGroq(keys.groqKey.trim(), keys.groqModel);
      setGroqTestResult({
        success: true,
        latencyMs: res.latencyMs,
        model: res.model,
        reply: res.reply
      });
      if (res.model) {
        setKeys(prev => ({ ...prev, groqModel: res.model }));
      }
      if (res.availableModels && Array.isArray(res.availableModels)) {
        setAvailableGroqModels(res.availableModels);
      }
    } catch (err) {
      setGroqTestResult({
        error: err.message || 'Error al conectar con Groq AI'
      });
    } finally {
      setTestingGroq(false);
    }
  };

  const handleSave = () => {
    saveStoredAiKeys(keys);
    setSaveSuccess(true);
    if (onSaved) onSaved(keys);
    if (!embedded) {
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleTestVoice = async () => {
    if (testingVoice) return;
    setTestingVoice(true);
    const sampleText = 'Hola, soy tu compañero en Emobi. Esta es mi voz realista y estoy aquí para acompañarte siempre que lo necesites.';

    try {
      // Si hay key de ElevenLabs y la voz seleccionada es de ElevenLabs
      if (keys.elevenlabsKey && !keys.defaultVoice.startsWith('browser-')) {
        const res = await api.speak('test', sampleText, keys.defaultVoice);
        if (res && res.audioData) {
          await voiceService.playRealisticAudio(res.audioData, null, () => setTestingVoice(false));
          return;
        }
      }

      // Probar voz natural del navegador
      const isFemale = !keys.defaultVoice.includes('male') && !keys.defaultVoice.includes('adam') && !keys.defaultVoice.includes('antoni') && !keys.defaultVoice.includes('charlie');
      voiceService.speakWithNaturalVoice(
        sampleText,
        { gender: isFemale ? 'female' : 'male', rate: 1.0 },
        null,
        () => setTestingVoice(false)
      );
    } catch (e) {
      console.warn('Error probando voz:', e);
      setTestingVoice(false);
    }
  };

  return (
    <div className={embedded ? 'w-full' : 'fixed inset-0 z-50 bg-emobi-black/35 backdrop-blur-md flex items-center justify-center p-4'}>
      <div className={`relative glass-strong rounded-[2rem] sm:rounded-[2.5rem] ${embedded ? 'max-w-5xl' : 'max-w-xl max-h-[90vh] overflow-y-auto'} w-full shadow-glass-xl p-4 sm:p-6`}>
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-emobi-black/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emobi-yellow/85 backdrop-blur-md rounded-2xl shadow-glow-yellow flex items-center justify-center font-black">
              <Zap className="w-4 h-4 text-emobi-black" />
            </div>
            <div>
              <h3 className="text-lg font-black font-syne uppercase">
                Configuración de IA Avanzada & Voces
              </h3>
              <p className="text-[11px] text-emobi-black/50 font-space">
                Conecta tus APIs favoritas para activar modelos de lenguaje de última generación y voces humanas.
              </p>
            </div>
          </div>
          {!embedded && <button
            onClick={onClose}
            className="p-2 rounded-full glass-subtle hover:bg-emobi-yellow/60 transition-colors"
            aria-label="Cerrar configuración de IA"
          >
            <X className="w-4 h-4" />
          </button>}
        </div>

        <div className="space-y-5">
          {/* SECCIÓN 1: PROVEEDORES DE TEXTO (GEMINI / GROQ / OPENAI) */}
          <div className="glass-subtle rounded-3xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-unbounded uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emobi-yellow-warm" />
                1. Inteligencia Artificial (Chat Real)
              </span>
              <Badge variant="yellow" size="sm">Prioridad Activa</Badge>
            </div>

            <p className="text-xs text-emobi-black/60 font-space mb-4">
              Ingresa una de las siguientes claves gratuitas para que las respuestas sean 100% reales, empáticas y de contexto profundo:
            </p>

            <div className="space-y-4">
                {/* Groq AI Ultra Rápido */}
                <div className="bg-white/65 backdrop-blur-md rounded-2xl p-3.5 shadow-glass-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emobi-yellow animate-pulse" />
                      <label className="text-xs font-black font-unbounded text-emobi-black">
                        Groq AI (Motor Ultra-Rápido & Gratuito)
                      </label>
                    </div>
                    <Badge variant="yellow" size="sm">Motor Recomendado</Badge>
                  </div>

                  <p className="text-[11px] text-emobi-black/55 font-space mb-2">
                    Genera respuestas a más de 300 palabras por segundo con profunda empatía y contexto humano.
                  </p>

                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Input
                        type="password"
                        placeholder="gsk_..."
                        value={keys.groqKey}
                        onChange={(e) => handleChange('groqKey', e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleTestGroq}
                      disabled={testingGroq || !keys.groqKey}
                      className="text-xs font-bold whitespace-nowrap"
                    >
                      {testingGroq ? 'Probando...' : '⚡ Probar Conexión'}
                    </Button>
                  </div>

                  {/* Selector / Indicador de Modelo Groq */}
                  <div className="mt-2.5 pt-2 border-t border-emobi-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-emobi-black/70 font-space flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emobi-yellow-warm" />
                      Modelo Groq Activo:
                    </span>
                    <select
                      value={keys.groqModel || 'openai/gpt-oss-120b'}
                      onChange={(e) => handleChange('groqModel', e.target.value)}
                      className="text-xs bg-white/60 backdrop-blur-md rounded-full px-3 py-1.5 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emobi-yellow/70"
                    >
                      <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (120B Flagship)</option>
                      <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (20B Ultra Rápido)</option>
                      <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (27B Multilingüe)</option>
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Meta)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Meta 8B)</option>
                      {availableGroqModels.filter(m => ![
                        'openai/gpt-oss-120b',
                        'openai/gpt-oss-20b',
                        'qwen/qwen3.8-27b',
                        'llama-3.3-70b-versatile',
                        'llama-3.1-8b-instant'
                      ].includes(m)).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold font-space"
                    >
                      Obtener API Key Gratis en Groq Console <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    {groqTestResult?.success && (
                      <span className="text-[10px] text-green-700 font-bold font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Conectado ({groqTestResult.latencyMs}ms) • {groqTestResult.model}
                      </span>
                    )}
                    {groqTestResult?.error && (
                      <span className="text-[10px] text-red-600 font-bold font-mono">
                        ⚠️ {groqTestResult.error}
                      </span>
                    )}
                  </div>
                </div>

              {/* Proveedores Secundarios (Gemini y OpenAI) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Google Gemini */}
                <div className="bg-white/50 backdrop-blur-md rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold font-space text-emobi-black">
                      Google Gemini API Key
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      AI Studio <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="AIzaSy..."
                    value={keys.geminiKey}
                    onChange={(e) => handleChange('geminiKey', e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                {/* OpenAI GPT-4o */}
                <div className="bg-white/50 backdrop-blur-md rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold font-space text-emobi-black">
                      OpenAI API Key (GPT-4o)
                    </label>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                    >
                      OpenAI <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={keys.openaiKey}
                    onChange={(e) => handleChange('openaiKey', e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: SÍNTESIS DE VOZ REALISTA (ELEVENLABS & NATURAL) */}
          <div className="glass-subtle rounded-3xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-unbounded uppercase flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emobi-yellow-warm" />
                2. Voz Humana Hiperrealista (ElevenLabs)
              </span>
              <Badge variant="black" size="sm">Lip-Sync Físico</Badge>
            </div>

            <p className="text-xs text-emobi-black/60 font-space mb-3">
              Usa ElevenLabs para clonación o voces neuronales hiperrealistas con respiración, pausas y modulación emocional.
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold font-space text-emobi-black">
                    ElevenLabs API Key
                  </label>
                  <a
                    href="https://elevenlabs.io"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                  >
                    Obtener en ElevenLabs <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="xi-..."
                  value={keys.elevenlabsKey}
                  onChange={(e) => handleChange('elevenlabsKey', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <Select
                label="Voz Predeterminada para Compañeros"
                value={keys.defaultVoice}
                onChange={(e) => handleChange('defaultVoice', e.target.value)}
                options={REALISTIC_VOICE_OPTIONS}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestVoice}
                disabled={testingVoice}
                icon={Play}
                className="w-full text-xs font-bold"
              >
                {testingVoice ? 'Reproduciendo voz realista...' : '🔊 Probar Esta Voz en Vivo'}
              </Button>
            </div>
          </div>
        </div>

        {/* Botones de Guardar */}
        <div className="mt-6 pt-4 border-t border-emobi-black/10 flex items-center justify-between">
          <div className="text-[11px] text-emobi-black/50 font-space">
            {saveSuccess ? (
              <span className="text-green-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> ¡Configuración guardada exitosamente!
              </span>
            ) : (
              <span>Las claves se guardan localmente en este navegador.</span>
            )}
          </div>

          <div className="flex gap-2">
            {!embedded && <Button onClick={onClose} variant="secondary" size="sm">Cancelar</Button>}
            <Button onClick={handleSave} variant="primary" size="sm" icon={Check}>
              Guardar Configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
