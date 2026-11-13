import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Smile, 
  Clock, 
  Check, 
  Palette,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Textarea, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { CubistGridPattern } from '../assets/cubist-elements';
import { useUiActions } from '../context/UiActions';
import { Avatar3D } from '../avatar3d/Avatar3D';
import { AppDialog } from '../components/ui/AppDialog';
import {
  presetForCompanion,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  OUTFIT_COLORS,
  HAIR_STYLES,
  EXPRESSIONS,
} from '../avatar3d/config';

const ARCHETYPES = [
  { value: 'Arquitecta Sensorial', label: 'Arquitecta Sensorial (Empatía, diseño y escucha profunda)' },
  { value: 'Filósofo Tecnológico', label: 'Filósofo Tecnológico (Introspectivo, lógico y pacífico)' },
  { value: 'Espíritu Libre y Artista', label: 'Espíritu Libre y Artista (Espontáneo, alegre y aventurero)' },
  { value: 'Mentor Afectuoso', label: 'Mentor Afectuoso (Cálido, orientador y motivador)' },
  { value: 'Poeta Nocturno', label: 'Poeta Nocturno (Sensible, observador y reconfortante)' },
];

const AVAILABLE_TRAITS = [
  'Empático', 'Curioso', 'Reflexivo', 'Divertido', 'Pacífico', 
  'Leal', 'Creativo', 'Poético', 'Espontáneo', 'Comprensivo'
];

const AVAILABLE_HOBBIES = [
  'Música y vinilos', 'Fotografía', 'Lectura de filosofía', 'Cocina gourmet',
  'Ajedrez', 'Senderismo', 'Diseño cubista', 'Astronomía', 'Cerámica'
];

/* --- Controles del editor de avatar 3D --- */

const Label = ({ children }) => (
  <label className="text-xs font-bold uppercase tracking-wider font-unbounded text-emobi-black/80 mb-1.5 block">
    {children}
  </label>
);

