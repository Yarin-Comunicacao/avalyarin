import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Camera, Settings, Share2, Star, Loader2, Bell, BarChart3,
  TrendingUp, MapPin, BookOpen, CalendarDays, Clock, FileText,
  Tag, Users
} from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import { getConnectYarinUrl } from "@shared/const";
import { FourPointStar } from "@/components/FourPointStar";

type ProfileTab = "galeria" | "painel";

export default function CriticProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("galeria");

  // Profile data
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const { data: stats } = trpc.analytics.myStats.useQuery(undefined, { enabled: !!user });
  const { data: followCounts } = trpc.social.counts.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user }
  );
  const { data: criticData } = trpc.critic.myProfile.useQuery(undefined, { enabled: !!user });

  // Gallery photos from user's ratings
  const { data: galleryPhotos, isLoading: galleryLoading } = trpc.ratings.myGallery.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  const totalRatings = stats?.totalRatings ?? 0;
  const uniqueEstabs = stats?.establishmentsVisited ?? 0;
  const avgScore = stats?.avgScore ?? 0;

  return (
    <div className="pb-20">
      {/* Profile Header — Blue/sapphire critic style */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar with blue border + star */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center overflow-hidden border-[3px] border-slate-300 shadow-lg shadow-slate-300/20">
              {user?.name ? (
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            {/* Star badge */}
            <div className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center">
              <FourPointStar variant="critic" size={22} glow />
            </div>
          </div>

          {/* Metrics row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-around text-center">
              <div>
                <span className="text-lg font-bold text-foreground">{totalRatings}</span>
                <p className="text-[11px] text-muted-foreground">avaliações</p>
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">{followCounts?.followers ?? 0}</span>
                <p className="text-[11px] text-muted-foreground">seguidores</p>
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">{followCounts?.following ?? 0}</span>
                <p className="text-[11px] text-muted-foreground">seguindo</p>
              </div>
            </div>
          </div>

          {/* Notification bell */}
          <Link href="/notificacoes">
            <button className="p-2 rounded-full hover:bg-secondary/50 transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
        </div>
        {/* Name + username + role badge */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base text-foreground">
              {profile?.name || user?.name || "Crítico"}
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium">
              CRÍTICO GASTRONÔMICO
            </span>
          </div>
          {profile?.username && (
            <p className="text-sm text-blue-400 font-medium">@{profile.username}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {uniqueEstabs} locais visitados
            {(criticData as any)?.publication && ` · ${(criticData as any).publication}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Link href="/conta" className="flex-1">
            <button className="w-full py-2 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50 flex items-center justify-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Editar perfil
            </button>
          </Link>
          <button
            onClick={() => {
              if (profile?.username) {
                navigator.share?.({
                  title: profile.name || "Perfil",
                  url: getConnectYarinUrl(profile.username),
                }).catch(() => {});
              }
            }}
            className="py-2 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50 flex items-center justify-center"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs — Galeria + Painel (Painel only visible to self) */}
      <div className="border-t border-border/50">
        <div className="flex">
          <button
            onClick={() => setActiveTab("galeria")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              activeTab === "galeria"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="w-4 h-4" />
            GALERIA
          </button>
          <button
            onClick={() => setActiveTab("painel")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              activeTab === "painel"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            PAINEL
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "galeria" && (
        <div className="px-1">
          {galleryLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
            </div>
          ) : (
            <PhotoGrid
              photos={(galleryPhotos || []).map((p: any) => ({
                id: p.id,
                url: p.url,
                establishmentName: p.establishmentName,
                establishmentSlug: p.establishmentSlug,
                overallScore: p.overallScore,
                visitDate: p.visitDate,
                taggedItemIds: p.taggedItemIds,
                ratingId: p.ratingId,
              }))}
              emptyMessage="Avalie estabelecimentos e envie fotos para construir seu perfil de crítico!"
            />
          )}
        </div>
      )}

      {activeTab === "painel" && (
        <PainelTab
          totalRatings={totalRatings}
          avgScore={avgScore}
          locaisVisitados={uniqueEstabs}
          publication={(criticData as any)?.publication}
          ratingsByMonth={stats?.ratingsByMonth}
          variant="critic"
        />
      )}
    </div>
  );
}

// ============================================================
// PAINEL TAB — Shared between Critic and Specialist
// ============================================================
function PainelTab({
  totalRatings,
  avgScore,
  locaisVisitados,
  publication,
  ratingsByMonth,
  variant,
}: {
  totalRatings: number;
  avgScore: number;
  locaisVisitados: number;
  publication?: string;
  ratingsByMonth?: any[];
  variant: "critic" | "specialist";
}) {
  const accentColor = variant === "critic" ? "blue" : "amber";
  const { data: ratings, isLoading: ratingsLoading } = trpc.critic.myRatings.useQuery({ limit: 50 });
  const { data: events } = trpc.events.myEvents.useQuery({ upcoming: true });
  const { data: codes } = trpc.promo.myCodes.useQuery();

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-xl bg-card border border-border/30`}>
          <div className="flex items-center gap-2 mb-1">
            <FourPointStar variant="critic" size={14} />
            <span className="text-xs text-muted-foreground">Avaliações</span>
          </div>
          <p className="font-numbers text-2xl font-bold text-foreground">{totalRatings}</p>
        </div>
        <div className={`p-4 rounded-xl bg-card border border-border/30`}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Nota Média</span>
          </div>
          <p className="font-numbers text-2xl font-bold text-foreground">{avgScore.toFixed(1)}</p>
        </div>
        <div className={`p-4 rounded-xl bg-card border border-border/30`}>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Locais</span>
          </div>
          <p className="font-numbers text-2xl font-bold text-foreground">{locaisVisitados}</p>
        </div>
        <div className={`p-4 rounded-xl bg-card border border-border/30`}>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">Veículo</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">{publication || "—"}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border/30 rounded-xl p-4">
        <h3 className={`font-display text-sm tracking-wider text-${accentColor}-400 mb-3`}>ATIVIDADE RECENTE</h3>
        {ratingsByMonth && ratingsByMonth.length > 0 ? (
          <div className="space-y-2">
            {ratingsByMonth.slice(0, 6).map((m: any) => (
              <div key={m.month} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <span className="text-sm text-foreground">{m.month}</span>
                <span className={`font-numbers text-sm text-${accentColor}-400`}>{m.count} avaliações</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
        )}
      </div>

      {/* Upcoming Events */}
      {events && events.length > 0 && (
        <div className="bg-card border border-border/30 rounded-xl p-4">
          <h3 className={`font-display text-sm tracking-wider text-${accentColor}-400 mb-3`}>PRÓXIMOS EVENTOS</h3>
          <div className="space-y-2">
            {events.slice(0, 3).map((event: any) => (
              <Link key={event.id} href={`/evento/${event.id}`}>
                <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 cursor-pointer hover:bg-secondary/30 rounded px-1 -mx-1 transition-colors">
                  <div>
                    <p className="text-sm text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.groupName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium text-${accentColor}-400`}>
                      {new Date(event.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(event.eventDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Promo Codes */}
      {codes && codes.length > 0 && (
        <div className="bg-card border border-border/30 rounded-xl p-4">
          <h3 className={`font-display text-sm tracking-wider text-${accentColor}-400 mb-3`}>CÓDIGOS PROMOCIONAIS</h3>
          <div className="space-y-2">
            {codes.slice(0, 3).map((code: any) => (
              <div key={code.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className={`font-mono text-sm font-bold text-${accentColor}-400 tracking-wider`}>{code.code}</p>
                  <p className="text-xs text-muted-foreground">{code.description || code.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-numbers text-sm text-foreground">{code.usageCount || 0} usos</p>
                  <p className="text-[11px] text-muted-foreground">{code.active ? "Ativo" : "Inativo"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Ratings */}
      {!ratingsLoading && ratings && ratings.length > 0 && (
        <div className="bg-card border border-border/30 rounded-xl p-4">
          <h3 className={`font-display text-sm tracking-wider text-${accentColor}-400 mb-3`}>ÚLTIMAS AVALIAÇÕES</h3>
          <div className="space-y-2">
            {ratings.slice(0, 5).map((rating: any) => (
              <Link key={rating.id} href={`/estabelecimento/${rating.establishmentSlug}`}>
                <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 cursor-pointer hover:bg-secondary/30 rounded px-1 -mx-1 transition-colors">
                  <div>
                    <p className="text-sm text-foreground">{rating.establishmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {rating.type === "analytic" ? "Analítica" : "Direta"} •{" "}
                      {rating.visitDate ? new Date(rating.visitDate).toLocaleDateString("pt-BR") : new Date(rating.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-${accentColor}-500/10 border border-${accentColor}-500/20`}>
                    <FourPointStar variant={variant} size={12} glow={false} />
                    <span className={`font-numbers text-xs font-bold text-${accentColor}-400`}>
                      {((rating.overallScore || 0) / 10).toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className={`bg-${accentColor}-500/10 border border-${accentColor}-500/30 rounded-xl p-4`}>
        <p className={`text-sm text-${accentColor}-300`}>
          <strong>Peso elevado:</strong> Suas avaliações têm peso maior no cálculo da nota dos estabelecimentos.
          Avaliações com nota ≥ 9 aparecem em destaque no topo.
        </p>
      </div>
    </div>
  );
}

export { PainelTab };
