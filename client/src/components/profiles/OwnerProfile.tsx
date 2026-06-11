import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Crown, Users, Store, Star, Server, Shield, BarChart3, Settings, Database, FileText } from "lucide-react";
import { Link } from "wouter";

export default function OwnerProfile() {
  const { user } = useAuth();
  const { data: adminStats } = trpc.admin.stats.useQuery(undefined, { enabled: !!user });

  return (
    <div className="pb-20">
      {/* Profile Info */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar with gold crown border */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center overflow-hidden border-[3px] border-yellow-500 shadow-lg shadow-yellow-500/30">
              {user?.name ? (
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <Crown className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="absolute -top-2 -right-1 w-7 h-7 flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500 drop-shadow-md" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-lg text-foreground truncate">
                {user?.name || "Owner"}
              </h2>
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 text-[10px] font-bold">
                OWNER
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Proprietário do Sistema</p>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Visão Geral</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Usuários</span>
            </div>
            <span className="text-xl font-bold text-foreground mt-1 block">{adminStats?.users ?? 0}</span>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Estabelecimentos</span>
            </div>
            <span className="text-xl font-bold text-foreground mt-1 block">{adminStats?.establishments ?? 0}</span>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Avaliações</span>
            </div>
            <span className="text-xl font-bold text-foreground mt-1 block">{adminStats?.ratings ?? 0}</span>
          </div>
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Sistema</span>
            </div>
            <span className="text-sm font-bold text-green-500 mt-1 block">Online ✓</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Controles do Owner</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin/usuarios">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Shield className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-foreground">Gerenciar Roles</span>
            </div>
          </Link>
          <Link href="/admin">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Users className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-foreground">Aprovar Admins</span>
            </div>
          </Link>
          <Link href="/admin/analytics">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <BarChart3 className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-foreground">Analytics</span>
            </div>
          </Link>
          <Link href="/admin/config">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Settings className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-foreground">Configurações</span>
            </div>
          </Link>
          <Link href="/admin">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Database className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-foreground">Backup</span>
            </div>
          </Link>
          <Link href="/admin">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <FileText className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-foreground">Logs</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
