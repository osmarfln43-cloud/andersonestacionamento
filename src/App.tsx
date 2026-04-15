import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { SplashScreen } from "@/components/SplashScreen";
import { useState, useCallback } from "react";
import { canAccessRoute, getDefaultRoute } from "@/lib/permissions";
import Dashboard from "./pages/Dashboard";
import Entrada from "./pages/Entrada";
import Saida from "./pages/Saida";
import Patio from "./pages/Patio";
import Clientes from "./pages/Clientes";
import Veiculos from "./pages/Veiculos";
import Mensalistas from "./pages/Mensalistas";
import Relatorios from "./pages/Relatorios";
import Financeiro from "./pages/Financeiro";
import Comprovantes from "./pages/Comprovantes";
import Admin from "./pages/Admin";
import Configuracoes from "./pages/Configuracoes";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import InstallPWA from "@/components/InstallPWA";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-lg bg-primary animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground font-mono">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  const role = profile?.perfil;
  if (!canAccessRoute(role, location.pathname)) {
    const defaultRoute = getDefaultRoute(role);
    return <Navigate to={defaultRoute} replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedRoleRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <RoleRoute>{children}</RoleRoute>
      </AppLayout>
    </ProtectedRoute>
  );
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoleRoute><Dashboard /></ProtectedRoleRoute>} />
    <Route path="/entrada" element={<ProtectedRoleRoute><Entrada /></ProtectedRoleRoute>} />
    <Route path="/saida" element={<ProtectedRoleRoute><Saida /></ProtectedRoleRoute>} />
    <Route path="/patio" element={<ProtectedRoleRoute><Patio /></ProtectedRoleRoute>} />
    <Route path="/clientes" element={<ProtectedRoleRoute><Clientes /></ProtectedRoleRoute>} />
    <Route path="/veiculos" element={<ProtectedRoleRoute><Veiculos /></ProtectedRoleRoute>} />
    <Route path="/mensalistas" element={<ProtectedRoleRoute><Mensalistas /></ProtectedRoleRoute>} />
    <Route path="/relatorios" element={<ProtectedRoleRoute><Relatorios /></ProtectedRoleRoute>} />
    <Route path="/financeiro" element={<ProtectedRoleRoute><Financeiro /></ProtectedRoleRoute>} />
    <Route path="/comprovantes" element={<ProtectedRoleRoute><Comprovantes /></ProtectedRoleRoute>} />
    <Route path="/admin" element={<ProtectedRoleRoute><Admin /></ProtectedRoleRoute>} />
    <Route path="/configuracoes" element={<ProtectedRoleRoute><Configuracoes /></ProtectedRoleRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    const hasSeenSplash = sessionStorage.getItem('mepark-splash-seen');
    return !hasSeenSplash || isStandalone;
  });

  const handleSplashFinish = useCallback(() => {
    sessionStorage.setItem('mepark-splash-seen', 'true');
    setShowSplash(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
          <BrowserRouter>
            <AppRoutes />
            <InstallPWA />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
