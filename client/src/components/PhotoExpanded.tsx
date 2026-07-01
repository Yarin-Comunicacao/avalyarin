import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Heart, Send, Bookmark, ArrowLeft, X, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface PhotoData {
  id: number;
  url: string;
  establishmentName: string;
  establishmentSlug: string;
  establishmentLogo?: string | null;
  overallScore: number | null;
  visitDate: string | Date | null;
  taggedItemIds?: string | null;
  userName?: string | null;
  username?: string | null;
  ratingId?: number;
  itemComments?: { itemName: string; comment: string | null }[];
}

interface PhotoExpandedProps {
  photo: PhotoData;
  onClose: () => void;
  /** Item names resolved from taggedItemIds */
  taggedItemNames?: string[];
  /** Comment text from the rating items */
  comment?: string;
  /** All photos from the same rating (carousel) */
  carouselPhotos?: PhotoData[];
  /** Callback when navigating carousel */
  onNavigate?: (photo: PhotoData) => void;
}

export default function PhotoExpanded({ photo, onClose, taggedItemNames, comment, carouselPhotos, onNavigate }: PhotoExpandedProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [likeLoaded, setLikeLoaded] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Determine carousel index
  useEffect(() => {
    if (carouselPhotos && carouselPhotos.length > 0) {
      const idx = carouselPhotos.findIndex(p => p.id === photo.id);
      if (idx >= 0) setCurrentIdx(idx);
    }
  }, [photo.id, carouselPhotos]);

  const hasCarousel = carouselPhotos && carouselPhotos.length > 1;
  const currentPhoto = hasCarousel ? carouselPhotos[currentIdx] : photo;

  // Fetch like status
  const { data: likesData } = trpc.ratings.likesBatch.useQuery({ photoIds: [currentPhoto.id] });

  useEffect(() => {
    if (likesData && likesData[currentPhoto.id]) {
      setLiked(likesData[currentPhoto.id].liked);
      setLikeCount(likesData[currentPhoto.id].count);
      setLikeLoaded(true);
    }
  }, [likesData, currentPhoto.id]);

  const toggleLikeMutation = trpc.ratings.toggleLike.useMutation({
    onMutate: () => {
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setLiked(liked);
      setLikeCount(prev => liked ? prev + 1 : prev - 1);
      toast.error("Erro ao curtir");
    },
  });

  const handleLike = () => {
    if (!user) {
      toast("Faça login para curtir");
      return;
    }
    toggleLikeMutation.mutate({ photoId: currentPhoto.id });
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCarousel && currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      if (onNavigate) onNavigate(carouselPhotos![currentIdx - 1]);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCarousel && currentIdx < carouselPhotos!.length - 1) {
      setCurrentIdx(currentIdx + 1);
      if (onNavigate) onNavigate(carouselPhotos![currentIdx + 1]);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  };

  // Get comment for current photo's tagged item
  const getCurrentComment = (): string | undefined => {
    if (comment) return comment;
    if (currentPhoto.itemComments && currentPhoto.itemComments.length > 0) {
      // Find the first item with a comment
      const withComment = currentPhoto.itemComments.find(ic => ic.comment && ic.comment.trim().length > 0);
      return withComment?.comment || undefined;
    }
    return undefined;
  };

  const getCurrentItemName = (): string | undefined => {
    if (currentPhoto.itemComments && currentPhoto.itemComments.length > 0) {
      const withComment = currentPhoto.itemComments.find(ic => ic.comment && ic.comment.trim().length > 0);
      return withComment?.itemName || currentPhoto.itemComments[0]?.itemName || undefined;
    }
    return taggedItemNames?.[0] || undefined;
  };

  const displayComment = getCurrentComment();
  const displayItemName = getCurrentItemName();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
        onClick={onClose}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 p-4 bg-gradient-to-b from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          {photo.userName && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                {photo.userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-white text-sm font-medium">{photo.username || photo.userName}</span>
            </div>
          )}
          {/* Carousel indicator */}
          {hasCarousel && (
            <div className="ml-auto flex items-center gap-1.5">
              {carouselPhotos!.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIdx ? "bg-primary" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Photo with carousel navigation */}
        <div className="flex-1 flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
          {/* Left arrow */}
          {hasCarousel && currentIdx > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          <img
            src={currentPhoto.url}
            alt={currentPhoto.establishmentName}
            className="w-full h-full object-contain"
          />

          {/* Right arrow */}
          {hasCarousel && currentIdx < carouselPhotos!.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Right side actions */}
        <div className="absolute right-4 top-1/3 flex flex-col items-center gap-6 z-10" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <Heart className={`w-7 h-7 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-white"}`} />
            <span className="text-white text-xs">{likeCount}</span>
          </button>
          <button onClick={() => setShowShareModal(true)} className="flex flex-col items-center gap-1">
            <Send className="w-6 h-6 text-white" />
          </button>
          <button className="flex flex-col items-center gap-1" onClick={() => toast("Salvo!", { description: "Foto adicionada aos favoritos" })}>
            <Bookmark className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Bottom info panel */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent" onClick={(e) => e.stopPropagation()}>
          <div className="max-w-lg">
            <h3 className="font-display text-lg tracking-wider text-primary font-bold">{currentPhoto.establishmentName}</h3>
            <div className="flex items-center gap-2 mt-1">
              {currentPhoto.overallScore && (
                <span className="text-primary font-bold text-sm">★ {Number(currentPhoto.overallScore).toFixed(1)}</span>
              )}
              {currentPhoto.visitDate && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-white/60 text-xs">{formatDate(currentPhoto.visitDate)}</span>
                </>
              )}
            </div>
            {/* Tagged items */}
            {taggedItemNames && taggedItemNames.length > 0 && (
              <p className="text-white/50 text-xs mt-1">🏷 {taggedItemNames.join(", ")}</p>
            )}
            {/* Item comment in @avalyarin style */}
            {displayComment && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="text-white/80 text-sm leading-relaxed">
                  <span className="text-primary font-medium">@avalyarin</span>
                  {displayItemName && <span className="text-white/50 text-xs ml-1">sobre {displayItemName}</span>}
                  <span className="block mt-0.5 italic">"{displayComment}"</span>
                </p>
              </div>
            )}
            {/* Carousel info: items in this rating */}
            {hasCarousel && currentPhoto.itemComments && currentPhoto.itemComments.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-white/40 text-xs">
                <span>{carouselPhotos!.length} fotos nesta avaliação</span>
                <span>·</span>
                <span>Use as setas para ver todos os pedidos</span>
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <SharePhotoModal
            photoId={currentPhoto.id}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ============ Share Photo Modal ============
function SharePhotoModal({ photoId, onClose }: { photoId: number; onClose: () => void }) {
  const { data: groups } = trpc.groups.myGroups.useQuery();
  const [comment, setComment] = useState("");

  const shareMutation = trpc.ratings.shareToGroup.useMutation({
    onSuccess: () => {
      toast.success("Foto compartilhada no grupo!");
      onClose();
    },
    onError: () => toast.error("Erro ao compartilhar"),
  });

  const handleShare = (groupId: number) => {
    shareMutation.mutate({ photoId, groupId, comment: comment || undefined });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-card/95 backdrop-blur-xl border-t border-border rounded-t-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <h3 className="text-foreground font-display text-lg tracking-wider mb-4">COMPARTILHAR PARA</h3>

        {!groups || groups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Você não participa de nenhum grupo</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {groups.map((group: any) => (
              <button
                key={group.id}
                onClick={() => handleShare(group.id)}
                disabled={shareMutation.isPending}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {group.name?.charAt(0)?.toUpperCase() || "G"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.memberCount || ""} membros</p>
                </div>
                {shareMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Send className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Comment input */}
        <div className="mt-4 flex items-center gap-2 border-t border-border/30 pt-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Adicionar comentário..."
            maxLength={280}
            className="flex-1 bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>

        <button onClick={onClose} className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cancelar
        </button>
      </motion.div>
    </div>
  );
}
