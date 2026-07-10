import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Camera, Settings, Share2, Star, MapPin, Users, Loader2, Bell } from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import { getConnectYarinUrl } from "@shared/const";

export default function UserProfile() {
  const { user } = useAuth();

  // Profile data
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const { data: stats } = trpc.analytics.myStats.useQuery(undefined, { enabled: !!user });
  const { data: followCounts } = trpc.social.counts.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user }
  );

  // Gallery photos from user's ratings
  const { data: galleryPhotos, isLoading: galleryLoading } = trpc.ratings.myGallery.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  // All ratings (to show those without photos as logo cards)
  const { data: myRatings } = trpc.ratings.myRatings.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  const totalRatings = stats?.totalRatings ?? 0;
  const uniqueEstabs = stats?.establishmentsVisited ?? 0;

  return (
    <div className="pb-20">
      {/* Profile Header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
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

        {/* Name + username */}
        <div className="mt-3">
          <h2 className="font-semibold text-base text-foreground">
            {profile?.name || user?.name || "Usuário"}
          </h2>
          {profile?.username && (
            <p className="text-sm text-primary font-medium">@{profile.username}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {uniqueEstabs} locais visitados
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
            className="py-2 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50 flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Divider + Gallery label */}
      <div className="border-t border-border/50">
        <div className="flex items-center justify-center py-2.5">
          <Camera className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary ml-1.5 tracking-wide">GALERIA</span>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="px-1">
        {galleryLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : (() => {
          // Combine photos + ratings without photos (shown as logo cards)
          const photoEntries = (galleryPhotos || []).map((p: any) => ({
            id: p.id,
            url: p.url,
            establishmentName: p.establishmentName,
            establishmentSlug: p.establishmentSlug,
            establishmentLogo: p.establishmentLogo || null,
            overallScore: p.overallScore ? Number(p.overallScore) : null,
            visitDate: p.visitDate,
            taggedItemIds: p.taggedItemIds,
            ratingId: p.ratingId,
          }));

          // Find ratings that have NO photos
          const ratingIdsWithPhotos = new Set(photoEntries.map((p: any) => p.ratingId).filter(Boolean));
          const ratingsWithoutPhotos = (myRatings || []).filter(
            (r: any) => !ratingIdsWithPhotos.has(r.id)
          ).map((r: any) => ({
            id: r.id + 100000, // offset to avoid key collision
            url: "", // no photo URL — PhotoGrid will show logo fallback
            establishmentName: r.establishmentName,
            establishmentSlug: r.establishmentSlug,
            establishmentLogo: r.establishmentLogo || null,
            overallScore: r.overallScore ? Number(r.overallScore) : null,
            visitDate: r.visitDate || r.createdAt,
            taggedItemIds: null,
            ratingId: r.id,
          }));

          const allPhotos = [...photoEntries, ...ratingsWithoutPhotos];

          return (
            <PhotoGrid
              photos={allPhotos}
              emptyMessage="Avalie estabelecimentos e envie fotos para construir seu perfil!"
            />
          );
        })()}
      </div>
    </div>
  );
}
