import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { ArrowLeft, Loader2, Calendar, Award, Share2, UserPlus, UserCheck, MessageCircle, Image } from "lucide-react";
import { FourPointStar } from "@/components/FourPointStar";
import PhotoGrid from "@/components/PhotoGrid";
import { useAuth } from "@/_core/hooks/useAuth";
import ShareToGroup from "@/components/ShareToGroup";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getConnectYarinUrl } from "@shared/const";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.profile.publicByUsername.useQuery(
    { username: username || "" },
    { enabled: !!username }
  );

  const { data: ratings } = trpc.ratings.publicUserRatings.useQuery(
    { userId: profile?.id || 0, limit: 20, offset: 0 },
    { enabled: !!profile?.id }
  );

  const { data: nobility } = trpc.nobility.publicSummary.useQuery(
    { userId: profile?.id || 0 },
    { enabled: !!profile?.id }
  );

  const isOwnProfile = user?.id === profile?.id;

  const { data: followStatus } = trpc.social.isFollowing.useQuery(
    { userId: profile?.id || 0 },
    { enabled: !!profile?.id && !!user && !isOwnProfile }
  );

  const { data: followCounts } = trpc.social.counts.useQuery(
    { userId: profile?.id || 0 },
    { enabled: !!profile?.id }
  );

  const followMutation = trpc.social.follow.useMutation({
    onSuccess: () => {
      utils.social.isFollowing.invalidate({ userId: profile?.id || 0 });
      utils.social.counts.invalidate({ userId: profile?.id || 0 });
    },
  });
  const unfollowMutation = trpc.social.unfollow.useMutation({
    onSuccess: () => {
      utils.social.isFollowing.invalidate({ userId: profile?.id || 0 });
      utils.social.counts.invalidate({ userId: profile?.id || 0 });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar  />
        <div className="container pt-24 text-center">
          <h1 className="font-display text-2xl tracking-wider text-foreground mb-2">PERFIL NÃO ENCONTRADO</h1>
          <p className="text-sm text-muted-foreground">O usuário @{username} não existe.</p>
          <Link href="/">
            <button className="mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              Voltar ao início
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isCritic = profile.role === "critic";
  const isEspecialista = profile.role === "specialist";
  const connectYarinUrl = profile.username ? getConnectYarinUrl(profile.username) : null;

  // Extract badges from nobility summary
  const allBadges: { title: string; subtitle: string }[] = [];
  if (nobility) {
    const n = nobility as any;
    if (n.categoryBadges) {
      n.categoryBadges.forEach((b: any) => allBadges.push({ title: b.title || b.categoryName, subtitle: b.subtitle || "Categoria" }));
    }
    if (n.neighborhoodBadges) {
      n.neighborhoodBadges.forEach((b: any) => allBadges.push({ title: b.title || b.neighborhood, subtitle: b.subtitle || "Bairro" }));
    }
    if (n.establishmentBadges) {
      n.establishmentBadges.forEach((b: any) => allBadges.push({ title: b.title || b.establishmentName, subtitle: b.subtitle || "Estabelecimento" }));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar  />

      <div className="container pt-20 pb-12">
        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
              isCritic
                ? "bg-blue-500/10 border-2 border-blue-400 text-blue-400"
                : isEspecialista
                ? "bg-amber-500/10 border-2 border-amber-400 text-amber-400"
                : "bg-primary/10 border-2 border-primary text-primary"
            }`}>
              {profile.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {isCritic && (
              <div className="absolute -top-1 -right-1">
                <FourPointStar variant="critic" size={20} glow />
              </div>
            )}
            {isEspecialista && (
              <div className="absolute -top-1 -right-1">
                <FourPointStar variant="specialist" size={20} glow />
              </div>
            )}
          </div>

          <h1 className="font-display text-2xl tracking-wider text-foreground mb-1">
            {profile.name || "Usuário"}
          </h1>
          <p className="text-sm text-primary font-medium">@{profile.username}</p>

          {/* Role badge */}
          {isCritic && (
            <span className="mt-2 text-[11px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium">
              CRÍTICO GASTRONÔMICO
            </span>
          )}
          {isEspecialista && (
            <span className="mt-2 text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium">
              INFLUENCER
            </span>
          )}

          {/* Follow counts */}
          {followCounts && (
            <div className="flex items-center gap-4 mt-3">
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{followCounts.followers}</strong> seguidores
              </span>
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{followCounts.following}</strong> seguindo
              </span>
            </div>
          )}

          {/* Follow + DM buttons */}
          {user && !isOwnProfile && (
            <div className="flex items-center gap-2 mt-3">
              {followStatus?.following ? (
                <button
                  onClick={() => unfollowMutation.mutate({ userId: profile.id })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Seguindo
                </button>
              ) : (
                <button
                  onClick={() => followMutation.mutate({ userId: profile.id })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Seguir
                </button>
              )}
              {followStatus?.mutual && (
                <Link href={`/mensagens/${profile.username}`}>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border/50 text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    Mensagem
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* Share profile button */}
          <div className="mt-3">
            <ShareToGroup
              type="share_profile"
              referenceSlug={`perfil/${profile.username}`}
              label="Compartilhar perfil"
            />
          </div>

          {/* Connect Yarin link */}
          {connectYarinUrl && (
            <a
              href={connectYarinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors underline"
            >
              Ver links no Connect Yarin
            </a>
          )}

          {/* Member since */}
          {profile.createdAt && (
            <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Membro desde {format(new Date(profile.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>

        {/* Nobility badges */}
        {allBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg tracking-wider text-primary text-glow-amber mb-3">INSÍGNIAS</h2>
            <div className="grid grid-cols-2 gap-2">
              {allBadges.slice(0, 6).map((badge, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border/30">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground truncate">{badge.title}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{badge.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {profile?.id && <ProfileGallerySection userId={profile.id} />}

        {/* Recent ratings */}
        {ratings && ratings.length > 0 && (
          <div>
            <h2 className="font-display text-lg tracking-wider text-primary text-glow-amber mb-3">AVALIAÇÕES RECENTES</h2>
            <div className="space-y-3">
              {ratings.map((rating: any) => (
                <Link key={rating.id} href={`/estabelecimento/${rating.establishmentSlug || rating.establishmentId}`}>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {rating.establishmentName || "Estabelecimento"}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {rating.overallScore?.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {rating.visitDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(rating.visitDate), "dd/MM/yyyy")}
                        </span>
                      )}
                      {rating.items && rating.items.length > 0 && (
                        <span className="truncate">
                          {rating.items.map((i: any) => i.itemName).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Profile Gallery Section ============
function ProfileGallerySection({ userId }: { userId: number }) {
  const { data: photos, isLoading } = trpc.ratings.userGallery.useQuery(
    { userId, limit: 50, offset: 0 },
    { enabled: !!userId }
  );

  if (isLoading) return null;
  if (!photos || photos.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-lg tracking-wider text-primary text-glow-amber mb-3 flex items-center gap-2">
        <Image className="w-4 h-4" /> GALERIA
      </h2>
      <PhotoGrid
        photos={photos.map((p: any) => ({
          id: p.id,
          url: p.url,
          establishmentName: p.establishmentName,
          establishmentSlug: p.establishmentSlug,
          overallScore: p.overallScore,
          visitDate: p.visitDate,
          taggedItemIds: p.taggedItemIds,
          ratingId: p.ratingId,
          userName: p.userName,
          username: p.username,
          itemComments: p.itemComments || [],
        }))}
      />
    </div>
  );
}
