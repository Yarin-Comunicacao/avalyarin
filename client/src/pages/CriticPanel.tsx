/**
 * Painel do Crítico Gastronômico — /painel-critico
 * Área exclusiva para críticos aprovados com abas:
 * - Visão Geral (métricas, avaliações recentes)
 * - Minhas Avaliações (histórico completo)
 * - Meu Perfil (editar informações de publicação)
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Redirect, Link } from "wouter";
import { toast } from "sonner";
import {
  Loader2, BarChart3, FileText, UserCircle, Star, MapPin, BadgeCheck,
  Newspaper, ExternalLink, Pencil, Save, BookOpen
} from "lucide-react";
import { getConnectYarinUrl } from "@shared/const";

type Tab = "overview" | "ratings" | "profile";

export default function CriticPanel() {
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

  if (!user || user.role !== "critic") {
    return <Redirect to="/" />;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "ratings", label: "Minhas Avaliações", icon: FileText },
    { id: "profile", label: "Meu Perfil", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="container pt-24 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-wider text-purple-400">PAINEL CRÍTICO</h1>
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
                    ? "bg-purple-500/10 text-purple-400 border-b-2 border-purple-400"
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
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "ratings" && <RatingsTab />}
        {activeTab === "profile" && <ProfileTab username={user.username || ""} />}
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW TAB
// ============================================================

function OverviewTab() {
  const { data: profile, isLoading: profileLoading } = trpc.critic.myProfile.useQuery();
  const { data: ratings, isLoading: ratingsLoading } = trpc.critic.myRatings.useQuery({ limit: 5 });

  if (profileLoading || ratingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      {profile && (
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Newspaper className="w-7 h-7 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{profile.displayName}</h3>
                {profile.verified && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold border border-purple-500/30">
                    VERIFICADO
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {profile.publication}
              </p>
              {profile.specialty && (
                <p className="text-xs text-muted-foreground mt-1">Especialidade: {profile.specialty}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
          <span className="font-numbers text-3xl font-bold text-purple-400">{ratings?.length ?? 0}</span>
          <p className="text-xs text-muted-foreground mt-1">Avaliações Recentes</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
          <span className="font-numbers text-3xl font-bold text-purple-400">
            {profile?.verified ? "✓" : "⏳"}
          </span>
          <p className="text-xs text-muted-foreground mt-1">Status</p>
        </div>
      </div>

      {/* Recent Ratings */}
      <div>
        <h3 className="font-display text-lg tracking-wider text-foreground mb-3">AVALIAÇÕES RECENTES</h3>
        {ratings && ratings.length > 0 ? (
          <div className="space-y-2">
            {ratings.map((rating: any) => (
              <Link key={rating.id} href={`/estabelecimento/${rating.establishmentSlug}`}>
                <div className="p-3 rounded-lg bg-card border border-border/50 hover:border-purple-500/30 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{rating.establishmentName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                      <span className="font-numbers text-sm font-bold text-purple-400">
                        {((rating.overallScore || 0) / 10).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rating.type === "analytic" ? "Avaliação Analítica" : "Avaliação Direta"} •{" "}
                    {new Date(rating.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma avaliação ainda.</p>
            <p className="text-xs mt-1">Comece avaliando estabelecimentos para construir seu portfólio.</p>
          </div>
        )}
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
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
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
            <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-purple-500/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-foreground">{rating.establishmentName}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rating.type === "analytic" ? "Analítica" : "Direta"} •{" "}
                    {rating.visitDate ? new Date(rating.visitDate).toLocaleDateString("pt-BR") : new Date(rating.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <Star className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                  <span className="font-numbers text-sm font-bold text-purple-400">
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
// PROFILE TAB
// ============================================================

function ProfileTab({ username }: { username: string }) {
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
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!profile) return null;

  const connectYarinUrl = username ? getConnectYarinUrl(username) : null;

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <div className="p-5 rounded-xl bg-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg tracking-wider text-foreground">MEU PERFIL</h3>
          {!editing ? (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
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
              <BadgeCheck className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-foreground">{profile.displayName}</span>
              {profile.verified && (
                <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[9px] font-bold">
                  VERIFICADO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{profile.publication}</span>
              {profile.publicationUrl && (
                <a href={profile.publicationUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
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

      {/* Connect Yarin Link */}
      {connectYarinUrl && (
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Connect Yarin</span>
            </div>
            <a
              href={connectYarinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {connectYarinUrl}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
