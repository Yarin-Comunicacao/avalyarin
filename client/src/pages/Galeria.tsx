// Design: AvaLyarin — Galeria page
// Photos taken by the user of dishes and drinks
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Image, Camera, X } from "lucide-react";

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  place: string;
  date: string;
}

const mockPhotos: GalleryPhoto[] = [
  { id: "1", url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop", caption: "Risoto de Camarão", place: "Cervejaria Nacional", date: "28/04/2026" },
  { id: "2", url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop", caption: "Old Fashioned", place: "Frigobar Speakeasy", date: "20/04/2026" },
  { id: "3", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop", caption: "Smash Burger", place: "Melts Gastrobar", date: "10/04/2026" },
  { id: "4", url: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=400&fit=crop", caption: "Gin Tônica Especial", place: "The Blue Pub", date: "25/04/2026" },
  { id: "5", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop", caption: "Tábua de Frios", place: "Le Jazz Brasserie", date: "15/04/2026" },
  { id: "6", url: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=400&h=400&fit=crop", caption: "IPA Artesanal", place: "Cervejaria Nacional", date: "28/04/2026" },
];

export default function Galeria() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref="/" onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-20 pb-16">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Image className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">GALERIA</h2>
              <p className="text-sm text-muted-foreground">{mockPhotos.length} fotos de pratos e drinks</p>
            </div>
          </div>

          {/* Permission notice */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-6">
            <Camera className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-foreground/80">
              Permita o acesso à galeria do smartphone para importar suas fotos de pratos e drinks automaticamente.
            </p>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-2">
            {mockPhotos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-xl overflow-hidden border border-border/30 hover:border-primary/40 transition-colors group"
              >
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[10px] font-medium truncate">{photo.caption}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Lightbox */}
          {selectedPhoto && (
            <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
              <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="w-full rounded-xl" />
                <div className="mt-3 text-center">
                  <p className="text-white font-medium">{selectedPhoto.caption}</p>
                  <p className="text-white/60 text-sm">{selectedPhoto.place} · {selectedPhoto.date}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
