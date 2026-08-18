import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  Camera, Share2, Loader2, Bell, Pencil, Heart, Crown, Flag, X, Users, UserSearch, Star, CalendarDays, Bug
} from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import BugReportButton from "@/components/BugReportButton";
import { getConnectYarinUrl } from "@shared/const";

// Import tab content components
import EditarTab from "@/components/profile-tabs/EditarTab";
import PreferenciasTab from "@/components/profile-tabs/PreferenciasTab";
import PlanosTab from "@/components/profile-tabs/PlanosTab";
import SalvosTab from "@/components/profile-tabs/SalvosTab";
import CalendarioTab from "@/components/profile-tabs/CalendarioTab";

type ProfileTab = "galeria" | "salvos" | "calendario" | "editar" | "preferencias" | "planos";

export default function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("galeria");
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);
  const [showTopRatings, setShowTopRatings] = useState(false);

  // Followers/following lists
  const { data: followersList } = trpc.social.followers.useQuery(
    { userId: user?.id },
    { enabled: followListType === "followers" && !!user }
  );
  const { data: followingList } = trpc.social.following.useQuery(
    { userId: user?.id },
    { enabled: followListType === "following" && !!user }
  );

  // Pending follow count for notification badge
  const { data: pendingCount } = trpc.social.pendingCount.useQuery(undefined, { enabled: !!user });
  const { data: groupInvites } = trpc.groups.pendingInvites.useQuery(undefined, { enabled: !!user });
  const { data: dmConvs } = trpc.social.dmConversations.useQuery(undefined, { enabled: !!user });
  const totalNotifs = (pendingCount || 0) + (groupInvites?.length || 0) + (dmConvs?.reduce((a: number, c: any) => a + (c.unreadCount || 0), 0) || 0);

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

  // Use profilePhotoUrl from profile query (most up-to-date after upload)
  const avatarUrl = profile?.profilePhotoUrl || user?.profilePhotoUrl;
  const initials = (profile?.name || user?.name || "U").charAt(0).toUpperCase();

  // Icon action buttons config
  const iconActions: { id: ProfileTab; icon: typeof Pencil; label: string }[] = [
    { id: "editar", icon: Pencil, label: "Editar" },
    { id: "preferencias", icon: Heart, label: "Preferências" },
    { id: "planos", icon: Crown, label: "Planos" },
  ];

  return (
    <div className="pb-28">
      {/* Followers/Following Modal */}
      {followListType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4" onClick={() => setFollowListType(null)}>
          <div className="bg-card border border-border/50 rounded-xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="font-display text-lg tracking-wider text-primary">
                {followListType === "followers" ? "SEGUIDORES" : "SEGUINDO"}
              </h2>
              <button onClick={() => setFollowListType(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 border-b border-border/30">
              <Link
                href="/grupos?tab=pessoas"
                onClick={() => setFollowListType(null)}
                className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <UserSearch className="w-4 h-4" />
                Encontrar meus amigos
              </Link>
            </div>
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {(followListType === "followers" ? followersList : followingList)?.map((person: any) => (
                <Link
                  key={person.id}
                  href={`/perfil/${person.username}`}
                  onClick={() => setFollowListType(null)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/30 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
                    <span className="text-sm font-bold text-primary">{(person.name || "?")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground">@{person.username}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {person.role === "specialist" ? "Especialista" : person.role === "critic" ? "Crítico" : "Usuário"}
                  </span>
                </Link>
              ))}
              {(followListType === "followers" ? followersList : followingList)?.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {followListType === "followers" ? "Nenhum seguidor ainda" : "Você não segue ninguém ainda"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar — enlarged to occupy the full profile summary height */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden border-2 border-amber-500/30">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-foreground">
                  {initials}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            {/* Name and username stay at the top, beside the photo */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-semibold text-base sm:text-lg text-foreground leading-tight">
                  {profile?.name || user?.name || "Usuário"}
                  {profile?.username && (
                    <span className="text-sm font-medium text-primary"> - @{profile.username}</span>
                  )}
                </h2>
                {(profile as any)?.description && (
                  <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">{(profile as any).description}</p>
                )}
              </div>

              {/* Notification bell */}
              <Link href="/notificacoes" className="p-1.5 -mr-1 rounded-full hover:bg-secondary/50 transition-colors relative flex-shrink-0">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {totalNotifs > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full bg-red-500 text-foreground flex items-center justify-center">{totalNotifs > 9 ? '9+' : totalNotifs}</span>
                ) : null}
              </Link>
            </div>

            {/* Metrics below the name */}
            <div className="grid grid-cols-3 gap-1 mt-4 text-center">
              <button onClick={() => setShowTopRatings(!showTopRatings)} className="rounded-lg px-1 py-1 hover:bg-secondary/50 transition-colors">
                <span className="text-base font-bold text-foreground">{totalRatings}</span>
                <p className="text-[10px] text-muted-foreground">avaliações</p>
              </button>
              <button onClick={() => setFollowListType("followers")} className="rounded-lg px-1 py-1 hover:bg-secondary/50 transition-colors">
                <span className="text-base font-bold text-foreground">{followCounts?.followers ?? 0}</span>
                <p className="text-[10px] text-muted-foreground">seguidores</p>
              </button>
              <button onClick={() => setFollowListType("following")} className="rounded-lg px-1 py-1 hover:bg-secondary/50 transition-colors">
                <span className="text-base font-bold text-foreground">{followCounts?.following ?? 0}</span>
                <p className="text-[10px] text-muted-foreground">seguindo</p>
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {uniqueEstabs} locais visitados
            </p>
          </div>
        </div>
      </div>

      {showTopRatings && (
        <TopRatingsSection ratings={myRatings} />
      )}

      {/* Tabs Navigation — Galeria, Salvos e Calendário */}
      <div className="border-t border-border/50">
        <div className="flex">
          <button
            onClick={() => setActiveTab("galeria")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              activeTab === "galeria"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="w-4 h-4" />
            GALERIA
          </button>
          <button
            onClick={() => setActiveTab("salvos")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              activeTab === "salvos"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flag className="w-4 h-4" />
            SALVOS
          </button>
          <button
            onClick={() => setActiveTab("calendario")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              activeTab === "calendario"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            CALENDÁRIO
          </button>
        </div>
      </div>

      {/* Action icons row: Editar, Preferências, Planos, Temas + Compartilhar */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2">
          {iconActions.map(action => (
            <button
              key={action.id}
              onClick={() => setActiveTab(activeTab === action.id ? "galeria" : action.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors ${
                activeTab === action.id
                  ? "bg-primary/10 border border-primary/40 text-primary"
                  : "bg-secondary border border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{action.label}</span>
            </button>
          ))}
          <BugReportButton inline />
          <button
            onClick={() => {
              if (profile?.username) {
                navigator.share?.({
                  title: profile.name || "Perfil",
                  url: getConnectYarinUrl(profile.username),
                }).catch(() => {});
              }
            }}
            className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px] font-medium">Enviar</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-2 pb-6">
        {activeTab === "galeria" && (
          <GaleriaContent
            galleryPhotos={galleryPhotos}
            myRatings={myRatings}
            galleryLoading={galleryLoading}
          />
        )}
        {activeTab === "salvos" && <SalvosTab />}
        {activeTab === "calendario" && <CalendarioTab />}
        {activeTab === "editar" && <EditarTab />}
        {activeTab === "preferencias" && <PreferenciasTab />}
        {activeTab === "planos" && <PlanosTab />}
      </div>
    </div>
  );
}

function TopRatingsSection({ ratings }: { ratings: any[] | undefined }) {
  const topRatings = [...(ratings || [])]
    .sort((a: any, b: any) => Number(b.overallScore ?? 0) - Number(a.overallScore ?? 0))
    .slice(0, 3);

  return (
    <section className="px-4 pb-4" aria-label="Minhas três melhores avaliações">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Minhas 3 melhores avaliações</h3>
        </div>
        {topRatings.length === 0 ? (
          <p className="text-xs text-muted-foreground">Você ainda não tem avaliações feitas.</p>
        ) : (
          <div className="space-y-2">
            {topRatings.map((rating: any) => (
              <Link key={rating.id} href={`/estabelecimento/${rating.establishmentSlug || rating.establishmentId}`} className="flex items-center gap-3 rounded-lg bg-background/60 p-2.5 hover:bg-background transition-colors">
                <div className="flex items-center gap-1 min-w-[3.5rem] text-primary">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm font-bold">{Number(rating.overallScore ?? 0).toFixed(1)}</span>
                </div>
                <span className="text-sm text-foreground truncate">{rating.establishmentName || "Estabelecimento"}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function GaleriaContent({ galleryPhotos, myRatings, galleryLoading }: { galleryPhotos: any; myRatings: any; galleryLoading: boolean }) {
  if (galleryLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

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

  const ratingIdsWithPhotos = new Set(photoEntries.map((p: any) => p.ratingId).filter(Boolean));
  const ratingsWithoutPhotos = (myRatings || []).filter(
    (r: any) => !ratingIdsWithPhotos.has(r.id)
  ).map((r: any) => ({
    id: r.id + 100000,
    url: "",
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
    <div className="-mx-4 px-1">
      <PhotoGrid
        photos={allPhotos}
        emptyMessage="Avalie estabelecimentos e envie fotos para construir seu perfil!"
      />
    </div>
  );
}
