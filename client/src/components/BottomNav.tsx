import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import {
  Home, Megaphone, Users, Search, User, Store, BarChart3, Settings,
  Ticket, MessageCircle, Shield, Crown, Server, Star, Bell, ScanLine, ClipboardList, Newspaper, MapPin, Briefcase, ShieldCheck, AtSign, Check, X
} from "lucide-react";
import { ROLE_BOTTOM_NAV, ROLE_COLORS, type AppRole } from "@shared/role-visibility";
import { cn } from "@/lib/utils";
import { useOwnerView } from "@/contexts/OwnerViewContext";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BugReportButton from "@/components/BugReportButton";

const iconMap: Record<string, React.ElementType> = {
  Home, Megaphone, Users, Search, User, Store, BarChart3, Settings,
  Ticket, MessageCircle, Shield, Crown, Server, Star, Bell, ScanLine, ClipboardList, Newspaper, MapPin, Briefcase, ShieldCheck,
};

// When user is not authenticated, show only "Perfil"
const UNAUTHENTICATED_NAV = [
  { icon: "User", label: "Perfil", path: "/perfil" },
];

// Sub-menus for each role that the Owner can "view as"
const OWNER_ROLE_SUBMENUS: Record<string, { icon: string; label: string; path: string }[]> = {
  Busca: [
    { icon: "Search", label: "Busca", path: "/busca" },
  ],
  User: ROLE_BOTTOM_NAV.user,
  Critic: ROLE_BOTTOM_NAV.critic,
  Especialista: ROLE_BOTTOM_NAV.specialist,
  Business: ROLE_BOTTOM_NAV.business,
  Support: ROLE_BOTTOM_NAV.support,
  Admin: ROLE_BOTTOM_NAV.admin,
  Owner: [
    { icon: "Crown", label: "Owner", path: "/owner" },
    { icon: "BarChart3", label: "Analytics", path: "/owner/analytics" },
    { icon: "Server", label: "Sistema", path: "/owner/sistema" },
    { icon: "Settings", label: "Config", path: "/owner/config" },
    { icon: "User", label: "Perfil", path: "/perfil" },
  ],
};

// Map BottomNav label to AppRole
const LABEL_TO_ROLE: Record<string, AppRole> = {
  User: "user",
  Critic: "critic",
  Especialista: "specialist",
  Business: "business",
  Support: "support",
  Admin: "admin",
  Owner: "owner",
};

// Roles that support per-role usernames
const USERNAME_ROLES: AppRole[] = ["user", "specialist", "critic"];

// Map role to display label for the username dialog
const ROLE_DISPLAY_LABEL: Record<string, string> = {
  user: "Usuário",
  specialist: "Especialista",
  critic: "Crítico",
};

