/**
 * PostsCarousel — Carrossel horizontal de postagens de estabelecimentos (9:16 vertical)
 * Exibido na Home com posts ativos de contas empresariais.
 * Modal expandido com auto-play de 15s e setas de navegação.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Tag, Megaphone, UtensilsCrossed, X } from "lucide-react";
import { Link } from "wouter";

const typeConfig = {
  event: { label: "Evento", icon: Calendar, color: "text-purple-300 bg-purple-500/20 border-purple-500/30" },
  promotion: { label: "Promoção", icon: Tag, color: "text-green-300 bg-green-500/20 border-green-500/30" },
  brand: { label: "Divulgação", icon: Megaphone, color: "text-blue-300 bg-blue-500/20 border-blue-500/30" },
  menu_daily: { label: "Cardápio do Dia", icon: UtensilsCrossed, color: "text-amber-300 bg-amber-500/20 border-amber-500/30" },
};

const AUTO_PLAY_DURATION = 15000; // 15 seconds

export function PostsCarousel() {
  const { data: posts, isLoading, isError } = trpc.posts.active.useQuery({ limit: 15 });
  const recordView = trpc.posts.recordView.useMutation();
  const recordTap = trpc.posts.recordTap.useMutation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [viewedPosts, setViewedPosts] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  // No posts available or error — don't render section
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

  const handlePostTap = (postId: number, index: number) => {
    setExpandedIndex(index);
    setProgress(0);
    recordTap.mutate({ postId });
  };

  const goToNext = useCallback(() => {
    if (!posts) return;
    setExpandedIndex(prev => {
      if (prev === null) return null;
      if (prev >= posts.length - 1) return null; // Close on last
      return prev + 1;
    });
    setProgress(0);
  }, [posts]);

  const goToPrev = useCallback(() => {
    setExpandedIndex(prev => {
      if (prev === null || prev <= 0) return prev;
      return prev - 1;
    });
    setProgress(0);
  }, []);

  const closeModal = useCallback(() => {
    setExpandedIndex(null);
    setProgress(0);
  }, []);

  // Auto-play timer for expanded modal
  useEffect(() => {
    if (expandedIndex === null) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }

    // Record view for current post
    if (posts && posts[expandedIndex]) {
      handlePostView(posts[expandedIndex].id);
    }

    // Reset progress
    setProgress(0);

    // Progress bar update every 100ms
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (AUTO_PLAY_DURATION / 100));
        return next >= 100 ? 100 : next;
      });
    }, 100);
    progressRef.current = progressInterval;

    // Auto-advance after 15s
    const timer = setTimeout(() => {
      goToNext();
    }, AUTO_PLAY_DURATION);
    timerRef.current = timer;

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [expandedIndex]);

  const expandedPostData = posts && expandedIndex !== null ? posts[expandedIndex] : null;
  const canGoLeft = expandedIndex !== null && expandedIndex > 0;
  const canGoRight = posts && expandedIndex !== null && expandedIndex < posts.length - 1;

  return (
    <>
      <section className="py-10 border-t border-border/30">
        <div className="container">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
                DESTAQUES
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Novidades dos estabelecimentos
              </p>
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
              // Skeleton loading
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[140px] h-[248px] rounded-xl bg-card/50 border border-border/30 animate-pulse"
                  style={{ scrollSnapAlign: "start" }}
                />
              ))
            ) : (
              posts?.map((post, index) => {
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
                      handlePostTap(post.id, index);
                    }}
                    onViewportEnter={() => handlePostView(post.id)}
                  >
                    {/* 9:16 aspect ratio card */}
                    <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden border border-border/40 group-hover:border-primary/40 transition-all">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
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

      {/* Expanded post modal with auto-play and navigation */}
      <AnimatePresence>
        {expandedIndex !== null && expandedPostData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bars at top */}
              <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-2">
                {posts?.map((_, i) => (
                  <div key={i} className="flex-1 h-[3px] rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                      style={{
                        width: i < expandedIndex ? "100%" : i === expandedIndex ? `${progress}%` : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Image */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={expandedPostData.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={expandedPostData.imageUrl}
                  alt={expandedPostData.title}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />

              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-5 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-all z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Top info */}
              <div className="absolute top-5 left-3 flex items-center gap-2 z-10">
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

              {/* Navigation arrows */}
              {canGoLeft && (
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {canGoRight && (
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
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