const SwatchRow = ({ label, colors, value, onChange }) => (
  <div>
    {label && <Label>{label}</Label>}
    <div className="flex flex-wrap gap-2">
      {colors.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Color ${c}`}
          className={`w-8 h-8 rounded-full transition-all ${value === c ? 'ring-2 ring-emobi-black ring-offset-2 ring-offset-white scale-110' : 'hover:scale-105'}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  </div>
);

const Slider = ({ label, hint, value, onChange }) => (
  <div>
    <div className="flex items-baseline justify-between mb-1">
      <span className="text-[11px] font-bold font-space text-emobi-black/80">{label}</span>
      {hint && <span className="text-[9px] text-emobi-black/40 font-space">{hint}</span>}
    </div>
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none bg-emobi-black/10 accent-emobi-yellow cursor-pointer"
    />
  </div>
);

export const CreateFriend = () => {
  const navigate = useNavigate();
  const ui = useUiActions();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  // El Dock inferior refleja el contexto de la pantalla de creación
  useEffect(() => {
    ui.register({
      openSettings: () => navigate('/settings'),
      openRoutine: null,
      voiceAutoPlay: null,
      toggleVoice: null,
    });
    return () => ui.clear(['openSettings']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    gender: 'female',
    archetype: 'Arquitecta Sensorial',
    occupation: 'Diseñadora de Experiencias y Sonido',
    traits: ['Empático', 'Curioso'],
    hobbies: ['Música y vinilos', 'Diseño cubista'],
    quirk: 'Siempre busca encontrar armonías geométricas y pregunta con sinceridad por tus emociones.',
    tone: 'Cálido, pausado y profundamente presente',
    avatar3d: presetForCompanion({ gender: 'female', archetype: 'Arquitecta Sensorial' }),
    voiceId: '21m00Tcm4TlvDq8ikWAM', // ElevenLabs Rachel
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Actualiza un campo del avatar 3D
  const updateAvatar3d = (field, value) => {
    setFormData(prev => ({
      ...prev,
      avatar3d: { ...prev.avatar3d, [field]: value },
    }));
  };

  // Reaplica el preset cuando cambian género o arquetipo (paso 1)
  const applyAvatarPreset = (overrides = {}) => {
    setFormData(prev => {
      const next = { ...prev, ...overrides };
      return {
        ...next,
        avatar3d: presetForCompanion({ gender: next.gender, archetype: next.archetype }),
      };
    });
  };

  const toggleTrait = (trait) => {
    setFormData(prev => {
      const exists = prev.traits.includes(trait);
      const traits = exists 
        ? prev.traits.filter(t => t !== trait)
        : [...prev.traits, trait];
      return { ...prev, traits };
    });
  };

  const toggleHobby = (hobby) => {
    setFormData(prev => {
      const exists = prev.hobbies.includes(hobby);
      const hobbies = exists 
        ? prev.hobbies.filter(h => h !== hobby)
        : [...prev.hobbies, hobby];
      return { ...prev, hobbies };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setDialogMessage('Por favor ingresa un nombre para tu compañero.');
      setStep(1);
      return;
    }

    try {
      setSubmitting(true);
      const created = await api.createCompanion(formData);

      // Lanzar confeti cubista
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFE600', '#FFD000', '#111111', '#FFFFFF']
        });
      } catch (e) {}

      setTimeout(() => {
        navigate(`/chat/${created.id}`);
      }, 700);
    } catch (err) {
      console.error('Error creando compañero:', err);
      setDialogMessage('Hubo un error al crear tu compañero. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col pb-32">
      <CubistGridPattern />

      {/* Encabezado de contexto: solo progreso (la navegación vive en el Dock inferior) */}
      <header className="px-4 lg:px-8 pt-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emobi-yellow/90 backdrop-blur-md rounded-2xl shadow-glow-yellow flex items-center justify-center font-black font-unbounded text-base">
              E
            </div>
            <div>
              <p className="text-sm font-black font-syne text-emobi-black">Nuevo Compañero</p>
              <p className="text-[11px] text-emobi-black/50 font-space font-medium">Asistente de creación</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold bg-emobi-black/85 text-white rounded-full px-3 py-1 shadow-glass-sm">
            PASO {step} DE 4
          </span>
        </div>
      </header>

      {/* Wizard Form Container */}
      <main className="px-4 lg:px-8 py-8 max-w-3xl mx-auto w-full flex-1">
        <div className="mb-6">
          <Badge variant="neon" size="sm" className="mb-2">
            Génesis de Compañero Emobi
          </Badge>
          <h2 className="text-2xl md:text-4xl font-black font-syne text-emobi-black">
            Diseña una Presencia Humanoide Única
          </h2>
          <p className="text-xs md:text-sm text-emobi-black/60 font-space mt-1">
            Configura su identidad, personalidad, rostro interactivo con Lip-Sync y rutina de 24 horas.
          </p>
        </div>

        {/* Indicador de pasos visual glass */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[
            { num: 1, label: 'Identidad' },
            { num: 2, label: 'Carácter' },
            { num: 3, label: 'Rostro & Avatar' },
            { num: 4, label: 'Vida & Voz' },
          ].map(s => (
            <div
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`p-3 rounded-2xl cursor-pointer transition-all backdrop-blur-md ${
                step === s.num
                  ? 'glass-yellow shadow-glow-yellow font-black'
                  : step > s.num
                    ? 'bg-white/60 shadow-glass-sm font-bold'
                    : 'bg-white/25 text-emobi-black/40 border border-white/40'
              }`}
            >
              <div className="text-[10px] font-mono">0{s.num}</div>
              <div className="text-xs font-unbounded truncate">{s.label}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 md:p-8" shadow>
            {/* PASO 1: IDENTIDAD */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-emobi-black/10 pb-3">
                  <Compass className="w-5 h-5 text-emobi-black" />
                  <h3 className="text-lg font-black font-syne uppercase">
                    1. Identidad y Arquetipo Emocional
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre Completo"
                    placeholder="Ej. Clara, Kenji, Luna..."
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                  />

                  <Input
                    label="Edad"
                    type="number"
                    min={18}
                    max={99}
                    value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Género / Identidad"
                    value={formData.gender}
                    onChange={(e) => applyAvatarPreset({ gender: e.target.value })}
                    options={[
                      { value: 'female', label: 'Femenino' },
                      { value: 'male', label: 'Masculino' },
                      { value: 'non-binary', label: 'No Binario / Fluido' },
                    ]}
                  />

                  <Input
                    label="Ocupación / Pasión Central"
                    placeholder="Ej. Diseñadora de Espacios, Músico, Botánica..."
                    value={formData.occupation}
                    onChange={(e) => updateField('occupation', e.target.value)}
                  />
                </div>

                <Select
                  label="Arquetipo de Compañía"
                  value={formData.archetype}
                  onChange={(e) => applyAvatarPreset({ archetype: e.target.value })}
                  options={ARCHETYPES}
                />
              </div>
            )}

            {/* PASO 2: CARÁCTER Y PERSONALIDAD */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-emobi-black/10 pb-3">
                  <Smile className="w-5 h-5 text-emobi-black" />
                  <h3 className="text-lg font-black font-syne uppercase">
                    2. Rasgos, Hobbies y Manías Únicas
                  </h3>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider font-unbounded text-emobi-black mb-2 block">
                    Rasgos de Personalidad (Selecciona al menos 2)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_TRAITS.map(trait => {
                      const selected = formData.traits.includes(trait);
                      return (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => toggleTrait(trait)}
                          className={`px-3.5 py-1.5 text-xs font-bold font-space rounded-full backdrop-blur-md border transition-all ${selected ? 'bg-emobi-yellow/80 border-emobi-black/15 shadow-glass-yellow' : 'bg-white/50 border-emobi-black/10 hover:bg-white/80'}`}
                        >
                          {selected ? `✓ ${trait}` : `+ ${trait}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider font-unbounded text-emobi-black mb-2 block">
                    Hobbies y Pasiones Personales
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_HOBBIES.map(hobby => {
                      const selected = formData.hobbies.includes(hobby);
                      return (
                        <button
                          key={hobby}
                          type="button"
                          onClick={() => toggleHobby(hobby)}
                          className={`px-3.5 py-1.5 text-xs font-bold font-space rounded-full backdrop-blur-md border transition-all ${selected ? 'bg-emobi-yellow/80 border-emobi-black/15 shadow-glass-yellow' : 'bg-white/50 border-emobi-black/10 hover:bg-white/80'}`}
                        >
                          {selected ? `✓ ${hobby}` : `+ ${hobby}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Textarea
                  label="Manía o Peculiaridad Humana"
                  placeholder="Ej. Siempre usa metáforas geométricas, se sirve un café cuando empieza a pensar hondo..."
                  value={formData.quirk}
                  onChange={(e) => updateField('quirk', e.target.value)}
                  rows={2}
                />

                <Input
                  label="Tono de Comunicación"
                  placeholder="Ej. Cálido, pausado, con un toque de humor sutil..."
                  value={formData.tone}
                  onChange={(e) => updateField('tone', e.target.value)}
                />
              </div>
            )}

            {/* PASO 3: ROSTRO 3D INTERACTIVO */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-emobi-black/10 pb-3">
                  <Palette className="w-5 h-5 text-emobi-black" />
                  <h3 className="text-lg font-black font-syne uppercase">
                    3. Rostro 3D y Apariencia
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visor 3D */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-full aspect-square max-w-[260px] glass-subtle rounded-[2rem] shadow-glass overflow-hidden">
                      <Avatar3D
                        avatar3d={formData.avatar3d}
                        autoRotate
                        className="w-full h-full"
                        cameraPosition={[0, 0.25, 3]}
                      />
                      <div className="absolute top-2 left-2 bg-emobi-yellow/85 backdrop-blur-md rounded-full px-2.5 py-1 text-[9px] font-mono font-bold">
                        3D EN VIVO
                      </div>
                      <div className="absolute bottom-2 right-2 bg-emobi-black/85 text-white backdrop-blur-md rounded-full px-2.5 py-1 text-[9px] font-mono font-bold">
                        LIP-SYNC READY
                      </div>
                    </div>
                    <span className="text-xs font-space font-bold mt-2 text-emobi-black/55 text-center">
                      Modelo de {formData.name || 'tu compañero'} • girando
                    </span>
                  </div>

                  {/* Controles de apariencia */}
                  <div className="flex flex-col gap-4">
                    {/* Tono de piel */}
                    <SwatchRow
                      label="Tono de piel"
                      colors={SKIN_TONES}
                      value={formData.avatar3d.skinTone}
                      onChange={(c) => updateAvatar3d('skinTone', c)}
                    />

                    {/* Cabello */}
                    <div>
                      <Label>Cabello</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {HAIR_STYLES.map(style => (
                          <button
                            key={style.value}
                            type="button"
                            onClick={() => updateAvatar3d('hairStyle', style.value)}
                            className={`px-3 py-1.5 text-xs font-bold font-space rounded-full backdrop-blur-md border transition-all ${formData.avatar3d.hairStyle === style.value ? 'bg-emobi-yellow/80 border-emobi-black/15 shadow-glass-yellow' : 'bg-white/50 border-emobi-black/10 hover:bg-white/80'}`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                      <SwatchRow
                        colors={HAIR_COLORS}
                        value={formData.avatar3d.hairColor}
                        onChange={(c) => updateAvatar3d('hairColor', c)}
                      />
                    </div>

                    {/* Ojos */}
                    <SwatchRow
                      label="Color de ojos"
                      colors={EYE_COLORS}
                      value={formData.avatar3d.eyeColor}
                      onChange={(c) => updateAvatar3d('eyeColor', c)}
                    />

                    {/* Ropa */}
                    <SwatchRow
                      label="Color de ropa"
                      colors={OUTFIT_COLORS}
                      value={formData.avatar3d.outfitColor}
                      onChange={(c) => updateAvatar3d('outfitColor', c)}
                    />

                    {/* Expresión base */}
                    <div>
                      <Label>Expresión base</Label>
                      <div className="flex flex-wrap gap-2">
                        {EXPRESSIONS.map(exp => (
                          <button
                            key={exp.value}
                            type="button"
                            onClick={() => updateAvatar3d('expression', exp.value)}
                            className={`px-3 py-1.5 text-xs font-bold font-space rounded-full backdrop-blur-md border transition-all ${formData.avatar3d.expression === exp.value ? 'bg-emobi-yellow/80 border-emobi-black/15 shadow-glass-yellow' : 'bg-white/50 border-emobi-black/10 hover:bg-white/80'}`}
                          >
                            {exp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deslizadores de rasgos faciales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 glass-subtle rounded-2xl p-4">
                  <Slider label="Forma de cara" hint="Alargada ↔ Redonda" value={formData.avatar3d.faceShape} onChange={(v) => updateAvatar3d('faceShape', v)} />
                  <Slider label="Mandíbula" hint="Fina ↔ Ancha" value={formData.avatar3d.jawWidth} onChange={(v) => updateAvatar3d('jawWidth', v)} />
                  <Slider label="Tamaño de ojos" hint="Pequeños ↔ Grandes" value={formData.avatar3d.eyeSize} onChange={(v) => updateAvatar3d('eyeSize', v)} />
                  <Slider label="Nariz" hint="Pequeña ↔ Grande" value={formData.avatar3d.noseSize} onChange={(v) => updateAvatar3d('noseSize', v)} />
                  <Slider label="Ancho de boca" value={formData.avatar3d.mouthWidth} onChange={(v) => updateAvatar3d('mouthWidth', v)} />
                  <Slider label="Labios" hint="Finos ↔ Camosos" value={formData.avatar3d.lipsFullness} onChange={(v) => updateAvatar3d('lipsFullness', v)} />
                  <Slider label="Grosor de cejas" value={formData.avatar3d.browThickness} onChange={(v) => updateAvatar3d('browThickness', v)} />
                </div>

                {/* Detalles opcionales */}
                <div>
                  <Label>Detalles</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'glasses', label: 'Gafas' },
                      { key: 'freckles', label: 'Pecas' },
                      { key: 'earrings', label: 'Pendientes' },
                      { key: 'facialHair', label: 'Barba' },
                    ].map(opt => {
                      const active = Boolean(formData.avatar3d[opt.key]);
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => updateAvatar3d(opt.key, !active)}
                          className={`px-3.5 py-1.5 text-xs font-bold font-space rounded-full backdrop-blur-md border transition-all ${active ? 'bg-emobi-yellow/80 border-emobi-black/15 shadow-glass-yellow' : 'bg-white/50 border-emobi-black/10 hover:bg-white/80'}`}
                        >
                          {active ? `✓ ${opt.label}` : `+ ${opt.label}`}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => updateField('avatar3d', presetForCompanion(formData))}
                      className="px-3.5 py-1.5 text-xs font-bold font-space rounded-full bg-emobi-black/85 text-white shadow-glass-sm hover:bg-emobi-black transition-all"
                    >
                      ↺ Sugerir según arquetipo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: VIDA AUTÓNOMA Y VOZ */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-emobi-black/10 pb-3">
                  <Clock className="w-5 h-5 text-emobi-black" />
                  <h3 className="text-lg font-black font-syne uppercase">
                    4. Vida Autónoma, Rutina y Síntesis de Voz
                  </h3>
                </div>

                <div className="glass-yellow rounded-2xl p-4">
                  <div className="flex items-center gap-2 font-bold font-unbounded text-xs mb-1">
                    <Sparkles className="w-4 h-4 text-emobi-black" />
                    Generación de Rutina de 24 Horas
                  </div>
                  <p className="text-xs text-emobi-black/70 font-space">
                    Al confirmar, Emobi calculará automáticamente la rutina de vida completa de {formData.name || 'tu compañero'}, incluyendo sus horarios de despertar, trabajo creativo, almuerzos, pasatiempos y descanso nocturno según sus rasgos.
                  </p>
                </div>

                <Select
                  label="Voz de ElevenLabs / Síntesis"
                  value={formData.voiceId}
                  onChange={(e) => updateField('voiceId', e.target.value)}
                  options={[
                    { value: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (Cálida, femenina, serena)' },
                    { value: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi (Masculina, segura, profunda)' },
                    { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (Expresiva, brillante, alegre)' },
                    { value: 'ErXwobaYiN019PkySvjV', label: 'Antoni (Masculina, reflexiva, cercana)' },
                  ]}
                />

                <div className="border-t border-emobi-black/10 pt-4">
                  <h4 className="text-xs font-bold uppercase font-unbounded text-emobi-black/80 mb-2">
                    Resumen del Vínculo
                  </h4>
                  <div className="text-xs font-space glass-subtle rounded-2xl p-3.5 space-y-1">
                    <p><strong>Compañero:</strong> {formData.name || 'Sin nombre'} ({formData.age} años, {formData.gender})</p>
                    <p><strong>Arquetipo:</strong> {formData.archetype}</p>
                    <p><strong>Personalidad:</strong> {formData.traits.join(', ')}</p>
                    <p><strong>Pasiones:</strong> {formData.hobbies.join(', ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Barra de Navegación del Wizard */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-emobi-black/10">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setStep(s => s - 1)}
                  icon={ArrowLeft}
                >
                  Anterior
                </Button>
              ) : <div />}

              {step < 4 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (step === 1 && !formData.name.trim()) {
                      setDialogMessage('Por favor introduce un nombre antes de continuar.');
                      return;
                    }
                    setStep(s => s + 1);
                  }}
                  icon={ArrowRight}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  icon={Check}
                >
                  {submitting ? 'Dando Vida a tu Compañero...' : 'Crear y Conectar Ahora'}
                </Button>
              )}
            </div>
          </Card>
        </form>
      </main>
      <AppDialog
        isOpen={Boolean(dialogMessage)}
        title="Revisa la información"
        message={dialogMessage}
        onConfirm={() => setDialogMessage('')}
      />
    </div>
  );
};
