/**
 * Role Visibility Rules for Avalyarin
 * 
 * Defines which roles each role can "see" in the system.
 * - User: sees user, specialist, critic, business
 * - Especialista: sees user, specialist, critic, business, support
 * - Critic: sees user, specialist, critic, business, support
 * - Business: sees user, specialist, critic, business, support
 * - Support: sees user, specialist, critic, business, support, admin
 * - Admin: sees all
 * - Owner: sees all
 */

export type AppRole = "user" | "specialist" | "critic" | "business" | "support" | "admin" | "owner";

export const ROLE_VISIBILITY: Record<AppRole, AppRole[]> = {
  user: ["user", "specialist", "critic", "business"],
  specialist: ["user", "specialist", "critic", "business", "support"],
  critic: ["user", "specialist", "critic", "business", "support"],
  business: ["user", "specialist", "critic", "business", "support"],
  support: ["user", "specialist", "critic", "business", "support", "admin"],
  admin: ["user", "specialist", "critic", "business", "support", "admin", "owner"],
  owner: ["user", "specialist", "critic", "business", "support", "admin", "owner"],
};

/**
 * Check if a role can see another role
 */
export function canSeeRole(viewerRole: AppRole, targetRole: AppRole): boolean {
  return ROLE_VISIBILITY[viewerRole]?.includes(targetRole) ?? false;
}

/**
 * Get the visible roles for a given role
 */
export function getVisibleRoles(role: AppRole): AppRole[] {
  return ROLE_VISIBILITY[role] ?? [];
}

/**
 * Role hierarchy (higher number = more power)
 */
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  user: 1,
  specialist: 2,
  critic: 3,
  business: 4,
  support: 5,
  admin: 6,
  owner: 7,
};

/**
 * Role display colors (for UI theming)
 */
export const ROLE_COLORS: Record<AppRole, { primary: string; border: string; badge: string }> = {
  user: { primary: "#f59e0b", border: "#f59e0b", badge: "bg-amber-500" },       // Amber
  specialist: { primary: "#eab308", border: "#ca8a04", badge: "bg-yellow-500" }, // Gold
  critic: { primary: "#a855f7", border: "#9333ea", badge: "bg-purple-500" },     // Purple
  business: { primary: "#f97316", border: "#ea580c", badge: "bg-orange-500" },   // Orange
  support: { primary: "#14b8a6", border: "#0d9488", badge: "bg-teal-500" },      // Teal
  admin: { primary: "#ef4444", border: "#dc2626", badge: "bg-red-500" },         // Red
  owner: { primary: "#eab308", border: "#ca8a04", badge: "bg-yellow-600" },      // Gold Crown
};

/**
 * Role display names in Portuguese
 */
export const ROLE_LABELS: Record<AppRole, string> = {
  user: "Usuário",
  specialist: "Especialista",
  critic: "Crítico Gastronômico",
  business: "Empresarial",
  support: "Suporte",
  admin: "Administrador",
  owner: "Owner",
};

/**
 * Bottom navigation items per role
 */
export const ROLE_BOTTOM_NAV: Record<AppRole, { icon: string; label: string; path: string }[]> = {
  user: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "MapPin", label: "Mapa", path: "/mapa" },
    { icon: "Users", label: "Grupos", path: "/grupos" },
    { icon: "Star", label: "Avaliações", path: "/minhas-avaliacoes" },
    { icon: "User", label: "Perfil", path: "/perfil" },
  ],
  specialist: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "ScanLine", label: "Scan", path: "/scan" },
    { icon: "Newspaper", label: "Painel", path: "/painel-especialista" },
    { icon: "Star", label: "Avaliações", path: "/minhas-avaliacoes" },
    { icon: "User", label: "Perfil", path: "/perfil" },
  ],
  critic: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "ScanLine", label: "Scan", path: "/scan" },
    { icon: "Newspaper", label: "Painel", path: "/painel-critico" },
    { icon: "Star", label: "Avaliações", path: "/minhas-avaliacoes" },
    { icon: "User", label: "Perfil", path: "/perfil" },
  ],
  business: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "Store", label: "Meus Locais", path: "/business/locais" },
    { icon: "BarChart3", label: "Insights", path: "/business/insights" },
    { icon: "Megaphone", label: "Divulgação", path: "/business/divulgacoes" },
    { icon: "User", label: "Perfil", path: "/perfil" },
  ],
  support: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "Ticket", label: "Tickets", path: "/suporte/tickets" },
    { icon: "Store", label: "Estabs", path: "/suporte/estabs" },
    { icon: "MessageCircle", label: "Chat", path: "/suporte/chat" },
    { icon: "User", label: "Conta", path: "/conta" },
  ],
  admin: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "Users", label: "Equipe", path: "/admin/equipe" },
    { icon: "Briefcase", label: "Negócio", path: "/admin/negocio" },
    { icon: "ShieldCheck", label: "Permissões", path: "/admin/permissoes" },
    { icon: "Settings", label: "Config", path: "/admin/config" },
  ],
  owner: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "User", label: "User", path: "/perfil" },
    { icon: "Star", label: "Critic", path: "/painel-critico" },
    { icon: "Megaphone", label: "Especialista", path: "/specialist" },
    { icon: "Store", label: "Business", path: "/business/locais" },
    { icon: "MessageCircle", label: "Support", path: "/suporte/tickets" },
    { icon: "Shield", label: "Admin", path: "/admin" },
    { icon: "Crown", label: "Owner", path: "/owner" },
  ],
};
