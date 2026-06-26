import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Crown, Users, Store, Star, TrendingUp, DollarSign,
  Shield, UserCog, Settings, BarChart3, ArrowUpRight, ArrowDownRight, ClipboardList
} from "lucide-react";
import { useState } from "react";

export default function OwnerPanel() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "growth" | "financials" | "roles">("overview");

  const { data: stats, isLoading: statsLoading } = trpc.ownerPanel.stats.useQuery();
  const { data: growth, isLoading: growthLoading } = trpc.ownerPanel.growth.useQuery();
  const { data: financials, isLoading: financialsLoading } = trpc.ownerPanel.financials.useQuery();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground">Apenas o Owner pode acessar esta página.</p>
          <Link href="/">
            <span className="text-primary hover:underline mt-4 inline-block">Voltar ao início</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Visão Geral", icon: Crown },
    { id: "growth" as const, label: "Crescimento", icon: TrendingUp },
    { id: "financials" as const, label: "Financeiro", icon: DollarSign },
    { id: "roles" as const, label: "Gestão de Roles", icon: UserCog },
  ];

  const growthPercentage = stats
    ? stats.newUsersLastMonth > 0
      ? (((stats.newUsersThisMonth - stats.newUsersLastMonth) / stats.newUsersLastMonth) * 100).toFixed(1)
      : "100"
    : "0";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-yellow-900/20 to-background border-b border-yellow-500/20 px-4 pt-6 pb-4">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wider text-yellow-500">PAINEL OWNER</h1>
              <p className="text-xs text-muted-foreground">Visão estratégica da plataforma Avalyarin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-yellow-500 text-yellow-500"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 px-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Usuários</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : stats?.totalUsers.toLocaleString("pt-BR")}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {Number(growthPercentage) >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${Number(growthPercentage) >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {growthPercentage}% este mês
                  </span>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-muted-foreground">Estabelecimentos</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : stats?.totalEstablishments.toLocaleString("pt-BR")}
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-muted-foreground">Avaliações</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : stats?.totalRatings.toLocaleString("pt-BR")}
                </p>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Verificados</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? "..." : stats?.verifiedUsers.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <h3 className="font-display text-lg text-foreground mb-3">Novos este mês</h3>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xl font-bold text-yellow-500">{stats?.newUsersThisMonth || 0}</p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div className="text-center">
                  <p className="text-xl font-bold text-yellow-500">{stats?.totalGroups || 0}</p>
                  <p className="text-xs text-muted-foreground">Grupos</p>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div className="text-center">
                  <p className="text-xl font-bold text-yellow-500">{stats?.newUsersLastMonth || 0}</p>
                  <p className="text-xs text-muted-foreground">Mês anterior</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <h3 className="font-display text-lg text-foreground mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer">
                    <Shield className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-foreground">Painel Admin</span>
                  </div>
                </Link>
                <Link href="/owner/sistema">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors cursor-pointer">
                    <Settings className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-foreground">Sistema</span>
                  </div>
                </Link>
                <Link href="/admin?tab=users">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer">
                    <UserCog className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-foreground">Gerenciar Roles</span>
                  </div>
                </Link>
                <Link href="/admin?tab=insights">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-foreground">Analytics</span>
                  </div>
                </Link>
                <Link href="/owner/survey">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors cursor-pointer">
                    <ClipboardList className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-foreground">Survey</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Growth Tab */}
        {activeTab === "growth" && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-foreground">Crescimento (últimos 6 meses)</h2>
            {growthLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-12 bg-card rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {growth?.map((month) => (
                  <div key={month.month} className="bg-card border border-border/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground capitalize">{month.month}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-lg font-bold text-blue-400">{month.users}</p>
                        <p className="text-xs text-muted-foreground">Usuários</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-orange-400">{month.establishments}</p>
                        <p className="text-xs text-muted-foreground">Estabs</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-amber-400">{month.ratings}</p>
                        <p className="text-xs text-muted-foreground">Avaliações</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Financials Tab */}
        {activeTab === "financials" && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-foreground">Financeiro</h2>
            {financialsLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-32 bg-card rounded-lg" />
                <div className="h-24 bg-card rounded-lg" />
              </div>
            ) : (
              <>
                {/* Plan Distribution */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <h3 className="font-display text-lg text-foreground mb-4">Distribuição de Planos</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="text-sm text-foreground">Free</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{financials?.freeUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <span className="text-sm text-foreground">Premium</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{financials?.premiumUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm text-foreground">Embaixador</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{financials?.embaixadorUsers || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Conversion */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <h3 className="font-display text-lg text-foreground mb-3">Conversão</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-500">{financials?.totalPaying || 0}</p>
                      <p className="text-xs text-muted-foreground">Pagantes</p>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{financials?.conversionRate || "0"}%</p>
                      <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-foreground">Distribuição de Roles</h2>
            {statsLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-12 bg-card rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats?.roleDistribution.map((item) => {
                  const roleColors: Record<string, string> = {
                    user: "text-amber-400 bg-amber-400/10 border-amber-400/20",
                    influencer: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
                    business: "text-orange-400 bg-orange-400/10 border-orange-400/20",
                    support: "text-teal-400 bg-teal-400/10 border-teal-400/20",
                    admin: "text-red-400 bg-red-400/10 border-red-400/20",
                    owner: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
                  };
                  const roleLabels: Record<string, string> = {
                    user: "Usuário",
                    influencer: "Influencer",
                    business: "Empresarial",
                    support: "Suporte",
                    admin: "Administrador",
                    owner: "Owner",
                  };
                  const colors = roleColors[item.role] || "text-gray-400 bg-gray-400/10 border-gray-400/20";
                  return (
                    <div key={item.role} className={`flex items-center justify-between p-4 rounded-xl border ${colors}`}>
                      <span className="text-sm font-medium">{roleLabels[item.role] || item.role}</span>
                      <span className="text-lg font-bold">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manage Roles Link */}
            <div className="bg-card border border-border/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Para alterar roles de usuários, acesse o Painel Admin na aba Usuários.
              </p>
              <Link href="/admin?tab=users">
                <span className="inline-flex items-center gap-1 text-sm text-yellow-500 hover:underline cursor-pointer">
                  <UserCog className="w-4 h-4" />
                  Gerenciar Usuários
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
