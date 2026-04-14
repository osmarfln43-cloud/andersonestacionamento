import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { hasPermission } from "@/lib/permissions";
import logoImg from "@/assets/logo.png";
import {
  LayoutDashboard, LogIn, LogOut, Car, Users, CarFront, CalendarCheck,
  FileText, Printer, Settings, Wallet, ShieldCheck, User, Menu, X
} from "lucide-react";

const navItems = [
  { title: "Gerenciador", url: "/", icon: LayoutDashboard, perm: "dashboard", fKey: "F1" },
  { title: "Entrada", url: "/entrada", icon: LogIn, perm: "entrada", fKey: "F2" },
  { title: "Saída", url: "/saida", icon: LogOut, perm: "saida", fKey: "F3" },
  { title: "Pátio", url: "/patio", icon: Car, perm: "patio", fKey: "F4" },
  { title: "Clientes", url: "/clientes", icon: Users, perm: "clientes", fKey: "F5" },
  { title: "Veículos", url: "/veiculos", icon: CarFront, perm: "veiculos", fKey: "F6" },
  { title: "Mensalistas", url: "/mensalistas", icon: CalendarCheck, perm: "mensalistas", fKey: "F7" },
  { title: "Financeiro", url: "/financeiro", icon: Wallet, perm: "financeiro", fKey: "F8" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, perm: "relatorios", fKey: "F9" },
  { title: "Comprovantes", url: "/comprovantes", icon: Printer, perm: "comprovantes", fKey: "F10" },
  { title: "Admin", url: "/admin", icon: ShieldCheck, perm: "admin", fKey: "F11" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, perm: "configuracoes", fKey: "F12" },
];

const roleLabels: Record<string, string> = {
  admin: 'ADMINISTRADOR',
  gerente: 'GERENTE',
  operador: 'OPERADOR',
  financeiro: 'FINANCEIRO',
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = profile?.perfil || 'operador';
  const roleLabel = roleLabels[role] || role.toUpperCase();
  const userName = profile?.nome || roleLabel;

  const visibleItems = navItems.filter(item => hasPermission(role, item.perm));

  const [horaAtual, setHoraAtual] = useState(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const fIndex = parseInt(e.key.replace('F', ''));
      if (fIndex >= 1 && fIndex <= 12) {
        e.preventDefault();
        const item = visibleItems[fIndex - 1];
        if (item) navigate(item.url);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visibleItems, navigate]);

  const currentPage = navItems.find(n => n.url === location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header Bar */}
      <header className="pdv-header h-14 flex items-center px-3 md:px-4 gap-3 shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-2 shrink-0">
          <img src={logoImg} alt="Logo" className="h-8 w-8 rounded-md object-cover" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Anderson Estacionamentos</span>
          </div>
        </div>

        <span className="text-xs text-muted-foreground hidden md:block">›</span>
        <span className="text-xs font-bold text-accent hidden md:block">{roleLabel}</span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-lg md:text-xl font-mono font-bold text-primary tabular-nums">{horaAtual}</span>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{userName}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="hidden md:flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 pt-14 overflow-auto md:hidden">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div className="text-sm font-bold text-foreground">{userName}</div>
              <span className="text-xs font-bold text-accent">{roleLabel}</span>
            </div>
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <button
                  key={item.url}
                  onClick={() => { navigate(item.url); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold transition-colors ${
                    isActive ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{item.fKey}</span>
                </button>
              );
            })}
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold text-destructive hover:bg-destructive/10 mt-4"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-3 md:p-4 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation Bar - PDV Style */}
      <nav className="hidden md:block pdv-header shrink-0 border-t border-border">
        <div className="flex flex-wrap gap-1 p-2 max-w-[1600px] mx-auto">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.url;
            const isGerenciador = item.title === 'Gerenciador';
            return (
              <button
                key={item.url}
                onClick={() => navigate(item.url)}
                className={`flex-1 min-w-[100px] flex flex-col items-center gap-0.5 py-2 px-2 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all ${
                  isActive
                    ? (isGerenciador ? 'pdv-btn-red' : 'pdv-btn-green')
                    : 'pdv-btn-yellow'
                }`}
              >
                <span>{item.title}</span>
                <span className="text-[9px] opacity-60">{item.fKey}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="pdv-header shrink-0 py-2 px-4 text-center text-[10px] text-muted-foreground border-t border-border">
        <p>© 2026 Anderson Estacionamentos — Desenvolvimento ® OSMARJR Sistemas</p>
      </footer>
    </div>
  );
}
