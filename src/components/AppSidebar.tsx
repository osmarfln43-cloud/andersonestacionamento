import {
  LayoutDashboard, LogIn, LogOut, Car, Users, CarFront, CalendarCheck,
  FileText, Printer, Settings, Wallet, ChevronLeft,
  ChevronRight, ParkingCircle, Sparkles, ShieldCheck, PiggyBank
} from "lucide-react";
import brandIcon from "@/assets/anderson-icon.png.asset.json";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { hasPermission } from "@/lib/permissions";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const operationalItems = [
  { title: "Gerenciador", url: "/", icon: LayoutDashboard, perm: "dashboard" },
  { title: "Entrada", url: "/entrada", icon: LogIn, perm: "entrada" },
  { title: "Saída", url: "/saida", icon: LogOut, perm: "saida" },
  { title: "Pátio", url: "/patio", icon: Car, perm: "patio" },
];

const managementItems = [
  { title: "Clientes", url: "/clientes", icon: Users, perm: "clientes" },
  { title: "Veículos", url: "/veiculos", icon: CarFront, perm: "veiculos" },
  { title: "Mensalistas", url: "/mensalistas", icon: CalendarCheck, perm: "mensalistas" },
];

const businessItems = [
  { title: "Financeiro", url: "/financeiro", icon: Wallet, perm: "financeiro" },
  { title: "Fluxo de Caixa", url: "/caixa", icon: PiggyBank, perm: "caixa" },
  { title: "Relatórios", url: "/relatorios", icon: FileText, perm: "relatorios" },
  { title: "Comprovantes", url: "/comprovantes", icon: Printer, perm: "comprovantes" },
];

const systemItems = [
  { title: "Admin", url: "/admin", icon: ShieldCheck, perm: "admin" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, perm: "configuracoes" },
];

type MenuItem = { title: string; url: string; icon: any; perm: string };

function MenuSection({ label, items, collapsed, role }: { label: string; items: MenuItem[]; collapsed: boolean; role: string | null }) {
  const location = useLocation();
  const visibleItems = items.filter(item => hasPermission(role, item.perm));
  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup className="py-1">
      {!collapsed && (
        <div className="px-4 pt-4 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">{label}</span>
        </div>
      )}
      {collapsed && <div className="h-3" />}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1 px-2">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end
                    className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      item.title === 'Gerenciador'
                        ? (isActive ? 'bg-destructive/10 text-destructive' : 'text-destructive hover:bg-destructive/10')
                        : (isActive ? 'bg-primary/[0.08] text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')
                    }`}
                    activeClassName=""
                  >
                    {isActive && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full ${item.title === 'Gerenciador' ? 'bg-destructive' : 'bg-primary'}`} />
                    )}
                    <item.icon className={`h-5 w-5 shrink-0 transition-colors ${item.title === 'Gerenciador' ? 'text-destructive' : (isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}`} />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { signOut, profile } = useAuth();
  const collapsed = state === "collapsed";
  const role = profile?.perfil || null;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden">
            <img src={brandIcon.url} alt="Anderson Estacionamento" className="h-10 w-10 object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
               <span className="text-[15px] font-bold text-foreground tracking-tight font-display">Anderson</span>
              <span className="text-[10px] text-muted-foreground tracking-wide">Estacionamento</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-1">
        <MenuSection label="Operacional" items={operationalItems} collapsed={collapsed} role={role} />
        <MenuSection label="Cadastros" items={managementItems} collapsed={collapsed} role={role} />
        <MenuSection label="Negócios" items={businessItems} collapsed={collapsed} role={role} />
        <MenuSection label="Sistema" items={systemItems} collapsed={collapsed} role={role} />
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {!collapsed && (
          <>
            {/* Role badge */}
            <div className="glass-card p-2.5 flex items-center gap-2">
              <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                role === 'admin' ? 'bg-destructive/10 text-destructive' :
                role === 'gerente' ? 'bg-primary/10 text-primary' :
                role === 'financeiro' ? 'bg-warning/10 text-warning' :
                'bg-accent/10 text-accent'
              }`}>
                {(profile?.nome || '?').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">{profile?.nome || 'Usuário'}</p>
                <p className="text-[9px] text-muted-foreground capitalize">{role || 'carregando...'}</p>
              </div>
            </div>
            <div className="glass-card p-3 flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground">IA Ativa</p>
                <p className="text-[10px] text-muted-foreground">Monitorando operação</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            </div>
          </>
        )}
        <button
          onClick={() => { signOut(); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Recolher</span></>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
