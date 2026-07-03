import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useState } from "react";
import {
  Home, Megaphone, Users, Search, User, Store, BarChart3, Settings,
  Ticket, MessageCircle, Shield, Crown, Server, Star, Bell, ScanLine, ClipboardList, Newspaper, MapPin, Briefcase, ShieldCheck
} from "lucide-react";
import { ROLE_BOTTOM_NAV, ROLE_COLORS, type AppRole } from "@shared/role-visibility";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Home, Megaphone, Users, Search, User, Store, BarChart3, Settings,
  Ticket, MessageCircle, Shield, Crown, Server, Star, Bell, ScanLine, ClipboardList, Newspaper, MapPin, Briefcase, ShieldCheck,
};

// When user is not authenticated, show only "Conta"
const UNAUTHENTICATED_NAV = [
  { icon: "User", label: "Conta", path: "/conta" },
];

// Sub-menus for each role that the Owner can "view as"
const OWNER_ROLE_SUBMENUS: Record<string, { icon: string; label: string; path: string }[]> = {
  Busca: [
    { icon: "Search", label: "Busca", path: "/" },
  ],
  User: ROLE_BOTTOM_NAV.user,
  Critic: ROLE_BOTTOM_NAV.critic,
  Influencer: ROLE_BOTTOM_NAV.influencer,
  Business: ROLE_BOTTOM_NAV.business,
  Support: ROLE_BOTTOM_NAV.support,
  Admin: ROLE_BOTTOM_NAV.admin,
  Owner: [
    { icon: "Crown", label: "Owner", path: "/owner" },
    { icon: "BarChart3", label: "Analytics", path: "/admin/analytics" },
    { icon: "Server", label: "Sistema", path: "/owner/sistema" },
    { icon: "Settings", label: "Config", path: "/admin" },
  ],
};

export default function BottomNav() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [activeOwnerRole, setActiveOwnerRole] = useState<string | null>(null);

  // While auth is loading, hide the BottomNav entirely to prevent flash of wrong role
  if (loading) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto" />
      </nav>
    );
  }

  // If not authenticated, show only "Conta" button
  if (!isAuthenticated) {
    const colors = ROLE_COLORS.user;
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 pb-safe">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {UNAUTHENTICATED_NAV.map((item) => {
            const Icon = iconMap[item.icon] || Home;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer">
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                      style={isActive ? { color: colors.primary } : undefined}
                    />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                    style={isActive ? { color: colors.primary } : undefined}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Authenticated: show role-based nav
  const role: AppRole = (user?.role as AppRole) || "user";
  const colors = ROLE_COLORS[role];

  // Owner gets a special double-row nav
  if (role === "owner") {
    const ownerNavItems = ROLE_BOTTOM_NAV.owner;
    const subMenuItems = activeOwnerRole ? OWNER_ROLE_SUBMENUS[activeOwnerRole] || [] : [];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
        {/* Secondary submenu (above primary) */}
        {activeOwnerRole && subMenuItems.length > 0 && (
          <div className="bg-card/95 backdrop-blur-sm border-t border-border/30">
            <div className="flex items-center justify-around h-14 max-w-lg mx-auto overflow-x-auto">
              {subMenuItems.map((item) => {
                const Icon = iconMap[item.icon] || Home;
                const isExactMatch = location === item.path;
                const isPartialMatch = item.path !== "/" && location.startsWith(item.path + "/");
                const hasMoreSpecificMatch = subMenuItems.some(
                  (other) => other.path !== item.path && other.path.startsWith(item.path + "/") &&
                    (location === other.path || location.startsWith(other.path + "/"))
                );
                const isActive = isExactMatch || (isPartialMatch && !hasMoreSpecificMatch);

                // Get the color for the role being viewed
                const roleKey = activeOwnerRole.toLowerCase() as AppRole;
                const subColors = ROLE_COLORS[roleKey] || ROLE_COLORS.owner;

                return (
                  <Link key={item.path + item.label} href={item.path}>
                    <div className="flex flex-col items-center gap-0.5 px-2 py-1 cursor-pointer">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                        style={isActive ? { color: subColors.primary } : undefined}
                      />
                      <span className={cn(
                        "text-[9px] font-medium transition-colors whitespace-nowrap",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                        style={isActive ? { color: subColors.primary } : undefined}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Primary owner role-switcher bar */}
        <div className="bg-background border-t border-border/50">
          <div className="flex items-center justify-around h-[72px] max-w-lg mx-auto overflow-x-auto">
            {ownerNavItems.map((item) => {
              const Icon = iconMap[item.icon] || Home;
              const isSelected = activeOwnerRole === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.label === "Busca") {
                      // Busca navigates directly
                      setActiveOwnerRole(null);
                      window.location.href = item.path;
                    } else {
                      setActiveOwnerRole(isSelected ? null : item.label);
                    }
                  }}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 cursor-pointer"
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all",
                    isSelected ? "bg-primary/15 scale-110" : "hover:bg-secondary/50"
                  )}>
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )}
                      style={isSelected ? { color: colors.primary } : undefined}
                    />
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold tracking-wide transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                    style={isSelected ? { color: colors.primary } : undefined}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  // Non-owner authenticated users
  const navItems = ROLE_BOTTOM_NAV[role] || ROLE_BOTTOM_NAV.user;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || Home;
          const isExactMatch = location === item.path;
          const isPartialMatch = item.path !== "/" && location.startsWith(item.path + "/");
          const hasMoreSpecificMatch = navItems.some(
            (other) => other.path !== item.path && other.path.startsWith(item.path + "/") && 
              (location === other.path || location.startsWith(other.path + "/"))
          );
          const isActive = isExactMatch || (isPartialMatch && !hasMoreSpecificMatch);

          return (
            <Link key={item.path} href={item.path}>
              <div className="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer">
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive && "bg-primary/10"
                )}>
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                    style={isActive ? { color: colors.primary } : undefined}
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                  style={isActive ? { color: colors.primary } : undefined}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
