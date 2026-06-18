/**
 * Role Visibility Rules for Avalyarin
 * 
 * Defines which roles each role can "see" in the system.
 * - User: sees user, influencer, critic, business
 * - Influencer: sees user, influencer, critic, business, support
 * - Critic: sees user, influencer, critic, business, support
 * - Business: sees user, influencer, critic, business, support
 * - Support: sees user, influencer, critic, business, support, admin
 * - Admin: sees all
 * - Owner: sees all
 */

export type AppRole = "user" | "influencer" | "critic" | "business" | "support" | "admin" | "owner";

export const ROLE_VISIBILITY: Record<AppRole, AppRole[]> = {
  user: ["user", "influencer", "critic", "business"],
  influencer: ["user", "influencer", "critic", "business", "support"],
  critic: ["user", "influencer", "critic", "business", "support"],
  business: ["user", "influencer", "critic", "business", "support"],
  support: ["user", "influencer", "critic", "business", "support", "admin"],
  admin: ["user", "influencer", "critic", "business", "support", "admin", "owner"],
  owner: ["user", "influencer", "critic", "business", "support", "admin", "owner"],
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
  influencer: 2,
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
  influencer: { primary: "#eab308", border: "#ca8a04", badge: "bg-yellow-500" }, // Gold
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
  influencer: "Influencer",
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
    { icon: "ScanLine", label: "Scan", path: "/scan" },
    { icon: "Users", label: "Grupos", path: "/grupos" },
    { icon: "Star", label: "Avaliações", path: "/minhas-avaliacoes" },
    { icon: "User", label: "Conta", path: "/conta" },
  ],
  influencer: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "ScanLine", label: "Scan", path: "/scan" },
    { icon: "Users", label: "Grupos", path: "/grupos" },
    { icon: "Star", label: "Avaliações", path: "/minhas-avaliacoes" },
    { icon: "User", label: "Conta", path: "/conta" },
  ],
  critic: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "ScanLine", label: "Scan", path: "/scan" },
    { icon: "Newspaper", label: "Painel", path: "/painel-critico" },
    { icon: "Star", label: "Avaliações", path: "/minhas-avaliacoes" },
    { icon: "User", label: "Conta", path: "/conta" },
  ],
  business: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "Store", label: "Meu Bar", path: "/painel-empresarial" },
    { icon: "BarChart3", label: "Insights", path: "/painel-empresarial/insights" },
    { icon: "Bell", label: "Alertas", path: "/painel-empresarial/notificacoes" },
    { icon: "User", label: "Conta", path: "/conta" },
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
    { icon: "Star", label: "Influencers", path: "/admin/influencers" },
    { icon: "Store", label: "Estabs", path: "/admin/estabs" },
    { icon: "Settings", label: "Config", path: "/admin" },
  ],
  owner: [
    { icon: "Search", label: "Busca", path: "/" },
    { icon: "BarChart3", label: "Analytics", path: "/admin/analytics" },
    { icon: "Crown", label: "Owner", path: "/owner" },
    { icon: "Shield", label: "Admin", path: "/admin" },
    { icon: "Server", label: "Sistema", path: "/owner/sistema" },
  ],
};
