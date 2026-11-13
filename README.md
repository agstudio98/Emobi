# Emobi — Compañeros IA con Estética Cubista Neo-Minimalista

> **Propósito:** Creación y gestión de "Compañeros IA" personalizados con personalidades dinámicas, vida propia, rutinas diarias de 24h, rasgos físicos personalizables (generación por avatar/imagen) y avatar interactivo con sincronización labial (Lip-Sync) / animación facial durante el chat de voz.
> **Objetivo Estratégico:** Estandarizar y democratizar las relaciones e interacciones interpersonales para reducir la soledad humana, proveyendo una experiencia hiperrealista e inmersiva de compañía y apoyo emocional.

---

## 🎨 Líneas de Diseño (Cubismo Neo-Minimalista)
- **Primario:** Amarillo Neón / Amarillo Cálido (`#FFE600` / `#FFD000`).
- **Neutros:** Blanco Puro (`#FFFFFF`), Gris Ultra Claro (`#F8F9FA`) y Off-White (`#F1F3F5`).
- **Contraste & Estructura:** Negro Azabache (`#111111`) con bordes gruesos de 2px a 3px y cortes angulares achaflanados.
- **Tipografía:** *National Park* en toda la interfaz.
- **Sombras Brutalistas:** Sombras sólidas desplazadas (`box-shadow: 4px 4px 0px #111111`).

---

## 🏗️ Arquitectura del Proyecto

```text
emobi-app/
├── android/                    # Proyecto nativo generado por Capacitor para exportar a AAB/APK
├── server/                     # Backend Express + Babel (ESM)
│   ├── src/
│   │   ├── config/             # Configuración de APIs de IA (OpenAI, Gemini, ElevenLabs, Replicate)
│   │   ├── controllers/        # Controladores (Amigos IA, Rutinas, Generación, Chat)
│   │   ├── routes/             # Rutas API Express (/api/companions, /api/generation, etc.)
│   │   ├── services/           # Lógica de IA, rutinas dinámicas, síntesis de voz y avatares
│   │   └── app.js              # Servidor Express con CORS y logger
│   ├── .babelrc
│   ├── .env.example
│   └── package.json
├── .env.example                # Variables públicas del frontend (Google OAuth)
├── src/                        # Frontend React 18 + Vite + Tailwind CSS
│   ├── assets/                 # SVGs y patrones geométricos cubistas
│   ├── components/
│   │   ├── ui/                 # Botones amarillos brutalistas, Cards geométricas, Inputs, Badges
│   │   ├── AvatarCanvas.jsx    # Componente de animación facial y Lip-Sync sobre Canvas 2D
│   │   └── VoiceChat.jsx       # Interacción por voz con Web Speech API y ecualizador reactivo
│   ├── pages/
│   │   ├── Home.jsx            # Lista de Compañeros, ticker "¿Qué hace ahora?" y visor de rutinas
│   │   ├── CreateFriend.jsx    # Wizard de 4 pasos (Identidad, Carácter, Rostro IA, Rutina & Voz)
│   │   └── ChatSession.jsx     # Sesión inmersiva con Lip-Sync reactivo, voz y texto
│   ├── services/
│   │   └── api.js              # Cliente de API con fallback y sincronización offline
│   ├── styles/
│   │   └── globals.css         # Tailwind y clases de estilo Neo-Brutalista y Cubista
│   ├── App.jsx
│   └── main.jsx
├── capacitor.config.json       # Configuración híbrida Mobile/AAB
├── tailwind.config.js
└── package.json
```

## Cuentas y sesiones

Emobi comienza con una pantalla de bienvenida para iniciar sesión, crear una cuenta o continuar con Google. El registro valida el nombre de usuario (3–20 caracteres ASCII alfanuméricos, punto, guion o guion bajo; sin puntuación al inicio/final) y requiere una contraseña de 12–128 caracteres con mayúsculas, minúsculas, números y símbolos, sin espacios.

Las cuentas y sus compañeros se guardan en `server/data/emobi-store.json`; conserva esa carpeta al desplegar para mantener usuarios y sesiones. El backend genera y persiste la clave de firma de sesión en ese mismo archivo. Protege y respalda el directorio como datos privados.

Para habilitar el botón de Google, configura el mismo ID de cliente OAuth en `VITE_GOOGLE_CLIENT_ID` (frontend) y `GOOGLE_CLIENT_ID` (`server/.env`), y autoriza el origen de la aplicación en Google Cloud. Sin esas credenciales, el registro e inicio de sesión con correo y contraseña funcionan y el botón de Google permanece desactivado.

El cliente usa `VITE_API_BASE_URL=/api` junto al proxy local de Vite. En Capacitor o en una compilación estática, define `VITE_API_BASE_URL` con la URL pública del backend terminada en `/api`; vuelve a compilar el frontend después de cambiar variables `VITE_`.

---

## 🚀 Inicio Rápido

### 1. Iniciar Aplicación Completa (Frontend + Backend)
Para ejecutar simultáneamente el servidor backend en el puerto `5000` y la interfaz React en el puerto `5173`:
```bash
npm run start
```

O por separado:
```bash
# Terminal 1: Backend Express + Babel
npm run server

# Terminal 2: Frontend Vite
npm run dev
```

### 2. Configurar Claves de IA (Groq AI Recomendado)
Puedes configurar las claves desde la interfaz en el botón **"⚡ Configurar IA & Voces"** o en tu archivo `server/.env`:
```env
PORT=5000

# Groq AI (Motor Principal Ultra-Rápido: Llama 3.3 70B Versatile - Gratuito)
# Obtén tu clave en: https://console.groq.com/keys
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Proveedores alternativos opcionales
OPENAI_API_KEY=sk-...         # Para GPT-4o y DALL-E 3
GEMINI_API_KEY=...            # Alternativa Google Gemini
ELEVENLABS_API_KEY=...        # Síntesis de voz realista humana
REPLICATE_API_TOKEN=...       # Generación de retratos
```
> *Nota:* Con Groq AI conectado, los saludos iniciales, las rutinas diarias de 24h y todas las conversaciones son 100% generadas por inteligencia artificial real en milisegundos con LLaMA 3.3 70B.

---

## 📱 Exportación a Android (AAB / APK)

Emobi está preparado para empaquetar en formato Android App Bundle (`.aab`) para Google Play Store:

```bash
# 1. Compilar web y sincronizar con Android
npm run build
npx cap sync android

# 2. Abrir en Android Studio para compilar y firmar:
npx cap open android
```

O compilar el paquete Release AAB directamente desde la terminal:
```bash
cd android && ./gradlew bundleRelease
```
El archivo `.aab` generado se encontrará en:
`android/app/build/outputs/bundle/release/app-release.aab`
