import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import brandLogo from "@/assets/anderson-logo.png";
import brandIcon from "@/assets/anderson-icon.png";
import { useLocation, useNavigate } from "react-router-dom";
import { hasPermission } from "@/lib/permissions";
import { BackToTopButton } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
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
  FileText, Printer, Settings, Wallet, ShieldCheck, User, BarChart3,
  ChevronDown, ChevronUp, PiggyBank
} from "lucide-react";

const adminItems = [
  { title: "Home", url: "/", icon: LayoutDashboard, perm: "dashboard", fKey: "F1" },
  { title: "Pátio", url: "/patio", icon: Car, perm: "patio", fKey: "F2" },
  { title: "Pgto. Mensal", url: "/mensalistas", icon: CalendarCheck, perm: "mensalistas", fKey: "F3" },
  { title: "Financeiro", url: "/financeiro", icon: Wallet, perm: "financeiro", fKey: "F4" },
  { title: "Fluxo de Caixa", url: "/caixa", icon: PiggyBank, perm: "caixa", fKey: "F5" },
  { title: "Comprovantes", url: "/comprovantes", icon: Printer, perm: "comprovantes", fKey: "F6" },
  { title: "Gráficos", url: "/graficos", icon: BarChart3, perm: "graficos", fKey: "F7" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, perm: "relatorios", fKey: "F8" },
  { title: "Clientes", url: "/clientes", icon: Users, perm: "clientes", fKey: "F9" },
  { title: "Veículos", url: "/veiculos", icon: CarFront, perm: "veiculos", fKey: "F10" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, perm: "configuracoes", fKey: "F11" },
  { title: "Administração", url: "/admin", icon: ShieldCheck, perm: "admin", fKey: "F12" },
];

const primaryItems = [
  { title: "Entrada", url: "/entrada", icon: LogIn, perm: "entrada" },
  { title: "Saída", url: "/saida", icon: LogOut, perm: "saida" },
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
  const [adminOpen, setAdminOpen] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const role = profile?.perfil || 'operador';
  const roleLabel = roleLabels[role] || role.toUpperCase();

  const visibleAdminItems = adminItems.filter(item => hasPermission(role, item.perm));
  const visiblePrimaryItems = primaryItems.filter(item => hasPermission(role, item.perm));

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
          const item = adminItems.find(n => n.fKey === `F${fNum}`);
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
          <img src={brandIcon} alt="Anderson Estacionamento" className="h-8 w-9 object-contain" />
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
        </div>
      </header>

      {/* Main Content */}
      <main className="app-scroll-area relative flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-0 pb-8">
          <img src={brandLogo} alt="" className="w-[420px] max-w-[72vw] object-contain opacity-[0.06]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1600px] min-h-full p-3 md:p-4">
          {children}
        </div>
      </main>

      {/* Operational navigation - always visible */}
      <nav className="shrink-0 border-t border-border bg-secondary p-2" aria-label="Navegação principal">
        <div className={`grid gap-2 ${visiblePrimaryItems.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {visiblePrimaryItems.map((item) => {
            const isEntrada = item.url === '/entrada';
            const isActive = location.pathname === item.url;
            return (
              <Button
                key={item.url}
                onClick={() => navigate(item.url)}
                className={`h-14 gap-2 rounded-md text-base font-black uppercase shadow-none ${
                  isEntrada
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : 'bg-accent text-accent-foreground hover:bg-accent/90'
                } ${isActive ? 'ring-2 ring-foreground ring-offset-2 ring-offset-secondary' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setAdminOpen(open => !open)}
          aria-expanded={adminOpen}
          aria-controls="admin-navigation"
          className="mt-2 h-11 w-full justify-between rounded-md bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <span className="font-black uppercase">Admin</span>
          {adminOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>

        {adminOpen && (
          <div id="admin-navigation" className="mt-2 grid max-h-[34vh] grid-cols-2 gap-2 overflow-y-auto rounded-md" role="region" aria-label="Opções administrativas">
            {visibleAdminItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Button
                  key={item.url}
                  type="button"
                  variant="outline"
                  onClick={() => { navigate(item.url); setAdminOpen(false); }}
                  className={`h-12 justify-center gap-2 rounded-sm bg-card text-xs font-bold sm:text-sm ${isActive ? 'border-primary bg-primary/10 text-primary' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                  <span className="hidden text-[9px] text-muted-foreground sm:inline">{item.fKey}</span>
                </Button>
              );
            })}
          </div>
        )}
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
