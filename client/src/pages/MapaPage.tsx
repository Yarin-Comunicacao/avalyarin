import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { trpc } from "@/lib/trpc";
import { CategoryIcon } from "@/lib/categoryIcons";
import {
  LocateFixed,
  Loader2,
  MapPin,
  Navigation,
  Search,
  Star,
  X,
  Utensils,
} from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { MapView } from "@/components/Map";

// Pinheiros / Vila Madalena center
const SP_CENTER = { lat: -23.5613, lng: -46.6917 };

const CATEGORY_COLORS: Record<string, string> = {
  "bar-lanchonete": "#f97316",
  "cozinha-brasileira": "#16a34a",
  "autoral-contemporaneo": "#7c3aed",
  "boteco-tradicional": "#dc2626",
  "boteco-moderno": "#e11d48",
  pub: "#b45309",
  coquetelaria: "#c026d3",
  cafeteria: "#92400e",
  padaria: "#d97706",
  "bar-balada": "#ec4899",
  confeitaria: "#f472b6",
  balada: "#a855f7",
  "bar-musical": "#6366f1",
  cervejaria: "#f59e0b",
  pizzaria: "#ef4444",
  saudavel: "#22c55e",
  hamburgueria: "#ea580c",
  "cozinha-internacional": "#0891b2",
  "casa-de-carnes": "#991b1b",
  "casual-dining": "#0d9488",
  gastrobar: "#4f46e5",
  lanches: "#fb923c",
  natural: "#15803d",
  restaurante: "#059669",
  vegan: "#16a34a",
  "veg-vegan": "#16a34a",
  vegetariano: "#4ade80",
  acai: "#7e22ce",
};

const CATEGORY_LABELS: Record<string, string> = {
  "bar-lanchonete": "Bar / Lanchonete",
  "cozinha-brasileira": "Cozinha Brasileira",
  "autoral-contemporaneo": "Autoral",
  "boteco-tradicional": "Boteco Tradicional",
  "boteco-moderno": "Boteco Moderno",
  pub: "Pub",
  coquetelaria: "Coquetelaria",
  cafeteria: "Cafeteria",
  padaria: "Padaria",
  "bar-balada": "Bar Balada",
  confeitaria: "Confeitaria",
  balada: "Balada",
  "bar-musical": "Bar Musical",
  cervejaria: "Cervejaria",
  pizzaria: "Pizzaria",
  saudavel: "Saudável",
  hamburgueria: "Hamburgueria",
  "cozinha-internacional": "Cozinha Internacional",
  "casa-de-carnes": "Casa de Carnes",
  "casual-dining": "Casual Dining",
  gastrobar: "Gastrobar",
  lanches: "Lanches",
  natural: "Natural",
  restaurante: "Restaurante",
  vegan: "Vegan",
  "veg-vegan": "Vegan",
  vegetariano: "Vegetariano",
  acai: "Açaí",
};

/**
 * O mapa externo consulta somente categorias gastronômicas do Google Places.
 * O limite de 20 por tipo é imposto pela API; o botão "Pesquisar nesta área"
 * permite que o usuário atualize a busca após mover o mapa.
 */
const GOOGLE_PLACE_TYPES = ["bar", "restaurant", "cafe", "bakery", "night_club"] as const;

type GooglePlaceType = (typeof GOOGLE_PLACE_TYPES)[number];

type MapDbPlace = {
  id: number;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  rating: number | null;
  reviewCount: number | null;
  image: string | null;
  hasMenu: boolean;
  categoryName: string;
  categorySlug: string;
};

type ExternalPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rating: number | null;
  reviewCount: number | null;
  image: string | null;
  categoryName: string;
  categorySlug: string;
  googleMapsUrl: string | null;
};

type SelectedPlace =
  | { kind: "avalyarin"; place: MapDbPlace }
  | { kind: "google"; place: ExternalPlace };

// Map styles: hide native POIs but keep transit visible.
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
    featureType: "transit.station",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
  {
    featureType: "transit.line",
    elementType: "all",
    stylers: [{ visibility: "on" }],
  },
];

function getMarkerColor(categorySlug: string): string {
  return CATEGORY_COLORS[categorySlug] || "#f59e0b";
}

function getCategoryLabel(categorySlug: string): string {
  return CATEGORY_LABELS[categorySlug] || categorySlug.replace(/-/g, " ");
}

function getPinGlyph(categorySlug: string): string {
  if (["cafeteria", "padaria", "confeitaria", "acai"].includes(categorySlug)) return "☕";
  if (["coquetelaria", "pub", "gastrobar", "cervejaria"].includes(categorySlug)) return "🍸";
  if (["balada", "bar-musical"].includes(categorySlug)) return "♪";
  if (["cozinha-brasileira", "casa-de-carnes", "hamburgueria", "pizzaria"].includes(categorySlug)) return "🍽";
  if (["saudavel", "natural", "vegan", "veg-vegan", "vegetariano"].includes(categorySlug)) return "♣";
  return "•";
}