export default function BottomNav() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [activeOwnerRole, setActiveOwnerRole] = useState<string | null>(null);
  const { setViewingAs } = useOwnerView();
  // IMPORTANT: All hooks must be declared before any conditional returns
  const { data: pendingFollowCount } = trpc.social.pendingCount.useQuery(undefined, { enabled: isAuthenticated });
  const { data: groupInvitesList } = trpc.groups.pendingInvites.useQuery(undefined, { enabled: isAuthenticated });
  const { data: dmConvsList } = trpc.social.dmConversations.useQuery(undefined, { enabled: isAuthenticated });
  const totalNotifCount = (pendingFollowCount || 0) + (groupInvitesList?.length || 0) + (dmConvsList?.reduce((a: number, c: any) => a + (c.unreadCount || 0), 0) || 0);

  // Owner multi-profile: fetch role-specific usernames
  const isOwner = isAuthenticated && user?.role === "owner";
  const { data: roleUsernames, refetch: refetchUsernames } = trpc.profile.getRoleUsernames.useQuery(undefined, { enabled: isOwner });

  // Username config dialog state
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [usernameDialogRole, setUsernameDialogRole] = useState<"user" | "specialist" | "critic">("user");
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const setRoleUsernameMutation = trpc.profile.setRoleUsername.useMutation({
    onSuccess: (data) => {
      toast.success("Username salvo com sucesso!");
      setUsernameDialogOpen(false);
      setUsernameInput("");
      setUsernameError("");
      refetchUsernames();
    },
    onError: (err) => {
      if (err.message.includes("em uso")) {
        setUsernameError("Este username já está em uso.");
      } else {
        setUsernameError(err.message || "Erro ao salvar username.");
      }
    },
  });

  // When switching to a role that supports usernames, check if one is set
  const handleOwnerRoleSwitch = (label: string) => {
    const newRole = activeOwnerRole === label ? null : label;
    setActiveOwnerRole(newRole);
    setViewingAs(newRole ? (LABEL_TO_ROLE[newRole] || null) : null);

    // If activating a role that supports per-role username, check if configured
    if (newRole) {
      const appRole = LABEL_TO_ROLE[newRole];
      if (appRole && USERNAME_ROLES.includes(appRole)) {
        const currentUsername = roleUsernames?.[appRole as keyof typeof roleUsernames];
        if (!currentUsername) {
          // Prompt to set username for this role
          setUsernameDialogRole(appRole as "user" | "specialist" | "critic");
          setUsernameInput("");
          setUsernameError("");
          setUsernameDialogOpen(true);
        }
      }
    }
  };

  const handleSaveUsername = () => {
    const clean = usernameInput.trim().toLowerCase();
    if (clean.length < 3) {
      setUsernameError("Mínimo 3 caracteres.");
      return;
    }
    if (clean.length > 30) {
      setUsernameError("Máximo 30 caracteres.");
      return;
    }
    if (!/^[a-zA-Z0-9._]+$/.test(clean)) {
      setUsernameError("Apenas letras, números, pontos e underscores.");
      return;
    }
    setUsernameError("");
    setRoleUsernameMutation.mutate({ role: usernameDialogRole, username: clean });
  };

  // Get the username for the currently active role (for display)
  const getActiveRoleUsername = (): string | null => {
    if (!activeOwnerRole || !roleUsernames) return null;
    const appRole = LABEL_TO_ROLE[activeOwnerRole];
    if (!appRole || !USERNAME_ROLES.includes(appRole)) return null;
    return roleUsernames[appRole as keyof typeof roleUsernames] || null;
  };

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
    const activeUsername = getActiveRoleUsername();

    return (
      <>
        {/* Username config dialog */}
        <Dialog open={usernameDialogOpen} onOpenChange={setUsernameDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AtSign className="w-5 h-5 text-primary" />
                Configurar Username
              </DialogTitle>
              <DialogDescription>
                Defina seu @username para o perfil de <strong>{ROLE_DISPLAY_LABEL[usernameDialogRole]}</strong>.
                Este username será público e único no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-lg">@</span>
                <Input
                  placeholder="meu_username"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value.replace(/\s/g, ""));
                    setUsernameError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveUsername();
                  }}
                  className="flex-1"
                  autoFocus
                />
              </div>
              {usernameError && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  {usernameError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Apenas letras, números, pontos e underscores. Mínimo 3 caracteres.
              </p>
              {roleUsernames?.[usernameDialogRole as keyof typeof roleUsernames] && (
                <p className="text-xs text-muted-foreground">
                  Username atual: <span className="text-foreground font-medium">@{roleUsernames[usernameDialogRole as keyof typeof roleUsernames]}</span>
                </p>
              )}
            </div>
            <DialogFooter className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setUsernameDialogOpen(false)}
                size="sm"
              >
                Pular
              </Button>
              <Button
                onClick={handleSaveUsername}
                disabled={setRoleUsernameMutation.isPending || !usernameInput.trim()}
                size="sm"
              >
                {setRoleUsernameMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BugReportButton />
        <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
          {/* Active role username indicator */}
          {activeOwnerRole && activeUsername && (
            <div className="bg-card/90 backdrop-blur-sm border-t border-border/20 px-4 py-1.5">
              <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
                <AtSign className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground font-medium">{activeUsername}</span>
                <button
                  onClick={() => {
                    const appRole = LABEL_TO_ROLE[activeOwnerRole];
                    if (appRole && USERNAME_ROLES.includes(appRole)) {
                      setUsernameDialogRole(appRole as "user" | "specialist" | "critic");
                      setUsernameInput(activeUsername || "");
                      setUsernameError("");
                      setUsernameDialogOpen(true);
                    }
                  }}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline"
                >
                  editar
                </button>
              </div>
            </div>
          )}

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
                // Show per-role username below the label for roles that support it
                const appRole = LABEL_TO_ROLE[item.label];
                const hasUsernameSupport = appRole && USERNAME_ROLES.includes(appRole);
                const roleUsername = hasUsernameSupport && roleUsernames
                  ? roleUsernames[appRole as keyof typeof roleUsernames]
                  : null;

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.label === "Busca") {
                        // Busca navigates directly
                        setActiveOwnerRole(null);
                        setViewingAs(null);
                        window.location.href = item.path;
                      } else {
                        handleOwnerRoleSwitch(item.label);
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
                      "text-[9px] font-bold tracking-wide transition-colors leading-tight",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                      style={isSelected ? { color: colors.primary } : undefined}
                    >
                      {item.label}
                    </span>
                    {/* Show role-specific username below the label */}
                    {roleUsername && (
                      <span className="text-[8px] text-muted-foreground/70 truncate max-w-[60px] leading-none">
                        @{roleUsername}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </>
    );
  }

    // Non-owner authenticated users
  const navItems = ROLE_BOTTOM_NAV[role] || ROLE_BOTTOM_NAV.user;

  return (
    <>
      <BugReportButton />
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
          const isPerfilItem = item.path === "/perfil";

          return (
            <Link key={item.path} href={item.path}>
              <div className="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer relative">
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors relative"
                  )}
                  style={isActive ? { backgroundColor: `${colors.primary}15` } : undefined}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      !isActive && "text-muted-foreground"
                    )}
                    style={isActive ? { color: colors.primary } : undefined}
                  />
                  {isPerfilItem && totalNotifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-background" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    !isActive && "text-muted-foreground"
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
    </>
  );
}
