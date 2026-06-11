import { useAuth } from "@/_core/hooks/useAuth";
import { ROLE_COLORS, ROLE_LABELS, type AppRole } from "@shared/role-visibility";
import { Camera, Bell, Menu, Star, BadgeCheck, Crown, Shield, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  onMenuOpen?: () => void;
  notificationCount?: number;
}

export default function ProfileHeader({ onMenuOpen, notificationCount = 0 }: ProfileHeaderProps) {
  const { user } = useAuth();
  const role: AppRole = (user?.role as AppRole) || "user";
  const colors = ROLE_COLORS[role];

  const getRoleIcon = () => {
    switch (role) {
      case "influencer": return <Star className="w-4 h-4 text-yellow-500" />;
      case "support": return <Headphones className="w-4 h-4 text-teal-500" />;
      case "admin": return <Shield className="w-4 h-4 text-red-500" />;
      case "owner": return <Crown className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border/30">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Menu */}
        <button onClick={onMenuOpen} className="p-2 -ml-2">
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Center: Username + role icon */}
        <div className="flex items-center gap-1.5">
          <span className="font-display text-base font-semibold tracking-wide text-foreground">
            {user?.username || user?.name || "Usuário"}
          </span>
          {getRoleIcon()}
        </div>

        {/* Right: Notifications */}
        <button className="p-2 -mr-2 relative">
          <Bell className="w-5 h-5 text-foreground" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
