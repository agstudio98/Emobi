import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CubistGridPattern } from '../assets/cubist-elements';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{1,18}[A-Za-z0-9]$/;
const PASSWORD_RULES = [
  { label: 'Entre 12 y 128 caracteres', test: value => value.length >= 12 && value.length <= 128 },
  { label: 'Una letra mayúscula y una minúscula', test: value => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'Un número y un símbolo', test: value => /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value) },
  { label: 'Sin espacios', test: value => value.length > 0 && !/\s/.test(value) },
];

const validateEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;

export const AuthScreen = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const signInGoogleRef = useRef(signInWithGoogle);
  signInGoogleRef.current = signInWithGoogle;
  const [mode, setMode] = useState('welcome');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return undefined;
    let active = true;
    const renderGoogleButton = () => {
      if (!active || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setBusy(true);
          setGoogleError('');
          try {
            await signInGoogleRef.current(credential);
            navigate('/');
          } catch (err) {
            setGoogleError(err.message);
            setBusy(false);
          }
        },
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: Math.min(360, googleButtonRef.current.clientWidth || 360),
        locale: 'es',
      });
    };

    const existingScript = document.getElementById('google-identity-services');
    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderGoogleButton);
    } else {
      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      script.onerror = () => setGoogleError('No se pudo cargar el acceso de Google.');
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      existingScript?.removeEventListener('load', renderGoogleButton);
    };
  }, [navigate]);

  const resetMessages = () => {
    setError('');
    setGoogleError('');
  };

  const switchMode = nextMode => {
    resetMessages();
    setMode(nextMode);
  };

  const submit = async event => {
    event.preventDefault();
    resetMessages();
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (mode === 'register') {
      if (!USERNAME_PATTERN.test(username)) {
        setError('El usuario debe tener de 3 a 20 caracteres, solo letras sin acentos, números, punto, guion o guion bajo; empieza y termina con letra o número.');
        return;
      }
      const unmetRule = PASSWORD_RULES.find(rule => !rule.test(password));
      if (unmetRule) {
        setError(`La contraseña no cumple: ${unmetRule.label.toLowerCase()}.`);
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'register') await signUp({ username, email: normalizedEmail, password });
      else await signIn({ email: normalizedEmail, password });
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] overflow-y-auto flex items-center justify-center px-4 py-8 sm:px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute w-[34rem] h-[34rem] -top-52 -right-28 rounded-full bg-emobi-yellow/35 blur-3xl" />
        <div className="absolute w-[30rem] h-[30rem] -bottom-52 -left-28 rounded-full bg-emobi-yellow-warm/25 blur-3xl" />
        <CubistGridPattern />
      </div>

      <section className="relative z-10 w-full max-w-lg glass-strong rounded-[2.5rem] p-6 sm:p-9 shadow-glass-xl">
        {mode !== 'welcome' && (
          <button type="button" onClick={() => switchMode('welcome')} className="mb-5 flex items-center gap-1.5 text-sm font-bold text-emobi-black/55 hover:text-emobi-black transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        )}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emobi-yellow/85 shadow-glow-yellow flex items-center justify-center font-black font-syne text-2xl">E</div>
          <p className="mt-5 text-[10px] font-bold tracking-[0.24em] text-emobi-black/45 font-unbounded">EMOBI</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black font-syne text-emobi-black">
            {mode === 'welcome' ? 'Bienvenido' : mode === 'register' ? 'Crea tu cuenta' : 'Inicia sesión'}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-emobi-black/60 font-space leading-relaxed">
            {mode === 'welcome'
              ? 'Inicia sesión o crea tu cuenta para entrar a tu espacio en Emobi.'
              : mode === 'register'
                ? 'Crea una cuenta para guardar tus compañeros y continuar cuando vuelvas.'
                : 'Vuelve a conversar con tus compañeros.'}
          </p>
        </div>

        {mode === 'welcome' ? (
          <div className="mt-8 space-y-3">
            <Button variant="primary" size="lg" className="w-full" onClick={() => switchMode('login')} icon={KeyRound}>
              Iniciar sesión
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={() => switchMode('register')} icon={UserRound}>
              Crear cuenta
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'register' && (
              <Input
                label="Nombre de usuario"
                placeholder="ej. ana_rios"
                value={username}
                onChange={event => setUsername(event.target.value)}
                minLength={3}
                maxLength={20}
                autoComplete="username"
                required
              />
            )}
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={254}
              required
            />
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Crea una contraseña segura' : 'Tu contraseña'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                maxLength={128}
                required
              />
              <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-8 p-2 text-emobi-black/45 hover:text-emobi-black">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {mode === 'register' && (
              <>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-space text-emobi-black/55" aria-label="Requisitos de contraseña">
                  {PASSWORD_RULES.map(rule => (
                    <li key={rule.label} className={rule.test(password) ? 'text-green-700' : ''}>
                      <span aria-hidden="true">{rule.test(password) ? '✓' : '•'}</span> {rule.label}
                    </li>
                  ))}
                </ul>
                <Input
                  label="Confirmar contraseña"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  maxLength={128}
                  required
                />
              </>
            )}
            {error && <p role="alert" className="rounded-2xl bg-red-500/10 border border-red-600/15 p-3 text-xs leading-relaxed text-red-800 font-space">{error}</p>}
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy} icon={ArrowRight}>
              {busy ? 'Un momento…' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
            </Button>
            <p className="text-center text-xs text-emobi-black/55 font-space">
              {mode === 'register' ? '¿Ya tienes cuenta?' : '¿Todavía no tienes cuenta?'}{' '}
              <button type="button" onClick={() => switchMode(mode === 'register' ? 'login' : 'register')} className="font-bold text-emobi-black underline underline-offset-2">
                {mode === 'register' ? 'Inicia sesión' : 'Crear cuenta'}
              </button>
            </p>
          </form>
        )}

        <div className="my-6 flex items-center gap-3 text-[10px] text-emobi-black/35 font-unbounded">
          <span className="h-px bg-emobi-black/10 flex-1" />
          O CONTINÚA CON
          <span className="h-px bg-emobi-black/10 flex-1" />
        </div>
        {GOOGLE_CLIENT_ID ? (
          <div ref={googleButtonRef} className="min-h-10 flex justify-center" />
        ) : (
          <button type="button" disabled className="w-full min-h-11 rounded-full border border-emobi-black/10 bg-white/40 text-xs font-bold text-emobi-black/35 flex items-center justify-center gap-2 cursor-not-allowed" title="El administrador debe configurar Google OAuth">
            <span className="font-black text-sm">G</span> Google no está configurado
          </button>
        )}
        {googleError && <p role="alert" className="mt-3 text-xs text-red-800 text-center font-space">{googleError}</p>}
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-emobi-black/40 font-space">
          <ShieldCheck className="w-3.5 h-3.5" /> Tus compañeros quedan asociados a tu cuenta.
        </div>
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-emobi-black/35 font-space">
          <Sparkles className="w-3 h-3" /> Un espacio propio para conversar y crear
        </div>
      </section>
    </main>
  );
};

export default AuthScreen;
