import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Camera, Settings, Share2, Star, Loader2 } from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import { getConnectYarinUrl } from "@shared/const";

export default function InfluencerProfile() {
  const { user } = useAuth();

  // Profile data
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const { data: stats } = trpc.analytics.myStats.useQuery(undefined, { enabled: !!user });
  const { data: followCounts } = trpc.social.counts.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user }
  );
  const { data: partnerships } = trpc.influencer.myPartnerships.useQuery(undefined, { enabled: !!user });

  // Gallery photos from user's ratings
  const { data: galleryPhotos, isLoading: galleryLoading } = trpc.ratings.myGallery.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  const totalRatings = stats?.totalRatings ?? 0;
  const uniqueEstabs = stats?.establishmentsVisited ?? 0;
  const activePartnerships = partnerships?.filter((p: any) => p.status === "active")?.length ?? 0;

  return (
    <div className="pb-20">
      {/* Profile Header — Gold influencer style */}
      <div className="px-4 pt-4 pb-4">
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
            {/* Star badge */}
            <div className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500 drop-shadow-md" />
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
        </div>

        {/* Name + username + role badge */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base text-foreground">
              {profile?.name || user?.name || "Influencer"}
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
          <Link href="/conta" className="flex-1">
            <button className="w-full py-2 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50 flex items-center justify-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Editar perfil
            </button>
          </Link>
          <Link href="/painel-influencer" className="flex-1">
            <button className="w-full py-2 px-4 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-medium border border-amber-500/30 flex items-center justify-center gap-1.5">
              Painel
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

      {/* Divider + Gallery label */}
      <div className="border-t border-border/50">
        <div className="flex items-center justify-center py-2.5">
          <Camera className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-medium text-yellow-500 ml-1.5 tracking-wide">GALERIA</span>
        </div>
      </div>

      {/* Photo Gallery Grid */}
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
            emptyMessage="Avalie estabelecimentos e envie fotos para construir seu perfil de influencer!"
          />
        )}
      </div>
    </div>
  );
}
