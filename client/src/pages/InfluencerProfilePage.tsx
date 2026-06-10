/**
 * Página Pública do Influencer — /influencer/:id
 * Exibe perfil público, avaliações recentes, e botão de seguir.
 * Similar à página de estabelecimento, mas para influencers.
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { useRoute } from "wouter";
import { Loader2, BadgeCheck, UserPlus, UserMinus, Star, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function InfluencerProfilePage() {
  const [, params] = useRoute("/influencer/:id");
  const influencerId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: profile, isLoading } = trpc.influencerProfile.get.useQuery(
    { influencerId },
    { enabled: influencerId > 0 }
  );

  const { data: isFollowing, refetch: refetchFollow } = trpc.influencerProfile.isFollowing.useQuery(
    { influencerId },
    { enabled: influencerId > 0 && !!user }
  );

  const { data: feed, isLoading: feedLoading } = trpc.influencerProfile.ratings.useQuery(
    { influencerId, limit: 20 },
    { enabled: influencerId > 0 }
  );

  const followMutation = trpc.influencerProfile.follow.useMutation({
    onSuccess: () => {
      refetchFollow();
      toast.success("Agora você segue este influencer!");
    },
    onError: () => toast.error("Erro ao seguir"),
  });

  const unfollowMutation = trpc.influencerProfile.unfollow.useMutation({
    onSuccess: () => {
      refetchFollow();
      toast("Você deixou de seguir");
    },
    onError: () => toast.error("Erro ao deixar de seguir"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <Navbar onMenuOpen={() => setMenuOpen(true)} />
        <div className="container pt-24 text-center">
          <p className="text-muted-foreground">Influencer não encontrado.</p>
          <Link href="/" className="text-primary text-sm mt-2 inline-block">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === influencerId;
  const canFollow = user && !isOwnProfile && user.role !== "business";

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="container pt-24 pb-8 max-w-lg mx-auto">
        {/* Back button */}
        <Link href="/">
          <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </Link>

        {/* Profile Header */}
        <div className="bg-card border border-border/30 rounded-xl p-6 text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-display text-primary">
              {(profile.name || profile.username || "?")[0].toUpperCase()}
            </span>
          </div>
          <h1 className="font-display text-xl tracking-wider text-foreground">
            {profile.name || profile.username}
          </h1>
          {profile.username && (
            <p className="text-sm text-primary/70 mt-0.5">@{profile.username}</p>
          )}
          <div className="flex items-center justify-center gap-1 mt-2">
            <BadgeCheck className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400">Influencer Verificado</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-5">
            <div className="text-center">
              <p className="font-numbers text-lg font-bold text-foreground">{profile.followerCount}</p>
              <p className="text-[11px] text-muted-foreground">Seguidores</p>
            </div>
            <div className="text-center">
              <p className="font-numbers text-lg font-bold text-foreground">{profile.stats.totalRatings}</p>
              <p className="text-[11px] text-muted-foreground">Avaliações</p>
            </div>
            <div className="text-center">
              <p className="font-numbers text-lg font-bold text-foreground">{profile.stats.avgScore.toFixed(1)}</p>
              <p className="text-[11px] text-muted-foreground">Nota Média</p>
            </div>
          </div>

          {/* Follow Button */}
          {canFollow && (
            <div className="mt-5">
              {isFollowing ? (
                <button
                  onClick={() => unfollowMutation.mutate({ influencerId })}
                  disabled={unfollowMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  <UserMinus className="w-4 h-4" />
                  Seguindo
                </button>
              ) : (
                <button
                  onClick={() => followMutation.mutate({ influencerId })}
                  disabled={followMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Seguir
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feed - Recent Ratings */}
        <div>
          <h2 className="font-display text-lg tracking-wider text-primary mb-4">AVALIAÇÕES RECENTES</h2>
          {feedLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !feed || feed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma avaliação publicada ainda.</p>
          ) : (
            <div className="space-y-3">
              {feed.map((rating: any) => (
                <div key={rating.id} className="bg-card border border-border/30 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={`/estabelecimento/${rating.establishmentId}`}>
                        <p className="text-sm font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
                          {rating.establishmentName}
                        </p>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {rating.visitDate && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(rating.visitDate), "dd MMM yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {rating.source && rating.source !== "remote" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                            {rating.source === "presencial" ? "Presencial" : "Híbrido"}
                          </span>
                        )}
                      </div>
                    </div>
                    {rating.overallScore && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-numbers text-sm font-bold text-primary">{rating.overallScore.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  {/* Items summary */}
                  {rating.items && rating.items.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rating.items.slice(0, 4).map((item: any, idx: number) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {item.itemName}
                        </span>
                      ))}
                      {rating.items.length > 4 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          +{rating.items.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
