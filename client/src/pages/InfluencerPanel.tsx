/**
 * Painel do Influencer — /painel-influencer
 * Área exclusiva para influencers aprovados com abas:
 * - Visão Geral (métricas, seguidores, avaliações recentes)
 * - Parcerias (propostas, ativas, histórico)
 * - Códigos Promo (códigos associados)
 * - Meu Perfil Público (preview do que os seguidores veem)
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Redirect } from "wouter";
import { Loader2, BarChart3, Handshake, Tag, UserCircle, Users, Star, TrendingUp, MapPin, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

type Tab = "overview" | "partnerships" | "promos" | "profile";

export default function InfluencerPanel() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "influencer") {
    return <Redirect to="/" />;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "partnerships", label: "Parcerias", icon: Handshake },
    { id: "promos", label: "Códigos", icon: Tag },
    { id: "profile", label: "Meu Perfil", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="container pt-24 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <BadgeCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-wider text-primary">PAINEL INFLUENCER</h1>
            <p className="text-sm text-muted-foreground">Olá, {user.name || user.username}!</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-border/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <OverviewTab userId={user.id} />}
        {activeTab === "partnerships" && <PartnershipsTab userId={user.id} />}
        {activeTab === "promos" && <PromosTab userId={user.id} />}
        {activeTab === "profile" && <ProfileTab userId={user.id} userName={user.name || user.username || ""} />}
      </div>
    </div>
  );
}

function OverviewTab({ userId }: { userId: number }) {
  const { data: stats, isLoading } = trpc.analytics.myStats.useQuery();
  const { data: profile } = trpc.influencerProfile.get.useQuery({ influencerId: userId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const followers = profile?.followerCount || 0;
  const totalRatings = stats?.totalRatings || 0;
  const avgScore = stats?.avgScore || 0;
  const locaisVisitados = stats?.establishmentsVisited || 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="Seguidores" value={String(followers)} color="text-blue-400" />
        <MetricCard icon={Star} label="Avaliações" value={String(totalRatings)} color="text-amber-400" />
        <MetricCard icon={TrendingUp} label="Nota Média" value={avgScore.toFixed(1)} color="text-green-400" />
        <MetricCard icon={MapPin} label="Categorias" value={String(locaisVisitados)} color="text-purple-400" />
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border/30 rounded-xl p-5">
        <h3 className="font-display text-lg tracking-wider text-primary mb-4">ATIVIDADE RECENTE</h3>
        {stats?.ratingsByMonth && stats.ratingsByMonth.length > 0 ? (
          <div className="space-y-2">
            {stats.ratingsByMonth.slice(0, 6).map((m: any) => (
              <div key={m.month} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <span className="text-sm text-foreground">{m.month}</span>
                <span className="font-numbers text-sm text-primary">{m.count} avaliações</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
        )}
      </div>

      {/* Reminder: Only QR ratings */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <p className="text-sm text-amber-300">
          <strong>Lembrete:</strong> Como influencer, suas avaliações devem ser feitas presencialmente via QR Code no estabelecimento.
        </p>
      </div>
    </div>
  );
}

function PartnershipsTab({ userId }: { userId: number }) {
  const { data: partnerships, isLoading } = trpc.influencer.myPartnerships.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const active = partnerships?.filter((p: any) => p.status === "active") || [];
  const pending = partnerships?.filter((p: any) => p.status === "pending_business" || p.status === "pending_admin") || [];
  const past = partnerships?.filter((p: any) => p.status === "completed" || p.status === "rejected") || [];

  return (
    <div className="space-y-6">
      {/* Active */}
      <div>
        <h3 className="font-display text-lg tracking-wider text-primary mb-3">PARCERIAS ATIVAS</h3>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-4">Nenhuma parceria ativa no momento.</p>
        ) : (
          <div className="space-y-2">
            {active.map((p: any) => (
              <PartnershipCard key={p.id} partnership={p} />
            ))}
          </div>
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-3">PENDENTES</h3>
          <div className="space-y-2">
            {pending.map((p: any) => (
              <PartnershipCard key={p.id} partnership={p} />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h3 className="font-display text-lg tracking-wider text-muted-foreground mb-3">HISTÓRICO</h3>
          <div className="space-y-2">
            {past.map((p: any) => (
              <PartnershipCard key={p.id} partnership={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PartnershipCard({ partnership }: { partnership: any }) {
  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/30",
    pending_business: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    pending_admin: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed: "bg-muted text-muted-foreground border-border/30",
    rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  const statusLabels: Record<string, string> = {
    active: "Ativa",
    pending_business: "Aguardando Estabelecimento",
    pending_admin: "Aguardando Admin",
    completed: "Concluída",
    rejected: "Rejeitada",
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{partnership.establishmentName || `Estabelecimento #${partnership.establishmentId}`}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{partnership.description || "Parceria de divulgação"}</p>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusColors[partnership.status] || ""}`}>
          {statusLabels[partnership.status] || partnership.status}
        </span>
      </div>
    </div>
  );
}

function PromosTab({ userId }: { userId: number }) {
  const { data: codes, isLoading } = trpc.promo.myCodes.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!codes || codes.length === 0) {
    return (
      <div className="text-center py-12">
        <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nenhum código promocional vinculado.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Códigos são criados pelos estabelecimentos parceiros.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg tracking-wider text-primary mb-3">MEUS CÓDIGOS</h3>
      {codes.map((code: any) => (
        <div key={code.id} className="p-4 rounded-xl bg-card border border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-lg font-bold text-primary tracking-wider">{code.code}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{code.description || code.type}</p>
            </div>
            <div className="text-right">
              <p className="font-numbers text-sm text-foreground">{code.usageCount || 0} usos</p>
              <p className="text-[11px] text-muted-foreground">{code.active ? "Ativo" : "Inativo"}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileTab({ userId, userName }: { userId: number; userName: string }) {
  const { data: profile, isLoading } = trpc.influencerProfile.get.useQuery({ influencerId: userId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/30 rounded-xl p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
          <UserCircle className="w-10 h-10 text-primary" />
        </div>
        <h3 className="font-display text-xl tracking-wider text-foreground">{userName}</h3>
        <div className="flex items-center justify-center gap-1 mt-1">
          <BadgeCheck className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-400">Influencer Verificado</span>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="font-numbers text-lg font-bold text-foreground">{profile?.followerCount || 0}</p>
            <p className="text-[11px] text-muted-foreground">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="font-numbers text-lg font-bold text-foreground">{profile?.stats?.totalRatings || 0}</p>
            <p className="text-[11px] text-muted-foreground">Avaliações</p>
          </div>
          <div className="text-center">
            <p className="font-numbers text-lg font-bold text-foreground">{profile?.stats?.avgScore?.toFixed(1) || "0.0"}</p>
            <p className="text-[11px] text-muted-foreground">Nota Média</p>
          </div>
        </div>
      </div>

      <div className="bg-secondary/30 border border-border/20 rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          Este é o preview do seu perfil público. Os usuários que te seguirem verão suas avaliações no feed e receberão notificações de novas publicações.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="bg-card border border-border/30 rounded-xl p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className="font-numbers text-xl font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
