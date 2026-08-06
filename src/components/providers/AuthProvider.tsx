'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from '@/lib/firebase/client';

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'user' | 'admin';
}

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  /** Czy działamy na prawdziwym Firebase Authentication */
  live: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Token do autoryzacji wywołań API Routes */
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEV_SESSION_KEY = 'envelopes.devSession';

/**
 * Sesja demonstracyjna używana wyłącznie, gdy projekt Firebase nie jest
 * skonfigurowany. Pozwala przejść całą ścieżkę (logowanie → zamówienie →
 * panel → admin) bez konta Firebase; token jest oznaczony prefiksem `dev.`
 * i akceptowany przez API tylko przy braku Admin SDK.
 */
function devToken(user: SessionUser): string {
  const payload = { uid: user.uid, email: user.email, role: user.role };
  const base64 =
    typeof window === 'undefined'
      ? Buffer.from(JSON.stringify(payload)).toString('base64url')
      : btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `dev.${base64}`;
}

function readDevSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DEV_SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function makeDevUser(email: string, displayName?: string): SessionUser {
  const isAdmin = email.trim().toLowerCase().startsWith('admin@');
  return {
    uid: `dev-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    email: email.trim().toLowerCase(),
    displayName: displayName ?? null,
    role: isAdmin ? 'admin' : 'user',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setUser(readDevSession());
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      const tokenResult = await fbUser.getIdTokenResult();
      setUser({
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        displayName: fbUser.displayName,
        role: tokenResult.claims.role === 'admin' ? 'admin' : 'user',
      });
      setLoading(false);
    });
  }, []);

  const persistDev = useCallback((session: SessionUser | null) => {
    if (typeof window === 'undefined') return;
    if (session) window.localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(DEV_SESSION_KEY);
    setUser(session);
    window.dispatchEvent(new Event('envelopes:auth'));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const auth = getFirebaseAuth();
      if (!auth) {
        if (password.length < 6) throw new Error('Hasło musi mieć co najmniej 6 znaków.');
        persistDev(makeDevUser(email));
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
    },
    [persistDev]
  );

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const auth = getFirebaseAuth();
      if (!auth) {
        if (password.length < 6) throw new Error('Hasło musi mieć co najmniej 6 znaków.');
        persistDev(makeDevUser(email, displayName));
        return;
      }
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(credential.user, { displayName });
    },
    [persistDev]
  );

  const loginWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      persistDev(makeDevUser('konto.google@przyklad.pl', 'Konto Google'));
      return;
    }
    await signInWithPopup(auth, googleProvider);
  }, [persistDev]);

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      persistDev(null);
      return;
    }
    await signOut(auth);
  }, [persistDev]);

  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await sendPasswordResetEmail(auth, email);
  }, []);

  const getToken = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return user ? devToken(user) : null;
    return auth.currentUser ? auth.currentUser.getIdToken() : null;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      live: isFirebaseConfigured,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      getToken,
    }),
    [user, loading, login, register, loginWithGoogle, logout, resetPassword, getToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth musi być użyty wewnątrz AuthProvider.');
  return ctx;
}
