import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import watermarkLogo from "@/assets/watermark-logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import { hasPermission } from "@/lib/permissions";
import logoImg from "@/assets/logo.png";
import { BackToTopButton } from "@/components/ScrollToTop";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LayoutDashboard, LogIn, LogOut, Car, Users, CarFront, CalendarCheck,
  FileText, Printer, Settings, Wallet, ShieldCheck, User, Menu, X
} from "lucide-react";

const navItems = [
  { title: "Pátio", url: "/patio", icon: Car, perm: "patio", fKey: "F1", bg: "hsl(50 80% 72%)", bgActive: "hsl(50 80% 62%)", textColor: "#333" },
  { title: "Saída/Fechamento", url: "/saida", icon: LogOut, perm: "saida", fKey: "F2", bg: "hsl(50 80% 72%)", bgActive: "hsl(50 80% 62%)", textColor: "#333" },
  { title: "Comprovantes", url: "/comprovantes", icon: Printer, perm: "comprovantes", fKey: "F3", bg: "hsl(130 40% 55%)", bgActive: "hsl(130 40% 45%)", textColor: "#fff" },
  { title: "Pgto. Mensal", url: "/mensalistas", icon: CalendarCheck, perm: "mensalistas", fKey: "F4", bg: "hsl(130 40% 55%)", bgActive: "hsl(130 40% 45%)", textColor: "#fff" },
  { title: "Financeiro", url: "/financeiro", icon: Wallet, perm: "financeiro", fKey: "F5", bg: "hsl(130 40% 55%)", bgActive: "hsl(130 40% 45%)", textColor: "#fff" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, perm: "configuracoes", fKey: "F6", bg: "hsl(130 40% 55%)", bgActive: "hsl(130 40% 45%)", textColor: "#fff" },
  { title: "Entrada", url: "/entrada", icon: LogIn, perm: "entrada", fKey: "F7", bg: "hsl(65 70% 52%)", bgActive: "hsl(65 65% 45%)", textColor: "#333" },
  { title: "Clientes", url: "/clientes", icon: Users, perm: "clientes", fKey: "F8", bg: "hsl(65 70% 52%)", bgActive: "hsl(65 65% 45%)", textColor: "#333" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, perm: "relatorios", fKey: "F9", bg: "hsl(65 70% 52%)", bgActive: "hsl(65 65% 45%)", textColor: "#333" },
  { title: "Veículos", url: "/veiculos", icon: CarFront, perm: "veiculos", fKey: "F10", bg: "hsl(65 70% 52%)", bgActive: "hsl(65 65% 45%)", textColor: "#333" },
  { title: "Gerenciador", url: "/", icon: LayoutDashboard, perm: "dashboard", fKey: "F11", bg: "hsl(65 70% 52%)", bgActive: "hsl(65 65% 45%)", textColor: "#333" },
  { title: "Admin", url: "/admin", icon: ShieldCheck, perm: "admin", fKey: "F12", bg: "hsl(65 70% 52%)", bgActive: "hsl(65 65% 45%)", textColor: "#333" },
];

const roleLabels: Record<string, string> = {
  admin: 'ADMIN',
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
  const [showExitDialog, setShowExitDialog] = useState(false);

  const role = profile?.perfil || 'operador';
  const roleLabel = roleLabels[role] || role.toUpperCase();

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

  // F1-F12 + ESC keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowExitDialog(true);
        return;
      }
      if (e.key.startsWith('F') && e.key.length <= 3) {
        const fNum = parseInt(e.key.substring(1));
        if (fNum >= 1 && fNum <= 12) {
          e.preventDefault();
          const item = navItems.find(n => n.fKey === `F${fNum}`);
          if (item && hasPermission(role, item.perm)) {
            navigate(item.url);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [role, navigate]);

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      {/* Top Header Bar - dark green like PARKEE */}
      <header className="pdv-header h-12 flex items-center px-3 md:px-4 gap-3 shrink-0 z-40">
        <div className="flex items-center gap-2 shrink-0">
          <img src={logoImg} alt="Logo" className="h-7 w-7 rounded-sm object-cover" />
          <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider hidden sm:block">OSMARJR SISTEMAS</span>
        </div>

        <span className="text-xs text-white/50 hidden md:block">›</span>
        <span className="text-xs font-bold text-white hidden md:block">ANDERSON ESTACIONAMENTOS</span>
        <span className="text-xs text-white/50 hidden md:block">›</span>
        <span className="text-xs font-bold text-yellow-300 hidden md:block">{roleLabel}</span>
        <span className="text-xs text-white/50 hidden md:block">›</span>
        <span className="text-xs font-bold text-white/80 hidden md:block">{profile?.nome || ''}</span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-base md:text-lg font-mono font-bold text-white tabular-nums">{horaAtual}</span>
          <div className="hidden md:flex items-center gap-2">
            <User className="h-4 w-4 text-white/70" />
            <button
              onClick={() => signOut()}
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              Sair
            </button>
          </div>
          <button
            className="md:hidden p-1.5 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-12 overflow-y-auto overscroll-contain md:hidden" style={{ backgroundColor: 'hsl(120 30% 22%)' }}>
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/20">
              <span className="text-sm font-bold text-white">{profile?.nome || 'Usuário'}</span>
              <span className="text-xs font-bold text-yellow-300">{roleLabel}</span>
            </div>
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <button
                  key={item.url}
                  onClick={() => { navigate(item.url); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-colors rounded-sm ${
                    isActive ? 'bg-white/20 text-yellow-300' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  <span className="ml-auto text-[10px] text-white/40">{item.fKey}</span>
                </button>
              );
            })}
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/20 mt-3 rounded-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-scroll-area relative flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-0 pb-8">
          <img src={watermarkLogo} alt="" className="w-[350px] h-[350px] object-contain opacity-[0.06]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1600px] min-h-full p-3 md:p-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - always visible */}
      <nav className="shrink-0">
        {/* Row 1 */}
        <div className="flex gap-0.5 px-1 pt-1" style={{ backgroundColor: 'hsl(200 30% 88%)' }}>
          {visibleItems.slice(0, 6).map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <button
                key={item.url}
                onClick={() => navigate(item.url)}
                className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-[11px] font-bold uppercase tracking-wide transition-all border-2 border-black/10"
                style={{ backgroundColor: isActive ? item.bgActive : item.bg, color: item.textColor, borderRadius: '2px' }}
              >
                <span>{item.title}</span>
                <span className="text-[9px] opacity-50 mt-0.5">{item.fKey}</span>
              </button>
            );
          })}
        </div>
        {/* Row 2 */}
        <div className="flex gap-0.5 px-1 pb-1" style={{ backgroundColor: 'hsl(200 30% 88%)' }}>
          {visibleItems.slice(6, 12).map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <button
                key={item.url}
                onClick={() => navigate(item.url)}
                className="flex-1 flex flex-col items-center justify-center py-2 px-1 text-[11px] font-bold uppercase tracking-wide transition-all border-2 border-black/10"
                style={{ backgroundColor: isActive ? item.bgActive : item.bg, color: item.textColor, borderRadius: '2px' }}
              >
                <span>{item.title}</span>
                <span className="text-[9px] opacity-50 mt-0.5">{item.fKey}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="pdv-header shrink-0 py-1.5 px-4 text-center text-[9px] text-white/40">
        <p>© 2026 Anderson Estacionamentos — Desenvolvimento ® OSMARJR Sistemas</p>
      </footer>

      <BackToTopButton />

      {/* Exit confirmation dialog (ESC key) */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black">Sair do aplicativo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair da plataforma? Você precisará fazer login novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => signOut()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
