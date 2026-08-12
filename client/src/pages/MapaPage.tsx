import { useRef, useState, useCallback, useEffect } from "react";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { Loader2, MapPin, Star } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";

// Pinheiros / Vila Madalena center
const SP_CENTER = { lat: -23.5613, lng: -46.6917 };

// Category color map for markers — distinct colors per category
const CATEGORY_COLORS: Record<string, string> = {
  "bar-lanchonete": "#f97316",       // orange
  "cozinha-brasileira": "#16a34a",   // green
  "autoral-contemporaneo": "#7c3aed", // violet
  "boteco-tradicional": "#dc2626",   // red
  "boteco-moderno": "#e11d48",       // rose
  "pub": "#b45309",                  // amber dark
  "coquetelaria": "#c026d3",         // fuchsia
  "cafeteria": "#92400e",            // brown
  "padaria": "#d97706",              // amber
  "bar-balada": "#ec4899",           // pink
  "confeitaria": "#f472b6",          // pink light
  "balada": "#a855f7",               // purple
  "bar-musical": "#6366f1",          // indigo
  "cervejaria": "#f59e0b",           // yellow
  "pizzaria": "#ef4444",             // red bright
  "saudavel": "#22c55e",             // green bright
  "hamburgueria": "#ea580c",         // orange dark
  "cozinha-internacional": "#0891b2", // cyan
  "casa-de-carnes": "#991b1b",       // red dark
  "casual-dining": "#0d9488",        // teal
  "gastrobar": "#4f46e5",            // indigo dark
  "lanches": "#fb923c",              // orange light
  "natural": "#15803d",              // green dark
  "restaurante": "#059669",          // emerald
  "vegan": "#16a34a",                // green
  "vegetariano": "#4ade80",          // green light
  "acai": "#7e22ce",                 // purple dark
};

// Category display names for legend
const CATEGORY_LABELS: Record<string, string> = {
  "bar-lanchonete": "Bar / Lanchonete",
  "cozinha-brasileira": "Cozinha Brasileira",
  "autoral-contemporaneo": "Autoral",
  "boteco-tradicional": "Boteco Tradicional",
  "boteco-moderno": "Boteco Moderno",
  "pub": "Pub",
  "coquetelaria": "Coquetelaria",
  "cafeteria": "Cafeteria",
  "padaria": "Padaria",
  "bar-balada": "Bar Balada",
  "confeitaria": "Confeitaria",
  "balada": "Balada",
  "bar-musical": "Bar Musical",
  "cervejaria": "Cervejaria",
  "pizzaria": "Pizzaria",
  "saudavel": "Saudável",
  "hamburgueria": "Hamburgueria",
  "cozinha-internacional": "Cozinha Internacional",
  "casa-de-carnes": "Casa de Carnes",
  "casual-dining": "Casual Dining",
  "gastrobar": "Gastrobar",
  "lanches": "Lanches",
  "natural": "Natural",
  "restaurante": "Restaurante",
  "vegan": "Vegan",
  "vegetariano": "Vegetariano",
  "acai": "Açaí",
};

// Map styles: hide ALL native POIs, keep transit (metro/bus) visible
// Only our custom markers (establishments) will appear
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  // Hide all POIs (restaurants, hotels, museums, hospitals, etc.)
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  // Keep park geometry for visual context (green areas)
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on" }],
  },
  // Hide park labels to keep map clean
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  // Keep transit stations visible (metro, bus stops)
  {
    featureType: "transit.station",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
  // Keep transit lines visible
  {
    featureType: "transit.line",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
];

function getMarkerColor(categorySlug: string): string {
  return CATEGORY_COLORS[categorySlug] || "#f59e0b";
}

export default function MapaPage() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
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
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    for (const est of ests) {
      if (!est.lat || !est.lng) continue;

      const color = getMarkerColor(est.categorySlug);

      // Create SVG pin icon with category color
      const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="#fff" opacity="0.9"/>
      </svg>`;

      const marker = new google.maps.Marker({
        map,
        position: { lat: est.lat, lng: est.lng },
        title: est.name,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgPin),
          scaledSize: new google.maps.Size(28, 36),
          anchor: new google.maps.Point(14, 36),
        },
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

        {/* Legend - only show categories present on the map */}
        {establishments && establishments.length > 0 && (
          <div className="absolute top-3 right-3 z-20 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg p-2.5 text-[10px] max-h-[50vh] overflow-y-auto">
            <p className="font-medium text-foreground/80 mb-1.5">Categorias</p>
            {(Array.from(new Set(establishments.map((e: any) => e.categorySlug))) as string[]).sort().map((slug) => (
              <div key={slug} className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[slug] || "#f59e0b" }} />
                <span className="text-muted-foreground">
                  {CATEGORY_LABELS[slug] || slug.replace(/-/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}

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
