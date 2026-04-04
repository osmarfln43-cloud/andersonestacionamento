import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
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
import NotFound from "./pages/NotFound";
import InstallPWA from "@/components/InstallPWA";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-xl bg-primary animate-pulse mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
    <Route path="/entrada" element={<ProtectedRoute><AppLayout><Entrada /></AppLayout></ProtectedRoute>} />
    <Route path="/saida" element={<ProtectedRoute><AppLayout><Saida /></AppLayout></ProtectedRoute>} />
    <Route path="/patio" element={<ProtectedRoute><AppLayout><Patio /></AppLayout></ProtectedRoute>} />
    <Route path="/clientes" element={<ProtectedRoute><AppLayout><Clientes /></AppLayout></ProtectedRoute>} />
    <Route path="/veiculos" element={<ProtectedRoute><AppLayout><Veiculos /></AppLayout></ProtectedRoute>} />
    <Route path="/mensalistas" element={<ProtectedRoute><AppLayout><Mensalistas /></AppLayout></ProtectedRoute>} />
    <Route path="/relatorios" element={<ProtectedRoute><AppLayout><Relatorios /></AppLayout></ProtectedRoute>} />
    <Route path="/financeiro" element={<ProtectedRoute><AppLayout><Financeiro /></AppLayout></ProtectedRoute>} />
    <Route path="/comprovantes" element={<ProtectedRoute><AppLayout><Comprovantes /></AppLayout></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
    <Route path="/configuracoes" element={<ProtectedRoute><AppLayout><Configuracoes /></AppLayout></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <InstallPWA />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
