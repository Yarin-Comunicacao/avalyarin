import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Camera, Settings, Share2, Star, MapPin, Users, Loader2, Bell, Pencil } from "lucide-react";
import PhotoGrid from "@/components/PhotoGrid";
import { getConnectYarinUrl } from "@shared/const";

// Import tab content components
import EditarTab from "@/components/profile-tabs/EditarTab";
import PreferenciasTab from "@/components/profile-tabs/PreferenciasTab";
import PlanosTab from "@/components/profile-tabs/PlanosTab";
import TemaFundoTab from "@/components/profile-tabs/TemaFundoTab";
import SalvosTab from "@/components/profile-tabs/SalvosTab";

type ProfileTab = "galeria" | "editar" | "preferencias" | "planos" | "tema" | "salvos";

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: "galeria", label: "Galeria" },
  { id: "editar", label: "Editar" },
  { id: "preferencias", label: "Preferências" },
  { id: "planos", label: "Planos" },
  { id: "tema", label: "Tema e Fundo" },
  { id: "salvos", label: "Salvos" },
];

export default function UserProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("galeria");

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

  return (
    <div className="pb-28">
      {/* Profile Header */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar — shows uploaded photo or initials */}
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
          <button
            onClick={() => setActiveTab(activeTab === "editar" ? "galeria" : "editar")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === "editar"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border/50"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Editar perfil
          </button>
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

      {/* Tabs Navigation */}
      <div className="border-t border-border/50">
        <div className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
          {PROFILE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              {tab.id === "galeria" && <Camera className="w-3 h-3 inline mr-1" />}
              {tab.label}
            </button>
          ))}
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
        {activeTab === "editar" && <EditarTab />}
        {activeTab === "preferencias" && <PreferenciasTab />}
        {activeTab === "planos" && <PlanosTab />}
        {activeTab === "tema" && <TemaFundoTab />}
        {activeTab === "salvos" && <SalvosTab />}
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
