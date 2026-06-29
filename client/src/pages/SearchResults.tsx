// Design: AvaLyarin — Full search results page
// Supports: ?q=query, ?bairro=neighborhood, ?tipo=post_type
// Uses smartSearch (LLM) for natural language queries, standard search for short queries
import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { Search, MapPin, UtensilsCrossed, Star, Loader2, Calendar, Tag, Megaphone, Sparkles, Handshake } from "lucide-react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { trpc } from "@/lib/trpc";

const typeLabels: Record<string, { label: string; icon: any; description: string }> = {
  event: { label: "Evento", icon: Calendar, description: "Estabelecimentos com eventos ativos" },
  promotion: { label: "Promoção", icon: Tag, description: "Estabelecimentos com promoções ativas" },
  brand: { label: "Divulgação", icon: Megaphone, description: "Destaques de divulgação" },
  menu_daily: { label: "Cardápio do Dia", icon: UtensilsCrossed, description: "Cardápios especiais do dia" },
  new_item: { label: "Novidade", icon: Sparkles, description: "Novidades nos cardápios" },
  collab: { label: "Parceria", icon: Handshake, description: "Parcerias e collabs" },
};

/**
 * Determine if a query needs AI interpretation (natural language)
 */
function needsAiInterpretation(query: string): boolean {
  const words = query.trim().split(/\s+/);
  if (words.length >= 3) return true;
  const nlIndicators = ["de", "do", "da", "com", "para", "perto", "um", "uma", "que", "no", "na", "ao"];
  if (words.some(w => nlIndicators.includes(w.toLowerCase()))) return true;
  return false;
}

