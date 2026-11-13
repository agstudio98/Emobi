import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageCircle, PhoneCall, Trash2 } from 'lucide-react';
import { AvatarMini } from '../avatar3d/AvatarMini';
import { presetForCompanion } from '../avatar3d/config';

/**
 * Tarjeta circular de compañero, optimizada para móvil.
 * El avatar 3D es el protagonista (círculo con anillo de afinidad),
 * y las acciones secundarias aparecen como botones circulares.
 */
export const CompanionBubble = ({ companion, onRoutine, onDelete, index = 1 }) => {
  const navigate = useNavigate();

  const affinity = Math.min(100, Math.max(0, Number(companion.affinity ?? 75)));
  const age = companion.age;
  const activity = companion.currentActivity;
  const traits = (companion.traits || []).slice(0, 2);

  // Si el compañero no tiene avatar 3D guardado, se genera uno coherente
  const avatar3d = companion.avatar3d || presetForCompanion(companion);

  return (
    <div className="flex flex-col items-center">
      {/* Avatar 3D circular con anillo de afinidad */}
      <button
        type="button"
        onClick={() => navigate(`/chat/${companion.id}`)}
        className="relative group"
        aria-label={`Abrir conversación con ${companion.name}`}
      >
        <div
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[3px] transition-transform duration-300 group-hover:scale-[1.04] group-active:scale-95"
          style={{
            background: `conic-gradient(#FFE600 ${affinity}%, rgba(17,17,17,0.10) ${affinity}% 100%)`,
          }}
        >
          <div className="w-full h-full rounded-full p-[3px] glass-strong overflow-hidden">
            <div className="w-full h-full rounded-full overflow-hidden bg-emobi-yellow/20">
              <AvatarMini
                avatar3d={avatar3d}
                emotion={companion.currentActivity?.mood}
                className="w-full h-full"
                index={index}
              />
            </div>
          </div>
        </div>

        {/* Indicador de estado en vivo */}
        <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center shadow-glass-sm">
          <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.9)] animate-pulse" />
        </span>

        {/* Porcentaje de afinidad */}
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 bg-emobi-black/85 text-white text-[10px] font-mono font-bold rounded-full px-2 py-0.5">
          {affinity}%
        </span>
      </button>

      {/* Nombre y ocupación */}
      <h4 className="mt-3 text-base font-black font-syne text-emobi-black text-center leading-tight max-w-[9rem] truncate">
        {companion.name}
      </h4>
      <p className="text-[11px] text-emobi-black/50 font-space font-medium text-center max-w-[9rem] truncate">
        {companion.occupation || companion.archetype}
        {age ? ` • ${age}` : ''}
      </p>

      {/* Estado "ahora mismo" */}
      {activity?.title && (
        <p className="mt-1.5 text-[10px] text-emobi-black/60 font-space text-center max-w-[9.5rem] truncate">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emobi-yellow-warm mr-1 align-middle" />
          {activity.title}
        </p>
      )}

      {/* Acciones circulares */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(`/chat/${companion.id}`)}
          className="w-10 h-10 rounded-full bg-emobi-yellow/90 flex items-center justify-center shadow-glow-yellow hover:bg-emobi-yellow active:scale-95 transition-all"
          title="Hablar"
          aria-label={`Hablar con ${companion.name}`}
        >
          <MessageCircle className="w-4 h-4 text-emobi-black" />
        </button>

        <button
          type="button"
          onClick={() => navigate(`/chat/${companion.id}?voice=true`)}
          className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center hover:bg-white/70 active:scale-95 transition-all"
          title="Llamar"
          aria-label={`Llamar a ${companion.name}`}
        >
          <PhoneCall className="w-4 h-4 text-emobi-black" />
        </button>

        <button
          type="button"
          onClick={() => onRoutine?.(companion)}
          className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center hover:bg-white/70 active:scale-95 transition-all"
          title="Ver rutina"
          aria-label={`Ver rutina de ${companion.name}`}
        >
          <Calendar className="w-4 h-4 text-emobi-black" />
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(companion.id)}
          className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center hover:bg-red-500 hover:text-white active:scale-95 transition-all"
          title="Eliminar"
          aria-label={`Eliminar a ${companion.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Rasgos rápidos */}
      {traits.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1 max-w-[10rem]">
          {traits.map((trait, idx) => (
            <span
              key={idx}
              className="text-[9px] font-bold font-unbounded uppercase tracking-wide text-emobi-black/55 bg-white/50 backdrop-blur-sm rounded-full px-2 py-0.5"
            >
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
