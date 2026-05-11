// Design: AvaLyarin — Minhas Avaliações page
// Shows mini gallery of last 3 visits, then full list ordered by visit date (newest first)
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Link } from "wouter";
import { Star, MapPin, Calendar, ChevronRight } from "lucide-react";

interface ReviewEntry {
  id: string;
  name: string;
  image: string;
  date: string;
  score: number;
  category: string;
  neighborhood: string;
}

// Mock review data
const mockReviews: ReviewEntry[] = [
  { id: "cervejaria-nacional", name: "Cervejaria Nacional", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop", date: "28/04/2026", score: 8.5, category: "Cervejaria", neighborhood: "Pinheiros" },
  { id: "the-blue-pub", name: "The Blue Pub", image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=300&fit=crop", date: "25/04/2026", score: 7.8, category: "Pub", neighborhood: "Consolação" },
  { id: "frigobar-speakeasy", name: "Frigobar Speakeasy", image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop", date: "20/04/2026", score: 9.2, category: "Coquetelaria", neighborhood: "Vila Madalena" },
  { id: "le-jazz-brasserie", name: "Le Jazz Brasserie", image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=300&fit=crop", date: "15/04/2026", score: 8.0, category: "Bar Musical", neighborhood: "Jardins" },
  { id: "melts-gastrobar", name: "Melts Gastrobar", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", date: "10/04/2026", score: 7.5, category: "Boteco Moderno", neighborhood: "Vila Mariana" },
];

export default function Avaliacoes() {
  const [menuOpen, setMenuOpen] = useState(false);

  const lastThree = mockReviews.slice(0, 3);

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref="/" onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-20 pb-16">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">MINHAS AVALIAÇÕES</h2>
              <p className="text-sm text-muted-foreground">{mockReviews.length} locais avaliados</p>
            </div>
          </div>

          {/* Mini Gallery - Last 3 */}
          <div className="mb-8">
            <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-3">Últimas visitas</p>
            <div className="grid grid-cols-3 gap-3">
              {lastThree.map((review) => (
                <Link key={review.id} href={`/estabelecimento/${review.id}`}>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/30 hover:border-primary/40 transition-colors group cursor-pointer">
                    <img src={review.image} alt={review.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">{review.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-[10px] text-white/80 font-numbers">{review.score.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Full List */}
          <div>
            <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mb-3">Todas as avaliações</p>
            <div className="space-y-2">
              {mockReviews.map((review) => (
                <Link key={review.id} href={`/estabelecimento/${review.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <img src={review.image} alt={review.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{review.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {review.neighborhood}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {review.date}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60">{review.category}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-numbers text-sm font-bold text-primary">{review.score.toFixed(1)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
