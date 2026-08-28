import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { login, me, register } from './api';
import type { User } from './types';

const TOKEN_KEY = 'kn_token';
const EMAIL_KEY = 'kn_email';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (savedToken) {
          const u = await me(savedToken);
          if (u) {
            setToken(savedToken);
            setUser(u);
          } else {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          }
        }
      } catch {
        // ignore — treat as signed out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (newToken: string, u: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(EMAIL_KEY, u.email);
    setToken(newToken);
    setUser(u);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const data = await login(email, password);
      await persist(data.token, data.user);
    },
    [persist]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await register(name, email, password);
      await persist(data.token, data.user);
    },
    [persist]
  );

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, signIn, signUp, signOut }),
    [user, token, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}