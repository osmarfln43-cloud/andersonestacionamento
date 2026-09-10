// Role-based permission definitions

export type UserRole = 'admin' | 'gerente' | 'operador' | 'financeiro';

export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'dashboard', 'entrada', 'saida', 'patio',
    'clientes', 'veiculos', 'mensalistas',
    'financeiro', 'caixa', 'relatorios', 'comprovantes',
    'admin', 'configuracoes', 'usuarios',
    'exportar_pdf', 'importar', 'deletar',
  ],
  gerente: [
    'dashboard', 'entrada', 'saida', 'patio',
    'clientes', 'veiculos', 'mensalistas',
    'relatorios', 'comprovantes',
  ],
  operador: [
    'entrada', 'saida', 'patio', 'comprovantes',
  ],
  financeiro: [
    'dashboard', 'financeiro', 'caixa', 'relatorios', 'mensalistas',
  ],
};

// Map routes to required permissions
export const routePermissions: Record<string, string> = {
  '/': 'dashboard',
  '/entrada': 'entrada',
  '/saida': 'saida',
  '/patio': 'patio',
  '/clientes': 'clientes',
  '/veiculos': 'veiculos',
  '/mensalistas': 'mensalistas',
  '/financeiro': 'financeiro',
  '/caixa': 'caixa',
  '/relatorios': 'relatorios',
  '/comprovantes': 'comprovantes',
  '/admin': 'admin',
  '/configuracoes': 'configuracoes',
};

export function hasPermission(role: string | undefined | null, permission: string): boolean {
  if (!role) return false;
  const perms = rolePermissions[role as UserRole];
  if (!perms) return false;
  return perms.includes(permission);
}

export function canAccessRoute(role: string | undefined | null, path: string): boolean {
  if (!role) return false;
  if (role === 'admin') return true; // admin has full access
  const perm = routePermissions[path];
  if (!perm) return true; // unknown routes are allowed (will 404)
  return hasPermission(role, perm);
}

// Get the default landing page for a role
export function getDefaultRoute(role: string | undefined | null): string {
  if (!role || role === 'admin' || role === 'gerente') return '/';
  if (role === 'operador') return '/entrada';
  if (role === 'financeiro') return '/';
  return '/';
}