function escapeSvgText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function createPinIcon(categorySlug: string, external: boolean): google.maps.Icon {
  const color = getMarkerColor(categorySlug);
  const glyph = escapeSvgText(getPinGlyph(categorySlug));
  const stroke = external ? "#ffffff" : "#241d17";
  const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
    <path d="M17 1C8.16 1 1 8.16 1 17c0 11.2 16 25 16 25s16-13.8 16-25C33 8.16 25.84 1 17 1z" fill="${color}" stroke="${stroke}" stroke-width="2"/>
    <circle cx="17" cy="17" r="10" fill="#fff" opacity=".93"/>
    <text x="17" y="21" text-anchor="middle" font-size="12" font-family="Arial, sans-serif">${glyph}</text>
  </svg>`;

  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svgPin),
    scaledSize: new google.maps.Size(34, 44),
    anchor: new google.maps.Point(17, 44),
  };
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const earthRadius = 6371000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const deltaLat = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLng = ((b.lng - a.lng) * Math.PI) / 180;
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function getDirectionsUrl(place: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.lat},${place.lng}`)}`;
}

function getUberUrl(place: { name: string; lat: number; lng: number }): string {
  const params = new URLSearchParams({
    action: "setPickup",
    "dropoff[latitude]": String(place.lat),
    "dropoff[longitude]": String(place.lng),
    "dropoff[nickname]": place.name,
  });
  return `https://m.uber.com/ul/?${params.toString()}`;
}

function getGoogleCategory(type: GooglePlaceType, place: google.maps.places.Place): { slug: string; name: string } {
  const placeTypes = place.types || [];
  if (placeTypes.some((value) => value.includes("pizza"))) return { slug: "pizzaria", name: "Pizzaria" };
  if (placeTypes.some((value) => value.includes("hamburger"))) return { slug: "hamburgueria", name: "Hamburgueria" };
  if (placeTypes.some((value) => value.includes("brazilian"))) return { slug: "cozinha-brasileira", name: "Cozinha Brasileira" };
  if (placeTypes.some((value) => value.includes("japanese") || value.includes("chinese") || value.includes("korean"))) {
    return { slug: "cozinha-internacional", name: "Cozinha Internacional" };
  }
  if (type === "bar") return { slug: "bar-lanchonete", name: "Bar / Lanchonete" };
  if (type === "night_club") return { slug: "balada", name: "Balada" };
  if (type === "cafe") return { slug: "cafeteria", name: "Cafeteria" };
  if (type === "bakery") return { slug: "padaria", name: "Padaria" };
  return { slug: "restaurante", name: "Restaurante" };
}

