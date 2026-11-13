/**
 * Motor de Voz Ultra-Realista y Analizador Acústico para Lip-Sync
 * Soporta ElevenLabs Audio Streaming y Web Speech API con Voces Naturales Neurales
 */

class VoiceService {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.sourceNode = null;
    this.animationId = null;
    this.availableVoices = [];
    this.currentAudio = null;
    this.isSpeaking = false;

    // Inicializar voces del navegador
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadBrowserVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadBrowserVoices();
    }
  }

  loadBrowserVoices() {
    if (!window.speechSynthesis) return [];
    this.availableVoices = window.speechSynthesis.getVoices();
    return this.availableVoices;
  }

  // Filtro estricto contra sintetizadores robóticos obsoletos del SO (espeak, mbrola, etc.)
  isRoboticVoice(voice) {
    if (!voice || !voice.name) return true;
    const name = voice.name.toLowerCase();
    return (
      name.includes('espeak') ||
      name.includes('klatt') ||
      name.includes('festival') ||
      name.includes('mbrola') ||
      name.includes('dummy') ||
      name.includes('generic')
    );
  }

  // Genera URL de voz humana en caso de que el sistema operativo no tenga voces neurales instaladas
  generateClientHumanVoice(text, gender = 'female') {
    const clean = (text || '')
      .replace(/\[(?:emocion|emoción):\s*[^\]]+\]/gi, '')
      .replace(/\((?:emocion|emoción):\s*[^)]+\)/gi, '')
      .replace(/\*([^*]+)\*/g, '')
      .trim();

    if (!clean) return null;
    const lang = gender === 'male' ? 'es-ES' : 'es-US';
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(clean.slice(0, 190))}`;
  }

  // Encuentra la voz más realista y natural en español (Microsoft Neural, Google o Apple)
  getBestNaturalVoice(preferredGender = 'female') {
    const voices = this.availableVoices.length > 0 ? this.availableVoices : this.loadBrowserVoices();
    const isFemale = preferredGender === 'female';

    // 1. Filtrar voces en español excluyendo sintetizadores robóticos (espeak)
    const validSpanish = voices.filter(v => v.lang.startsWith('es') && !this.isRoboticVoice(v));
    
    // Prioridad a voces neuronales/naturales de Microsoft, Google o Apple
    const naturalVoice = validSpanish.find(v => {
      const name = v.name.toLowerCase();
      const matchesGender = isFemale 
        ? (name.includes('elvira') || name.includes('monica') || name.includes('paulina') || name.includes('paloma') || name.includes('laura') || name.includes('female') || name.includes('dalia') || name.includes('elena'))
        : (name.includes('alvaro') || name.includes('jorge') || name.includes('pablo') || name.includes('diego') || name.includes('male') || name.includes('tomas') || name.includes('gonzalo'));
      return (name.includes('natural') || name.includes('neural') || name.includes('google') || name.includes('premium') || name.includes('online')) && matchesGender;
    });

    if (naturalVoice) return naturalVoice;

    // Cualquier voz neural en español de alta calidad
    const anyNeural = validSpanish.find(v => {
      const name = v.name.toLowerCase();
      return name.includes('natural') || name.includes('neural') || name.includes('google') || name.includes('online');
    });

    if (anyNeural) return anyNeural;

    // Segunda opción: Cualquier voz válida en español que no sea robótica
    if (validSpanish.length > 0) return validSpanish[0];

    // Si solo hay voces robóticas del sistema operativo (espeak en Linux), devolver null para activar fallback humano
    return null;
  }

  // Inicializar Web Audio Context para análisis acústico FFT
  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.5;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Iniciar monitoreo acústico del audio que se reproduce para Lip-Sync físico
  startAcousticAnalysis(onAudioFrame) {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      if (!this.isSpeaking) return;

      this.analyser.getByteFrequencyData(dataArray);

      // Calcular energía por bandas de frecuencia
      // Graves (60 - 250Hz): apertura vertical de mandíbula
      let bass = 0;
      for (let i = 1; i <= 6; i++) bass += dataArray[i];
      bass = bass / (6 * 255);

      // Medios (250 - 2000Hz): fonemas vocálicos A, E
      let mid = 0;
      for (let i = 7; i <= 24; i++) mid += dataArray[i];
      mid = mid / (18 * 255);

      // Agudos (2000 - 6000Hz): consonantes sibilantes S, T, F
      let high = 0;
      for (let i = 25; i <= 50; i++) high += dataArray[i];
      high = high / (26 * 255);

      // Nivel RMS promedio
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const rms = sum / (bufferLength * 255);

      if (onAudioFrame) {
        onAudioFrame({
          rms: Math.min(1, rms * 2.2),
          bass,
          mid,
          high,
          speaking: rms > 0.04
        });
      }

      this.animationId = requestAnimationFrame(checkAudio);
    };

    this.animationId = requestAnimationFrame(checkAudio);
  }

  // Reproducir audio realista desde buffer / URL (ElevenLabs) con Lip-Sync conectado
  async playRealisticAudio(audioDataUri, onAudioFrame, onEnded, playbackRate = 1.14) {
    this.stop();
    this.initAudioContext();
    this.isSpeaking = true;

    try {
      const audio = new Audio(audioDataUri);
      audio.playbackRate = playbackRate;
      audio.preservesPitch = true;
      audio.mozPreservesPitch = true;
      audio.webkitPreservesPitch = true;
      this.currentAudio = audio;

      if (this.audioCtx && this.analyser) {
        try {
          const source = this.audioCtx.createMediaElementSource(audio);
          source.connect(this.analyser);
          this.analyser.connect(this.audioCtx.destination);
          this.startAcousticAnalysis(onAudioFrame);
        } catch (e) {
          console.warn('CORS/MediaElementSource fallback simulado:', e);
          this.startSimulatedAnalysis(onAudioFrame);
        }
      } else {
        this.startSimulatedAnalysis(onAudioFrame);
      }

      audio.onended = () => {
        this.stop();
        if (onEnded) onEnded();
      };

      audio.onerror = (err) => {
        console.warn('Error en reproducción de audio:', err);
        this.stop();
        if (onEnded) onEnded();
      };

      await audio.play();
      return true;
    } catch (err) {
      console.error('Error al reproducir voz realista:', err);
      this.stop();
      if (onEnded) onEnded();
      return false;
    }
  }

  // Reproducir voz mediante Web Speech API optimizada con entonación natural
  speakWithNaturalVoice(text, options = {}, onAudioFrame, onEnded) {
    this.stop();
    if (!window.speechSynthesis) {
      if (onEnded) onEnded();
      return;
    }

    const { gender = 'female', rate = 1.16, pitch = 1.0 } = options;
    const voice = this.getBestNaturalVoice(gender);

    // Si el sistema no tiene voces naturales (ej. Linux con solo espeak robótico),
    // reproducir mediante streaming de audio neural humano en lugar de sonar robótico!
    if (!voice) {
      const audioUrl = this.generateClientHumanVoice(text, gender);
      if (audioUrl) {
        this.playRealisticAudio(audioUrl, onAudioFrame, onEnded);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'es-ES';
    }

    // Parámetros de cadencia y entonación humana
    utterance.rate = rate;
    utterance.pitch = gender === 'female' ? 1.05 : 0.95;

    this.isSpeaking = true;
    this.startSimulatedAnalysis(onAudioFrame);

    utterance.onend = () => {
      this.stop();
      if (onEnded) onEnded();
    };

    utterance.onerror = () => {
      this.stop();
      if (onEnded) onEnded();
    };

    window.speechSynthesis.speak(utterance);
  }

  // Simulación acústica realista para síntesis nativa cuando AudioContext no tiene acceso directo al pipeline del SO
  startSimulatedAnalysis(onAudioFrame) {
    let t = 0;
    const loop = () => {
      if (!this.isSpeaking) return;
      t += 0.15;
      // Ondas acústicas orgánicas moduladas
      const rms = Math.max(0.1, (Math.sin(t * 8) * 0.4 + Math.sin(t * 14) * 0.3 + 0.5) * 0.8);
      const mid = rms * 0.9;
      const bass = (Math.sin(t * 4) * 0.5 + 0.5) * rms;
      const high = (Math.cos(t * 12) * 0.5 + 0.5) * rms;

      if (onAudioFrame) {
        onAudioFrame({ rms, bass, mid, high, speaking: true });
      }

      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stop() {
    this.isSpeaking = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceService = new VoiceService();
