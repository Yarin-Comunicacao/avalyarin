// Design: AvaLyarin — Full search results page
// Priority order: establishments by name > items by name > items by description
import { useState, useEffect, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { Search, MapPin, UtensilsCrossed, Star, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { categories } from "@/lib/data";

interface EstablishmentResult {
  id: string;
  name: string;
  neighborhood: string;
  rating: number;
  image: string;
  categoryName: string;
  categoryId: string;
}

interface ItemResult {
  itemName: string;
  itemDescription?: string;
  itemPrice: number;
  establishmentId: string;
  establishmentName: string;
  categoryName: string;
  matchType: "name" | "description";
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function searchEstablishments(query: string): EstablishmentResult[] {
  const q = normalize(query);
  const results: EstablishmentResult[] = [];
  for (const cat of categories) {
    for (const est of cat.establishments) {
      if (normalize(est.name).includes(q)) {
        results.push({
          id: est.id,
          name: est.name,
          neighborhood: est.neighborhood,
          rating: est.rating,
          image: est.image,
          categoryName: cat.name,
          categoryId: cat.id,
        });
      }
    }
  }
  return results;
}

function searchItems(query: string): ItemResult[] {
  const q = normalize(query);
  const nameResults: ItemResult[] = [];
  const descResults: ItemResult[] = [];

  for (const cat of categories) {
    for (const est of cat.establishments) {
      for (const item of est.menu) {
        const nameMatch = normalize(item.name).includes(q);
        const descMatch = item.description ? normalize(item.description).includes(q) : false;

        if (nameMatch) {
          nameResults.push({
            itemName: item.name,
            itemDescription: item.description,
            itemPrice: item.price,
            establishmentId: est.id,
            establishmentName: est.name,
            categoryName: cat.name,
            matchType: "name",
          });
        } else if (descMatch) {
          descResults.push({
            itemName: item.name,
            itemDescription: item.description,
            itemPrice: item.price,
            establishmentId: est.id,
            establishmentName: est.name,
            categoryName: cat.name,
            matchType: "description",
          });
        }
      }
    }
  }

  return [...nameResults, ...descResults];
}

export default function SearchResults() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const query = params.get("q") || "";
  const [menuOpen, setMenuOpen] = useState(false);

  const establishments = useMemo(() => searchEstablishments(query), [query]);
  const items = useMemo(() => searchItems(query), [query]);
  const totalResults = establishments.length + items.length;

  if (!query) {
    return (
      <div className="min-h-screen bg-background">
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
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="pt-24 pb-12 container">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-1">
            {totalResults} {totalResults === 1 ? "resultado" : "resultados"} para
          </p>
          <h2 className="font-display text-3xl tracking-wider text-primary text-glow-amber">
            "{query}"
          </h2>
        </div>

        {/* No results */}
        {totalResults === 0 && (
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
                <Link key={est.id} href={`/estabelecimento/${est.id}`}>
                  <div className="group rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all cursor-pointer">
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={est.image}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div className="absolute bottom-2 left-3 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="text-sm font-bold text-primary">{est.rating}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-display text-base tracking-wider text-foreground group-hover:text-primary transition-colors truncate">
                        {est.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {est.categoryName} • {est.neighborhood}
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
              {items.map((item, i) => (
                <Link key={`${item.establishmentId}-${item.itemName}-${i}`} href={`/estabelecimento/${item.establishmentId}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {item.itemName}
                        </p>
                        {item.matchType === "description" && (
                          <span className="text-[10px] text-blue-400/70 bg-blue-400/10 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                            DESC
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.establishmentName} • {item.categoryName}
                      </p>
                      {item.itemDescription && item.matchType === "description" && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate italic">
                          {item.itemDescription}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-primary flex-shrink-0">
                      R$ {item.itemPrice.toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
