// Meu Ranking — Personal top 10 / top 3 per category with discovery banner
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, Reorder } from "framer-motion";
import { toast } from "sonner";
import {
  Trophy, Crown, Medal, ArrowRight, GripVertical, Save,
  MapPin, Compass, Coffee, Beer, UtensilsCrossed, ChefHat,
  Sparkles, Cake, Wine, CupSoda, Croissant, Music, Leaf, Globe, Pizza,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function MeuRanking() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [rankedItems, setRankedItems] = useState<RankedItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [userLat, setUserLat] = useState<number | undefined>();
  const [userLng, setUserLng] = useState<number | undefined>();

  // Get all categories
  const { data: categoriesData } = trpc.categories.list.useQuery();
  const categories = categoriesData || [];

  // Get user's ranking summary
  const { data: rankingSummary } = trpc.rankings.summary.useQuery(undefined, {
    enabled: !!user,
  });

  // Get rated establishments for selected category
  const { data: ratedEstablishments, isLoading: loadingRated } = trpc.rankings.ratedInCategory.useQuery(
    { categoryId: selectedCategoryId! },
    { enabled: !!selectedCategoryId && !!user }
  );

  // Get existing ranking for selected category
  const { data: existingRanking } = trpc.rankings.getByCategory.useQuery(
    { categoryId: selectedCategoryId! },
    { enabled: !!selectedCategoryId && !!user }
  );

  // Discovery suggestions when fewer than 3 rated places (uses geolocation)
  const { data: discoveryPlaces } = trpc.rankings.discover.useQuery(
    { categoryId: selectedCategoryId!, limit: 6, lat: userLat, lng: userLng },
    { enabled: !!selectedCategoryId && !!user && (ratedEstablishments?.length ?? 0) < 3 }
  );

  // Save mutation
  const saveMutation = trpc.rankings.save.useMutation({
    onSuccess: () => {
      toast.success("Ranking salvo!", { description: "Seu ranking pessoal foi atualizado." });
      setHasChanges(false);
    },
    onError: (err) => {
      toast.error("Erro ao salvar", { description: err.message });
    },
  });

  // Geolocation for discovery
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        () => { /* silently ignore permission denial */ }
      );
    }
  }, []);

  // Determine ranking mode: top 10 if >= 10 rated, top 3 if 3-9 rated
  const ratedCount = ratedEstablishments?.length ?? 0;
  const maxRankSize = ratedCount >= 10 ? 10 : 3;
  const canRank = ratedCount >= 3;

  // Initialize ranked items when category changes or data loads
  useEffect(() => {
    if (!ratedEstablishments) return;

    if (existingRanking && existingRanking.length > 0) {
      // Use existing ranking order
      const ranked: RankedItem[] = existingRanking.map(r => ({
        id: r.establishmentId,
        slug: r.establishmentSlug,
        name: r.establishmentName,
        image: r.establishmentImage,
        neighborhood: r.establishmentNeighborhood,
      }));
      setRankedItems(ranked);
    } else {
      // Start with top rated establishments sorted by score
      const sorted = [...ratedEstablishments]
        .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0))
        .slice(0, maxRankSize)
        .map(e => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          image: e.image,
          neighborhood: e.neighborhood,
          avgScore: e.avgScore,
        }));
      setRankedItems(sorted);
    }
    setHasChanges(false);
  }, [ratedEstablishments, existingRanking, maxRankSize]);

  const handleReorder = useCallback((newOrder: RankedItem[]) => {
    setRankedItems(newOrder);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!selectedCategoryId || rankedItems.length === 0) return;
    saveMutation.mutate({
      categoryId: selectedCategoryId,
      items: rankedItems.map((item, idx) => ({
        establishmentId: item.id,
        position: idx + 1,
      })),
    });
  }, [selectedCategoryId, rankedItems, saveMutation]);

  const handleAddToRanking = useCallback((est: RankedItem) => {
    if (rankedItems.length >= maxRankSize) {
      toast("Ranking cheio", { description: `Você já tem ${maxRankSize} itens no ranking. Remova um para adicionar outro.` });
      return;
    }
    if (rankedItems.find(r => r.id === est.id)) {
      toast("Já no ranking", { description: `${est.name} já está no seu ranking.` });
      return;
    }
    setRankedItems(prev => [...prev, est]);
    setHasChanges(true);
  }, [rankedItems, maxRankSize]);

  const handleRemoveFromRanking = useCallback((id: number) => {
    setRankedItems(prev => prev.filter(item => item.id !== id));
    setHasChanges(true);
  }, []);

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <Navbar onMenuOpen={() => setMenuOpen(true)} />
        <div className="container py-20 text-center">
          <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="font-display text-3xl tracking-wider text-primary text-glow-amber mb-4">MEU RANKING</h2>
          <p className="text-muted-foreground mb-6">Faça login para criar seu ranking pessoal.</p>
          <a href={getLoginUrl()}>
            <Button variant="default" size="lg">Entrar</Button>
          </a>
        </div>
      </div>
    );
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-primary" />
          <div>
            <h2 className="font-display text-3xl tracking-wider text-primary text-glow-amber">MEU RANKING</h2>
            <p className="text-sm text-muted-foreground">
              Organize seus favoritos por categoria
            </p>
          </div>
        </div>

        {/* Category Selection */}
        {!selectedCategoryId ? (
          <div>
            <h3 className="font-display text-xl tracking-wider text-foreground mb-6">
              ESCOLHA UMA CATEGORIA
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.filter(c => c.active).map((cat) => {
                const Icon = iconMap[cat.icon || "Coffee"] || Coffee;
                const summary = rankingSummary?.find(s => s.categoryId === cat.id);
                return (
                  <motion.div
                    key={cat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="group relative p-5 rounded-xl bg-card border border-border/50 hover:border-primary/60 transition-all cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-display text-base tracking-wider text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </h4>
                    {summary && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-primary/80">
                        <Crown className="w-3 h-3" />
                        <span>Top {summary.rankingCount} definido</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            {/* Back button + Category header */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setSelectedCategoryId(null); setRankedItems([]); setHasChanges(false); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Voltar
              </button>
              <div className="flex items-center gap-2">
                {selectedCategory && (
                  <>
                    {(() => { const Icon = iconMap[selectedCategory.icon || "Coffee"] || Coffee; return <Icon className="w-5 h-5 text-primary" />; })()}
                    <h3 className="font-display text-xl tracking-wider text-foreground">
                      {selectedCategory.name}
                    </h3>
                  </>
                )}
              </div>
            </div>

            {loadingRated ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : !canRank ? (
              /* ========== DISCOVERY BANNER ========== */
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Compass className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg tracking-wider text-foreground mb-2">
                        EXPLORE MAIS LUGARES
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Você avaliou apenas <strong className="text-foreground">{ratedCount}</strong> {ratedCount === 1 ? "estabelecimento" : "estabelecimentos"} nesta categoria.
                        Para criar seu ranking pessoal, visite e avalie pelo menos <strong className="text-foreground">3 lugares</strong>.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Confira algumas sugestões próximas:
                      </p>
                    </div>
                  </div>
                </div>

                {/* Discovery suggestions */}
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
                          <h5 className="font-display text-sm tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {place.name}
                          </h5>
                          {place.neighborhood && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{place.neighborhood}</span>
                            </div>
                          )}
                          {place.rating && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                              <span>★ {place.rating.toFixed(1)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                            <span>Visitar</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma sugestão disponível no momento. Explore a categoria para encontrar novos lugares!
                  </p>
                )}
              </div>
            ) : (
              /* ========== RANKING EDITOR ========== */
              <div className="space-y-6">
                {/* Info banner */}
                <div className="p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {ratedCount >= 10 ? (
                        <>Você avaliou <strong className="text-foreground">{ratedCount}</strong> lugares. Organize seu <strong className="text-primary">Top 10</strong> arrastando os itens.</>
                      ) : (
                        <>Você avaliou <strong className="text-foreground">{ratedCount}</strong> lugares. Organize seu <strong className="text-primary">Top 3</strong> arrastando os itens.</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Ranking list - Drag and reorder */}
                <div className="space-y-2">
                  <Reorder.Group axis="y" values={rankedItems} onReorder={handleReorder} className="space-y-2">
                    {rankedItems.map((item, index) => (
                      <Reorder.Item key={item.id} value={item}>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing">
                          {/* Position badge */}
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

                          {/* Drag handle */}
                          <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />

                          {/* Establishment info */}
                          {item.image && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-display text-sm tracking-wider text-foreground truncate">
                              {item.name}
                            </h5>
                            {item.neighborhood && (
                              <p className="text-xs text-muted-foreground truncate">{item.neighborhood}</p>
                            )}
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveFromRanking(item.id); }}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>

                {/* Available establishments to add */}
                {rankedItems.length < maxRankSize && ratedEstablishments && (
                  <div>
                    <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
                      ADICIONAR AO RANKING ({rankedItems.length}/{maxRankSize})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ratedEstablishments
                        .filter(e => !rankedItems.find(r => r.id === e.id))
                        .map(est => (
                          <button
                            key={est.id}
                            onClick={() => handleAddToRanking({
                              id: est.id,
                              slug: est.slug,
                              name: est.name,
                              image: est.image,
                              neighborhood: est.neighborhood,
                            })}
                            className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 transition-all text-left"
                          >
                            {est.image && (
                              <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                                <img src={est.image} alt={est.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-foreground truncate block">{est.name}</span>
                              {est.avgScore && (
                                <span className="text-xs text-primary">★ {Number(est.avgScore).toFixed(1)}</span>
                              )}
                            </div>
                            <span className="text-xs text-primary">+ Adicionar</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Save button */}
                <div className="sticky bottom-4">
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges || saveMutation.isPending || rankedItems.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    SALVAR RANKING
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
