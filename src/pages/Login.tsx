import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, senha, nome || email);
        if (error) {
          toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar" });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, senha);
        if (error) {
          toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
        } else {
          navigate("/");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await supabase.auth.signOut();
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });
      if (result.error) {
        toast({ title: "Erro ao entrar com Google", description: String(result.error), variant: "destructive" });
        return;
      }
      if (result.redirected) return;
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erro ao entrar com Google", description: err?.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={logoImg} alt="" className="w-[600px] max-w-[90vw] opacity-10 select-none" draggable={false} />
        </div>
      </div>

      <div className="w-full max-w-[420px] space-y-6 relative z-10 animate-in" style={{ opacity: 0 }}>
        <div className="text-center space-y-3">
          <div className="h-20 w-20 rounded-lg overflow-hidden flex items-center justify-center mx-auto border-2 border-primary/30">
            <img src={logoImg} alt="Anderson Estacionamento" className="h-20 w-20 object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-mono text-primary uppercase tracking-wider">Anderson</h1>
            <p className="text-sm text-muted-foreground font-mono">Estacionamento</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pdv-card p-6 space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <Label className="stat-label">Nome</Label>
              <input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} className="pdv-input w-full text-base" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="stat-label">E-mail</Label>
            <input type="email" placeholder="operador@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pdv-input w-full text-base" required />
          </div>
          <div className="space-y-1.5">
            <Label className="stat-label">Senha</Label>
            <input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="pdv-input w-full text-base" required minLength={6} />
          </div>
          <button type="submit" className="pdv-btn-green w-full flex items-center justify-center gap-2 text-base" disabled={loading}>
            {loading ? 'Aguarde...' : isSignUp ? 'CRIAR CONTA' : 'ENTRAR'} <ArrowRight className="h-4 w-4" />
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground font-mono">ou</span>
            </div>
          </div>

          <button
            type="button"
            className="pdv-btn-yellow w-full flex items-center justify-center gap-3 text-base"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? 'CONECTANDO...' : 'ENTRAR COM GOOGLE'}
          </button>

          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">
            {isSignUp ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar conta'}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground/50 font-mono">
          © 2026 Anderson Estacionamento — OSMARJR Sistemas
        </p>
      </div>
    </div>
  );
}
