import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateFriend } from './pages/CreateFriend';
import { ChatSession } from './pages/ChatSession';
import { Settings } from './pages/Settings';
import { Dock } from './components/Dock';
import { UiActionsProvider, useUiActions } from './context/UiActions';
import { AvatarStage } from './avatar3d/AvatarStage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './pages/AuthScreen';

/**
 * Dock conectado a las acciones registradas por cada página.
 */
const ConnectedDock = () => {
  const location = useLocation();
  const ui = useUiActions();

  // Reglas de negocio por ruta: cada acción solo aparece donde tiene sentido.
  const isChat = location.pathname.startsWith('/chat');

  return (
    <Dock
      variant={isChat ? 'chat' : 'default'}
      onSettings={ui.openSettings}
      onRoutine={ui.openRoutine}
      voiceAutoPlay={isChat ? ui.voiceAutoPlay : undefined}
      onToggleVoice={isChat ? ui.toggleVoice : undefined}
    />
  );
};

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-emobi-gray-light">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emobi-yellow shadow-glow-yellow flex items-center justify-center font-black font-syne text-xl animate-pulse">E</div>
          <p className="mt-4 text-sm text-emobi-black/50 font-space">Preparando tu espacio…</p>
        </div>
      </main>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <UiActionsProvider>
      {/* Un único lienzo WebGL compartido por todos los avatares 3D */}
      <AvatarStage />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateFriend />} />
        <Route path="/chat/:id" element={<ChatSession />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ConnectedDock />
    </UiActionsProvider>
  );
};

export const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
