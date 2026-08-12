import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Navigation, Star, Loader2, ArrowLeft, Filter } from "lucide-react";
import { useGeolocation, formatDistance } from "@/hooks/useGeolocation";
import { trpc } from "@/lib/trpc";
import { CategoryIcon, getCategoryColor } from "@/lib/categoryIcons";
import Navbar from "@/components/Navbar";

export default function NearbyPage() {
  const { latitude, longitude, loading, error, permissionDenied, requestLocation } = useGeolocation();
  const [radiusKm, setRadiusKm] = useState(3);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const { data: nearbyEstablishments = [], isLoading: isLoadingNearby, error: queryError } = trpc.establishments.nearby.useQuery(
    { lat: latitude || 0, lng: longitude || 0, radiusKm, limit: 50 },
    { enabled: !!latitude && !!longitude }
  );

  // Get unique categories from results for filter
  const uniqueCategories = Array.from(
    new Map(
      nearbyEstablishments.map((est) => [est.categorySlug, { slug: est.categorySlug, name: est.categoryName }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Filter by category if selected
  const filteredEstablishments = filterCategory
    ? nearbyEstablishments.filter((est) => est.categorySlug === filterCategory)
    : nearbyEstablishments;

  return (
    <div className="min-h-screen">
      <Navbar  />

      <div className="container pt-28 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center hover:border-primary/40 transition-colors">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
              PERTO DE VOCÊ
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todos os estabelecimentos próximos à sua localização
            </p>
          </div>
          <button
            onClick={requestLocation}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        {/* Radius selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Raio:</span>
          {[1, 3, 5, 10].map((r) => (
            <button
              key={r}
              onClick={() => setRadiusKm(r)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                radiusKm === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              {r}km
            </button>
          ))}
        </div>

        {/* Category filter chips */}
        {uniqueCategories.length > 0 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-colors ${
                !filterCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/50 text-muted-foreground hover:border-primary/40"
              }`}
            >
              Todos
            </button>
            {uniqueCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setFilterCategory(cat.slug)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-colors ${
                  filterCategory === cat.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border/50 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <CategoryIcon slug={cat.slug} size={12} className={filterCategory === cat.slug ? "text-primary-foreground" : ""} />
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {(loading || isLoadingNearby) && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Buscando estabelecimentos...</span>
          </div>
        )}

        {/* Generic error */}
        {(error || queryError) && !permissionDenied && (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border/50">
            <MapPin className="w-10 h-10 text-red-400/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Ocorreu um erro ao buscar estabelecimentos. Tente novamente.
            </p>
            <button
              onClick={requestLocation}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              <Navigation className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Permission denied */}
        {permissionDenied && (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border/50">
            <MapPin className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Permissão de localização negada. Ative nas configurações do navegador.
            </p>
          </div>
        )}

        {/* No location yet */}
        {!latitude && !loading && !error && !permissionDenied && (
          <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-card border border-border/50">
            <MapPin className="w-10 h-10 text-primary/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              Ative sua localização para ver os estabelecimentos próximos
            </p>
            <button
              onClick={requestLocation}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Ativar Localização
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !isLoadingNearby && latitude && (
          <>
            <p className="text-xs text-muted-foreground mb-4">
              {filteredEstablishments.length} {filteredEstablishments.length === 1 ? "estabelecimento" : "estabelecimentos"} encontrados
              {filterCategory && ` em ${uniqueCategories.find(c => c.slug === filterCategory)?.name}`}
            </p>

            <div className="space-y-3">
              {filteredEstablishments.map((est, i) => (
                <motion.div
                  key={est.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <Link href={`/estabelecimento/${est.slug}`}>
                    <div className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-all cursor-pointer">
                      {/* Image or placeholder */}
                      {est.image ? (
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={est.image}
                            alt={est.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <CategoryIcon slug={est.categorySlug || ""} size={24} />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-sm tracking-wider text-foreground group-hover:text-primary transition-colors truncate">
                          {est.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {est.categoryName}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="text-xs font-medium text-primary">
                              {formatDistance(est.distance)}
                            </span>
                          </div>
                          {est.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="text-xs text-muted-foreground">
                                {Number(est.rating).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category icon on the right */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center">
                        <CategoryIcon slug={est.categorySlug || ""} size={20} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredEstablishments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <MapPin className="w-8 h-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum estabelecimento encontrado neste raio.
                </p>
                <button
                  onClick={() => setRadiusKm(Math.min(radiusKm + 2, 10))}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Aumentar raio de busca
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
