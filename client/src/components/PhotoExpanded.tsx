import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Heart, Send, Bookmark, ArrowLeft, X, Loader2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface PhotoData {
  id: number;
  url: string;
  establishmentName: string;
  establishmentSlug: string;
  overallScore: number | null;
  visitDate: string | Date | null;
  taggedItemIds?: string | null;
  userName?: string | null;
  username?: string | null;
  ratingId?: number;
}

interface PhotoExpandedProps {
  photo: PhotoData;
  onClose: () => void;
  /** Item names resolved from taggedItemIds */
  taggedItemNames?: string[];
  /** Comment text from the rating items */
  comment?: string;
}

export default function PhotoExpanded({ photo, onClose, taggedItemNames, comment }: PhotoExpandedProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [likeLoaded, setLikeLoaded] = useState(false);

  // Fetch like status
  const { data: likesData } = trpc.ratings.likesBatch.useQuery({ photoIds: [photo.id] });

  useEffect(() => {
    if (likesData && likesData[photo.id]) {
      setLiked(likesData[photo.id].liked);
      setLikeCount(likesData[photo.id].count);
      setLikeLoaded(true);
    }
  }, [likesData, photo.id]);

  const toggleLikeMutation = trpc.ratings.toggleLike.useMutation({
    onMutate: () => {
      // Optimistic update
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    },
    onError: () => {
      // Rollback
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
    toggleLikeMutation.mutate({ photoId: photo.id });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  };

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
        </div>

        {/* Photo */}
        <div className="flex-1 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <img
            src={photo.url}
            alt={photo.establishmentName}
            className="w-full h-full object-contain"
          />
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
            <h3 className="font-display text-lg tracking-wider text-primary font-bold">{photo.establishmentName}</h3>
            <div className="flex items-center gap-2 mt-1">
              {photo.overallScore && (
                <span className="text-primary font-bold text-sm">★ {photo.overallScore.toFixed(1)}</span>
              )}
              {photo.visitDate && (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-white/60 text-xs">{formatDate(photo.visitDate)}</span>
                </>
              )}
            </div>
            {taggedItemNames && taggedItemNames.length > 0 && (
              <p className="text-white/50 text-xs mt-1">🏷 {taggedItemNames.join(", ")}</p>
            )}
            {comment && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="text-white/80 text-sm italic leading-relaxed">"{comment}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <SharePhotoModal
            photoId={photo.id}
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
