import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus,
  Sparkles,
  MapPin,
  UsersRound,
  ChevronRight,
  ChevronLeft,
  X,
  LogOut
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CubistGridPattern } from '../assets/cubist-elements';
import { CompanionBubble } from '../components/CompanionBubble';
import { useUiActions } from '../context/UiActions';
import { AppDialog } from '../components/ui/AppDialog';
import { useAuth } from '../context/AuthContext';

const introSeenKey = userId => `emobi_welcome_intro_seen_${userId}`;
const markIntroSeen = userId => {
  try { localStorage.setItem(introSeenKey(userId), 'true'); } catch (err) {}
};
const hasSeenIntro = userId => {
  try { return localStorage.getItem(introSeenKey(userId)) === 'true'; } catch (err) { return false; }
};
const INTRO_STEPS = [
  {
    eyebrow: 'BIENVENIDO A EMOBI',
    title: 'Un espacio para conectar',
    description: 'Crea compañeros IA con personalidad, recuerdos y una forma propia de acompañarte.',
    icon: Sparkles,
  },
  {
    eyebrow: 'A SU PROPIO RITMO',
    title: 'Compañeros con vida propia',
    description: 'Cada compañero tiene sus intereses, su rutina diaria y una voz con la que puedes conversar.',
    icon: UsersRound,
  },
  {
    eyebrow: 'TU HISTORIA EMPIEZA AQUÍ',
    title: 'Crea tu primer compañero',
    description: 'Elige su personalidad, apariencia y voz. Después podrás conversar con él cuando quieras.',
    icon: Plus,
  },
];

