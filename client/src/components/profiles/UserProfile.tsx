import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import {
  Camera, Share2, Loader2, Bell, Pencil, Heart, Crown, Palette, Bookmark, Flag
} from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import { getConnectYarinUrl } from "@shared/const";

// Import tab content components
import EditarTab from "@/components/profile-tabs/EditarTab";
import PreferenciasTab from "@/components/profile-tabs/PreferenciasTab";
import PlanosTab from "@/components/profile-tabs/PlanosTab";
import TemaFundoTab from "@/components/profile-tabs/TemaFundoTab";
import SalvosTab from "@/components/profile-tabs/SalvosTab";

type ProfileTab = "galeria" | "salvos" | "editar" | "preferencias" | "planos" | "tema";

export default function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("galeria");

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
    { id: "tema", icon: Palette, label: "Temas" },
  ];

  return (
    <div className="pb-28">
      {/* Profile Header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden border-2 border-amber-500/30">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {initials}
                </span>
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
          <Link href="/notificacoes" className="p-2 rounded-full hover:bg-secondary/50 transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {totalNotifs > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full bg-red-500 text-white flex items-center justify-center">{totalNotifs > 9 ? '9+' : totalNotifs}</span>
            ) : null}
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

        {/* Action icons row: 4 ícones + compartilhar */}
        <div className="flex items-center gap-2 mt-3">
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
          {/* Compartilhar */}
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

      {/* Tabs Navigation — apenas Galeria e Salvos */}
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
        {activeTab === "editar" && <EditarTab />}
        {activeTab === "preferencias" && <PreferenciasTab />}
        {activeTab === "planos" && <PlanosTab />}
        {activeTab === "tema" && <TemaFundoTab />}
      </div>
    </div>
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
