import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Camera, Settings, Share2, Star, Loader2, Bell, BarChart3
} from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import { getConnectYarinUrl } from "@shared/const";
import { FourPointStar } from "@/components/FourPointStar";
import { PainelTab } from "./CriticProfile";

type ProfileTab = "galeria" | "painel";

export default function SpecialistProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("galeria");

  // Profile data
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const { data: stats } = trpc.analytics.myStats.useQuery(undefined, { enabled: !!user });
  const { data: followCounts } = trpc.social.counts.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user }
  );
  const { data: partnerships } = trpc.specialist.myPartnerships.useQuery(undefined, { enabled: !!user });

  // Gallery photos from user's ratings
  const { data: galleryPhotos, isLoading: galleryLoading } = trpc.ratings.myGallery.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  const totalRatings = stats?.totalRatings ?? 0;
  const uniqueEstabs = stats?.establishmentsVisited ?? 0;
  const avgScore = stats?.avgScore ?? 0;
  const activePartnerships = partnerships?.filter((p: any) => p.status === "active")?.length ?? 0;

  return (
    <div className="pb-20">
      {/* Profile Header — Gold especialista style */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar with gold border + star */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center overflow-hidden border-[3px] border-red-500 shadow-lg shadow-red-500/20">
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
              <FourPointStar variant="specialist" size={22} glow />
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
              {profile?.name || user?.name || "Especialista"}
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
              INFLUENCER
            </span>
          </div>
          {profile?.username && (
            <p className="text-sm text-yellow-500 font-medium">@{profile.username}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {uniqueEstabs} locais visitados · {activePartnerships} {activePartnerships === 1 ? "parceria" : "parcerias"} ativas
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Link href="/conta/editar-perfil" className="flex-1">
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

      {/* Tabs — Galeria + Painel */}
      <div className="border-t border-border/50">
        <div className="flex">
          <button
            onClick={() => setActiveTab("galeria")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              activeTab === "galeria"
                ? "text-yellow-500 border-b-2 border-yellow-500"
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
                ? "text-yellow-500 border-b-2 border-yellow-500"
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
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500/50" />
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
              emptyMessage="Avalie estabelecimentos e envie fotos para construir seu perfil de especialista!"
            />
          )}
        </div>
      )}

      {activeTab === "painel" && (
        <PainelTab
          totalRatings={totalRatings}
          avgScore={avgScore}
          locaisVisitados={uniqueEstabs}
          publication={undefined}
          ratingsByMonth={stats?.ratingsByMonth}
          variant="specialist"
        />
      )}
    </div>
  );
}
