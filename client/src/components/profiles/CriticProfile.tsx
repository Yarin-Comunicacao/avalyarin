import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, Star, Trophy, Crown, Newspaper, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type TabId = "avaliacoes" | "destaques" | "rankings" | "publicacoes" | "titulos";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "avaliacoes", label: "Avaliações", icon: () => <span className="text-sm">⭐</span> },
  { id: "destaques", label: "Destaques", icon: Newspaper },
  { id: "rankings", label: "Rankings", icon: Trophy },
  { id: "publicacoes", label: "Publicações", icon: BookOpen },
  { id: "titulos", label: "Títulos", icon: Crown },
];

export default function CriticProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("avaliacoes");

  const { data: stats } = trpc.analytics.myStats.useQuery(undefined, { enabled: !!user });
  const { data: profileData } = trpc.critic.myProfile.useQuery(undefined, { enabled: !!user });

  const totalRatings = stats?.totalRatings ?? 0;
  const publication = (profileData as any)?.publication ?? "—";
  const specialty = (profileData as any)?.specialty ?? "";
  const verified = (profileData as any)?.verified ?? false;

  return (
    <div className="pb-20">
      {/* Profile Info Section */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar with sapphire blue border + star */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center overflow-hidden border-[3px] border-blue-600 shadow-lg shadow-blue-600/20">
              {user?.name ? (
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            {/* 4-point star badge — Azul Safira Brilhante */}
            <div className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center">
              <Star className="w-6 h-6 text-blue-500 fill-blue-500 drop-shadow-md" style={{ filter: "drop-shadow(0 0 4px rgba(37, 99, 235, 0.6))" }} />
            </div>
          </div>

          {/* Info + Metrics */}
          <div className="flex-1 min-w-0">
            {/* Name + verified + badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-semibold text-lg text-foreground truncate">
                {(profileData as any)?.displayName || user?.name || "Crítico"}
              </h2>
              {verified && <BadgeCheck className="w-4.5 h-4.5 text-blue-500 flex-shrink-0" />}
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-bold">
                CRÍTICO
              </span>
            </div>

            {/* Publication */}
            <p className="text-sm text-blue-400 font-medium mt-0.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {publication}
            </p>

            {/* 3 Metrics */}
            <div className="flex items-center gap-3 mt-2">
              <div className="text-center">
                <span className="text-base font-bold text-foreground">{totalRatings}</span>
                <p className="text-[10px] text-muted-foreground">avaliações</p>
              </div>
              <div className="w-px h-7 bg-border" />
              <div className="text-center">
                <span className="text-base font-bold text-foreground">{stats?.establishmentsVisited ?? 0}</span>
                <p className="text-[10px] text-muted-foreground">locais</p>
              </div>
              <div className="w-px h-7 bg-border" />
              <div className="text-center">
                <span className="text-base font-bold text-foreground">{stats?.avgScore?.toFixed(1) ?? "0.0"}</span>
                <p className="text-[10px] text-muted-foreground">nota média</p>
              </div>
            </div>
          </div>
        </div>

        {/* Critic Info Panel */}
        <div className="mt-3 p-3 rounded-lg bg-blue-600/5 border border-blue-600/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Newspaper className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-foreground">Crítico Gastronômico</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{publication}</strong></span>
            {specialty && <span>• {specialty}</span>}
            {verified && <span className="text-blue-400 font-medium">Verificado ✓</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-2 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50">
            Editar perfil
          </button>
          <button className="flex-1 py-2 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50">
            Compartilhar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-border/50 mt-2">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors",
                  isActive ? "border-blue-500 text-blue-500" : "border-transparent text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4">
        {activeTab === "avaliacoes" && <CriticRatingsGrid />}
        {activeTab === "destaques" && <PlaceholderTab icon={Newspaper} text="Seus destaques" />}
        {activeTab === "rankings" && <PlaceholderTab icon={Trophy} text="Seus rankings" />}
        {activeTab === "publicacoes" && <PlaceholderTab icon={BookOpen} text="Suas publicações" />}
        {activeTab === "titulos" && <PlaceholderTab icon={Crown} text="Seus títulos" />}
      </div>
    </div>
  );
}

function CriticRatingsGrid() {
  const { data: ratings, isLoading } = trpc.ratings.myRatings.useQuery({ limit: 20, offset: 0 });

  if (isLoading) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;
  if (!ratings || ratings.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Nenhuma avaliação ainda</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {ratings.map((rating: any) => (
        <div key={rating.id} className="relative aspect-square bg-card rounded-lg overflow-hidden border border-border/30">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-secondary">
            <span className="text-2xl font-bold text-muted-foreground/50">
              {rating.establishmentName?.charAt(0) || "?"}
            </span>
          </div>
          {/* Score */}
          <div className="absolute bottom-1 left-1 bg-black/70 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
            <span className="text-blue-400 text-xs">★</span>
            <span className="text-white text-xs font-bold">{rating.overallScore?.toFixed(1) || "—"}</span>
          </div>
          {/* Critic verified badge */}
          <div className="absolute top-1 right-1">
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlaceholderTab({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center text-muted-foreground py-8">
      <Icon className="w-12 h-12 mx-auto mb-2 text-blue-500/30" />
      <p>{text}</p>
    </div>
  );
}
