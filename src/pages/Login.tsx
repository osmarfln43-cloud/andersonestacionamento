import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import andersonLoginLogo from "@/assets/anderson-login-logo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const navigate = useNavigate();
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !senha.trim()) return;

    setLoading(true);
    try {
      if (isSignUp) {
        if (!email.trim()) {
          toast({ title: "Informe seu e-mail", variant: "destructive" });
          return;
        }

        const { error } = await signUp(login, senha, nome || login, email);

        if (error) {
          toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Conta criada com sucesso!" });
          navigate("/");
        }
      } else {
        const { error } = await signIn(login, senha);

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

  const handleForgotPassword = async () => {
    const identifier = (forgotIdentifier || login || email).trim();
    if (!identifier) {
      toast({ title: "Informe seu login ou e-mail", variant: "destructive" });
      return;
    }

    setForgotLoading(true);
    try {
      const { error } = await requestPasswordReset(identifier, `${window.location.origin}/reset-password`);
      if (error) {
        toast({ title: "Erro ao enviar link", description: error.message, variant: "destructive" });
        return;
      }

      toast({
        title: "Link enviado",
        description: "Se o cadastro existir, você receberá o link de redefinição no e-mail informado.",
      });
      setShowForgotPassword(false);
      setForgotIdentifier("");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto flex items-start sm:items-center justify-center bg-background p-4 py-6 relative">
      <div className="w-full max-w-[400px] space-y-5 relative z-10 animate-in" style={{ opacity: 0 }}>
        <div className="flex justify-center">
          <img src={andersonLoginLogo} alt="Anderson Estacionamento" className="w-[270px] max-w-[82vw] h-auto object-contain" />
        </div>

        <form onSubmit={handleSubmit} className="pdv-card p-5 space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="stat-label">Nome completo</label>
                <input placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} className="pdv-input w-full text-base" required />
              </div>
              <div className="space-y-1">
                <label className="stat-label">E-mail</label>
                <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pdv-input w-full text-base" required />
                <p className="text-[10px] text-muted-foreground mt-1">Usado para recuperação de senha e identificação no sistema</p>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="stat-label">Login</label>
            <input
              type="text"
              placeholder={isSignUp ? "Crie seu login" : "Seu login ou e-mail"}
              value={login}
              onChange={(e) => setLogin(e.target.value.replace(/[^a-zA-Z0-9._@-]/g, ''))}
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="pdv-input w-full text-base pr-12"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="space-y-3 rounded-xl border border-border bg-secondary/20 p-3">
              <button
                type="button"
                onClick={() => setShowForgotPassword((prev) => !prev)}
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
              >
                <Mail className="h-3.5 w-3.5" /> Esqueci minha senha
              </button>

              {showForgotPassword && (
                <div className="space-y-3 pt-1">
                  <input
                    type="text"
                    placeholder="Seu login ou e-mail"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="pdv-input w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    className="pdv-btn-yellow w-full flex items-center justify-center gap-2 text-sm"
                  >
                    {forgotLoading ? 'Enviando...' : 'MANDAR LINK'}
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="pdv-btn-green w-full flex items-center justify-center gap-2 text-base" disabled={loading}>
            {loading ? 'Aguarde...' : isSignUp ? 'CRIAR CONTA' : 'ENTRAR'} <ArrowRight className="h-4 w-4" />
          </button>

          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">
            {isSignUp ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar conta'}
          </button>
        </form>

      </div>
    </div>
  );
}
