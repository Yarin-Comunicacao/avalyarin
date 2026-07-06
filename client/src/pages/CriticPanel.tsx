/**
 * Painel do Crítico Gastronômico — /painel-critico
 * Layout idêntico ao SpecialistPanel com tema azul safira.
 * Abas: Visão Geral, Calendário, Parcerias, Códigos, Meu Perfil
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { Redirect, Link } from "wouter";
import { toast } from "sonner";
import {
  Loader2, BarChart3, Handshake, Tag, UserCircle, Users, Star, TrendingUp,
  MapPin, BadgeCheck, CalendarDays, Clock, ExternalLink, Pencil, Save,
  BookOpen, Newspaper, FileText
} from "lucide-react";
import { getConnectYarinUrl } from "@shared/const";

type Tab = "overview" | "calendar" | "ratings" | "promos" | "profile";

export default function CriticPanel() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== "critic") {
    return <Redirect to="/" />;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "calendar", label: "Calendário", icon: CalendarDays },
    { id: "ratings", label: "Minhas Avaliações", icon: FileText },
    { id: "promos", label: "Códigos", icon: Tag },
    { id: "profile", label: "Meu Perfil", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar  />

      <div className="container pt-24 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 border-2 border-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            {/* Star badge — Azul Safira Brilhante */}
            <div className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center">
              <Star className="w-4 h-4 text-blue-500 fill-blue-500" style={{ filter: "drop-shadow(0 0 3px rgba(37, 99, 235, 0.6))" }} />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-wider text-blue-400">PAINEL CRÍTICO</h1>
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
                    ? "bg-blue-500/10 text-blue-400 border-b-2 border-blue-500"
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
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "ratings" && <RatingsTab />}
        {activeTab === "promos" && <PromosTab userId={user.id} />}
        {activeTab === "profile" && <ProfileTab userId={user.id} userName={user.name || user.username || ""} />}
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function OverviewTab({ userId }: { userId: number }) {
  const { data: stats, isLoading } = trpc.analytics.myStats.useQuery();
  const { data: profile } = trpc.critic.myProfile.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const totalRatings = stats?.totalRatings || 0;
  const avgScore = stats?.avgScore || 0;
  const locaisVisitados = stats?.establishmentsVisited || 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={Star} label="Avaliações" value={String(totalRatings)} color="text-blue-400" />
        <MetricCard icon={TrendingUp} label="Nota Média" value={avgScore.toFixed(1)} color="text-green-400" />
        <MetricCard icon={MapPin} label="Locais" value={String(locaisVisitados)} color="text-amber-400" />
        <MetricCard icon={BookOpen} label="Veículo" value={profile?.publication || "—"} color="text-purple-400" isText />
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border/30 rounded-xl p-5">
        <h3 className="font-display text-lg tracking-wider text-blue-400 mb-4">ATIVIDADE RECENTE</h3>
        {stats?.ratingsByMonth && stats.ratingsByMonth.length > 0 ? (
          <div className="space-y-2">
            {stats.ratingsByMonth.slice(0, 6).map((m: any) => (
              <div key={m.month} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <span className="text-sm text-foreground">{m.month}</span>
                <span className="font-numbers text-sm text-blue-400">{m.count} avaliações</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
        )}
      </div>

      {/* Critic info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-sm text-blue-300">
          <strong>Peso elevado:</strong> Suas avaliações têm peso maior no cálculo da nota dos estabelecimentos.
          Avaliações com nota ≥ 9 aparecem em destaque no topo.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// RATINGS TAB
// ============================================================
function RatingsTab() {
  const { data: ratings, isLoading } = trpc.critic.myRatings.useQuery({ limit: 100 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
        <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma avaliação</h3>
        <p className="text-sm text-muted-foreground">
          Visite estabelecimentos e registre suas avaliações como crítico.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        {ratings.length} avaliação{ratings.length !== 1 ? "ões" : ""} registrada{ratings.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-2">
        {ratings.map((rating: any) => (
          <Link key={rating.id} href={`/estabelecimento/${rating.establishmentSlug}`}>
            <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-blue-500/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">{rating.establishmentName}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rating.type === "analytic" ? "Analítica" : "Direta"} •{" "}
                    {rating.visitDate ? new Date(rating.visitDate).toLocaleDateString("pt-BR") : new Date(rating.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <Star className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                  <span className="font-numbers text-sm font-bold text-blue-400">
                    {((rating.overallScore || 0) / 10).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// CALENDAR TAB
// ============================================================
function CalendarTab() {
  const [showUpcoming, setShowUpcoming] = useState(true);
  const { data: events, isLoading } = trpc.events.myEvents.useQuery({ upcoming: showUpcoming });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowUpcoming(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            showUpcoming
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
              : "bg-secondary/30 text-muted-foreground border border-border/30 hover:bg-secondary/50"
          }`}
        >
          Próximos
        </button>
        <button
          onClick={() => setShowUpcoming(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            !showUpcoming
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
              : "bg-secondary/30 text-muted-foreground border border-border/30 hover:bg-secondary/50"
          }`}
        >
          Passados
        </button>
      </div>

      {/* Events list */}
      {!events || events.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 rounded-xl border border-border/20">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {showUpcoming ? "Nenhum evento próximo" : "Nenhum evento passado"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Eventos são criados nos calendários dos seus grupos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => (
            <Link key={event.id} href={`/evento/${event.id}`}>
              <div className="p-4 rounded-xl bg-card border border-border/30 hover:border-blue-500/30 transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.groupName} • {event.establishmentName}
                    </p>
                    {event.establishmentNeighborhood && (
                      <p className="text-xs text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {event.establishmentNeighborhood}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-blue-400">
                      {new Date(event.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(event.eventDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {event.maxGuests && (
                  <div className="mt-2 pt-2 border-t border-border/20">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.maxGuests} vagas
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROMOS TAB
// ============================================================
function PromosTab({ userId }: { userId: number }) {
  const { data: codes, isLoading } = trpc.promo.myCodes.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
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
      <h3 className="font-display text-lg tracking-wider text-blue-400 mb-3">MEUS CÓDIGOS</h3>
      {codes.map((code: any) => (
        <div key={code.id} className="p-4 rounded-xl bg-card border border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-lg font-bold text-blue-400 tracking-wider">{code.code}</p>
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

// ============================================================
// PROFILE TAB
// ============================================================
function ProfileTab({ userId, userName }: { userId: number; userName: string }) {
  const { user } = useAuth();
  const { data: profile, isLoading } = trpc.critic.myProfile.useQuery();
  const updateMutation = trpc.critic.updateProfile.useMutation();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    publication: "",
    publicationUrl: "",
    specialty: "",
  });

  const startEditing = () => {
    if (profile) {
      setForm({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        publication: profile.publication || "",
        publicationUrl: profile.publicationUrl || "",
        specialty: profile.specialty || "",
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        displayName: form.displayName || undefined,
        bio: form.bio || undefined,
        publication: form.publication || undefined,
        publicationUrl: form.publicationUrl || undefined,
        specialty: form.specialty || undefined,
      });
      utils.critic.myProfile.invalidate();
      setEditing(false);
      toast.success("Perfil atualizado!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) return null;

  const connectYarinUrl = user?.username ? getConnectYarinUrl(user.username) : null;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-card border border-border/30 rounded-xl p-6 text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 border-2 border-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <UserCircle className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center">
            <Star className="w-5 h-5 text-blue-500 fill-blue-500" style={{ filter: "drop-shadow(0 0 3px rgba(37, 99, 235, 0.6))" }} />
          </div>
        </div>
        <h3 className="font-display text-xl tracking-wider text-foreground">{profile.displayName || userName}</h3>
        <div className="flex items-center justify-center gap-1 mt-1">
          <BadgeCheck className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-blue-400">Crítico Gastronômico {profile.verified ? "Verificado" : ""}</span>
        </div>
        {connectYarinUrl && (
          <a
            href={connectYarinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 text-xs text-blue-400/80 hover:text-blue-400 transition-colors mt-2"
          >
            <ExternalLink className="w-3 h-3" />
            Connect Yarin
          </a>
        )}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="font-numbers text-lg font-bold text-foreground">{profile.publication || "—"}</p>
            <p className="text-[11px] text-muted-foreground">Veículo</p>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="p-5 rounded-xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg tracking-wider text-foreground">INFORMAÇÕES</h3>
          {!editing ? (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome de exibição</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Veículo / Publicação</label>
              <input
                type="text"
                value={form.publication}
                onChange={(e) => setForm(prev => ({ ...prev, publication: e.target.value }))}
                placeholder="Ex: Folha de S.Paulo, Blog Gastro SP"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">URL da publicação</label>
              <input
                type="url"
                value={form.publicationUrl}
                onChange={(e) => setForm(prev => ({ ...prev, publicationUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Especialidade</label>
              <input
                type="text"
                value={form.specialty}
                onChange={(e) => setForm(prev => ({ ...prev, specialty: e.target.value }))}
                placeholder="Ex: Cozinha Japonesa, Bares de Coquetelaria"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                placeholder="Conte um pouco sobre sua trajetória como crítico..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-foreground">{profile.displayName}</span>
              {profile.verified && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-bold">
                  VERIFICADO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{profile.publication}</span>
              {profile.publicationUrl && (
                <a href={profile.publicationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {profile.specialty && (
              <p className="text-xs text-muted-foreground">Especialidade: {profile.specialty}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// METRIC CARD
// ============================================================
function MetricCard({ icon: Icon, label, value, color, isText }: { icon: React.ElementType; label: string; value: string; color: string; isText?: boolean }) {
  return (
    <div className="bg-card border border-border/30 rounded-xl p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className={`font-numbers ${isText ? "text-sm" : "text-xl"} font-bold text-foreground truncate`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
