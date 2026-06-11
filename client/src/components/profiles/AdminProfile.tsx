import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Shield, Users, Store, Star, Clock, UserPlus, CheckCircle2, FileText, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link } from "wouter";

export default function AdminProfile() {
  const { user } = useAuth();
  const { data: adminStats } = trpc.admin.stats.useQuery(undefined, { enabled: !!user });

  return (
    <div className="pb-20">
      {/* Profile Info */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar with red border */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center overflow-hidden border-[3px] border-red-500">
              {user?.name ? (
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <Shield className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-background">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-lg text-foreground truncate">
                {user?.name || "Admin"}
              </h2>
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 text-[10px] font-bold">
                ADMIN
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Administrador do Sistema</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Usuários</span>
            </div>
            <span className="text-xl font-bold text-foreground mt-1 block">{adminStats?.users ?? 0}</span>
          </div>
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Estabelecimentos</span>
            </div>
            <span className="text-xl font-bold text-foreground mt-1 block">{adminStats?.establishments ?? 0}</span>
          </div>
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Avaliações</span>
            </div>
            <span className="text-xl font-bold text-foreground mt-1 block">{adminStats?.ratings ?? 0}</span>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pendentes</span>
            </div>
            <span className="text-xl font-bold text-foreground mt-1 block">{adminStats?.pendingClaims ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin/usuarios">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <UserPlus className="w-4 h-4 text-red-500" />
              <span className="text-sm text-foreground">Gerenciar Usuários</span>
            </div>
          </Link>
          <Link href="/admin">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-red-500" />
              <span className="text-sm text-foreground">Aprovações</span>
            </div>
          </Link>
          <Link href="/admin/analytics">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <BarChart3 className="w-4 h-4 text-red-500" />
              <span className="text-sm text-foreground">Analytics</span>
            </div>
          </Link>
          <Link href="/admin/config">
            <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Settings className="w-4 h-4 text-red-500" />
              <span className="text-sm text-foreground">Configurações</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground mb-3">Atividade Recente</h3>
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">Sistema operacional</p>
              <p className="text-xs text-muted-foreground">Todos os serviços ativos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
