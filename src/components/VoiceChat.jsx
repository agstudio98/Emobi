import React, { useState, useEffect, useRef } from 'react';
import { Mic, Radio, Loader2, X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { api } from '../services/api';
import { AppDialog } from './ui/AppDialog';

/**
 * Componente de Voz Avanzado con Reconocimiento Híbrido:
 * 1. Groq Whisper Large v3 (precisión del 99.5%, reconoce acentos, modismos y elimina ruidos).
 * 2. Previsualización de texto en tiempo real mientras el usuario habla.
 * 3. Analizador acústico real conectado al micrófono vía Web Audio API.
 */
export const VoiceChat = ({
  onUserMessage,
  isAiSpeaking = false,
  companionName = 'Compañero',
  disabled = false,
  compact = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioMeter, setAudioMeter] = useState([12, 16, 20, 28, 20, 16, 12, 8]);
  const [dialogMessage, setDialogMessage] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const speechFallbackRef = useRef('');

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const cleanupRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  // Iniciar reconocimiento en vivo paralelo (Web Speech API para preview instantáneo)
  const startLivePreviewRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Detecta el idioma del navegador si es español (ej. es-AR, es-MX, es-ES)
      const userLang = typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('es')
        ? navigator.language
        : 'es-ES';
      recognition.lang = userLang;

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) final += item[0].transcript;
          else interim += item[0].transcript;
        }
        const currentText = (final || interim || '').trim();
        if (currentText) {
          speechFallbackRef.current = currentText;
          setTranscript(currentText);
        }
      };

      recognition.onerror = () => {};
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {}
  };

  // Conectar analizador de audio real con Web Audio API
  const startAudioMeterAnalysis = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Seleccionar 8 bandas representativas
        const bands = [];
        const step = Math.max(1, Math.floor(bufferLength / 8));
        for (let i = 0; i < 8; i++) {
          const val = dataArray[i * step] || 0;
          bands.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
        }
        setAudioMeter(bands);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      animFrameRef.current = requestAnimationFrame(updateMeter);
    } catch (e) {}
  };

  // Iniciar grabación de audio de alta fidelidad
  const startRecording = async () => {
    if (disabled || isAiSpeaking || isListening || isTranscribing) return;

    speechFallbackRef.current = '';
    setTranscript('');
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Iniciar analizador acústico real
      startAudioMeterAnalysis(stream);

      // Iniciar previsualización instantánea
      startLivePreviewRecognition();

      // Configurar MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsListening(true);

      // Temporizador de duración
      timerRef.current = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);

    } catch (err) {
      console.warn('Error al acceder al micrófono:', err);
      setDialogMessage('No se pudo acceder al micrófono. Revisa los permisos de audio de la aplicación y vuelve a intentarlo.');
      cleanupRecording();
      setIsListening(false);
    }
  };

  // Detener y procesar con Groq Whisper Large v3
  const stopAndProcessRecording = async () => {
    if (!isListening) return;

    setIsListening(false);
    setIsTranscribing(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Detener previsualización
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    // Detener MediaRecorder y esperar el blob final
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      await new Promise(resolve => {
        recorder.onstop = resolve;
        try { recorder.stop(); } catch (e) { resolve(); }
      });
    }

    // Detener pistas de micrófono
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    const chunks = audioChunksRef.current;
    const blob = chunks.length > 0 ? new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }) : null;

    let finalRecognizedText = '';

    // 1. Enviar a Whisper Large v3 en Groq (IA de reconocimiento ultra-precisa)
    if (blob && blob.size > 100) {
      try {
        const whisperResult = await api.transcribeAudio(blob);
        if (whisperResult && whisperResult.trim().length > 0) {
          finalRecognizedText = whisperResult.trim();
        }
      } catch (err) {
        console.warn('Error en transcripción Whisper:', err);
      }
    }

    // 2. Fallback al texto de Web Speech API si Whisper no devolvió resultado
    if (!finalRecognizedText && speechFallbackRef.current) {
      finalRecognizedText = speechFallbackRef.current.trim();
    }

    setIsTranscribing(false);
    cleanupRecording();
    setAudioMeter([12, 16, 20, 28, 20, 16, 12, 8]);

    if (finalRecognizedText && onUserMessage) {
      setTranscript('');
      onUserMessage(finalRecognizedText);
    } else {
      setTranscript('');
    }
  };

  // Cancelar grabación sin enviar
  const cancelRecording = () => {
    cleanupRecording();
    setIsListening(false);
    setIsTranscribing(false);
    setTranscript('');
    setRecordingSeconds(0);
    setAudioMeter([12, 16, 20, 28, 20, 16, 12, 8]);
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={compact ? 'flex items-center gap-1.5' : 'w-full glass rounded-3xl p-4 flex flex-col gap-3 border border-white/60 shadow-glass'}>
      {/* Barra superior de estado de voz */}
      <div className={`${compact ? 'hidden' : 'flex'} items-center justify-between`}>
        <div className="flex items-center gap-2">
          {isTranscribing ? (
            <Loader2 className="w-4 h-4 text-emobi-yellow animate-spin" />
          ) : (
            <Radio className={`w-4 h-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-emobi-black'}`} />
          )}

          <span className="text-xs font-bold font-unbounded uppercase tracking-wider">
            {isTranscribing
              ? 'Transcribiendo con Whisper IA...'
              : isListening
              ? `Grabando tu voz (${formatTimer(recordingSeconds)})`
              : isAiSpeaking
              ? `${companionName} está hablando`
              : 'Voz en Espera'}
          </span>
        </div>

        {/* Ecualizador Reactivo Acústico Real */}
        <div className="flex items-end gap-1 h-6 px-2.5 glass-subtle rounded-full">
          {audioMeter.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                isListening
                  ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                  : isAiSpeaking
                  ? 'bg-emobi-yellow shadow-[0_0_6px_rgba(255,230,0,0.8)]'
                  : 'bg-emobi-black/25'
              }`}
              style={{ height: `${(isListening || isAiSpeaking) ? height : 15}%` }}
            />
          ))}
        </div>
      </div>

      {/* Previsualización en vivo o transcripción en proceso */}
      {!compact && (transcript || isTranscribing) && (
        <div className="bg-emobi-yellow/20 backdrop-blur-sm rounded-2xl border border-emobi-yellow/50 px-3.5 py-2.5 text-xs font-space text-emobi-black flex items-center justify-between gap-2">
          <p className="italic leading-relaxed flex-1">
            "{transcript || 'Escuchando con atención...'}"
          </p>
          {isTranscribing && (
            <span className="text-[10px] font-mono font-bold bg-emobi-black text-white px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse">
              WHISPER LARGE V3
            </span>
          )}
        </div>
      )}

      {/* Controles de Acción */}
      <div className="flex items-center gap-2">
        {isListening ? (
          <>
            <Button
              onClick={stopAndProcessRecording}
              variant="primary"
              className={`${compact ? 'w-11 h-11 !p-0 flex-none' : 'flex-1 py-3 text-sm'} bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)]`}
              disabled={disabled}
              aria-label="Enviar mensaje de voz"
              title="Enviar mensaje de voz"
            >
              <Check className={`w-4 h-4 ${compact ? '' : 'mr-1'}`} />
              {!compact && 'Enviar Mensaje de Voz'}
            </Button>

            <button
              type="button"
              onClick={cancelRecording}
              className={`${compact ? 'w-9 h-9' : 'w-12 h-12'} rounded-full glass-subtle hover:bg-emobi-black hover:text-white flex items-center justify-center transition-all shadow-glass-sm`}
              title="Cancelar grabación"
              aria-label="Cancelar grabación"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <Button
            onClick={startRecording}
            variant="primary"
            className={compact ? 'w-11 h-11 !p-0 flex-none' : 'flex-1 py-3 text-sm'}
            disabled={disabled || isAiSpeaking || isTranscribing}
            aria-label={isTranscribing ? 'Transcribiendo mensaje' : 'Grabar mensaje de voz'}
            title={isTranscribing ? 'Transcribiendo mensaje' : 'Grabar mensaje de voz'}
          >
            {isTranscribing ? (
              <>
                <Loader2 className={`w-4 h-4 animate-spin text-emobi-black ${compact ? '' : 'mr-1'}`} />
                {!compact && 'Procesando con Whisper IA...'}
              </>
            ) : (
              <>
                <Mic className={`w-4 h-4 ${compact ? '' : 'mr-1'}`} />
                {!compact && 'Hablar por Voz (Whisper IA)'}
              </>
            )}
          </Button>
        )}
      </div>

      <div className={`${compact ? 'hidden' : 'flex'} items-center justify-between text-[10px] text-emobi-black/45 font-mono px-1`}>
        <span>Reconocimiento: Whisper Large v3 (Groq)</span>
        <span>Síntesis: Neural HD Humana</span>
      </div>
      <AppDialog
        isOpen={Boolean(dialogMessage)}
        title="No se pudo iniciar la grabación"
        message={dialogMessage}
        onConfirm={() => setDialogMessage('')}
      />
    </div>
  );
};

export default VoiceChat;
