/**
 * SavedPostsCarousel — Carrossel de postagens dos estabelecimentos salvos pelo usuário.
 * Só aparece para usuários logados que têm estabelecimentos salvos com posts ativos.
 */
import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Tag, Megaphone, UtensilsCrossed, X, Bookmark } from "lucide-react";
import { Link } from "wouter";

const typeConfig = {
  event: { label: "Evento", icon: Calendar, color: "text-purple-300 bg-purple-500/20 border-purple-500/30" },
  promotion: { label: "Promoção", icon: Tag, color: "text-green-300 bg-green-500/20 border-green-500/30" },
  brand: { label: "Divulgação", icon: Megaphone, color: "text-blue-300 bg-blue-500/20 border-blue-500/30" },
  menu_daily: { label: "Cardápio do Dia", icon: UtensilsCrossed, color: "text-amber-300 bg-amber-500/20 border-amber-500/30" },
};

export function SavedPostsCarousel() {
  const { isAuthenticated } = useAuth();
  const { data: posts, isLoading, isError } = trpc.posts.saved.useQuery(
    { limit: 15 },
    { enabled: isAuthenticated }
  );
  const recordView = trpc.posts.recordView.useMutation();
  const recordTap = trpc.posts.recordTap.useMutation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [viewedPosts, setViewedPosts] = useState<Set<number>>(new Set());

  // Don't render if not logged in, error, or no saved posts
  if (!isAuthenticated) return null;
  if (isError) return null;
  if (!isLoading && (!posts || posts.length === 0)) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handlePostView = (postId: number) => {
    if (!viewedPosts.has(postId)) {
      setViewedPosts(prev => new Set(prev).add(postId));
      recordView.mutate({ postId });
    }
  };

  const handlePostTap = (postId: number) => {
    setExpandedPost(postId);
    recordTap.mutate({ postId });
  };

  const expandedPostData = posts?.find(p => p.id === expandedPost);

  return (
    <>
      <section className="py-10 border-t border-border/30">
        <div className="container">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
                  SEUS SALVOS
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Novidades dos locais que você segue
                </p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => scroll("left")}
                className="w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-8 h-8 rounded-full bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[140px] h-[248px] rounded-xl bg-card/50 border border-border/30 animate-pulse"
                  style={{ scrollSnapAlign: "start" }}
                />
              ))
            ) : (
              posts?.map((post) => {
                const config = typeConfig[post.type as keyof typeof typeConfig];
                const TypeIcon = config?.icon || Calendar;
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-shrink-0 w-[140px] cursor-pointer group"
                    style={{ scrollSnapAlign: "start" }}
                    onClick={() => {
                      handlePostView(post.id);
                      handlePostTap(post.id);
                    }}
                    onViewportEnter={() => handlePostView(post.id)}
                  >
                    {/* 9:16 aspect ratio card */}
                    <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden border border-primary/20 group-hover:border-primary/50 transition-all">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Saved indicator */}
                      <div className="absolute top-2 right-2">
                        <Bookmark className="w-3.5 h-3.5 text-primary fill-primary" />
                      </div>

                      {/* Type badge */}
                      <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-medium border ${config?.color || "text-white bg-black/40 border-white/20"}`}>
                        <TypeIcon className="w-2.5 h-2.5 inline mr-0.5" />
                        {config?.label}
                      </div>

                      {/* Bottom info */}
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-[10px] text-white/70 truncate mb-0.5">
                          {post.establishmentName}
                        </p>
                        <p className="text-xs text-white font-medium line-clamp-2 leading-tight">
                          {post.title}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Expanded post modal */}
      <AnimatePresence>
        {expandedPost && expandedPostData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setExpandedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedPostData.imageUrl}
                alt={expandedPostData.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />

              <button
                onClick={() => setExpandedPost(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute top-3 left-3 flex items-center gap-2">
                {expandedPostData.establishmentImage && (
                  <img
                    src={expandedPostData.establishmentImage}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-white/30"
                  />
                )}
                <div>
                  <p className="text-xs text-white font-medium">{expandedPostData.establishmentName}</p>
                  {expandedPostData.neighborhood && (
                    <p className="text-[10px] text-white/60">{expandedPostData.neighborhood}</p>
                  )}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border mb-2 ${typeConfig[expandedPostData.type as keyof typeof typeConfig]?.color || ""}`}>
                  {typeConfig[expandedPostData.type as keyof typeof typeConfig]?.label}
                </div>
                <h4 className="text-lg text-white font-bold mb-1">{expandedPostData.title}</h4>
                {expandedPostData.description && (
                  <p className="text-sm text-white/80 line-clamp-3 mb-3">{expandedPostData.description}</p>
                )}
                <Link href={`/estabelecimento/${expandedPostData.establishmentId}`}>
                  <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">
                    Ver Estabelecimento
                  </button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
