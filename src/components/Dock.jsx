import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Sparkles, Settings, Volume2, VolumeX, Calendar } from 'lucide-react';

/**
 * Dock inferior estilo app móvil (glassmorfista).
 * Reemplaza por completo al navbar superior.
 *
 * Props:
 *  - variant: 'default' | 'chat'
 *  - onSettings: abre Configuración
 *  - onRoutine: abre la rutina (solo chat)
 *  - voiceAutoPlay / onToggleVoice: control de voz (solo chat)
 */
export const Dock = ({
  variant = 'default',
  onSettings,
  onRoutine,
  voiceAutoPlay,
  onToggleVoice,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isCreate = location.pathname.startsWith('/create');
  const isChat = variant === 'chat' || location.pathname.startsWith('/chat');
  const isSettings = location.pathname.startsWith('/settings');

  const itemBase =
    'group relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2 rounded-2xl transition-all duration-200 select-none';

  const renderItem = ({ key, icon: Icon, label, active, onClick, accent = false, title }) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      title={title || label}
      className={`${itemBase} ${
        active
          ? 'bg-emobi-yellow/90 text-emobi-black shadow-glow-yellow'
          : accent
            ? 'bg-emobi-yellow/40 text-emobi-black hover:bg-emobi-yellow/70'
            : 'text-emobi-black/55 hover:bg-white/60 hover:text-emobi-black'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="text-[10px] font-unbounded font-bold tracking-wide truncate max-w-full px-1">
        {label}
      </span>
      {active && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-emobi-black/70" />
      )}
    </button>
  );

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-3 pb-3 pt-2 pointer-events-none">
      <div className="mx-auto max-w-md glass-strong rounded-[2rem] shadow-glass-xl px-2 py-1.5 flex items-center gap-1 pointer-events-auto">
        {renderItem({
          key: 'home',
          icon: Home,
          label: 'Inicio',
          active: isHome,
          onClick: () => navigate('/'),
        })}

        {renderItem({
          key: 'create',
          icon: PlusCircle,
          label: 'Crear',
          active: isCreate,
          accent: !isCreate,
          onClick: () => navigate('/create'),
        })}

        {isChat && onRoutine &&
          renderItem({
            key: 'routine',
            icon: Calendar,
            label: 'Rutina',
            onClick: onRoutine,
          })}

        {isChat && typeof voiceAutoPlay === 'boolean' && onToggleVoice &&
          renderItem({
            key: 'voice',
            icon: voiceAutoPlay ? Volume2 : VolumeX,
            label: voiceAutoPlay ? 'Voz' : 'Mudo',
            active: !voiceAutoPlay,
            onClick: onToggleVoice,
            title: voiceAutoPlay ? 'Silenciar voz' : 'Activar voz',
          })}

        {renderItem({
          key: 'settings',
          icon: Settings,
          label: 'Configuración',
          active: isSettings,
          onClick: onSettings || (() => navigate('/settings')),
        })}

        {isHome &&
          renderItem({
            key: 'sparkles',
            icon: Sparkles,
            label: 'Inspírame',
            onClick: () => navigate('/create'),
          })}
      </div>
    </nav>
  );
};
