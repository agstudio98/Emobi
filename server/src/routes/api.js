import { Router } from 'express';
import { register, login, googleLogin, currentUser, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authRateLimit } from '../middleware/authRateLimit.js';
import {
  getCompanions,
  getCompanionById,
  createCompanion,
  deleteCompanion,
  chatWithCompanion,
  speakWithCompanion,
  generateGreetingForCompanion
} from '../controllers/companionController.js';
import {
  generateAvatarEndpoint,
  generateRoutineEndpoint,
  getSystemStatus,
  testGroqEndpoint
} from '../controllers/generationController.js';

const router = Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

// Sesiones de usuario
router.post('/auth/register', authRateLimit, asyncHandler(register));
router.post('/auth/login', authRateLimit, asyncHandler(login));
router.post('/auth/google', authRateLimit, asyncHandler(googleLogin));
router.get('/auth/me', requireAuth, currentUser);
router.post('/auth/logout', requireAuth, logout);

// Rutas de Compañeros
router.use('/companions', requireAuth);
router.get('/companions', getCompanions);
router.get('/companions/:id', getCompanionById);
router.post('/companions', createCompanion);
router.delete('/companions/:id', deleteCompanion);

// Rutas de Interacción
router.post('/companions/:id/chat', chatWithCompanion);
router.post('/companions/:id/speak', speakWithCompanion);
router.post('/companions/:id/greeting', generateGreetingForCompanion);

// Rutas de Generación e IA
router.post('/generation/avatar', generateAvatarEndpoint);
router.post('/generation/routine', generateRoutineEndpoint);
router.post('/groq/test', testGroqEndpoint);
router.get('/status', getSystemStatus);

export default router;
