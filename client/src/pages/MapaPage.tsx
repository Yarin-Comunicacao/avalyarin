import { useRef, useState, useCallback, useEffect } from "react";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, Star } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";

// Pinheiros / Vila Madalena center
const SP_CENTER = { lat: -23.5613, lng: -46.6917 };

// Category color map for markers
const CATEGORY_COLORS: Record<string, string> = {
  "bar-de-cervejas-artesanais": "#f59e0b",
  "bares-tradicionais": "#ef4444",
  "gastronomia": "#10b981",
  "cafes-e-doces": "#8b5cf6",
  "natural": "#22c55e",
  "veg-vegan": "#22c55e",
  "vegetariano": "#22c55e",
  "baladas": "#ec4899",
};

// Category display names for legend
const CATEGORY_LABELS: Record<string, string> = {
  "bares-tradicionais": "Bares Tradicionais",
  "gastronomia": "Gastronomia",
  "cafes-e-doces": "Cafés e Doces",
  "natural": "Natural",
  "veg-vegan": "Veg / Vegan",
  "vegetariano": "Vegetariano",
  "baladas": "Baladas",
  "bar-de-cervejas-artesanais": "Cervejas Artesanais",
};

// Map styles to hide Google's native POIs (restaurants, shops, etc.)
// This ensures only OUR markers are visible
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];

function getMarkerColor(categorySlug: string): string {
  return CATEGORY_COLORS[categorySlug] || "#f59e0b";
}

export default function MapaPage() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [selectedEst, setSelectedEst] = useState<{
    id: number;
    name: string;
    slug: string;
    address: string | null;
    addressNumber: string | null;
    neighborhood: string | null;
    rating: number | null;
    reviewCount: number | null;
    categoryName: string;
    categorySlug: string;
  } | null>(null);

  const { data: establishments, isLoading } = trpc.establishments.mapEstablishments.useQuery();

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // Add markers to map
  const addMarkers = useCallback((map: google.maps.Map, ests: NonNullable<typeof establishments>) => {
    // Clear existing markers
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    for (const est of ests) {
      if (!est.lat || !est.lng) continue;

      const color = getMarkerColor(est.categorySlug);

      // Create custom marker element
      const pinEl = document.createElement("div");
      pinEl.style.width = "28px";
      pinEl.style.height = "28px";
      pinEl.style.borderRadius = "50% 50% 50% 0";
      pinEl.style.background = color;
      pinEl.style.border = "2px solid #fff";
      pinEl.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      pinEl.style.transform = "rotate(-45deg)";
      pinEl.style.cursor = "pointer";

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: est.lat, lng: est.lng },
        title: est.name,
        content: pinEl,
      });

      marker.addListener("click", () => {
        setSelectedEst(est);
        map.panTo({ lat: est.lat!, lng: est.lng! });
      });

      markersRef.current.push(marker);
    }
  }, []);

  // Effect: add markers when BOTH map is ready AND data is loaded
  useEffect(() => {
    if (mapReady && mapRef.current && establishments && establishments.length > 0) {
      addMarkers(mapRef.current, establishments);
    }
  }, [mapReady, establishments, addMarkers]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative w-full" style={{ height: "calc(100vh - 64px - 64px)" }}>
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        <MapView
          className="w-full h-full"
          initialCenter={SP_CENTER}
          initialZoom={14}
          onMapReady={handleMapReady}
          styles={MAP_STYLES}
        />

        {/* Info card for selected establishment */}
        {selectedEst && (
          <div className="absolute bottom-4 left-4 right-4 z-30 max-w-md mx-auto">
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <button
                onClick={() => setSelectedEst(null)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-lg leading-none"
              >
                &times;
              </button>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: getMarkerColor(selectedEst.categorySlug) + "20" }}
                >
                  <MapPin className="w-5 h-5" style={{ color: getMarkerColor(selectedEst.categorySlug) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/estabelecimento/${selectedEst.slug}`}>
                    <h3 className="font-display text-base tracking-wider text-primary truncate hover:underline cursor-pointer">
                      {selectedEst.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {selectedEst.address}{selectedEst.addressNumber ? `, ${selectedEst.addressNumber}` : ""}
                    {selectedEst.neighborhood ? ` — ${selectedEst.neighborhood}` : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {selectedEst.categoryName}
                    </span>
                    {selectedEst.rating && (
                      <span className="flex items-center gap-1 text-xs text-foreground/80">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        {selectedEst.rating.toFixed(1)}
                        {selectedEst.reviewCount ? ` (${selectedEst.reviewCount})` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link href={`/estabelecimento/${selectedEst.slug}`}>
                <button className="w-full mt-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                  Ver estabelecimento
                </button>
              </Link>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 z-20 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg p-2.5 text-[10px]">
          <p className="font-medium text-foreground/80 mb-1.5">Categorias</p>
          {Object.entries(CATEGORY_COLORS).map(([slug, color]) => (
            <div key={slug} className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">
                {CATEGORY_LABELS[slug] || slug.replace(/-/g, " ")}
              </span>
            </div>
          ))}
        </div>

        {/* Establishments count */}
        {establishments && (
          <div className="absolute top-3 left-3 z-20 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 inline mr-1 text-primary" />
              {establishments.length} estabelecimentos
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
