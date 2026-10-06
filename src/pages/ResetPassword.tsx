import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import brandLogo from "@/assets/anderson-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useDatabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: branding } = useBranding();
  const loginLogo = branding?.logo_login_url || brandLogo;
  const systemName = branding?.nome_sistema || "Anderson Estacionamento";

  useEffect(() => {
    let cancelled = false;

    const processRecovery = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const searchParams = new URLSearchParams(search);
      const hashParams = new URLSearchParams(hash.replace("#", ""));

      // PKCE flow: ?code=...
      const recoveryCode = searchParams.get("code");
      // Hash flow: #access_token=...&type=recovery
      const hashAccessToken = hashParams.get("access_token");
      const hashType = hashParams.get("type");
      const hashRefreshToken = hashParams.get("refresh_token");

      console.log("[ResetPassword] hash:", hash);
      console.log("[ResetPassword] code:", recoveryCode, "hashType:", hashType);

      // Try PKCE code exchange
      if (recoveryCode) {
        console.log("[ResetPassword] Exchanging code for session...");
        const { error } = await supabase.auth.exchangeCodeForSession(recoveryCode);
        if (error) {
          console.error("[ResetPassword] Code exchange failed:", error.message);
          if (!cancelled) {
            setIsRecoveryReady(false);
            setChecking(false);
            toast({ title: "Link inválido ou expirado", description: error.message, variant: "destructive" });
          }
          return;
        }
        if (!cancelled) {
          setIsRecoveryReady(true);
          setChecking(false);
        }
        return;
      }

      // Try hash-based recovery (set session from tokens)
      if (hashAccessToken && hashType === "recovery") {
        console.log("[ResetPassword] Setting session from hash tokens...");
        const { error } = await supabase.auth.setSession({
          access_token: hashAccessToken,
          refresh_token: hashRefreshToken || "",
        });
        if (error) {
          console.error("[ResetPassword] setSession failed:", error.message);
          if (!cancelled) {
            setIsRecoveryReady(false);
            setChecking(false);
            toast({ title: "Link inválido ou expirado", description: error.message, variant: "destructive" });
          }
          return;
        }
        if (!cancelled) {
          setIsRecoveryReady(true);
          setChecking(false);
        }
        return;
      }

      // Check if there's already a session (user may have been redirected
      // after Supabase auto-processed the recovery)
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) {
        setIsRecoveryReady(Boolean(session));
        setChecking(false);
      }
    };

    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[ResetPassword] Auth event:", event);
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (!cancelled) {
          setIsRecoveryReady(true);
          setChecking(false);
        }
      }
    });

    processRecovery();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: "Erro ao redefinir senha", description: error.message, variant: "destructive" });
        return;
      }

      await supabase.auth.signOut();
      toast({ title: "Senha atualizada!", description: "Faça login com a nova senha." });
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto flex items-start sm:items-center justify-center bg-background p-4 py-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <img src={loginLogo} alt="" className="w-[560px] max-w-[86vw] opacity-[0.06] select-none" draggable={false} />
      </div>

      <div className="w-full max-w-[420px] space-y-5 relative z-10">
        <div className="text-center space-y-2">
          <img
            src={loginLogo}
            alt={systemName}
            className="mx-auto h-auto w-[230px] max-w-full object-contain"
          />
          <h1 className="text-xl font-bold font-mono text-primary uppercase tracking-wider">Redefinir senha</h1>
          <p className="text-xs text-muted-foreground font-mono">Crie uma nova senha para acessar o sistema</p>
        </div>

        <div className="pdv-card p-5 space-y-4">
          {checking ? (
            <div className="text-center space-y-2">
              <div className="h-8 w-8 rounded-lg bg-primary animate-pulse mx-auto" />
              <p className="text-sm text-muted-foreground">Validando link de recuperação...</p>
            </div>
          ) : !isRecoveryReady ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-destructive font-bold">Link inválido ou expirado</p>
              <p className="text-xs text-muted-foreground">Solicite um novo link de recuperação na tela de login.</p>
              <button onClick={() => navigate('/login')} className="pdv-btn-yellow w-full text-sm">
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="stat-label">Nova senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pdv-input w-full text-base pr-12"
                    minLength={6}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="stat-label">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pdv-input w-full text-base pr-12"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="pdv-btn-green w-full flex items-center justify-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" /> {loading ? 'Salvando...' : 'SALVAR NOVA SENHA'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
