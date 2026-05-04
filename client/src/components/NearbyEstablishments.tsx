import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Navigation, Star, Loader2 } from "lucide-react";
import { categories, Establishment } from "@/lib/data";
import { useGeolocation, calculateDistance, formatDistance } from "@/hooks/useGeolocation";

interface EstablishmentWithDistance extends Establishment {
  distance: number;
  categoryName: string;
}

export function NearbyEstablishments() {
  const { latitude, longitude, loading, error, permissionDenied, requestLocation } = useGeolocation();
  const [showAll, setShowAll] = useState(false);

  // Get all establishments with their distances
  const nearbyEstablishments = useMemo(() => {
    if (!latitude || !longitude) return [];

    const allEstablishments: EstablishmentWithDistance[] = [];

    for (const category of categories) {
      if (!category.active) continue;
      for (const est of category.establishments) {
        const distance = calculateDistance(latitude, longitude, est.lat, est.lng);
        allEstablishments.push({
          ...est,
          distance,
          categoryName: category.name,
        });
      }
    }

    // Sort by distance
    allEstablishments.sort((a, b) => a.distance - b.distance);

    return allEstablishments;
  }, [latitude, longitude]);

  const displayedEstablishments = showAll
    ? nearbyEstablishments.slice(0, 20)
    : nearbyEstablishments.slice(0, 6);

  // Not yet requested location
  if (!latitude && !loading && !error) {
    return (
      <section className="py-12 border-t border-border/30">
        <div className="container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
                PERTO DE VOCÊ
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Descubra estabelecimentos próximos à sua localização
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-card border border-border/50">
            <MapPin className="w-10 h-10 text-primary/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
              Ative sua localização para ver os bares e restaurantes mais próximos de você
            </p>
            <button
              onClick={requestLocation}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Ativar Localização
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Loading
  if (loading) {
    return (
      <section className="py-12 border-t border-border/30">
        <div className="container">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Obtendo sua localização...</span>
          </div>
        </div>
      </section>
    );
  }

  // Permission denied
  if (permissionDenied) {
    return (
      <section className="py-12 border-t border-border/30">
        <div className="container">
          <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-card border border-border/50">
            <MapPin className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Permissão de localização negada. Ative nas configurações do navegador para ver estabelecimentos próximos.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Error
  if (error) {
    return (
      <section className="py-12 border-t border-border/30">
        <div className="container">
          <div className="flex flex-col items-center justify-center py-10 rounded-xl bg-card border border-border/50">
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={requestLocation}
              className="mt-3 text-sm text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Show nearby establishments
  return (
    <section className="py-12 border-t border-border/30">
      <div className="container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
              PERTO DE VOCÊ
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {nearbyEstablishments.length} estabelecimentos encontrados
            </p>
          </div>
          <button
            onClick={requestLocation}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedEstablishments.map((est, i) => (
            <motion.div
              key={est.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link href={`/estabelecimento/${est.id}`}>
                <div className="group flex gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={est.image}
                      alt={est.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
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
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs text-muted-foreground">
                          {est.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {nearbyEstablishments.length > 6 && !showAll && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowAll(true)}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Ver mais ({nearbyEstablishments.length - 6} restantes)
            </button>
          </div>
        )}
        {showAll && nearbyEstablishments.length > 20 && (
          <div className="flex justify-center mt-6">
            <p className="text-xs text-muted-foreground">
              Mostrando os 20 mais próximos de {nearbyEstablishments.length} total
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
