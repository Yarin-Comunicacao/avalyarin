import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import {
  Home, Megaphone, Users, Search, User, Store, BarChart3, Settings,
  Ticket, MessageCircle, Shield, Crown, Server, Star, Bell, ScanLine, ClipboardList
} from "lucide-react";
import { ROLE_BOTTOM_NAV, ROLE_COLORS, type AppRole } from "@shared/role-visibility";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  Home, Megaphone, Users, Search, User, Store, BarChart3, Settings,
  Ticket, MessageCircle, Shield, Crown, Server, Star, Bell, ScanLine, ClipboardList,
};

// When user is not authenticated, show only "Conta"
const UNAUTHENTICATED_NAV = [
  { icon: "User", label: "Conta", path: "/conta" },
];

export default function BottomNav() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();

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
  const navItems = ROLE_BOTTOM_NAV[role] || ROLE_BOTTOM_NAV.user;
  const colors = ROLE_COLORS[role];

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
