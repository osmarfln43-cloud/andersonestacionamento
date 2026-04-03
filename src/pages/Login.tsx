import { ParkingCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
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
          toast({ title: "Conta criada!", description: "Faça login para continuar" });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] space-y-8 relative z-10 animate-in" style={{ opacity: 0 }}>
        <div className="text-center space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-primary glow-primary flex items-center justify-center mx-auto">
            <ParkingCircle className="h-10 w-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display gradient-text">ME PARK AI</h1>
            <p className="text-sm text-muted-foreground mt-1">Estacionamento Inteligente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {isSignUp && (
            <div className="space-y-2">
              <Label className="stat-label">Nome</Label>
              <Input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12" />
            </div>
          )}
          <div className="space-y-2">
            <Label className="stat-label">E-mail</Label>
            <Input type="email" placeholder="operador@mepark.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" required />
          </div>
          <div className="space-y-2">
            <Label className="stat-label">Senha</Label>
            <Input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="h-12" required minLength={6} />
          </div>
          <Button type="submit" className="w-full h-13 text-base font-semibold gap-2 rounded-xl" disabled={loading}>
            {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'} <ArrowRight className="h-4 w-4" />
          </Button>
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
            {isSignUp ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar conta'}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground/50">
          © 2026 ME PARK AI • Estacionamento Inteligente
        </p>
      </div>
    </div>
  );
}
