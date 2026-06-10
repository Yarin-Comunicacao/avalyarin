// Design: AvaLyarin — Minhas Avaliações (unified page with 4 tabs)
// Tabs: Avaliações, Meu Ranking, Locais Visitados, Galeria
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, Redirect } from "wouter";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import {
  Star, MapPin, Calendar, ChevronRight, Trophy, Crown, Medal,
  ArrowRight, GripVertical, Save, Compass, Image, Camera, X,
  Coffee, Beer, UtensilsCrossed, ChefHat, Sparkles, Cake,
  Wine, CupSoda, Croissant, Music, Leaf, Globe, Pizza,
  Loader2, ArrowLeft, Navigation, BarChart3
} from "lucide-react";

type Tab = "avaliacoes" | "ranking" | "locais" | "galeria" | "stats";

const iconMap: Record<string, React.ElementType> = {
  Beer, Coffee, UtensilsCrossed, ChefHat, Sparkles, Cake,
  Wine, CupSoda, Croissant, Music, Leaf, Globe, Pizza,
};

interface RankedItem {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  neighborhood: string | null;
  avgScore?: number | null;
}

function UserStatsSection() {
  const { data: stats, isLoading } = trpc.analytics.myStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <h3 className="font-display text-xl tracking-wider text-foreground mb-2">SEM DADOS</h3>
        <p className="text-sm text-muted-foreground">Faça avaliações para ver suas estatísticas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Total de Avaliações</p>
          <p className="font-numbers text-2xl font-bold text-foreground">{stats.totalRatings}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Nota Média</p>
          <p className="font-numbers text-2xl font-bold text-primary">{stats.avgScore}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Locais Visitados</p>
          <p className="font-numbers text-2xl font-bold text-foreground">{stats.establishmentsVisited}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Categorias</p>
          <p className="font-numbers text-2xl font-bold text-foreground">{stats.categoriesEvaluated}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <p className="text-xs text-muted-foreground mb-1">Últimos 30 dias</p>
          <p className="font-numbers text-2xl font-bold text-foreground">{stats.ratingsLast30Days}</p>
        </div>
        {stats.avgCostPerVisit && (
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Gasto Médio</p>
            <p className="font-numbers text-2xl font-bold text-foreground">R$ {stats.avgCostPerVisit}</p>
          </div>
        )}
      </div>

      {/* Favorites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.favoriteCategory && (
          <div className="p-4 rounded-xl bg-card border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Categoria Favorita</p>
            <p className="text-lg font-medium text-foreground">{stats.favoriteCategory.name}</p>
            <p className="text-xs text-primary">{stats.favoriteCategory.count} avaliações</p>
          </div>
        )}
        {stats.favoriteNeighborhood && (
          <div className="p-4 rounded-xl bg-card border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Bairro Favorito</p>
            <p className="text-lg font-medium text-foreground">{stats.favoriteNeighborhood.name}</p>
            <p className="text-xs text-primary">{stats.favoriteNeighborhood.count} visitas</p>
          </div>
        )}
      </div>

      {/* Ratings by Month */}
      {stats.ratingsByMonth.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Avaliações por Mês</h3>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-end gap-1 h-24">
              {stats.ratingsByMonth.map((m: any, i: number) => {
                const maxCount = Math.max(...stats.ratingsByMonth.map((x: any) => x.count));
                const height = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${m.month}: ${m.count}`}>
                    <span className="text-[9px] text-muted-foreground mb-1">{m.count}</span>
                    <div
                      className="w-full bg-primary/80 rounded-t min-h-[2px]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">{stats.ratingsByMonth[0]?.month || ""}</span>
              <span className="text-[10px] text-muted-foreground">{stats.ratingsByMonth[stats.ratingsByMonth.length - 1]?.month || ""}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Rated */}
      {stats.topRatedEstablishments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Seus Melhores Locais</h3>
          <div className="space-y-2">
            {stats.topRatedEstablishments.map((est: any, i: number) => (
              <div key={i} className="p-3 rounded-lg bg-card border border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-numbers text-sm font-bold text-primary/50 w-5">{i + 1}</span>
                  <span className="text-sm text-foreground">{est.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-primary" />
                  <span className="font-numbers text-sm font-bold text-primary">{est.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MinhasAvaliacoes() {
  const params = useParams<{ tab?: string }>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || "avaliacoes");
  const { user, loading: authLoading } = useAuth();

  // ============ AVALIAÇÕES TAB DATA ============
  const { data: myRatings, isLoading: loadingRatings } = trpc.ratings.myRatings.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user }
  );

  // ============ RANKING TAB DATA ============
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [rankedItems, setRankedItems] = useState<RankedItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();

  const { data: categoriesData } = trpc.categories.list.useQuery();
  const categories = categoriesData || [];

  const { data: rankingSummary } = trpc.rankings.summary.useQuery(undefined, { enabled: !!user });

  const { data: ratedEstablishments, isLoading: loadingRated } = trpc.rankings.ratedInCategory.useQuery(
    { categoryId: selectedCategoryId! },
    { enabled: !!selectedCategoryId && !!user }
  );

  const { data: existingRanking } = trpc.rankings.getByCategory.useQuery(
    { categoryId: selectedCategoryId! },
    { enabled: !!selectedCategoryId && !!user }
  );

  const { data: discoveryPlaces } = trpc.rankings.discover.useQuery(
    { categoryId: selectedCategoryId!, limit: 6, lat: userLat, lng: userLng },
    { enabled: !!selectedCategoryId && !!user && (ratedEstablishments?.length ?? 0) < 3 }
  );

  const saveMutation = trpc.rankings.save.useMutation({
    onSuccess: () => {
      toast.success("Ranking salvo!", { description: "Seu ranking pessoal foi atualizado." });
      setHasChanges(false);
    },
    onError: (err) => toast.error("Erro ao salvar", { description: err.message }),
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => {}
      );
    }
  }, []);

  const ratedCount = ratedEstablishments?.length ?? 0;
  const maxRankSize = ratedCount >= 10 ? 10 : 3;
  const canRank = ratedCount >= 3;

  useEffect(() => {
    if (!ratedEstablishments) return;
    if (existingRanking && existingRanking.length > 0) {
      const ranked: RankedItem[] = existingRanking.map(r => ({
        id: r.establishmentId, slug: r.establishmentSlug, name: r.establishmentName,
        image: r.establishmentImage, neighborhood: r.establishmentNeighborhood,
      }));
      setRankedItems(ranked);
    } else {
      const sorted = [...ratedEstablishments]
        .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
        .slice(0, maxRankSize)
        .map(e => ({ id: e.id, slug: e.slug, name: e.name, image: e.image, neighborhood: e.neighborhood, avgScore: e.avgScore }));
      setRankedItems(sorted);
    }
    setHasChanges(false);
  }, [ratedEstablishments, existingRanking, maxRankSize]);

  const handleReorder = useCallback((newOrder: RankedItem[]) => { setRankedItems(newOrder); setHasChanges(true); }, []);
  const handleSave = useCallback(() => {
    if (!selectedCategoryId || rankedItems.length === 0) return;
    saveMutation.mutate({ categoryId: selectedCategoryId, items: rankedItems.map((item, idx) => ({ establishmentId: item.id, position: idx + 1 })) });
  }, [selectedCategoryId, rankedItems, saveMutation]);
  const handleAddToRanking = useCallback((est: RankedItem) => {
    if (rankedItems.length >= maxRankSize) { toast("Ranking cheio", { description: `Máximo ${maxRankSize} itens.` }); return; }
    if (rankedItems.find(r => r.id === est.id)) { toast("Já no ranking"); return; }
    setRankedItems(prev => [...prev, est]); setHasChanges(true);
  }, [rankedItems, maxRankSize]);
  const handleRemoveFromRanking = useCallback((id: number) => { setRankedItems(prev => prev.filter(item => item.id !== id)); setHasChanges(true); }, []);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  // ============ LOCAIS VISITADOS TAB DATA ============
  const visitedPlaces = useMemo(() => {
    if (!myRatings) return [];
    const placeMap = new Map<number, { id: number; slug: string; name: string; neighborhood: string | null; visits: number; bestScore: number }>();
    for (const r of myRatings) {
      if (!r.establishmentId) continue;
      const existing = placeMap.get(r.establishmentId);
      if (existing) {
        existing.visits++;
        if (r.overallScore && Number(r.overallScore) > existing.bestScore) existing.bestScore = Number(r.overallScore);
      } else {
        placeMap.set(r.establishmentId, {
          id: r.establishmentId,
          slug: r.establishmentSlug,
          name: r.establishmentName,
          neighborhood: r.categoryName,
          visits: 1,
          bestScore: r.overallScore ? Number(r.overallScore) : 0,
        });
      }
    }
    return Array.from(placeMap.values());
  }, [myRatings]);

  // ============ GALERIA TAB DATA ============
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; caption: string; place: string; date: string } | null>(null);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={getLoginUrl()} />;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "avaliacoes", label: "Avaliações", icon: <Star className="w-4 h-4" /> },
    { id: "ranking", label: "Meu Ranking", icon: <Trophy className="w-4 h-4" /> },
    { id: "locais", label: "Locais Visitados", icon: <MapPin className="w-4 h-4" /> },
    { id: "galeria", label: "Galeria", icon: <Image className="w-4 h-4" /> },
    { id: "stats", label: "Estatísticas", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="container pt-28 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <button className="p-2 rounded-lg bg-secondary/50 border border-border/30 hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          </Link>
          <div>
            <h1 className="font-display text-2xl tracking-wider text-primary">MINHAS AVALIAÇÕES</h1>
            <p className="text-sm text-muted-foreground">
              {myRatings ? `${myRatings.length} avaliações realizadas` : "Carregando..."}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* ============ AVALIAÇÕES TAB ============ */}
          {activeTab === "avaliacoes" && (
            <motion.div key="avaliacoes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {loadingRatings ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : !myRatings || myRatings.length === 0 ? (
                <div className="text-center py-20">
                  <Star className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                  <h3 className="font-display text-xl tracking-wider text-foreground mb-2">NENHUMA AVALIAÇÃO</h3>
                  <p className="text-sm text-muted-foreground mb-6">Visite um estabelecimento e faça sua primeira avaliação!</p>
                  <Link href="/">
                    <Button variant="default">Explorar Categorias</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mini Gallery - Last 3 */}
                  {myRatings.length >= 3 && (
                    <div>
                      <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-3">Últimas visitas</p>
                      <div className="grid grid-cols-3 gap-3">
                        {myRatings.slice(0, 3).map((review) => (
                          <Link key={review.id} href={`/estabelecimento/${review.establishmentSlug}`}>
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/30 hover:border-primary/40 transition-colors group cursor-pointer bg-card">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Star className="w-8 h-8 text-primary/20" />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white text-xs font-medium truncate">{review.establishmentName}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Star className="w-3 h-3 text-primary fill-primary" />
                                  <span className="text-[10px] text-white/80 font-numbers">
                                    {review.overallScore ? Number(review.overallScore).toFixed(1) : "—"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full List */}
                  <div>
                    <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-3">Todas as avaliações</p>
                    <div className="space-y-2">
                      {myRatings.map((review) => (
                        <Link key={review.id} href={`/estabelecimento/${review.establishmentSlug}`}>
                          <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all cursor-pointer group">
                            <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <Star className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{review.establishmentName}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString("pt-BR") : "—"}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {review.type === "analytic" ? "Analítico" : "Direto"}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground/60">{review.categoryName}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                                <span className="font-numbers text-sm font-bold text-primary">
                                  {review.overallScore ? Number(review.overallScore).toFixed(1) : "—"}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ============ MEU RANKING TAB ============ */}
          {activeTab === "ranking" && (
            <motion.div key="ranking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {!selectedCategoryId ? (
                <div>
                  <h3 className="font-display text-xl tracking-wider text-foreground mb-6">ESCOLHA UMA CATEGORIA</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.filter(c => c.active).map((cat) => {
                      const Icon = iconMap[cat.icon || "Coffee"] || Coffee;
                      const summary = rankingSummary?.find(s => s.categoryId === cat.id);
                      return (
                        <motion.div key={cat.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className="group relative p-5 rounded-xl bg-card border border-border/50 hover:border-primary/60 transition-all cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <h4 className="font-display text-base tracking-wider text-foreground group-hover:text-primary transition-colors">{cat.name}</h4>
                          {summary && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-primary/80">
                              <Crown className="w-3 h-3" /><span>Top {summary.rankingCount} definido</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => { setSelectedCategoryId(null); setRankedItems([]); setHasChanges(false); }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Voltar</button>
                    <div className="flex items-center gap-2">
                      {selectedCategory && (
                        <>
                          {(() => { const Icon = iconMap[selectedCategory.icon || "Coffee"] || Coffee; return <Icon className="w-5 h-5 text-primary" />; })()}
                          <h3 className="font-display text-xl tracking-wider text-foreground">{selectedCategory.name}</h3>
                        </>
                      )}
                    </div>
                  </div>

                  {loadingRated ? (
                    <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                  ) : !canRank ? (
                    <div className="space-y-6">
                      <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <Compass className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-display text-lg tracking-wider text-foreground mb-2">EXPLORE MAIS LUGARES</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Você avaliou apenas <strong className="text-foreground">{ratedCount}</strong> {ratedCount === 1 ? "estabelecimento" : "estabelecimentos"} nesta categoria.
                              Para criar seu ranking pessoal, visite e avalie pelo menos <strong className="text-foreground">3 lugares</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                      {discoveryPlaces && discoveryPlaces.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {discoveryPlaces.map((place) => (
                            <Link key={place.id} href={`/estabelecimento/${place.slug}`}>
                              <div className="group p-4 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-all cursor-pointer">
                                {place.image && (
                                  <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                                    <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  </div>
                                )}
                                <h5 className="font-display text-sm tracking-wider text-foreground group-hover:text-primary transition-colors">{place.name}</h5>
                                {place.neighborhood && (
                                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /><span>{place.neighborhood}</span></div>
                                )}
                                {place.rating && <div className="flex items-center gap-1 mt-1 text-xs text-primary"><span>★ {place.rating.toFixed(1)}</span></div>}
                                <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium"><span>Visitar</span><ArrowRight className="w-3 h-3" /></div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma sugestão disponível no momento.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-card border border-border/50">
                        <div className="flex items-center gap-3">
                          <Crown className="w-5 h-5 text-primary shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {ratedCount >= 10
                              ? <>Você avaliou <strong className="text-foreground">{ratedCount}</strong> lugares. Organize seu <strong className="text-primary">Top 10</strong>.</>
                              : <>Você avaliou <strong className="text-foreground">{ratedCount}</strong> lugares. Organize seu <strong className="text-primary">Top 3</strong>.</>}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Reorder.Group axis="y" values={rankedItems} onReorder={handleReorder} className="space-y-2">
                          {rankedItems.map((item, index) => (
                            <Reorder.Item key={item.id} value={item}>
                              <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                  index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                  index === 1 ? "bg-gray-300/20 text-gray-300" :
                                  index === 2 ? "bg-amber-700/20 text-amber-700" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {index === 0 ? <Crown className="w-4 h-4" /> :
                                   index === 1 ? <Medal className="w-4 h-4" /> :
                                   index === 2 ? <Medal className="w-4 h-4" /> :
                                   <span className="text-xs font-bold">{index + 1}</span>}
                                </div>
                                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                                {item.image && (
                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-display text-sm tracking-wider text-foreground truncate">{item.name}</h5>
                                  {item.neighborhood && <p className="text-xs text-muted-foreground truncate">{item.neighborhood}</p>}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveFromRanking(item.id); }}
                                  className="text-xs text-muted-foreground hover:text-destructive transition-colors">✕</button>
                              </div>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </div>
                      {rankedItems.length < maxRankSize && ratedEstablishments && (
                        <div>
                          <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
                            ADICIONAR AO RANKING ({rankedItems.length}/{maxRankSize})
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {ratedEstablishments.filter(e => !rankedItems.find(r => r.id === e.id)).map(est => (
                              <button key={est.id}
                                onClick={() => handleAddToRanking({ id: est.id, slug: est.slug, name: est.name, image: est.image, neighborhood: est.neighborhood })}
                                className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 transition-all text-left"
                              >
                                {est.image && (
                                  <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                                    <img src={est.image} alt={est.name} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-foreground truncate block">{est.name}</span>
                                  {est.avgScore && <span className="text-xs text-primary">★ {Number(est.avgScore).toFixed(1)}</span>}
                                </div>
                                <span className="text-xs text-primary">+ Adicionar</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="sticky bottom-4">
                        <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending || rankedItems.length === 0} className="w-full" size="lg">
                          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                          SALVAR RANKING
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ============ LOCAIS VISITADOS TAB ============ */}
          {activeTab === "locais" && (
            <motion.div key="locais" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {loadingRatings ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : visitedPlaces.length === 0 ? (
                <div className="text-center py-20">
                  <MapPin className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                  <h3 className="font-display text-xl tracking-wider text-foreground mb-2">NENHUM LOCAL VISITADO</h3>
                  <p className="text-sm text-muted-foreground mb-6">Faça avaliações para ver seus locais visitados aqui.</p>
                  <Link href="/"><Button variant="default">Explorar</Button></Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider">
                    {visitedPlaces.length} {visitedPlaces.length === 1 ? "local visitado" : "locais visitados"}
                  </p>
                  <div className="space-y-2">
                    {visitedPlaces.map((place) => (
                      <Link key={place.id} href={`/estabelecimento/${place.slug}`}>
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all cursor-pointer">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">{place.name}</p>
                            <p className="text-xs text-muted-foreground">{place.neighborhood}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-primary fill-primary" />
                              <span className="font-numbers text-sm font-bold text-primary">{place.bestScore.toFixed(1)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{place.visits}x</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ============ GALERIA TAB ============ */}
          {activeTab === "galeria" && (
            <motion.div key="galeria" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="text-center py-20">
                <Camera className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                <h3 className="font-display text-xl tracking-wider text-foreground mb-2">GALERIA</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Em breve você poderá ver aqui todas as fotos dos pratos e drinks que avaliou.
                </p>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 max-w-md mx-auto">
                  <Camera className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-xs text-foreground/80 text-left">
                    Ao avaliar, envie fotos dos itens consumidos para construir sua galeria pessoal.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============ ESTATÍSTICAS TAB ============ */}
          {activeTab === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <UserStatsSection />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox for gallery */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="w-full rounded-xl" />
            <div className="mt-3 text-center">
              <p className="text-white font-medium">{selectedPhoto.caption}</p>
              <p className="text-white/60 text-sm">{selectedPhoto.place} · {selectedPhoto.date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
