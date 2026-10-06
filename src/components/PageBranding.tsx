import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useBranding } from "@/hooks/useDatabase";

const pageNames: Record<string, string> = {
  "/": "Home",
  "/entrada": "Entrada",
  "/saida": "Saída",
  "/patio": "Pátio",
  "/mensalistas": "Pgto. Mensal",
  "/financeiro": "Financeiro",
  "/caixa": "Fluxo de Caixa",
  "/comprovantes": "Comprovantes",
  "/graficos": "Gráficos",
  "/relatorios": "Relatórios",
  "/clientes": "Clientes",
  "/veiculos": "Veículos",
  "/configuracoes": "Configurações",
  "/admin": "Administração",
  "/login": "Login",
  "/reset-password": "Redefinir senha",
};

export function PageBranding() {
  const location = useLocation();
  const { data: branding } = useBranding();

  useEffect(() => {
    const systemName = branding?.nome_sistema?.trim() || "Anderson Estacionamento";
    const pageName = pageNames[location.pathname];
    document.title = branding?.titulo_pagina_automatico && pageName
      ? `${pageName} | ${systemName}`
      : systemName;
  }, [branding?.nome_sistema, branding?.titulo_pagina_automatico, location.pathname]);

  return null;
}