export default function SearchResults() {
  const searchString = useSearch();
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const query = params.get("q") || "";
  const bairro = params.get("bairro") || "";
  const tipo = params.get("tipo") || "";
  const [menuOpen, setMenuOpen] = useState(false);

  // Determine if we should use AI search
  const useAi = useMemo(() => needsAiInterpretation(query), [query]);

  // Standard text search (for short queries)
  const { data: searchResults, isLoading: isSearchLoading } = trpc.establishments.search.useQuery(
    { query },
    { enabled: query.length >= 1 && !bairro && !tipo && !useAi }
  );

  // Smart search (LLM-powered, for natural language queries)
  const { data: smartResults, isLoading: isSmartLoading } = trpc.establishments.smartSearch.useQuery(
    { query },
    { enabled: query.length >= 1 && !bairro && !tipo && useAi }
  );

  // Search by neighborhood
  const { data: neighborhoodResults, isLoading: isNeighborhoodLoading } = trpc.establishments.byNeighborhood.useQuery(
    { neighborhood: bairro },
    { enabled: bairro.length >= 1 }
  );

  // Search by post type (active posts)
  const { data: typeResults, isLoading: isTypeLoading } = trpc.posts.byType.useQuery(
    { type: tipo },
    { enabled: tipo.length >= 1 }
  );

  const isLoading = isSearchLoading || isSmartLoading || isNeighborhoodLoading || isTypeLoading;

  // Determine what to show based on search type
  const establishments = useAi
    ? (smartResults?.establishments || [])
    : (searchResults?.establishments || []);
  const menuItemsByName = useAi ? [] : (searchResults?.menuItemsByName || []);
  const menuItemsByDescription = useAi ? [] : (searchResults?.menuItemsByDescription || []);
  const smartMenuItems = useAi ? (smartResults?.menuItems || []) : [];
  const items = useAi ? smartMenuItems : [...menuItemsByName, ...menuItemsByDescription];
  const totalResults = establishments.length + items.length;
  const isAiPowered = useAi && smartResults?.isAiPowered;
  const aiInterpretation = useAi && smartResults?.interpretation;

  // Page title based on filter
  const pageTitle = bairro
    ? bairro
    : tipo
      ? typeLabels[tipo]?.label || tipo
      : query ? `"${query}"` : "";

  const pageSubtitle = bairro
    ? "Estabelecimentos neste bairro"
    : tipo
      ? typeLabels[tipo]?.description || "Destaques"
      : "";

  // Empty state (no filter active)
  if (!query && !bairro && !tipo) {
    return (
      <div className="min-h-screen">
        <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <Navbar onMenuOpen={() => setMenuOpen(true)} />
        <div className="pt-28 container text-center">
          <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Digite algo para buscar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="pt-28 pb-24 container">
        {/* Header */}
        <div className="mb-8">
          {pageSubtitle && (
            <p className="text-sm text-muted-foreground mb-2">{pageSubtitle}</p>
          )}
          {!bairro && !tipo && (
            <p className="text-sm text-muted-foreground mb-2">
              {isLoading ? "Buscando..." : `${totalResults} ${totalResults === 1 ? "resultado" : "resultados"} para`}
            </p>
          )}
          <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-primary text-glow-amber break-words">
            {pageTitle}
          </h2>

          {/* AI Interpretation Banner */}
          {isAiPowered && aiInterpretation && !isLoading && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-violet-300/70 font-medium mb-0.5">Busca inteligente</p>
                <p className="text-sm text-violet-200/90 italic">
                  {aiInterpretation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            {useAi && (
              <p className="text-sm text-muted-foreground">
                IA interpretando sua busca...
              </p>
            )}
          </div>
        )}

        {/* ===== NEIGHBORHOOD RESULTS ===== */}
        {bairro && !isNeighborhoodLoading && (
          <>
            {neighborhoodResults && neighborhoodResults.length > 0 ? (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-xl tracking-wider text-foreground">
                    ESTABELECIMENTOS
                  </h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {neighborhoodResults.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {neighborhoodResults.map((est: any) => (
                    <Link key={est.id} href={`/estabelecimento/${est.slug}`}>
                      <div className="group rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all cursor-pointer">
                        {est.image ? (
                          <div className="relative h-32 overflow-hidden">
                            <img
                              src={est.image}
                              alt={est.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                            {est.rating && (
                              <div className="absolute bottom-2 left-3 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                                <span className="text-sm font-bold text-primary">{est.rating}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative h-20 bg-gradient-to-br from-primary/10 to-primary/5">
                            {est.rating && (
                              <div className="absolute bottom-2 left-3 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                                <span className="text-sm font-bold text-primary">{est.rating}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="font-display text-base tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {est.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {est.categoryName || ""} {est.neighborhood ? `• ${est.neighborhood}` : ""}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-16">
                <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">Nenhum estabelecimento encontrado</h3>
                <p className="text-muted-foreground">
                  Não encontramos estabelecimentos no bairro "{bairro}".
                </p>
              </div>
            )}
          </>
        )}

        {/* ===== POST TYPE RESULTS ===== */}
        {tipo && !isTypeLoading && (
          <>
            {typeResults && typeResults.length > 0 ? (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  {(() => {
                    const TypeIcon = typeLabels[tipo]?.icon || Tag;
                    return <TypeIcon className="w-5 h-5 text-primary" />;
                  })()}
                  <h3 className="font-display text-xl tracking-wider text-foreground">
                    DESTAQUES ATIVOS
                  </h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {typeResults.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeResults.map((post: any) => (
                    <Link key={post.id} href={`/estabelecimento/${post.slug || post.establishmentId}`}>
                      <div className="group rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all cursor-pointer">
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        </div>
                        <div className="p-3">
                          <h4 className="font-display text-base tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {post.establishmentName} {post.neighborhood ? `• ${post.neighborhood}` : ""}
                          </p>
                          {post.description && (
                            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                              {post.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              <div className="text-center py-16">
                <Tag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">Nenhum destaque encontrado</h3>
                <p className="text-muted-foreground">
                  Não há destaques do tipo "{typeLabels[tipo]?.label || tipo}" ativos no momento.
                </p>
              </div>
            )}
          </>
        )}

        {/* ===== STANDARD + SMART SEARCH RESULTS ===== */}
        {query && !bairro && !tipo && !isLoading && (
          <>
            {/* No results */}
            {totalResults === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">Nenhum resultado encontrado</h3>
                <p className="text-muted-foreground">
                  {useAi
                    ? "A IA não encontrou resultados para sua busca. Tente reformular."
                    : "Tente buscar por outro nome de bar, prato ou drink."}
                </p>
              </div>
            )}

            {/* Section 1: Establishments */}
            {establishments.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-xl tracking-wider text-foreground">
                    ESTABELECIMENTOS
                  </h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {establishments.length}
                  </span>
                  {isAiPowered && (
                    <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      IA
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {establishments.map((est: any) => (
                    <Link key={est.id} href={`/estabelecimento/${est.slug}`}>
                      <div className="group rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all cursor-pointer">
                        {est.image ? (
                          <div className="relative h-32 overflow-hidden">
                            <img
                              src={est.image}
                              alt={est.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                            {est.rating && (
                              <div className="absolute bottom-2 left-3 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                                <span className="text-sm font-bold text-primary">{est.rating}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative h-20 bg-gradient-to-br from-primary/10 to-primary/5">
                            {est.rating && (
                              <div className="absolute bottom-2 left-3 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                                <span className="text-sm font-bold text-primary">{est.rating}</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="font-display text-base tracking-wider text-foreground group-hover:text-primary transition-colors">
                            {est.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {est.categoryName || ""} {est.neighborhood ? `• ${est.neighborhood}` : ""}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: Menu Items */}
            {items.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <h3 className="font-display text-xl tracking-wider text-foreground">
                    ITENS DO CARDÁPIO
                  </h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                  {isAiPowered && (
                    <span className="text-[10px] text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      IA
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {items.map((item: any, i: number) => {
                    const isDescMatch = !useAi && i >= menuItemsByName.length;
                    return (
                      <Link key={`${item.establishmentSlug || item.id}-${item.name}-${i}`} href={`/estabelecimento/${item.establishmentSlug}`}>
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {item.name}
                              </p>
                              {isDescMatch && (
                                <span className="text-[10px] text-blue-400/70 bg-blue-400/10 px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5">
                                  DESC
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.establishmentName} {item.category ? `• ${item.category}` : (item.categoryName ? `• ${item.categoryName}` : "")}
                            </p>
                            {item.description && isDescMatch && (
                              <p className="text-xs text-muted-foreground/70 mt-0.5 italic line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.price && (
                            <span className="text-sm font-bold text-primary flex-shrink-0">
                              R$ {Number(item.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
