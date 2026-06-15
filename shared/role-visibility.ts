/**
 * Role Visibility Rules for Avalyarin
 * 
 * Defines which roles each role can "see" in the system.
 * - User: sees user, influencer, business
 * - Influencer: sees user, influencer, business, support
 * - Business: sees user, influencer, business, support
 * - Support: sees user, influencer, business, support, admin
 * - Admin: sees all
 * - Owner: sees all
 */

export type AppRole = "user" | "influencer" | "business" | "support" | "admin" | "owner";

export const ROLE_VISIBILITY: Record<AppRole, AppRole[]> = {
  user: ["user", "influencer", "business"],
  influencer: ["user", "influencer", "business", "support"],
  business: ["user", "influencer", "business", "support"],
  support: ["user", "influencer", "business", "support", "admin"],
  admin: ["user", "influencer", "business", "support", "admin", "owner"],
  owner: ["user", "influencer", "business", "support", "admin", "owner"],
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
  business: 3,
  support: 4,
  admin: 5,
  owner: 6,
};

/**
 * Role display colors (for UI theming)
 */
export const ROLE_COLORS: Record<AppRole, { primary: string; border: string; badge: string }> = {
  user: { primary: "#f59e0b", border: "#f59e0b", badge: "bg-amber-500" },       // Amber
  influencer: { primary: "#eab308", border: "#ca8a04", badge: "bg-yellow-500" }, // Gold
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
    { icon: "Home", label: "Início", path: "/" },
    { icon: "Megaphone", label: "Destaques", path: "/destaques" },
    { icon: "Search", label: "Busca", path: "/busca" },
    { icon: "Star", label: "Avaliações", path: "/minhas-avaliacoes" },
    { icon: "User", label: "Conta", path: "/conta" },
  ],
  influencer: [
    { icon: "Home", label: "Início", path: "/" },
    { icon: "Megaphone", label: "Destaques", path: "/destaques" },
    { icon: "Search", label: "Busca", path: "/busca" },
    { icon: "Star", label: "Avaliações", path: "/minhas-avaliacoes" },
    { icon: "User", label: "Conta", path: "/conta" },
  ],
  business: [
    { icon: "Home", label: "Início", path: "/" },
    { icon: "Store", label: "Meu Bar", path: "/painel-empresarial" },
    { icon: "BarChart3", label: "Insights", path: "/painel-empresarial/insights" },
    { icon: "Bell", label: "Alertas", path: "/painel-empresarial/notificacoes" },
    { icon: "User", label: "Conta", path: "/conta" },
  ],
  support: [
    { icon: "Home", label: "Início", path: "/" },
    { icon: "Ticket", label: "Tickets", path: "/suporte/tickets" },
    { icon: "Store", label: "Estabs", path: "/suporte/estabs" },
    { icon: "MessageCircle", label: "Chat", path: "/suporte/chat" },
    { icon: "User", label: "Conta", path: "/conta" },
  ],
  admin: [
    { icon: "Home", label: "Início", path: "/" },
    { icon: "Users", label: "Equipe", path: "/admin/equipe" },
    { icon: "Star", label: "Influencers", path: "/admin/influencers" },
    { icon: "Store", label: "Estabs", path: "/admin/estabs" },
    { icon: "Settings", label: "Config", path: "/admin" },
  ],
  owner: [
    { icon: "Home", label: "Início", path: "/" },
    { icon: "BarChart3", label: "Analytics", path: "/admin/analytics" },
    { icon: "Crown", label: "Owner", path: "/owner" },
    { icon: "Shield", label: "Admin", path: "/admin" },
    { icon: "Server", label: "Sistema", path: "/owner/sistema" },
  ],
};