export default function MapaPage() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const initialIdleHandledRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [externalPlaces, setExternalPlaces] = useState<ExternalPlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { data: establishments, isLoading } = trpc.establishments.mapEstablishments.useQuery();
  const dbPlaces = (establishments || []) as MapDbPlace[];

  const activeCategorySlugs = useMemo(() => {
    const slugs = new Set<string>();
    dbPlaces.forEach((place) => slugs.add(place.categorySlug));
    externalPlaces.forEach((place) => slugs.add(place.categorySlug));
    return Array.from(slugs).sort();
  }, [dbPlaces, externalPlaces]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  const searchGooglePlaces = useCallback(async (map: google.maps.Map) => {
    const center = map.getCenter();
    if (!center || !google.maps.places?.Place) return;

    setIsSearchingPlaces(true);
    setLocationError(null);

    try {
      const centerLiteral = { lat: center.lat(), lng: center.lng() };
      const searchResults = await Promise.all(
        GOOGLE_PLACE_TYPES.map(async (type) => {
          try {
            const response = await google.maps.places.Place.searchNearby({
              fields: [
                "id",
                "displayName",
                "location",
                "formattedAddress",
                "rating",
                "userRatingCount",
                "photos",
                "googleMapsURI",
                "primaryType",
                "types",
              ],
              includedPrimaryTypes: [type],
              locationRestriction: {
                center: centerLiteral,
                radius: 5000,
              },
              maxResultCount: 20,
              rankPreference: google.maps.places.SearchNearbyRankPreference.POPULARITY,
              language: "pt-BR",
              region: "BR",
            });
            return response.places.map((place) => ({ place, type }));
          } catch (error) {
            console.warn(`[Mapa] Falha ao consultar Google Places (${type})`, error);
            return [];
          }
        })
      );

      const bounds = map.getBounds();
      const seen = new Set<string>();
      const nextPlaces: ExternalPlace[] = [];

      for (const { place, type } of searchResults.flat()) {
        if (!place.id || !place.location || !place.displayName) continue;
        const position = { lat: place.location.lat(), lng: place.location.lng() };
        if (bounds && !bounds.contains(position)) continue;
        if (seen.has(place.id)) continue;
        seen.add(place.id);

        const duplicateInDb = dbPlaces.some((dbPlace) => {
          if (dbPlace.lat == null || dbPlace.lng == null) return false;
          const sameName = normalizeName(dbPlace.name) === normalizeName(place.displayName || "");
          return sameName || distanceMeters(position, { lat: dbPlace.lat, lng: dbPlace.lng }) < 70;
        });
        if (duplicateInDb) continue;

        const category = getGoogleCategory(type, place);
        nextPlaces.push({
          id: place.id,
          name: place.displayName,
          lat: position.lat,
          lng: position.lng,
          address: place.formattedAddress || "Endereço não informado pelo Google",
          rating: place.rating ?? null,
          reviewCount: place.userRatingCount ?? null,
          image: place.photos?.[0]?.getURI({ maxWidth: 360, maxHeight: 220 }) || null,
          categoryName: category.name,
          categorySlug: category.slug,
          googleMapsUrl: place.googleMapsURI || null,
        });
      }

      setExternalPlaces(nextPlaces);
      setShowSearchArea(false);
    } finally {
      setIsSearchingPlaces(false);
    }
  }, [dbPlaces]);

  const handleMapIdle = useCallback((map: google.maps.Map) => {
    if (!initialIdleHandledRef.current) {
      initialIdleHandledRef.current = true;
      void searchGooglePlaces(map);
      return;
    }
    setShowSearchArea(true);
  }, [searchGooglePlaces]);

  const createClusterIcon = useCallback((count: number, position: google.maps.LatLng) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="21" fill="#5b46b6" fill-opacity=".95" stroke="#ffffff" stroke-width="3"/>
    </svg>`;
    return new google.maps.Marker({
      position,
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(48, 48),
        anchor: new google.maps.Point(24, 24),
      },
      label: {
        text: String(count),
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "700",
      },
      zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
    });
  }, []);

  const renderMarkers = useCallback((map: google.maps.Map, places: MapDbPlace[], googlePlaces: ExternalPlace[]) => {
    clustererRef.current?.clearMarkers();
    clustererRef.current?.setMap(null);

    const markers: google.maps.Marker[] = [];

    places.forEach((place) => {
      if (place.lat == null || place.lng == null) return;
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
        icon: createPinIcon(place.categorySlug, false),
        zIndex: 20,
      });
      marker.addListener("click", () => {
        setSelectedPlace({ kind: "avalyarin", place });
        map.panTo({ lat: place.lat!, lng: place.lng! });
      });
      markers.push(marker);
    });

    googlePlaces.forEach((place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
        icon: createPinIcon(place.categorySlug, true),
        zIndex: 10,
      });
      marker.addListener("click", () => {
        setSelectedPlace({ kind: "google", place });
        map.panTo({ lat: place.lat, lng: place.lng });
      });
      markers.push(marker);
    });

    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      renderer: {
        render: ({ count, position }) => createClusterIcon(count, position),
      },
    });
  }, [createClusterIcon]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    renderMarkers(mapRef.current, dbPlaces, externalPlaces);
    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current?.setMap(null);
    };
  }, [mapReady, dbPlaces, externalPlaces, renderMarkers]);

  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) {
      setLocationError("A geolocalização não está disponível neste navegador.");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        mapRef.current?.panTo(userPosition);
        mapRef.current?.setZoom(15);
        setLocationLoading(false);
      },
      () => {
        setLocationError("Não foi possível obter sua localização. Verifique a permissão do navegador.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  const selectedDbPlace = selectedPlace?.kind === "avalyarin" ? selectedPlace.place : null;
  const selectedGooglePlace = selectedPlace?.kind === "google" ? selectedPlace.place : null;
  const selectedCoordinates = selectedPlace && selectedPlace.place.lat != null && selectedPlace.place.lng != null
    ? {
        name: selectedPlace.place.name,
        lat: selectedPlace.place.lat,
        lng: selectedPlace.place.lng,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative w-full" style={{ height: "calc(100vh - 64px - 64px)" }}>
        {(isLoading || isSearchingPlaces) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/45 pointer-events-none">
            <div className="rounded-full bg-card/95 border border-border/40 px-4 py-2 flex items-center gap-2 shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">
                {isLoading ? "Carregando locais do Avalyarin" : "Buscando locais nesta região"}
              </span>
            </div>
          </div>
        )}

        <MapView
          className="w-full h-full"
          initialCenter={SP_CENTER}
          initialZoom={14}
          onMapReady={handleMapReady}
          onMapIdle={handleMapIdle}
          styles={MAP_STYLES}
        />

        {/* Pesquisar após arrastar ou aproximar/afastar o mapa */}
        {showSearchArea && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
            <button
              type="button"
              onClick={() => mapRef.current && void searchGooglePlaces(mapRef.current)}
              className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-lg hover:brightness-105 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              Pesquisar nesta área
            </button>
          </div>
        )}

        {/* Controles de localização e contagem */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          <div className="bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 inline mr-1 text-primary" />
              {dbPlaces.length + externalPlaces.length} locais no mapa
            </span>
          </div>
          <button
            type="button"
            onClick={handleLocateUser}
            className="w-10 h-10 rounded-full bg-card/95 border border-border/40 shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            aria-label="Minha localização"
            title="Minha localização"
          >
            {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
          </button>
          {locationError && (
            <div className="max-w-[220px] rounded-lg bg-card/95 border border-destructive/40 px-2 py-1.5 text-[10px] text-destructive shadow-lg">
              {locationError}
            </div>
          )}
        </div>

        {/* Legenda dinâmica com os ícones oficiais */}
        {activeCategorySlugs.length > 0 && (
          <div className="absolute top-3 right-3 z-20 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg p-2.5 text-[10px] max-h-[50vh] overflow-y-auto shadow-sm">
            <p className="font-medium text-foreground/80 mb-1.5">Categorias</p>
            {activeCategorySlugs.map((slug) => (
              <div key={slug} className="flex items-center gap-1.5 mb-1">
                <CategoryIcon slug={slug} size={13} />
                <span className="text-muted-foreground">{getCategoryLabel(slug)}</span>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-border/30 text-[9px] text-muted-foreground">
              Pins coloridos = locais cadastrados e Google Places
            </div>
          </div>
        )}

        {/* Card flutuante do local selecionado */}
        {selectedPlace && selectedCoordinates && (
          <div className="absolute bottom-4 left-4 right-4 z-30 max-w-md mx-auto">
            <div className="relative overflow-hidden bg-card border border-border/50 rounded-xl shadow-2xl backdrop-blur-sm">
              {selectedPlace.place.image && (
                <img
                  src={selectedPlace.place.image}
                  alt=""
                  className="w-full h-28 object-cover"
                  loading="lazy"
                />
              )}
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75"
                aria-label="Fechar card"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${getMarkerColor(selectedPlace.place.categorySlug)}20` }}
                  >
                    <CategoryIcon slug={selectedPlace.place.categorySlug} size={21} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {selectedDbPlace ? (
                      <Link href={`/estabelecimento/${selectedDbPlace.slug}`}>
                        <h3 className="font-display text-base tracking-wider text-primary truncate hover:underline cursor-pointer">
                          {selectedDbPlace.name}
                        </h3>
                      </Link>
                    ) : (
                      <h3 className="font-display text-base tracking-wider text-primary truncate">
                        {selectedGooglePlace?.name}
                      </h3>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {selectedPlace.place.address}
                      {selectedDbPlace?.addressNumber ? `, ${selectedDbPlace.addressNumber}` : ""}
                      {selectedDbPlace?.neighborhood ? ` — ${selectedDbPlace.neighborhood}` : ""}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {selectedPlace.place.categoryName}
                      </span>
                      {selectedPlace.place.rating != null && (
                        <span className="flex items-center gap-1 text-xs text-foreground/80">
                          <Star className="w-3 h-3 text-primary fill-primary" />
                          {selectedPlace.place.rating.toFixed(1)}
                          {selectedPlace.place.reviewCount ? ` (${selectedPlace.place.reviewCount})` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  {selectedDbPlace ? (
                    <Link href={`/estabelecimento/${selectedDbPlace.slug}`}>
                      <button type="button" className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-105 transition-colors">
                        Veja o cardápio
                      </button>
                    </Link>
                  ) : (
                    <a
                      href={selectedGooglePlace?.googleMapsUrl || getDirectionsUrl(selectedGooglePlace!)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold text-center hover:brightness-105 transition-colors"
                    >
                      Ver no Google Maps
                    </a>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={getDirectionsUrl(selectedCoordinates)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border/50 text-foreground/80 text-xs flex items-center justify-center gap-1 hover:border-primary hover:text-primary transition-colors"
                      title="Abrir rota no Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Rota
                    </a>
                    <a
                      href={getUberUrl(selectedCoordinates)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border/50 text-foreground/80 text-xs flex items-center justify-center gap-1 hover:border-primary hover:text-primary transition-colors"
                      title="Abrir rota no Uber"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      Uber
                    </a>
                  </div>
                </div>
                {selectedGooglePlace && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Local encontrado pelo Google Places. O botão de cardápio aparece quando o local possui página no Avalyarin.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
