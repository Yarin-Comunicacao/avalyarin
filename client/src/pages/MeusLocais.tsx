// Design: AvaLyarin — Meus Locais (Saved Places) page
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Link } from "wouter";
import { Bookmark, MapPin, Star, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface SavedPlace {
  id: string;
  name: string;
  image: string;
  neighborhood: string;
  category: string;
  rating: number;
}

const mockSaved: SavedPlace[] = [
  { id: "cervejaria-nacional", name: "Cervejaria Nacional", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&h=200&fit=crop", neighborhood: "Pinheiros", category: "Cervejaria", rating: 4.5 },
  { id: "frigobar-speakeasy", name: "Frigobar Speakeasy", image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=200&h=200&fit=crop", neighborhood: "Vila Madalena", category: "Coquetelaria", rating: 4.7 },
  { id: "the-blue-pub", name: "The Blue Pub", image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=200&h=200&fit=crop", neighborhood: "Consolação", category: "Pub", rating: 4.3 },
  { id: "le-jazz-brasserie", name: "Le Jazz Brasserie", image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=200&h=200&fit=crop", neighborhood: "Jardins", category: "Bar Musical", rating: 4.6 },
];

export default function MeusLocais() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [places, setPlaces] = useState(mockSaved);

  const removePlace = (id: string, name: string) => {
    setPlaces(prev => prev.filter(p => p.id !== id));
    toast(`${name} removido dos salvos`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref="/" onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-20 pb-16">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">MEUS LOCAIS</h2>
              <p className="text-sm text-muted-foreground">{places.length} locais salvos</p>
            </div>
          </div>

          {places.length === 0 ? (
            <div className="text-center py-16">
              <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum local salvo ainda</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Salve locais que deseja visitar para encontrá-los aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {places.map((place) => (
                <div key={place.id} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all group">
                  <Link href={`/estabelecimento/${place.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{place.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {place.neighborhood}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">{place.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                      <span className="font-numbers text-sm font-bold text-primary">{place.rating}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => removePlace(place.id, place.name)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
