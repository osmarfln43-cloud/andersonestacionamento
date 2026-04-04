import {
  LayoutDashboard, LogIn, LogOut, Car, Users, CarFront, CalendarCheck,
  FileText, Printer, Settings, Wallet, ChevronLeft,
  ChevronRight, ParkingCircle, Sparkles, ShieldCheck
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const operationalItems = [
  { title: "Gerenciador", url: "/", icon: LayoutDashboard },
  { title: "Entrada", url: "/entrada", icon: LogIn },
  { title: "Saída", url: "/saida", icon: LogOut },
  { title: "Pátio", url: "/patio", icon: Car },
];

const managementItems = [
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Veículos", url: "/veiculos", icon: CarFront },
  { title: "Mensalistas", url: "/mensalistas", icon: CalendarCheck },
];

const businessItems = [
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Comprovantes", url: "/comprovantes", icon: Printer },
];

const systemItems = [
  { title: "Admin", url: "/admin", icon: ShieldCheck },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

function MenuSection({ label, items, collapsed }: { label: string; items: typeof operationalItems; collapsed: boolean }) {
  const location = useLocation();
  return (
    <SidebarGroup className="py-1">
      {!collapsed && (
        <div className="px-4 pt-4 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">{label}</span>
        </div>
      )}
      {collapsed && <div className="h-3" />}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-0.5 px-2">
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                      item.title === 'Gerenciador'
                        ? (isActive ? 'bg-destructive/10 text-destructive' : 'text-destructive hover:bg-destructive/10')
                        : (isActive ? 'bg-primary/[0.08] text-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')
                    }`}
                    activeClassName=""
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                    )}
                    <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
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
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary glow-primary">
            <ParkingCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-bold text-foreground tracking-tight font-display">ME PARK AI</span>
              <span className="text-[10px] text-muted-foreground tracking-wide">Estacionamento Inteligente</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-1">
        <MenuSection label="Operacional" items={operationalItems} collapsed={collapsed} />
        <MenuSection label="Cadastros" items={managementItems} collapsed={collapsed} />
        <MenuSection label="Negócios" items={businessItems} collapsed={collapsed} />
        <MenuSection label="Sistema" items={systemItems} collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {!collapsed && (
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
