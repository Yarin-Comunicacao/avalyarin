// Design: Neon Urbano — Category page listing establishments
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Link, useParams, Redirect } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Clock, Star, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCategoryCover } from "@/lib/categoryCoverImages";
import NeighborhoodFilter from "@/components/NeighborhoodFilter";

export default function CategoryPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  
  const { data: category, isLoading: catLoading } = trpc.categories.getBySlug.useQuery({ slug: id || "" });
  const { data: establishmentsList, isLoading: estLoading } = trpc.establishments.byCategory.useQuery(
    { categorySlug: id || "", limit: 200 },
    { enabled: !!id }
  );

  const allEstablishments = establishmentsList || [];
  
  // Get available neighborhoods for this category
  const availableNeighborhoods = useMemo(() => {
    return Array.from(new Set(allEstablishments.filter(e => e.neighborhood).map(e => e.neighborhood!)));
  }, [allEstablishments]);
  
  // Filter by selected neighborhood
  const establishments = useMemo(() => {
    if (!selectedNeighborhood) return allEstablishments;
    return allEstablishments.filter(e => e.neighborhood === selectedNeighborhood);
  }, [allEstablishments, selectedNeighborhood]);

  if (catLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!category) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      {/* Category Hero */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getCategoryCover(category.slug)}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
        </div>
        <div className="relative container pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-medium text-primary uppercase tracking-widest">Categoria</span>
            <h2 className="font-display text-5xl sm:text-6xl tracking-wider text-primary text-glow-amber mt-2">
              {category.name.toUpperCase()}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md">{category.description}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-foreground/70 bg-secondary px-3 py-1 rounded-full border border-border/50">
                {establishments.length} {establishments.length === 1 ? "estabelecimento" : "estabelecimentos"}
              </span>
              {establishments.length > 0 && (
                <span className="text-xs text-foreground/70 bg-secondary px-3 py-1 rounded-full border border-border/50">
                  {Array.from(new Set(establishments.filter(e => e.neighborhood).map(e => e.neighborhood))).slice(0, 5).join(", ")}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4">
        <div className="container flex items-center gap-3 flex-wrap">
          <NeighborhoodFilter
            selectedNeighborhood={selectedNeighborhood}
            onSelect={setSelectedNeighborhood}
            availableNeighborhoods={availableNeighborhoods}
          />
          {selectedNeighborhood && (
            <span className="text-xs text-muted-foreground">
              {establishments.length} {establishments.length === 1 ? "resultado" : "resultados"} em {selectedNeighborhood}
            </span>
          )}
        </div>
      </section>

      {/* Establishments List */}
      <section className="py-8">
        <div className="container">
          {estLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {establishments.map((est, i) => (
                <motion.div
                  key={est.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 1), duration: 0.5 }}
                >
                  <Link href={`/estabelecimento/${est.slug}`}>
                    <div className="group rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all cursor-pointer hover:glow-amber">
                      {est.image ? (
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={est.image}
                            alt={est.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                          {est.rating && (
                            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border/50">
                              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                              <span className="font-numbers text-sm font-semibold text-primary">{est.rating}</span>
                              {est.reviewCount && (
                                <span className="text-xs text-muted-foreground">({est.reviewCount.toLocaleString("pt-BR")})</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          {est.rating && (
                            <div className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border/50">
                              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                              <span className="font-numbers text-sm font-semibold text-primary">{est.rating}</span>
                              {est.reviewCount && (
                                <span className="text-xs text-muted-foreground">({est.reviewCount.toLocaleString("pt-BR")})</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-display text-2xl tracking-wider text-foreground group-hover:text-primary transition-colors">
                          {est.name.toUpperCase()}
                        </h3>
                        {est.address && (
                          <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>{est.address}</span>
                          </div>
                        )}
                        {est.hours && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{est.hours}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mt-4 text-sm text-primary font-medium group-hover:gap-2.5 transition-all">
                          <span>{est.hasMenu ? "Ver cardápio e avaliar" : "Ver detalhes"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30 mt-8">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            Avalyarin — Rede Social de Avaliações de São Paulo
          </p>
        </div>
      </footer>
    </div>
  );
}
