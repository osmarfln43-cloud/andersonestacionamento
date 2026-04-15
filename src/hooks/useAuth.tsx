import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: any }>;
  signUp: (login: string, password: string, nome: string, realEmail: string) => Promise<{ error: any }>;
  requestPasswordReset: (identifier: string, redirectTo: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeLogin = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');

const toLegacyAuthEmail = (login: string) => `${normalizeLogin(login)}@parking.local`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          supabase.from('profiles').select('*').eq('user_id', session.user.id).single()
            .then(({ data }) => setProfile(data));
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('*').eq('user_id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    const value = identifier.trim().toLowerCase();
    const looksLikeEmail = value.includes('@');
    const normalizedLogin = normalizeLogin(value);

    let profileMatch: any = null;

    if (looksLikeEmail) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', value)
        .maybeSingle();
      profileMatch = data;
    } else if (normalizedLogin) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('login', normalizedLogin)
        .maybeSingle();
      profileMatch = data;
    }

    const candidates = Array.from(new Set([
      looksLikeEmail ? value : null,
      profileMatch?.email?.toLowerCase?.(),
      profileMatch?.login ? toLegacyAuthEmail(profileMatch.login) : null,
      !looksLikeEmail && normalizedLogin ? toLegacyAuthEmail(normalizedLogin) : null,
    ].filter(Boolean) as string[]));

    let lastError: any = null;

    for (const email of candidates) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) return { error: null };
      lastError = error;
    }

    return { error: lastError || new Error('Login ou senha incorretos') };
  };

  const signUp = async (login: string, password: string, nome: string, realEmail: string) => {
    const cleanLogin = normalizeLogin(login);
    const cleanEmail = realEmail.trim().toLowerCase();

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          nome,
          login: cleanLogin,
          real_email: cleanEmail,
        },
      },
    });

    return { error };
  };

  const requestPasswordReset = async (identifier: string, redirectTo: string) => {
    const { data, error } = await supabase.functions.invoke('request-password-reset', {
      body: { identifier, redirectTo },
    });

    if (error) return { error };
    if (data?.error) return { error: new Error(data.error) };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, requestPasswordReset, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
