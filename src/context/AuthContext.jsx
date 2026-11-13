import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../services/config';

const AuthContext = createContext(null);
const TOKEN_KEY = 'emobi_session_token';
const USER_KEY = 'emobi_session_user';

const getInitialSession = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      token,
      user: token ? JSON.parse(localStorage.getItem(USER_KEY) || 'null') : null,
    };
  } catch (err) {
    return { token: null, user: null };
  }
};

const getResponse = async (response) => {
  const rawBody = await response.text();
  let body = {};
  try { body = rawBody ? JSON.parse(rawBody) : {}; } catch (err) {}
  if (!response.ok) {
    const detail = body.error || body.message;
    const textDetail = /<\/?(?:html|!doctype)/i.test(rawBody)
      ? ''
      : rawBody.replace(/\s+/g, ' ').trim().slice(0, 180);
    if (detail) throw new Error(detail);
    if (response.status === 404) {
      throw new Error('El servidor no reconoce la ruta de autenticación. Reinicia el backend actualizado y vuelve a intentarlo.');
    }
    throw new Error(textDetail || `El servidor respondió con el código ${response.status}.`);
  }
  return body;
};

export const AuthProvider = ({ children }) => {
  const [initial] = useState(getInitialSession);
  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);
  const [loading, setLoading] = useState(true);

  const acceptSession = (session) => {
    try {
      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    } catch (err) {
      throw new Error('No se pudo guardar la sesión en este dispositivo. Revisa el almacenamiento del navegador.');
    }
    setToken(session.token);
    setUser(session.user);
  };

  useEffect(() => {
    let active = true;
    if (!token) {
      setLoading(false);
      return () => { active = false; };
    }

    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(getResponse)
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [token]);

  const requestSession = async (endpoint, body) => {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`No se pudo conectar con el servidor de Emobi en ${API_BASE_URL}. Comprueba que esté activo y que VITE_API_BASE_URL apunte a su API.`);
    }
    const session = await getResponse(response);
    acceptSession(session);
    return session.user;
  };

  const value = useMemo(() => ({
    user,
    token,
    loading,
    signIn: ({ email, password }) => requestSession('login', { email, password }),
    signUp: ({ username, email, password }) => requestSession('register', { username, email, password }),
    signInWithGoogle: (credential) => requestSession('google', { credential }),
    signOut: () => {
      if (token) {
        fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    },
  }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
