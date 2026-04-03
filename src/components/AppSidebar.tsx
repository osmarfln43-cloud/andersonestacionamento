import {
  LayoutDashboard, LogIn, LogOut, Car, Users, CarFront, CalendarCheck,
  FileText, Printer, Settings, UserCog, Building2, Wallet, ChevronLeft, Bot, ParkingCircle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Entrada", url: "/entrada", icon: LogIn },
  { title: "Saída", url: "/saida", icon: LogOut },
  { title: "Pátio", url: "/patio", icon: Car },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Veículos", url: "/veiculos", icon: CarFront },
  { title: "Mensalistas", url: "/mensalistas", icon: CalendarCheck },
  { title: "Relatórios", url: "/relatorios", icon: FileText },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Comprovantes", url: "/comprovantes", icon: Printer },
  { title: "Unidades", url: "/unidades", icon: Building2 },
  { title: "Usuários", url: "/usuarios", icon: UserCog },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <ParkingCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">ME PARK AI</span>
              <span className="text-[10px] text-sidebar-foreground">Estacionamento Inteligente</span>
            </div>
          )}
          {!collapsed && (
            <button onClick={toggleSidebar} className="ml-auto text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
            {!collapsed && "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                        activeClassName=""
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="glass-card p-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-accent shrink-0" />
            <span className="text-xs text-muted-foreground">IA ativa</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