export const Home = () => {
  const navigate = useNavigate();
  const ui = useUiActions();
  const { user, signOut } = useAuth();
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoutine, setSelectedRoutine] = useState(null); // Companion for modal
  const [companionToDelete, setCompanionToDelete] = useState(null);
  const [introStep, setIntroStep] = useState(null);

  useEffect(() => {
    loadCompanions();
  }, []);

  // Publica las acciones de esta pantalla en el Dock inferior
  useEffect(() => {
    ui.register({
      openSettings: () => navigate('/settings'),
      openRoutine: null,
      voiceAutoPlay: null,
      toggleVoice: null,
    });
    return () => ui.clear(['openSettings']);
  }, [navigate]);

  const loadCompanions = async () => {
    try {
      setLoading(true);
      const data = await api.getCompanions();
      const nextCompanions = data || [];
      setCompanions(nextCompanions);
      if (nextCompanions.length > 0) {
        markIntroSeen(user.id);
      } else if (!hasSeenIntro(user.id)) {
        setIntroStep(0);
      }
    } catch (err) {
      console.error('Error cargando compañeros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (introStep === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [introStep]);

  const finishIntro = () => {
    markIntroSeen(user.id);
    setIntroStep(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col pb-32">
      <CubistGridPattern />

      {/* Cabecera compacta de marca (sin navbar: la navegación vive en el Dock inferior) */}
      <header className="px-4 lg:px-8 pt-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-emobi-yellow/90 backdrop-blur-md rounded-2xl shadow-glow-yellow flex items-center justify-center font-black font-unbounded text-base">
            E
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black font-syne tracking-tight text-emobi-black flex items-center gap-2">EMOBI</h1>
            <p className="text-[11px] text-emobi-black/50 font-space font-medium">Relaciones Humanas Aumentadas</p>
          </div>
          <span className="hidden sm:block text-xs font-bold text-emobi-black/55 font-space">{user.username}</span>
          <button type="button" onClick={signOut} className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center hover:bg-emobi-yellow/50 transition-colors" title="Cerrar sesión" aria-label="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Grid de Compañeros */}
      <main className="px-4 lg:px-8 pb-4 max-w-7xl mx-auto w-full flex-1">
        <div className="flex flex-col items-center gap-0.5 mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-black font-syne text-emobi-black uppercase text-center">
              Tus Compañeros
            </h3>
            <span className="text-xs font-mono font-bold bg-emobi-black/85 text-white rounded-full px-2 py-0.5">
              {companions.length}
            </span>
          </div>
          <p className="text-[11px] text-emobi-black/50 font-space">
            Toca un rostro para conversar
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 justify-items-center">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full glass animate-pulse" />
                <div className="mt-3 h-3 w-20 rounded-full glass animate-pulse" />
                <div className="mt-2 h-2 w-14 rounded-full glass animate-pulse" />
              </div>
            ))}
          </div>
        ) : companions.length === 0 ? (
          <Card className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-emobi-yellow/80 backdrop-blur-md rounded-full shadow-glow-yellow flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-emobi-black" />
            </div>
            <h4 className="text-xl font-bold font-syne mb-2">No tienes compañeros aún</h4>
            <p className="text-sm text-emobi-black/60 font-space max-w-md mb-6">
              Diseña una presencia única con su propia rutina, tono de voz y rostro interactivo con animación lip-sync.
            </p>
            <Button onClick={() => navigate('/create')} variant="primary" icon={Plus}>
              Crear Compañero Ahora
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 justify-items-center">
            {companions.map((comp, i) => (
              <CompanionBubble
                key={comp.id}
                companion={comp}
                index={i + 1}
                onRoutine={setSelectedRoutine}
                onDelete={(id) => setCompanionToDelete(id)}
              />
            ))}

            {/* Burbuja "Añadir" — patrón intuitivo de app móvil */}
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="flex flex-col items-center group"
              aria-label="Crear nuevo compañero"
            >
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full glass-subtle border-2 border-dashed border-emobi-black/20 flex items-center justify-center transition-all group-hover:border-emobi-black/40 group-hover:bg-emobi-yellow/25 group-active:scale-95">
                <Plus className="w-8 h-8 text-emobi-black/60 group-hover:text-emobi-black transition-colors" />
              </div>
              <h4 className="mt-3 text-sm font-black font-syne text-emobi-black/60 group-hover:text-emobi-black transition-colors">
                Añadir
              </h4>
              <p className="text-[11px] text-emobi-black/40 font-space font-medium">Nuevo compañero</p>
            </button>
          </div>
        )}
      </main>

      {/* Modal de Rutina de 24h — bottom sheet en móvil */}
      {selectedRoutine && (
        <div
          className="fixed inset-0 z-50 bg-emobi-black/35 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setSelectedRoutine(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative glass-strong rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-lg w-full shadow-glass-xl p-6 pb-8 max-h-[85vh] overflow-y-auto"
          >
            {/* Asa de arrastre */}
            <div className="sm:hidden w-12 h-1.5 rounded-full bg-emobi-black/20 mx-auto mb-4" />

            <div className="flex items-center justify-between pb-4 mb-4 border-b border-emobi-black/10">
              <div>
                <h4 className="text-xl font-black font-syne">
                  Rutina Diaria de {selectedRoutine.name}
                </h4>
                <p className="text-xs text-emobi-black/50 font-space">
                  Vida autónoma y horarios que sigue a lo largo del día
                </p>
              </div>
              <button
                onClick={() => setSelectedRoutine(null)}
                className="bg-emobi-yellow/80 backdrop-blur-md hover:bg-emobi-black hover:text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {(selectedRoutine.routine || []).map((step, idx) => (
                <div key={idx} className="glass-subtle rounded-2xl p-3.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="bg-emobi-black/85 text-white rounded-full px-2.5 py-0.5 text-xs font-mono font-bold">
                      {step.time}
                    </span>
                    <span className="text-xs font-bold uppercase font-unbounded text-emobi-black/80">
                      {step.mood}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm font-space text-emobi-black mt-1">
                    {step.title}
                  </h5>
                  <p className="text-xs text-emobi-black/55 font-space">
                    {step.description}
                  </p>
                  <span className="text-[11px] text-emobi-black/45 flex items-center gap-1 mt-1 font-mono">
                    <MapPin className="w-3 h-3 text-emobi-yellow-warm" /> {step.location}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-emobi-black/10 flex justify-end">
              <Button onClick={() => setSelectedRoutine(null)} variant="dark" size="sm">
                Cerrar Rutina
              </Button>
            </div>
          </div>
        </div>
      )}

      <AppDialog
        isOpen={Boolean(companionToDelete)}
        title="Despedir compañero"
        message="¿Seguro que deseas despedirte de este compañero? Esta acción no se puede deshacer."
        confirmLabel="Despedir"
        tone="danger"
        onCancel={() => setCompanionToDelete(null)}
        onConfirm={async () => {
          const id = companionToDelete;
          setCompanionToDelete(null);
          try {
            await api.deleteCompanion(id);
            await loadCompanions();
          } catch (err) {
            console.error('Error eliminando compañero:', err);
          }
        }}
      />
      {introStep !== null && (
        <div className="fixed inset-0 z-[80] min-h-[100dvh] overflow-y-auto bg-emobi-gray-light/95 backdrop-blur-xl flex items-center justify-center p-5 sm:p-8 emobi-intro-enter">
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="absolute w-[32rem] h-[32rem] -top-48 -right-32 rounded-full bg-emobi-yellow/35 blur-3xl" />
            <div className="absolute w-[28rem] h-[28rem] -bottom-48 -left-32 rounded-full bg-emobi-yellow-warm/25 blur-3xl" />
            <CubistGridPattern />
          </div>
          <button
            type="button"
            onClick={finishIntro}
            className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full glass-subtle flex items-center justify-center hover:bg-emobi-yellow/50 transition-colors"
            aria-label="Cerrar introducción"
          >
            <X className="w-5 h-5" />
          </button>
          <section
            key={introStep}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            className="relative z-10 w-full max-w-3xl text-center emobi-intro-step"
          >
            {(() => {
              const current = INTRO_STEPS[introStep];
              const StepIcon = current.icon;
              return <>
                <div className="mx-auto mb-8 w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] bg-emobi-yellow/75 shadow-glow-yellow flex items-center justify-center rotate-3">
                  <StepIcon className="w-11 h-11 sm:w-12 sm:h-12 text-emobi-black" strokeWidth={1.8} />
                </div>
                <p className="text-xs sm:text-sm font-bold tracking-[0.22em] text-emobi-black/50 font-unbounded mb-4">{current.eyebrow}</p>
                <h2 id="welcome-title" className="text-4xl sm:text-6xl md:text-7xl font-black font-syne tracking-tight text-emobi-black leading-[1.05]">{current.title}</h2>
                <p className="max-w-xl mx-auto mt-6 text-base sm:text-lg leading-relaxed text-emobi-black/65 font-space">{current.description}</p>
              </>;
            })()}
            <div className="flex justify-center gap-2 mt-10" aria-label={`Paso ${introStep + 1} de ${INTRO_STEPS.length}`}>
              {INTRO_STEPS.map((_, index) => (
                <span key={index} className={`h-1.5 rounded-full transition-all duration-500 ${index === introStep ? 'w-10 bg-emobi-black' : 'w-1.5 bg-emobi-black/20'}`} />
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-3">
              {introStep > 0 && (
                <Button variant="outline" onClick={() => setIntroStep(step => step - 1)} icon={ChevronLeft}>
                  Atrás
                </Button>
              )}
              {introStep < INTRO_STEPS.length - 1 ? (
                <Button variant="primary" size="lg" onClick={() => setIntroStep(step => step + 1)}>
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button variant="primary" size="lg" onClick={() => { finishIntro(); navigate('/create'); }} icon={Plus}>
                  Crear mi primer compañero
                </Button>
              )}
            </div>
            <button type="button" onClick={finishIntro} className="mt-5 text-xs font-space font-medium text-emobi-black/45 hover:text-emobi-black/75 transition-colors">
              {introStep === INTRO_STEPS.length - 1 ? 'Lo haré más tarde' : 'Saltar introducción'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
};
