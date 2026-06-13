// Design: AvaLyarin — Locais Visitados page
// Mini map with pins of visited locations + list below
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Link } from "wouter";
import { MapPin, Star, Navigation } from "lucide-react";
import { MapView } from "@/components/Map";

interface VisitedPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  neighborhood: string;
  score: number;
  visits: number;
}

const mockVisited: VisitedPlace[] = [
  { id: "cervejaria-nacional", name: "Cervejaria Nacional", lat: -23.5605, lng: -46.6867, neighborhood: "Pinheiros", score: 8.5, visits: 3 },
  { id: "the-blue-pub", name: "The Blue Pub", lat: -23.5534, lng: -46.6580, neighborhood: "Consolação", score: 7.8, visits: 2 },
  { id: "frigobar-speakeasy", name: "Frigobar Speakeasy", lat: -23.5544, lng: -46.6912, neighborhood: "Vila Madalena", score: 9.2, visits: 1 },
  { id: "le-jazz-brasserie", name: "Le Jazz Brasserie", lat: -23.5631, lng: -46.6659, neighborhood: "Jardins", score: 8.0, visits: 1 },
  { id: "melts-gastrobar", name: "Melts Gastrobar", lat: -23.5889, lng: -46.6388, neighborhood: "Vila Mariana", score: 7.5, visits: 2 },
];

export default function LocaisVisitados() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMapReady = (map: google.maps.Map) => {
    // Add markers for each visited place
    mockVisited.forEach((place) => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map,
        title: place.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#D4A843",
          fillOpacity: 1,
          strokeColor: "#B8922E",
          strokeWeight: 2,
          scale: 8,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding:4px;font-family:sans-serif"><strong>${place.name}</strong><br/><span style="color:#666;font-size:12px">${place.neighborhood} · ⭐ ${place.score}</span></div>`,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });
  };

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref="/" onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-28 pb-24">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">LOCAIS VISITADOS</h2>
              <p className="text-sm text-muted-foreground">{mockVisited.length} locais no mapa</p>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-border/50 mb-6">
            <MapView
              className="w-full h-[300px] sm:h-[400px]"
              initialCenter={{ lat: -23.5605, lng: -46.6700 }}
              initialZoom={13}
              onMapReady={handleMapReady}
            />
          </div>

          {/* Location permission notice */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-6">
            <Navigation className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-foreground/80">
              Permita o acesso à sua localização para ver os locais mais próximos de você no mapa.
            </p>
          </div>

          {/* List */}
          <div className="space-y-2">
            {mockVisited.map((place) => (
              <Link key={place.id} href={`/estabelecimento/${place.id}`}>
                <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{place.name}</p>
                    <p className="text-xs text-muted-foreground">{place.neighborhood}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      <span className="font-numbers text-sm font-bold text-primary">{place.score}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{place.visits}x</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
