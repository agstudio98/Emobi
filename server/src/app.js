import express from 'express';
import cors from 'cors';
import { config } from './config/aiConfig.js';
import apiRoutes from './routes/api.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-groq-key',
    'x-groq-model',
    'x-gemini-key',
    'x-openai-key',
    'x-elevenlabs-key',
    'x-replicate-token'
  ]
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [EMOBI-API] ${req.method} ${req.url}`);
  next();
});

// Rutas API
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Emobi AI Backend',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = config.port;

const server = app.listen(PORT, config.host, () => {
  console.log(`\n=================================================`);
  console.log(`🤖 EMOBI BACKEND RUNNING ON http://${config.host}:${PORT}`);
  console.log(`✨ Mode: Neo-Cubist AI Companion Hub`);
  console.log(`=================================================\n`);
});

server.on('error', async (error) => {
  if (error.code === 'EADDRINUSE') {
    let existingEmobiBackend = false;
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/api/auth/me`, {
        signal: AbortSignal.timeout(1500),
      });
      if (response.status === 401) {
        const result = await response.json().catch(() => ({}));
        existingEmobiBackend = result.error === 'Inicia sesión para continuar.';
      }
    } catch (probeError) {}

    if (existingEmobiBackend) {
      console.log(`Emobi backend ya está activo en el puerto ${PORT}; se reutilizará esa instancia.`);
      process.exitCode = 0;
      return;
    }

    console.error(`El puerto ${PORT} ya está ocupado por otra aplicación o por una versión anterior de Emobi.`);
    console.error(`Cierra ese proceso o configura el mismo puerto para el backend y VITE_API_BASE_URL antes de volver a iniciar.`);
    process.exitCode = 1;
    return;
  }

  console.error('No se pudo iniciar el backend de Emobi:', error);
  process.exitCode = 1;
});

export default app;
