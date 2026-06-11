import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, Star, Trophy, Crown, Bookmark, Megaphone, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type TabId = "avaliacoes" | "destaques" | "rankings" | "parcerias" | "titulos";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "avaliacoes", label: "Avaliações", icon: () => <span className="text-sm">⭐</span> },
  { id: "destaques", label: "Destaques", icon: Megaphone },
  { id: "rankings", label: "Rankings", icon: Trophy },
  { id: "parcerias", label: "Parcerias", icon: Handshake },
  { id: "titulos", label: "Títulos", icon: Crown },
];

export default function InfluencerProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("avaliacoes");

  const { data: stats } = trpc.analytics.myStats.useQuery(undefined, { enabled: !!user });
  const { data: profileData } = trpc.influencerProfile.get.useQuery(
    { influencerId: user?.id ?? 0 },
    { enabled: !!user }
  );
  const { data: partnerships } = trpc.influencer.myPartnerships.useQuery(undefined, { enabled: !!user });

  const totalRatings = stats?.totalRatings ?? 0;
  const followers = (profileData as any)?.followerCount ?? 0;
  const activePartnerships = partnerships?.filter((p: any) => p.status === "active")?.length ?? 0;

  return (
    <div className="pb-20">
      {/* Profile Info Section */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar with gold border + star */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center overflow-hidden border-[3px] border-yellow-500 shadow-lg shadow-yellow-500/20">
              {user?.name ? (
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            {/* 4-point star badge */}
            <div className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 drop-shadow-md" />
            </div>
          </div>

          {/* Info + Metrics */}
          <div className="flex-1 min-w-0">
            {/* Name + verified + badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-semibold text-lg text-foreground truncate">
                {user?.name || "Influencer"}
              </h2>
              <BadgeCheck className="w-4.5 h-4.5 text-blue-500 flex-shrink-0" />
              <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-[10px] font-bold">
                INFLUENCER
              </span>
            </div>

            {/* Level */}
            <p className="text-sm text-yellow-500 font-medium mt-0.5">
              Nível {Math.min(Math.floor(totalRatings / 5) + 1, 16)}
            </p>

            {/* 4 Metrics */}
            <div className="flex items-center gap-3 mt-2">
              <div className="text-center">
                <span className="text-base font-bold text-foreground">{totalRatings}</span>
                <p className="text-[10px] text-muted-foreground">avaliações</p>
              </div>
              <div className="w-px h-7 bg-border" />
              <div className="text-center">
                <span className="text-base font-bold text-foreground">
                  {followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : followers}
                </span>
                <p className="text-[10px] text-muted-foreground">seguidores</p>
              </div>
              <div className="w-px h-7 bg-border" />
              <div className="text-center">
                <span className="text-base font-bold text-foreground">{stats?.establishmentsVisited ?? 0}</span>
                <p className="text-[10px] text-muted-foreground">seguindo</p>
              </div>
              <div className="w-px h-7 bg-border" />
              <div className="text-center">
                <span className="text-base font-bold text-foreground">{activePartnerships}</span>
                <p className="text-[10px] text-muted-foreground">parcerias</p>
              </div>
            </div>
          </div>
        </div>

        {/* Partnership Panel */}
        <div className="mt-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Handshake className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-foreground">Painel de Parcerias</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{activePartnerships}</strong> ativas</span>
            <span><strong className="text-foreground">{partnerships?.filter((p: any) => p.status === "pending")?.length ?? 0}</strong> propostas</span>
            <span><strong className="text-foreground">{followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : followers}</strong> alcance</span>
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
                  isActive ? "border-yellow-500 text-yellow-500" : "border-transparent text-muted-foreground"
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
        {activeTab === "avaliacoes" && <InfluencerRatingsGrid />}
        {activeTab === "destaques" && <PlaceholderTab icon={Megaphone} text="Seus destaques" />}
        {activeTab === "rankings" && <PlaceholderTab icon={Trophy} text="Seus rankings" />}
        {activeTab === "parcerias" && <PlaceholderTab icon={Handshake} text="Suas parcerias" />}
        {activeTab === "titulos" && <PlaceholderTab icon={Crown} text="Seus títulos" />}
      </div>
    </div>
  );
}

function InfluencerRatingsGrid() {
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
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-white text-xs font-bold">{rating.overallScore?.toFixed(1) || "—"}</span>
          </div>
          {/* All influencer ratings must have verified badge */}
          <div className="absolute top-1 right-1">
            <BadgeCheck className="w-4 h-4 text-blue-500" />
          </div>
          {/* Partnership tag */}
          {rating.isPartnership && (
            <div className="absolute top-1 left-1 bg-yellow-500/90 rounded px-1 py-0.5">
              <span className="text-[8px] font-bold text-black">PARCERIA</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PlaceholderTab({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="text-center text-muted-foreground py-8">
      <Icon className="w-12 h-12 mx-auto mb-2 text-yellow-500/30" />
      <p>{text}</p>
    </div>
  );
}
