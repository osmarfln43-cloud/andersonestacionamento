import { ArrowRight } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Convert username to a fake email for Supabase auth
  const toEmail = (username: string) => `${username.toLowerCase().trim()}@parking.local`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !senha.trim()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(toEmail(login), senha, nome || login);
        if (error) {
          toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Conta criada com sucesso!" });
          navigate("/");
        }
      } else {
        const { error } = await signIn(toEmail(login), senha);
        if (error) {
          toast({ title: "Erro ao entrar", description: "Login ou senha incorretos", variant: "destructive" });
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <img src={logoImg} alt="" className="w-[500px] max-w-[80vw] opacity-[0.06] select-none" draggable={false} />
      </div>

      <div className="w-full max-w-[400px] space-y-5 relative z-10 animate-in" style={{ opacity: 0 }}>
        <div className="text-center space-y-2">
          <div className="h-16 w-16 rounded-sm overflow-hidden flex items-center justify-center mx-auto border-2 border-primary/30">
            <img src={logoImg} alt="Anderson Estacionamento" className="h-16 w-16 object-cover" />
          </div>
          <h1 className="text-xl font-bold font-mono text-primary uppercase tracking-wider">Anderson</h1>
          <p className="text-xs text-muted-foreground font-mono">Estacionamento</p>
        </div>

        <form onSubmit={handleSubmit} className="pdv-card p-5 space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="stat-label">Nome completo</label>
              <input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} className="pdv-input w-full text-base" />
            </div>
          )}
          <div className="space-y-1">
            <label className="stat-label">Login</label>
            <input
              type="text"
              placeholder="Digite seu login"
              value={login}
              onChange={(e) => setLogin(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
              className="pdv-input w-full text-base"
              required
              minLength={3}
              autoCapitalize="off"
              autoCorrect="off"
            />
            {isSignUp && (
              <p className="text-[10px] text-muted-foreground mt-1">Use letras, números, pontos ou hífens</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="stat-label">Senha</label>
            <input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="pdv-input w-full text-base" required minLength={6} />
          </div>
          <button type="submit" className="pdv-btn-green w-full flex items-center justify-center gap-2 text-base" disabled={loading}>
            {loading ? 'Aguarde...' : isSignUp ? 'CRIAR CONTA' : 'ENTRAR'} <ArrowRight className="h-4 w-4" />
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
