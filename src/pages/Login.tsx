import { ParkingCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
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

        <form onSubmit={handleLogin} className="glass-card p-8 space-y-5">
          <div className="space-y-2">
            <Label className="stat-label">E-mail</Label>
            <Input
              type="email"
              placeholder="operador@mepark.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label className="stat-label">Senha</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-12"
            />
          </div>
          <Button type="submit" className="w-full h-13 text-base font-semibold gap-2 rounded-xl">
            Entrar <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Demo — qualquer credencial funciona
          </p>
        </form>

        <p className="text-center text-[10px] text-muted-foreground/50">
          © 2026 ME PARK AI • Estacionamento Inteligente
        </p>
      </div>
    </div>
  );
}
