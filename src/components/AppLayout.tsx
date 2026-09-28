import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import brandLogo from "@/assets/anderson-logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import { hasPermission } from "@/lib/permissions";
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
import { LayoutDashboard, LogIn, LogOut, CalendarCheck, FileText, Printer, Settings, Wallet, ShieldCheck, User, Menu, X, BarChart3, ChevronDown, ChevronUp } from "lucide-react";

const navItems = [
  { title: "Entrada", url: "/entrada", icon: LogIn, perm: "entrada", fKey: "F1" },
  { title: "Saída", url: "/saida", icon: LogOut, perm: "saida", fKey: "F2" },
  { title: "Pgto. Mensal", url: "/mensalistas", icon: CalendarCheck, perm: "mensalistas", fKey: "F3" },
  { title: "Financeiro", url: "/financeiro", icon: Wallet, perm: "financeiro", fKey: "F4" },
  { title: "Comprovantes", url: "/comprovantes", icon: Printer, perm: "comprovantes", fKey: "F5" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, perm: "configuracoes", fKey: "F6" },
  { title: "Gráficos", url: "/graficos", icon: BarChart3, perm: "graficos", fKey: "F7" },
  { title: "Gerenciador", url: "/", icon: LayoutDashboard, perm: "dashboard", fKey: "F8" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, perm: "relatorios", fKey: "F9" },
  { title: "Administração", url: "/admin", icon: ShieldCheck, perm: "admin", fKey: "F10" },
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
  const [adminOpen, setAdminOpen] = useState(false);

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
          <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider hidden sm:block">FENIX SYSTENS</span>
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
          <img src={brandLogo} alt="" className="w-[420px] max-w-[72vw] object-contain opacity-[0.06]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1600px] min-h-full p-3 md:p-4">
          {children}
        </div>
      </main>

      <nav className="shrink-0 bg-slate-100 px-3 pt-2 pb-1 max-h-[48dvh] overflow-y-auto" aria-label="Ações do estacionamento">
        <div className="grid grid-cols-2 gap-2">
          {visibleItems.slice(0, 2).map((item) => (
            <button key={item.url} onClick={() => navigate(item.url)}
              className={`min-h-[72px] rounded-xl flex items-center justify-center gap-2 text-lg font-black text-white ${item.url === '/entrada' ? 'bg-red-600' : 'bg-green-600'}`}>
              <item.icon className="h-6 w-6" /> {item.title.toUpperCase()}
            </button>
          ))}
        </div>
        {visibleItems.slice(2).length > 0 && (
          <div className="mt-2">
            <button onClick={() => setAdminOpen((value) => !value)} aria-expanded={adminOpen}
              className="w-full min-h-[52px] rounded-xl bg-slate-800 text-white text-base font-bold flex items-center justify-between px-4">
              <span>ADMIN</span>{adminOpen ? <ChevronUp /> : <ChevronDown />}
            </button>
            {adminOpen && <div className="grid grid-cols-2 gap-2 py-2">
              {visibleItems.slice(2).map((item) => (
                <button key={item.url} onClick={() => { navigate(item.url); setAdminOpen(false); }}
                  className="min-h-[48px] rounded-lg bg-white border border-slate-300 text-slate-900 text-sm font-semibold px-2">
                  {item.title}
                </button>
              ))}
            </div>}
          </div>
        )}
        <img src={brandLogo} alt="Anderson Estacionamento" className="h-9 max-w-[150px] object-contain mx-auto mt-1" />
      </nav>

      {/* Footer */}
      <footer className="pdv-header shrink-0 py-1.5 px-2 text-[8px] leading-relaxed text-white/40">
        <div className="grid grid-cols-3 gap-2 items-center">
          <p className="text-left break-words">
            Desenvolvimento{' '}
            <a
              href="https://fenixsystens.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline-offset-2 transition-colors hover:text-yellow-300 hover:underline focus-visible:text-yellow-300"
            >
              fenixsystens.com.br
            </a>{' '}
            by osmarjr sistemas
          </p>
          <p className="text-center break-words">Copyright Todos os Direitos Reservados</p>
          <p className="text-right break-words">© 2026 Anderson Estacionamentos</p>
        </div>
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
