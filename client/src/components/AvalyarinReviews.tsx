// AvalyarinReviews — Displays clickable Avalyarin reviews with order summary + photo carousel
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { StarRating } from "./StarRating";
import { X, User, Calendar, ShoppingBag, BadgeCheck, ChevronLeft, ChevronRight, ImageIcon, Heart, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import PhotoExpanded from "./PhotoExpanded";

interface AvalyarinReviewsProps {
  establishmentId: number;
}

export function AvalyarinReviews({ establishmentId }: AvalyarinReviewsProps) {
  const [selectedReview, setSelectedReview] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expandedPhoto, setExpandedPhoto] = useState<any>(null);
  const { user } = useAuth();

  const { data: reviews, isLoading } = trpc.ratings.byEstablishment.useQuery(
    { establishmentId, limit: 10, offset: 0 },
    { enabled: !!establishmentId }
  );

  // Fetch photos for the selected review
  const { data: reviewPhotos } = trpc.ratings.getPhotos.useQuery(
    { ratingId: selectedReview! },
    { enabled: !!selectedReview }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">Nenhuma avaliação no Avalyarin ainda</p>
      </div>
    );
  }

  const selected = reviews.find((r) => r.id === selectedReview);

  const handleSelectReview = (id: number) => {
    setSelectedReview(id);
    setPhotoIndex(0);
  };

  return (
    <div>
      {/* Review cards */}
      <div className="space-y-2">
        {reviews.map((review) => {
          const itemNames = review.items?.map((i) => i.itemName).join(", ") || "Sem itens";
          const visitDateStr = review.visitDate
            ? format(new Date(review.visitDate), "dd/MM/yyyy", { locale: ptBR })
            : review.createdAt
            ? format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })
            : "";

          return (
            <button
              key={review.id}
              onClick={() => handleSelectReview(review.id)}
              className="w-full text-left p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all"
            >
              {/* Title: items ordered */}
              <p className="text-sm font-medium text-foreground line-clamp-1">
                {itemNames}
              </p>
              {/* Subtitle: date + @username */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-muted-foreground">{visitDateStr}</span>
                {review.username && (
                  <span className="text-[11px] text-primary/70 inline-flex items-center gap-0.5">
                    @{review.username}
                    {(review as any).userVerified && <BadgeCheck className="w-3 h-3 text-blue-400" />}
                  </span>
                )}
                {!review.username && review.userName && (
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-0.5">
                    {review.userName}
                    {(review as any).userVerified && <BadgeCheck className="w-3 h-3 text-blue-400" />}
                  </span>
                )}
              </div>
              {/* Score */}
              {review.overallScore && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <StarRating rating={Number(review.overallScore) / 2} size={12} />
                  <span className="font-numbers text-xs text-amber-400">
                    {Number(review.overallScore).toFixed(1)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded Photo Viewer */}
      {expandedPhoto && (
        <PhotoExpanded
          photo={{
            id: expandedPhoto.id,
            url: expandedPhoto.url,
            establishmentName: expandedPhoto.establishmentName || "",
            establishmentSlug: expandedPhoto.establishmentSlug || "",
            overallScore: expandedPhoto.overallScore,
            visitDate: expandedPhoto.visitDate,
            userName: expandedPhoto.userName,
            username: expandedPhoto.username,
          }}
          onClose={() => setExpandedPhoto(null)}
          taggedItemNames={expandedPhoto.taggedNames}
        />
      )}

      {/* Review detail modal */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedReview(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[90] bg-card border-t border-border/50 rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-display text-lg tracking-wider text-primary">RESUMO DO PEDIDO</h4>
                <div className="flex items-center gap-3 mt-1">
                  {selected.visitDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(selected.visitDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-primary/70">
                    <User className="w-3 h-3" />
                    {selected.username ? `@${selected.username}` : selected.userName}
                    {(selected as any).userVerified && <BadgeCheck className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Photo Carousel */}
            {reviewPhotos && reviewPhotos.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <ImageIcon className="w-4 h-4 text-primary/60" />
                  <span className="text-sm font-medium text-foreground">Fotos ({reviewPhotos.length})</span>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-black/20 border border-border/30">
                  <img
                    src={reviewPhotos[photoIndex].url}
                    alt={`Foto ${photoIndex + 1}`}
                    className="w-full h-48 object-contain"
                  />
                  {/* Navigation arrows */}
                  {reviewPhotos.length > 1 && (
                    <>
                      <button
                        onClick={() => setPhotoIndex((prev) => (prev - 1 + reviewPhotos.length) % reviewPhotos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPhotoIndex((prev) => (prev + 1) % reviewPhotos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {/* Dots indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {reviewPhotos.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              idx === photoIndex ? "bg-primary" : "bg-white/40"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {/* Tagged items for current photo */}
                {reviewPhotos[photoIndex].taggedItemIds && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Itens marcados: {(() => {
                      try {
                        const ids = JSON.parse(reviewPhotos[photoIndex].taggedItemIds as string);
                        const taggedNames = selected.items
                          ?.filter((item) => ids.includes(String(item.id)) || ids.includes(item.id))
                          .map((item) => item.itemName);
                        return taggedNames?.join(", ") || "—";
                      } catch {
                        return "—";
                      }
                    })()}
                  </p>
                )}
                {/* Like & Share & Expand buttons */}
                <div className="flex items-center gap-3 mt-2">
                  <PhotoLikeButton photoId={reviewPhotos[photoIndex].id} />
                  <button
                    onClick={() => {
                      const photo = reviewPhotos[photoIndex];
                      let taggedNames: string[] = [];
                      try {
                        if (photo.taggedItemIds) {
                          const ids = JSON.parse(photo.taggedItemIds as string);
                          taggedNames = selected.items
                            ?.filter((item) => ids.includes(String(item.id)) || ids.includes(item.id))
                            .map((item) => item.itemName) || [];
                        }
                      } catch {}
                      setExpandedPhoto({
                        id: photo.id,
                        url: photo.url,
                        establishmentName: selected.items?.[0]?.itemName ? "" : "",
                        establishmentSlug: "",
                        overallScore: selected.overallScore,
                        visitDate: selected.visitDate,
                        taggedItemIds: photo.taggedItemIds,
                        userName: selected.userName,
                        username: (selected as any).username,
                        taggedNames,
                      });
                    }}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Expandir
                  </button>
                </div>
              </div>
            )}

            {/* Overall score */}
            {selected.overallScore && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <StarRating rating={Number(selected.overallScore) / 2} size={16} />
                <span className="font-numbers text-base font-semibold text-amber-400">
                  {Number(selected.overallScore).toFixed(1)}/10
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({selected.type === "analytic" ? "Analítica" : "Direta"})
                </span>
              </div>
            )}

            {/* Items ordered */}
            {selected.items && selected.items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShoppingBag className="w-4 h-4 text-primary/60" />
                  <span className="text-sm font-medium text-foreground">Itens consumidos</span>
                </div>
                {selected.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ""}
                        {item.itemName}
                      </p>
                      {item.comment && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          "{item.comment}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {item.price && (
                        <span className="text-xs text-muted-foreground">
                          R$ {Number(item.price).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded">
                        <span className="font-numbers text-xs font-semibold text-primary">
                          {Number(item.score).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setSelectedReview(null)}
              className="w-full mt-5 py-2.5 rounded-xl border border-border/30 text-sm text-muted-foreground hover:bg-secondary/30 transition-colors"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============ PhotoLikeButton — inline like for carousel photos ============
function PhotoLikeButton({ photoId }: { photoId: number }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  const { data: likesData } = trpc.ratings.likesBatch.useQuery({ photoIds: [photoId] });

  useEffect(() => {
    if (likesData && likesData[photoId]) {
      setLiked(likesData[photoId].liked);
      setCount(likesData[photoId].count);
    }
  }, [likesData, photoId]);

  const toggleMutation = trpc.ratings.toggleLike.useMutation({
    onMutate: () => {
      setLiked(!liked);
      setCount(prev => liked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setLiked(liked);
      setCount(prev => liked ? prev + 1 : prev - 1);
      toast.error("Erro ao curtir");
    },
  });

  return (
    <button
      onClick={() => {
        if (!user) { toast("Fa\u00e7a login para curtir"); return; }
        toggleMutation.mutate({ photoId });
      }}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors"
    >
      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-500 text-red-500" : ""}`} />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
