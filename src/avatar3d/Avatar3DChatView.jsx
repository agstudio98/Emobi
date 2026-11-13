import React, { useState } from 'react';
import { Volume2, Sparkles, RefreshCw, Smile, Meh, HelpCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Avatar3D } from './Avatar3D';

const EMOTIONS = [
  { id: 'sonriendo', label: 'Sonriendo', icon: Smile },
  { id: 'pensativo', label: 'Pensativo', icon: HelpCircle },
  { id: 'sorprendido', label: 'Sorprendido', icon: AlertCircle },
  { id: 'neutral', label: 'Neutral', icon: Meh },
];

/**
 * Vista 3D Principal del Avatar para la pantalla de Chat.
 * Integra Lip-Sync acústico en tiempo real, OrbitControls para rotación táctil/ratón,
 * selector rápido de emociones y ecualizador visual interactivo.
 * Reemplaza completamente los avatares fotográficos 2D.
 */
export const Avatar3DChatView = ({
  avatar3d,
  companionName = 'Compañero',
  isSpeaking = false,
  acousticData = null,
  emotion = 'sonriendo',
  onEmotionChange,
  className = '',
}) => {
  const [autoRotate, setAutoRotate] = useState(false);
  const [keyReset, setKeyReset] = useState(0);

  // Detección o estimación de visema fonético para el display de depuración/status
  const currentViseme = React.useMemo(() => {
    if (!isSpeaking) return 'Cerrado';
    const rms = acousticData?.rms ?? 0.5;
    const mid = acousticData?.mid ?? 0.5;
    if (rms > 0.45) return mid > 0.4 ? 'Vocal [A/O]' : 'Vocal [O/U]';
    if (rms > 0.2) return 'Vocal [E/I]';
    return 'Consonante [M/P]';
  }, [isSpeaking, acousticData]);

  const handleResetCamera = () => {
    setAutoRotate(false);
    setKeyReset(prev => prev + 1);
  };

  return (
    <div className={`relative flex flex-col glass rounded-[2rem] overflow-hidden border border-white/60 shadow-glass ${className}`}>
      {/* Barra superior de estado */}
      <div className="w-full bg-emobi-yellow/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between text-xs font-unbounded font-bold text-emobi-black border-b border-emobi-black/10">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
              isSpeaking
                ? 'bg-red-500 animate-ping shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.9)]'
            }`}
          />
          <span className="truncate">{companionName}</span>
          <span className="text-[10px] font-mono font-medium opacity-60 hidden sm:inline">
            [AVATAR 3D]
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold transition-all ${
              isSpeaking
                ? 'bg-emobi-black text-emobi-yellow shadow-glass-yellow animate-pulse'
                : 'bg-white/70 text-emobi-black'
            }`}
          >
            {isSpeaking ? 'HABLANDO • LIP-SYNC 3D' : 'ESCUCHANDO'}
          </span>

          <button
            type="button"
            onClick={handleResetCamera}
            className="w-7 h-7 rounded-full bg-white/75 hover:bg-emobi-black hover:text-white flex items-center justify-center transition-all shadow-glass-sm"
            title="Centrar vista 3D"
            aria-label="Centrar vista 3D"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Escenario 3D interactivo con Three.js */}
      <div className="relative w-full aspect-[16/10] sm:aspect-square max-h-[24dvh] min-h-[132px] sm:max-h-[380px] sm:min-h-0 bg-gradient-to-b from-white/40 via-white/20 to-emobi-yellow/10 flex items-center justify-center overflow-hidden select-none">
        <Avatar3D
          key={keyReset}
          avatar3d={avatar3d}
          emotion={emotion}
          isSpeaking={isSpeaking}
          acousticData={acousticData}
          interactive={true}
          autoRotate={autoRotate}
          cameraPosition={[0, 0.28, 2.75]}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Indicador de Lip-Sync Acústico activo con ondas */}
        {isSpeaking && (
          <div className="absolute bottom-3 left-3 bg-emobi-black/90 backdrop-blur-md text-emobi-yellow rounded-full px-3 py-1.5 text-[11px] font-mono font-bold flex items-center gap-2 shadow-glass-yellow pointer-events-none">
            <Volume2 className="w-3.5 h-3.5 animate-bounce text-emobi-yellow" />
            <span>LIP-SYNC: {currentViseme}</span>
            {/* Barras animadas de ecualizador acústico */}
            <div className="flex items-end gap-0.5 h-3 ml-1">
              {[0.4, 0.9, 0.6, 1, 0.5, 0.8].map((mul, idx) => {
                const rmsVal = acousticData?.rms ?? 0.6;
                const h = Math.max(3, Math.min(12, Math.round(rmsVal * mul * 12)));
                return (
                  <span
                    key={idx}
                    className="w-1 bg-emobi-yellow rounded-full animate-pulse"
                    style={{ height: `${h}px` }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Pista interactiva sutil cuando está en reposo */}
        {!isSpeaking && (
          <div className="absolute bottom-3 left-3 bg-white/70 backdrop-blur-md text-emobi-black/60 rounded-full px-2.5 py-1 text-[10px] font-space font-medium pointer-events-none">
            Arrastra para rotar 360°
          </div>
        )}

        {/* Botón flotante para alternar giro automático */}
        <button
          type="button"
          onClick={() => setAutoRotate(prev => !prev)}
          className={`absolute top-3 right-3 rounded-full p-2 text-xs font-bold transition-all shadow-glass-sm ${
            autoRotate
              ? 'bg-emobi-yellow text-emobi-black ring-2 ring-emobi-black'
              : 'bg-white/80 text-emobi-black/70 hover:bg-white hover:text-emobi-black'
          }`}
          title={autoRotate ? 'Detener giro automático' : 'Activar giro automático suave'}
          aria-label="Alternar giro automático"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Selector Rápido de Emociones y Gestos 3D */}
      <div className="w-full glass-subtle rounded-none border-0 px-3.5 py-2.5 flex items-center justify-between gap-2 border-t border-emobi-black/10">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          <span className="text-[10px] font-unbounded font-bold text-emobi-black/50 uppercase mr-1 hidden sm:inline">
            Expresión:
          </span>
          {EMOTIONS.map(em => {
            const Icon = em.icon;
            const isActive = emotion === em.id;
            return (
              <button
                key={em.id}
                type="button"
                onClick={() => onEmotionChange?.(em.id)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-unbounded font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emobi-black text-white shadow-glass-sm scale-105'
                    : 'bg-white/60 text-emobi-black/70 hover:bg-white hover:text-emobi-black'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-emobi-yellow' : ''}`} />
                <span>{em.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-[10px] font-mono text-emobi-black/50 flex-shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emobi-yellow-warm" />
          <span className="hidden md:inline">Procedural 3D</span>
        </div>
      </div>
    </div>
  );
};

export default Avatar3DChatView;
