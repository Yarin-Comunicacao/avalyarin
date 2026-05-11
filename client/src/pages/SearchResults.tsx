// Design: AvaLyarin — Full search results page
// Priority order: establishments by name > items by name > items by description
import { useState } from "react";
import { Link, useSearch } from "wouter";
import { Search, MapPin, UtensilsCrossed, Star, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { trpc } from "@/lib/trpc";

export default function SearchResults() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const query = params.get("q") || "";
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: searchResults, isLoading } = trpc.establishments.search.useQuery(
    { query },
    { enabled: query.length >= 1 }
  );

  const establishments = searchResults?.establishments || [];
  const menuItemsByName = searchResults?.menuItemsByName || [];
  const menuItemsByDescription = searchResults?.menuItemsByDescription || [];
  const items = [...menuItemsByName, ...menuItemsByDescription];
  const totalResults = establishments.length + items.length;

  if (!query) {
    return (
      <div className="min-h-screen">
        <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <Navbar onMenuOpen={() => setMenuOpen(true)} />
        <div className="pt-24 container text-center">
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

      <div className="pt-24 pb-12 container">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            {isLoading ? "Buscando..." : `${totalResults} ${totalResults === 1 ? "resultado" : "resultados"} para`}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl tracking-wider text-primary text-glow-amber break-words">
            "{query}"
          </h2>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* No results */}
        {!isLoading && totalResults === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">
              Tente buscar por outro nome de bar, prato ou drink.
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {establishments.map((est) => (
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
                        {est.categoryName} {est.neighborhood ? `• ${est.neighborhood}` : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Menu Items (by name first, then by description) */}
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
            </div>
            <div className="space-y-2">
              {items.map((item, i) => {
                const isDescMatch = i >= menuItemsByName.length;
                return (
                  <Link key={`${item.establishmentSlug}-${item.name}-${i}`} href={`/estabelecimento/${item.establishmentSlug}`}>
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
                          {item.establishmentName} • {item.categoryName}
                        </p>
                        {item.description && isDescMatch && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5 italic line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-primary flex-shrink-0">
                        R$ {Number(item.price).toFixed(2)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
