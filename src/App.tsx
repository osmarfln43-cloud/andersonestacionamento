import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/entrada" element={<AppLayout><Entrada /></AppLayout>} />
          <Route path="/saida" element={<AppLayout><Saida /></AppLayout>} />
          <Route path="/patio" element={<AppLayout><Patio /></AppLayout>} />
          <Route path="/clientes" element={<AppLayout><Clientes /></AppLayout>} />
          <Route path="/veiculos" element={<AppLayout><Veiculos /></AppLayout>} />
          <Route path="/mensalistas" element={<AppLayout><Mensalistas /></AppLayout>} />
          <Route path="/relatorios" element={<AppLayout><Relatorios /></AppLayout>} />
          <Route path="/financeiro" element={<AppLayout><Financeiro /></AppLayout>} />
          <Route path="/comprovantes" element={<AppLayout><Comprovantes /></AppLayout>} />
          <Route path="/admin" element={<AppLayout><Admin /></AppLayout>} />
          <Route path="/configuracoes" element={<AppLayout><Configuracoes /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
