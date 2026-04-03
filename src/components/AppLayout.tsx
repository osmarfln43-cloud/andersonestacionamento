import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, ChevronDown } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-4 border-b border-border/50 px-6 shrink-0 backdrop-blur-sm bg-background/80 sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />

            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{greeting},</span>
              <span className="text-foreground font-medium">Operador</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1.5 rounded-xl bg-secondary border border-border/50 text-xs text-muted-foreground cursor-pointer hover:border-primary/30 transition-colors">
              <span>ME PARK Centro</span>
              <ChevronDown className="h-3 w-3" />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden md:block text-[11px] text-muted-foreground font-mono tracking-tight">
                {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </span>

              <div className="flex items-center gap-1 ml-3">
                <button className="relative p-2.5 rounded-xl hover:bg-secondary transition-colors">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="relative p-2.5 rounded-xl hover:bg-secondary transition-colors">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
                </button>
                <div className="ml-1 h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border/50 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors">
                  <span className="text-xs font-bold font-display text-foreground">OP</span>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
