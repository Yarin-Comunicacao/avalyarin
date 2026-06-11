import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, Camera, Trophy, Crown, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type TabId = "avaliacoes" | "rankings" | "titulos" | "salvos";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "avaliacoes", label: "Avaliações", icon: () => <span className="text-sm">⭐</span> },
  { id: "rankings", label: "Rankings", icon: Trophy },
  { id: "titulos", label: "Títulos", icon: Crown },
  { id: "salvos", label: "Salvos", icon: Bookmark },
];

export default function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("avaliacoes");

  // Fetch user stats
  const { data: stats } = trpc.analytics.myStats.useQuery(undefined, {
    enabled: !!user,
  });

  const totalRatings = stats?.totalRatings ?? 0;
  const uniqueEstabs = stats?.establishmentsVisited ?? 0;

  return (
    <div className="pb-20">
      {/* Profile Info Section */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar with camera */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden border-2 border-amber-500/30">
              {user?.name ? (
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
              <Camera className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Info + Metrics */}
          <div className="flex-1 min-w-0">
            {/* Name + verified */}
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-lg text-foreground truncate">
                {user?.name || "Usuário"}
              </h2>
              {user?.verified && (
                <BadgeCheck className="w-4.5 h-4.5 text-blue-500 flex-shrink-0" />
              )}
            </div>

            {/* Level */}
            <p className="text-sm text-primary font-medium mt-0.5">
              Nível {stats?.totalRatings ? Math.min(Math.floor(totalRatings / 5) + 1, 16) : 1}
            </p>

            {/* Metrics */}
            <div className="flex items-center gap-6 mt-2">
              <div className="text-center">
                <span className="text-lg font-bold text-foreground">{totalRatings}</span>
                <p className="text-xs text-muted-foreground">avaliações</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <span className="text-lg font-bold text-foreground">{uniqueEstabs}</span>
                <p className="text-xs text-muted-foreground">avaliados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          Explorando os melhores bares e restaurantes de São Paulo 🍻
        </p>

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
                  isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground"
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
        {activeTab === "avaliacoes" && <RatingsGrid />}
        {activeTab === "rankings" && <RankingsTab />}
        {activeTab === "titulos" && <TitulosTab />}
        {activeTab === "salvos" && <SalvosTab />}
      </div>
    </div>
  );
}

function RatingsGrid() {
  const { data: ratings, isLoading } = trpc.ratings.myRatings.useQuery({ limit: 20, offset: 0 });

  if (isLoading) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;
  if (!ratings || ratings.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Nenhuma avaliação ainda</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {ratings.map((rating: any) => (
        <div key={rating.id} className="relative aspect-square bg-card rounded-lg overflow-hidden border border-border/30">
          {/* Establishment logo/initial */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-card to-secondary">
            <span className="text-2xl font-bold text-muted-foreground/50">
              {rating.establishmentName?.charAt(0) || "?"}
            </span>
          </div>
          {/* Score badge */}
          <div className="absolute bottom-1 left-1 bg-black/70 rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-white text-xs font-bold">
              {rating.overallScore?.toFixed(1) || "—"}
            </span>
          </div>
          {/* Verified badge */}
          {rating.source !== "remoto" && (
            <div className="absolute top-1 right-1">
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            </div>
          )}
          {/* Carousel dots indicator */}
          <div className="absolute bottom-1 right-1 flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-white/80" />
            <div className="w-1 h-1 rounded-full bg-white/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RankingsTab() {
  return (
    <div className="text-center text-muted-foreground py-8">
      <Trophy className="w-12 h-12 mx-auto mb-2 text-amber-500/30" />
      <p>Seus rankings pessoais</p>
    </div>
  );
}

function TitulosTab() {
  return (
    <div className="text-center text-muted-foreground py-8">
      <Crown className="w-12 h-12 mx-auto mb-2 text-amber-500/30" />
      <p>Suas insígnias de nobreza</p>
    </div>
  );
}

function SalvosTab() {
  return (
    <div className="text-center text-muted-foreground py-8">
      <Bookmark className="w-12 h-12 mx-auto mb-2 text-amber-500/30" />
      <p>Estabelecimentos salvos</p>
    </div>
  );
}
