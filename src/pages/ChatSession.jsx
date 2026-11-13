import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Volume2, 
  Clock, 
  MapPin, 
  Heart, 
  Sparkles, 
  Smile,
  Zap,
  PanelLeft,
  Plus,
  Pin,
  PinOff,
  X
} from 'lucide-react';
import { api, getStoredAiKeys } from '../services/api';
import { voiceService } from '../services/voiceService';
import { Avatar3DChatView } from '../avatar3d/Avatar3DChatView';
import { VoiceChat } from '../components/VoiceChat';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CubistGridPattern } from '../assets/cubist-elements';
import { useUiActions } from '../context/UiActions';
import { AvatarMini } from '../avatar3d/AvatarMini';
import { presetForCompanion } from '../avatar3d/config';

const makeChatSession = (title = 'Nueva conversación', messages = []) => ({
  id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title,
  pinned: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  messages,
});

const readSavedSessions = (companionId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(`emobi_chat_sessions_${companionId}`) || 'null');
    return saved && Array.isArray(saved.sessions) ? saved : null;
  } catch {
    return null;
  }
};

export const ChatSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const ui = useUiActions();

  const [companion, setCompanion] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSessions, setShowSessions] = useState(false);
  const sessionsReadyFor = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('sonriendo');
  const [acousticData, setAcousticData] = useState(null);
  const [voiceAutoPlay, setVoiceAutoPlay] = useState(true);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [aiActiveProvider, setAiActiveProvider] = useState('Groq Llama 3.3');
  const [hasGroqConfigured, setHasGroqConfigured] = useState(false);

  const messagesEndRef = useRef(null);
  const activeSession = sessions.find(session => session.id === activeSessionId);
  const messages = activeSession?.messages || [];

  useEffect(() => {
    if (sessionsReadyFor.current !== id) return;
    try {
      localStorage.setItem(`emobi_chat_sessions_${id}`, JSON.stringify({ sessions, activeSessionId }));
    } catch (err) {
      console.warn('No se pudieron guardar las sesiones de chat:', err);
    }
  }, [sessions, activeSessionId, id]);

  useEffect(() => {
    loadCompanionData();
    updateProviderStatus();
    return () => {
      voiceService.stop();
    };
  }, [id]);

  // Publica las acciones del chat en el Dock inferior
  useEffect(() => {
    ui.register({
      openSettings: () => navigate('/settings'),
      openRoutine: () => setShowRoutineModal(true),
      voiceAutoPlay,
      toggleVoice: () => {
        if (isAiSpeaking) voiceService.stop();
        setVoiceAutoPlay(prev => !prev);
      },
    });
    return () => ui.clear(['openSettings', 'openRoutine', 'voiceAutoPlay', 'toggleVoice']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGroqConfigured, voiceAutoPlay, isAiSpeaking]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const updateProviderStatus = () => {
    const keys = getStoredAiKeys();
    const hasGroq = Boolean(keys.groqKey && keys.groqKey.trim().length > 5);
    setHasGroqConfigured(hasGroq);

    if (hasGroq) setAiActiveProvider('Groq Llama 3.3 70B');
    else if (keys.geminiKey) setAiActiveProvider('Gemini 1.5');
    else if (keys.openaiKey) setAiActiveProvider('GPT-4o');
    else setAiActiveProvider('Conectar Groq AI');
  };

  const handleRegenerateGreeting = async () => {
    if (sending) return;
    try {
      setSending(true);
      const result = await api.generateGreeting(id);
      if (result && result.message) {
        appendSessionMessage(result.message);
        if (result.message.emotion) {
          setCurrentEmotion(result.message.emotion);
        }
        if (voiceAutoPlay) {
          speakCompanionResponse(result.message.text);
        }
      }
    } catch (e) {
      console.error('Error generando nuevo saludo con IA:', e);
    } finally {
      setSending(false);
    }
  };

  const loadCompanionData = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanionById(id);
      if (data) {
        setCompanion(data);
        const saved = readSavedSessions(id);
        const restoredSessions = saved?.sessions?.length
          ? saved.sessions.map(session => ({
              ...session,
              pinned: Boolean(session.pinned),
              messages: Array.isArray(session.messages) ? session.messages : [],
              updatedAt: session.updatedAt || session.createdAt || new Date().toISOString(),
            }))
          : [makeChatSession('Conversación inicial', data.messages || [])];
        const restoredActiveId = restoredSessions.some(session => session.id === saved?.activeSessionId)
          ? saved.activeSessionId
          : restoredSessions[0].id;
        sessionsReadyFor.current = id;
        setSessions(restoredSessions);
        setActiveSessionId(restoredActiveId);
        if (data.currentActivity?.mood) {
          setCurrentEmotion(data.currentActivity.mood);
        }
      }
    } catch (err) {
      console.error('Error al cargar datos del compañero:', err);
    } finally {
      setLoading(false);
    }
  };

  const appendSessionMessage = (message, sessionId = activeSessionId) => {
    if (!sessionId) return;
    setSessions(previous => previous.map(session => {
      if (session.id !== sessionId) return session;
      const firstUserMessage = message.sender === 'user' && !session.messages.some(item => item.sender === 'user');
      const messageText = String(message.text || '').trim();
      const title = firstUserMessage
        ? (messageText.length > 38 ? `${messageText.slice(0, 38).trim()}…` : messageText)
        : session.title;
      return {
        ...session,
        title,
        messages: [...session.messages, message],
        updatedAt: new Date().toISOString(),
      };
    }));
  };

  const createNewSession = () => {
    const session = makeChatSession();
    setSessions(previous => [session, ...previous]);
    setActiveSessionId(session.id);
    setShowSessions(false);
    voiceService.stop();
    setIsAiSpeaking(false);
  };

  const selectSession = (sessionId) => {
    voiceService.stop();
    setIsAiSpeaking(false);
    setAcousticData(null);
    setActiveSessionId(sessionId);
    setShowSessions(false);
  };

  const toggleSessionPin = (sessionId) => {
    setSessions(previous => previous.map(session => session.id === sessionId
      ? { ...session, pinned: !session.pinned }
      : session));
  };

  // Reproducir voz realista y humana mediante síntesis AI o Audio Neural
  const speakCompanionResponse = async (text) => {
    voiceService.stop();
    setIsAiSpeaking(true);

    const cleanText = (text || '')
      .replace(/\[(?:emocion|emoción):\s*[^\]]+\]/gi, '')
      .replace(/\((?:emocion|emoción):\s*[^)]+\)/gi, '')
      .replace(/\*([^*]+)\*/g, '')
      .trim();

    if (!cleanText) {
      setIsAiSpeaking(false);
      return;
    }

    try {
      // 1. Solicitar síntesis de voz humana (ElevenLabs, OpenAI o Human Neural Audio)
      const voiceResult = await api.speak(companion.id, cleanText, companion.voiceId, companion.gender);

      if (voiceResult && voiceResult.audioData) {
        const played = await voiceService.playRealisticAudio(
          voiceResult.audioData,
          (frame) => setAcousticData(frame),
          () => {
            setIsAiSpeaking(false);
            setAcousticData(null);
          },
          1.14
        );
        if (played) return;
      }
    } catch (err) {
      console.warn('Error con síntesis en servidor, recurriendo a voz neural directa:', err);
    }

    // 2. Fallback a generador de voz neural directa o voz del SO filtrada (NUNCA robótica)
    voiceService.speakWithNaturalVoice(
      cleanText,
      {
        gender: companion?.gender || 'female',
        rate: 1.16,
        pitch: companion?.gender === 'female' ? 1.05 : 0.95
      },
      (frame) => setAcousticData(frame),
      () => {
        setIsAiSpeaking(false);
        setAcousticData(null);
      }
    );
  };

  // Enviar mensaje de usuario
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    setInputMessage('');
    setSending(true);

    // Agregar mensaje local del usuario inmediatamente
    const userMsg = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    const sessionId = activeSessionId;
    const conversationHistory = messages;
    appendSessionMessage(userMsg, sessionId);

    try {
      const response = await api.sendMessage(id, text, conversationHistory);

      if (response && response.message) {
        appendSessionMessage(response.message, sessionId);

        if (response.message.emotion) {
          setCurrentEmotion(response.message.emotion);
        }

        if (response.affinity && companion) {
          setCompanion(prev => ({ ...prev, affinity: response.affinity }));
        }

        if (response.currentActivity && companion) {
          setCompanion(prev => ({ ...prev, currentActivity: response.currentActivity }));
        }

        // Hablar respuesta realista si el sonido está activado
        if (voiceAutoPlay) {
          speakCompanionResponse(response.message.text);
        }
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        <CubistGridPattern />
        <div className="relative w-14 h-14 rounded-3xl bg-emobi-yellow/80 backdrop-blur-md shadow-glow-yellow animate-spin mb-4" />
        <h3 className="relative text-base font-black font-unbounded">Conectando con {companion?.name || 'compañero'}...</h3>
      </div>
    );
  }

  if (!companion) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
        <CubistGridPattern />
        <h3 className="relative text-xl font-black font-syne mb-2">Compañero no encontrado</h3>
        <Button onClick={() => navigate('/')} variant="primary">Volver al Inicio</Button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] min-h-0 flex flex-col overflow-hidden">
      <CubistGridPattern />

      {/* Barra de contexto del compañero (navegación y acciones → Dock inferior) */}
      <header className="z-20 shrink-0 px-3 lg:px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="glass-strong rounded-3xl px-3 lg:px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden glass-strong flex-shrink-0 p-[2px]">
              <div className="w-full h-full rounded-full overflow-hidden bg-emobi-yellow/20">
                <AvatarMini
                  avatar3d={companion.avatar3d || presetForCompanion(companion)}
                  emotion={currentEmotion}
                  isSpeaking={isAiSpeaking}
                  acousticData={acousticData}
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base lg:text-lg font-black font-syne text-emobi-black truncate">
                  {companion.name}
                </h2>
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0 ${isAiSpeaking ? 'bg-emobi-yellow shadow-[0_0_10px_rgba(255,230,0,0.9)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]'}`} />
              </div>
              <p className="text-[11px] text-emobi-black/50 font-space font-medium truncate">
                {companion.archetype} • {companion.age} años
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowSessions(true)}
              className="h-9 w-9 sm:w-auto sm:px-3 rounded-full glass-subtle flex items-center justify-center gap-2 hover:bg-emobi-yellow/50 transition-colors"
              title="Abrir sesiones"
              aria-label="Abrir sesiones de chat"
            >
              <PanelLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold font-space">Sesiones</span>
            </button>

            {/* Barra de Afinidad */}
            <div className="hidden md:flex items-center gap-1.5 glass-subtle rounded-full px-3 py-1.5 text-xs font-bold font-space">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              <span>Afinidad: {companion.affinity || 85}%</span>
            </div>

            {/* Botón Regenerar Saludo con IA */}
            <Button
              onClick={handleRegenerateGreeting}
              variant="outline"
              size="sm"
              className="hidden md:flex text-xs font-bold"
              icon={Sparkles}
              disabled={sending}
              title="Genera un nuevo saludo inicial con Groq AI"
            >
              Nuevo Saludo IA
            </Button>
          </div>
        </div>
      </header>

      {showSessions && (
        <div
          className="fixed inset-0 z-50 bg-emobi-black/35 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSessions(false); }}
        >
          <section className="absolute inset-y-0 left-0 w-[min(22rem,90vw)] glass-strong rounded-r-[2rem] p-4 sm:p-5 flex flex-col shadow-glass-xl pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-black font-syne">Sesiones</h3>
                <p className="text-xs text-emobi-black/50 font-space">Conversaciones con {companion.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSessions(false)}
                className="w-9 h-9 rounded-full glass-subtle flex items-center justify-center"
                aria-label="Cerrar sesiones"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Button onClick={createNewSession} variant="primary" className="w-full mb-4" icon={Plus}>
              Nueva conversación
            </Button>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {[...sessions]
                .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt) - new Date(a.updatedAt))
                .map(session => (
                  <div
                    key={session.id}
                    className={`flex items-center gap-2 p-2 rounded-2xl border transition-colors ${session.id === activeSessionId ? 'bg-emobi-yellow/45 border-emobi-black/15' : 'bg-white/35 border-transparent hover:bg-white/65'}`}
                  >
                    <button
                      type="button"
                      onClick={() => selectSession(session.id)}
                      className="min-w-0 flex-1 text-left px-2 py-1"
                    >
                      <span className="block truncate text-sm font-bold font-space">{session.title}</span>
                      <span className="block text-[10px] text-emobi-black/45 font-mono mt-0.5">
                        {session.messages.length} mensajes · {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSessionPin(session.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${session.pinned ? 'bg-emobi-black text-emobi-yellow' : 'hover:bg-white/70 text-emobi-black/50'}`}
                      title={session.pinned ? 'Desfijar sesión' : 'Fijar sesión'}
                      aria-label={session.pinned ? 'Desfijar sesión' : 'Fijar sesión'}
                    >
                      {session.pinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      {/* Área Principal Dividida: Avatar y Chat */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden px-2 sm:px-3 lg:px-4 pb-[calc(5.75rem_+_env(safe-area-inset-bottom))] pt-2 lg:pb-24 lg:pt-3 gap-2 lg:gap-4">
        {/* Panel Izquierdo: Avatar 3D Interactivo con Lip-Sync & Vida Actual */}
        <aside className="order-1 shrink-0 w-full h-[36dvh] min-h-[235px] max-h-[320px] lg:order-none lg:h-auto lg:max-h-none lg:w-[420px] glass rounded-[1.5rem] lg:rounded-[2rem] flex flex-col p-2 sm:p-3 lg:p-4 overflow-y-auto">
          {/* Avatar 3D Neo-Cubista con Lip-Sync Acústico en Tiempo Real */}
          <Avatar3DChatView
            avatar3d={companion.avatar3d || presetForCompanion(companion)}
            companionName={companion.name}
            isSpeaking={isAiSpeaking}
            acousticData={acousticData}
            emotion={currentEmotion}
            onEmotionChange={setCurrentEmotion}
            className="mb-2 lg:mb-4 shrink-0"
          />

          {/* Tarjeta de Vida Actual ("¿Está haciendo ahora?") */}
          {companion.currentActivity && (
            <Card className="hidden lg:block p-3.5 mb-4" variant="outline" shadow={false}>
              <div className="flex items-center justify-between text-xs font-bold font-unbounded text-emobi-black mb-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emobi-yellow-warm" />
                  RUTINA ACTUAL ({companion.currentActivity.time || 'Ahora'})
                </span>
                <Badge variant="yellow" size="sm">
                  {companion.currentActivity.mood || 'presente'}
                </Badge>
              </div>
              <h4 className="text-xs font-bold text-emobi-black font-space">
                {companion.currentActivity.title}
              </h4>
              <p className="text-[11px] text-emobi-black/55 font-space mt-0.5">
                {companion.currentActivity.description}
              </p>
              <div className="mt-2 text-[10px] text-emobi-black/45 flex items-center gap-1 font-mono">
                <MapPin className="w-3 h-3 text-emobi-black" />
                <span>Lugar: {companion.currentActivity.location}</span>
              </div>
            </Card>
          )}

        </aside>

        {/* Panel Derecho: Historial de Mensajes y Entrada */}
        <main className="order-2 flex-1 min-h-0 min-w-0 flex flex-col glass rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden">
          {/* Banner de Aviso si Groq AI no está conectado */}
          {!hasGroqConfigured && (
            <div className="hidden sm:flex glass-yellow rounded-none border-0 px-4 py-3 items-center justify-between text-xs font-space z-10">
              <div className="flex items-center gap-2 text-emobi-black">
                <Zap className="w-4 h-4 fill-emobi-black text-emobi-black" />
                <span>
                  <strong>Groq AI (Llama 3.3 70B)</strong> está listo para conectarse. Actívalo para disfrutar de respuestas con IA real y ultra-rápida.
                </span>
              </div>
              <button
                onClick={() => navigate('/settings', { state: { section: 'advanced' } })}
                className="bg-emobi-black/90 text-white hover:bg-emobi-black backdrop-blur-md rounded-full px-3.5 py-1.5 font-unbounded font-black text-[10px] transition-colors whitespace-nowrap ml-2 shadow-glass-sm"
              >
                Conectar Clave
              </button>
            </div>
          )}

          {/* Flujo de Conversación */}
          <div className="flex-1 min-h-0 p-3 sm:p-4 lg:p-6 overflow-y-auto overscroll-contain space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] p-3.5 rounded-3xl backdrop-blur-md transition-all ${
                      isUser
                        ? 'bg-emobi-black/85 text-white shadow-glass'
                        : 'bg-white/70 text-emobi-black shadow-glass-sm border border-white/50'
                    }`}
                  >
                    {/* Emoción o Remitente */}
                    {!isUser && msg.emotion && (
                      <div className="flex items-center justify-between mb-1.5 text-[10px] font-unbounded font-bold text-emobi-black/45 border-b border-emobi-black/10 pb-1">
                        <span className="text-emobi-black flex items-center gap-1 uppercase">
                          <Smile className="w-3 h-3 text-emobi-yellow-warm" />
                          [{msg.emotion}]
                        </span>
                        <button
                          onClick={() => speakCompanionResponse(msg.text)}
                          className="hover:text-emobi-black p-0.5"
                          title="Reproducir voz"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <p className="text-xs md:text-sm font-space leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>

                    {/* Botón directo de acción si el mensaje indica falta de clave */}
                    {msg.needsApiKey && (
                      <button
                        onClick={() => navigate('/settings', { state: { section: 'advanced' } })}
                        className="mt-3 flex items-center gap-1.5 bg-emobi-yellow/85 text-emobi-black rounded-full px-3.5 py-1.5 text-xs font-black font-unbounded shadow-glass-yellow hover:-translate-y-0.5 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 fill-emobi-black text-emobi-black" />
                        Conectar Groq AI Ahora (Gratis)
                      </button>
                    )}

                    <span className={`text-[9px] font-mono block mt-1.5 ${isUser ? 'text-white/45 text-right' : 'text-emobi-black/40'}`}>
                      {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-center gap-2 text-xs font-bold font-unbounded text-emobi-black/55 glass-subtle rounded-full px-3.5 py-2 w-fit">
                <span className="w-2 h-2 bg-emobi-yellow rounded-full animate-ping" />
                {companion.name} está pensando...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Barra Inferior de Entrada de Texto */}
          <div className="shrink-0 p-2 sm:p-3 lg:p-4 border-t border-emobi-black/10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 max-w-4xl mx-auto"
            >
              <input
                type="text"
                placeholder={`Conversa con ${companion.name} con total confianza...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={sending}
                className="min-w-0 flex-1 px-4 sm:px-5 py-2.5 glass-subtle rounded-full font-space text-sm focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-emobi-yellow/70 transition-all"
              />

              <VoiceChat
                compact
                onUserMessage={handleSendMessage}
                isAiSpeaking={isAiSpeaking}
                companionName={companion.name}
                disabled={sending}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={sending || !inputMessage.trim()}
                icon={Send}
              >
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </form>
          </div>
        </main>
      </div>

      {/* Modal de Rutina de Vida */}
      {showRoutineModal && (
        <div className="fixed inset-0 z-50 bg-emobi-black/35 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative glass-strong rounded-[2.5rem] max-w-lg w-full shadow-glass-xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-emobi-black/10">
              <div>
                <h4 className="text-xl font-black font-syne">
                  Rutina de Vida de {companion.name}
                </h4>
                <p className="text-xs text-emobi-black/50 font-space">
                  Horarios y actividades que realiza a lo largo del día
                </p>
              </div>
              <button
                onClick={() => setShowRoutineModal(false)}
                className="bg-emobi-yellow/80 backdrop-blur-md hover:bg-emobi-black hover:text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {(companion.routine || []).map((step, idx) => (
                <div key={idx} className="glass-subtle rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="bg-emobi-black/85 text-white rounded-full px-2.5 py-0.5 text-xs font-mono font-bold">
                      {step.time}
                    </span>
                    <span className="text-xs font-bold uppercase font-unbounded text-emobi-black/80">
                      {step.mood}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm font-space text-emobi-black">
                    {step.title}
                  </h5>
                  <p className="text-xs text-emobi-black/55 font-space mt-0.5">
                    {step.description}
                  </p>
                  <span className="text-[11px] text-emobi-black/45 flex items-center gap-1 mt-1 font-mono">
                    <MapPin className="w-3 h-3 text-emobi-yellow-warm" /> {step.location}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-emobi-black/10 flex justify-end">
              <Button onClick={() => setShowRoutineModal(false)} variant="dark" size="sm">
                Cerrar Rutina
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
