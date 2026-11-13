import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserRound, Shield, SlidersHorizontal, Check, LogOut } from 'lucide-react';
import { AiSettingsModal } from '../components/AiSettingsModal';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { CubistGridPattern } from '../assets/cubist-elements';
import { useAuth } from '../context/AuthContext';

const SECTIONS = [
  { id: 'profile', label: 'Perfil', description: 'Configurar perfil', icon: UserRound },
  { id: 'security', label: 'Seguridad', description: 'Privacidad y acceso', icon: Shield },
  { id: 'advanced', label: 'Configuración Avanzada', description: 'IA y voces', icon: SlidersHorizontal },
];

const readProfile = (userId, fallbackName) => {
  try {
    return { name: fallbackName || '', about: '', ...JSON.parse(localStorage.getItem(`emobi_profile_${userId}`) || '{}') };
  } catch (err) {
    return { name: fallbackName || '', about: '' };
  }
};

export const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState(location.state?.section || 'profile');
  const [profile, setProfile] = useState(() => readProfile(user.id, user.name || user.username));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (SECTIONS.some(section => section.id === location.state?.section)) {
      setActiveSection(location.state.section);
    }
  }, [location.state]);

  const saveProfile = () => {
    try {
      localStorage.setItem(`emobi_profile_${user.id}`, JSON.stringify(profile));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('No se pudo guardar el perfil:', err);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col pb-32">
      <CubistGridPattern />
      <header className="relative z-10 px-4 lg:px-8 pt-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center hover:bg-emobi-yellow/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-syne text-emobi-black">Configuración</h1>
            <p className="text-xs text-emobi-black/50 font-space">Personaliza tu experiencia en Emobi</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-xs font-bold text-emobi-black/55 font-space">{user.username}</span>
            <button type="button" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión" className="w-10 h-10 rounded-full glass-subtle flex items-center justify-center hover:bg-emobi-yellow/50 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 lg:px-8 py-7 max-w-6xl mx-auto w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-5 lg:gap-8 items-start">
          <nav aria-label="Secciones de configuración" className="glass rounded-3xl p-2 flex lg:flex-col gap-2 overflow-x-auto">
            {SECTIONS.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                aria-current={activeSection === id ? 'page' : undefined}
                className={`flex-1 lg:flex-none min-w-[135px] lg:min-w-0 text-left rounded-2xl px-3 py-3 flex items-center gap-3 transition-colors ${activeSection === id ? 'bg-emobi-yellow/80 shadow-glow-yellow text-emobi-black' : 'hover:bg-white/65 text-emobi-black/65'}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-xs font-bold font-unbounded truncate">{label}</span>
                  <span className="hidden lg:block text-[10px] font-space opacity-65 mt-0.5">{description}</span>
                </span>
              </button>
            ))}
          </nav>

          <section className="min-w-0">
            {activeSection === 'profile' && (
              <div className="glass-strong rounded-3xl p-5 sm:p-7">
                <div className="mb-6">
                  <h2 className="text-xl font-black font-syne">Configurar perfil</h2>
                  <p className="text-sm text-emobi-black/55 font-space mt-1">Personaliza cómo aparece tu perfil en este dispositivo.</p>
                </div>
                <div className="space-y-5 max-w-2xl">
                  <Input
                    label="Nombre"
                    placeholder="¿Cómo te llamas?"
                    value={profile.name}
                    onChange={event => setProfile(current => ({ ...current, name: event.target.value }))}
                    autoComplete="name"
                  />
                  <Textarea
                    label="Sobre ti"
                    placeholder="Cuéntanos un poco sobre ti (opcional)"
                    value={profile.about}
                    onChange={event => setProfile(current => ({ ...current, about: event.target.value }))}
                    rows={4}
                    maxLength={300}
                  />
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-emobi-black/45 font-space">El perfil se guarda localmente en este dispositivo.</p>
                    <Button variant="primary" onClick={saveProfile} icon={Check}>{saved ? 'Guardado' : 'Guardar perfil'}</Button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="glass-strong rounded-3xl p-5 sm:p-7">
                <div className="mb-6">
                  <h2 className="text-xl font-black font-syne">Seguridad</h2>
                  <p className="text-sm text-emobi-black/55 font-space mt-1">Información sobre el acceso y los datos guardados por Emobi.</p>
                </div>
                <div className="space-y-4">
                  <article className="glass-subtle rounded-2xl p-4 sm:p-5">
                    <h3 className="text-sm font-bold font-unbounded">Sesiones</h3>
                    <p className="text-sm text-emobi-black/60 font-space mt-2 leading-relaxed">Las sesiones duran hasta 30 días. Al cerrar sesión, Emobi revoca la sesión activa en el servidor.</p>
                  </article>
                  <article className="glass-subtle rounded-2xl p-4 sm:p-5">
                    <h3 className="text-sm font-bold font-unbounded">Claves de servicios de IA</h3>
                    <p className="text-sm text-emobi-black/60 font-space mt-2 leading-relaxed">Las claves API que ingresas se guardan localmente en este navegador y se separan por usuario. Puedes administrarlas en Configuración Avanzada.</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setActiveSection('advanced')}>Ir a Configuración Avanzada</Button>
                  </article>
                </div>
              </div>
            )}

            {activeSection === 'advanced' && (
              <div>
                <div className="mb-4 px-1">
                  <h2 className="text-xl font-black font-syne">Configuración Avanzada</h2>
                  <p className="text-sm text-emobi-black/55 font-space mt-1">Configura los proveedores de IA y las voces de tus compañeros.</p>
                </div>
                <AiSettingsModal isOpen onClose={() => {}} embedded />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
