// Design: AvaLyarin — Meus Locais (Saved Places) page — uses real data from backend
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Link } from "wouter";
import { Bookmark, MapPin, Star, Trash2, Loader2, Megaphone } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/lib/trpc";
import { getCategoryCover } from "@/lib/categoryCoverImages";

export default function MeusLocais() {
  const [menuOpen, setMenuOpen] = useState(false);
  const utils = trpc.useUtils();

  // Get saved establishments with full details
  const { data: savedPlaces, isLoading } = trpc.posts.savedEstablishments.useQuery();

  const toggleSave = trpc.posts.toggleSave.useMutation({
    onSuccess: () => {
      utils.posts.savedEstablishments.invalidate();
      utils.posts.savedIds.invalidate();
    },
  });

  const removePlace = (id: number, name: string) => {
    toggleSave.mutate({ establishmentId: id });
    toast(`${name} removido dos salvos`);
  };

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref="/" onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-28 pb-24">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">MEUS LOCAIS</h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : `${savedPlaces?.length || 0} locais salvos`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !savedPlaces || savedPlaces.length === 0 ? (
            <div className="text-center py-16">
              <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum local salvo ainda</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Salve locais que deseja visitar para encontrá-los aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedPlaces.map((place) => (
                <div key={place.id} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all group">
                  <Link href={`/estabelecimento/${place.slug}`} className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-secondary">
                      {place.imageUrl ? (
                        <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <img
                          src={getCategoryCover(place.categorySlug || "")}
                          alt={place.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{place.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {place.neighborhood || ""}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">{place.categoryName || ""}</span>
                      </div>
                    </div>
                    {place.googleRating && Number(place.googleRating) >= 4.7 && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-numbers text-sm font-bold text-primary">{Number(place.googleRating).toFixed(1)}</span>
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={() => removePlace(place.id, place.name)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    disabled={toggleSave.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Feed de Transmissões */}
          <BroadcastFeed />
        </div>
      </div>
    </div>
  );
}

function BroadcastFeed() {
  const { data: feed, isLoading } = trpc.posts.broadcastFeed.useQuery();

  if (isLoading) return null;
  if (!feed || feed.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg tracking-wider text-primary">NOVIDADES</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Mensagens dos estabelecimentos que voc\u00ea salvou</p>
      <div className="space-y-2">
        {feed.map((item: any) => (
          <div key={item.id} className="p-3 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-3.5 h-3.5 text-primary/60" />
              <span className="text-xs font-medium text-foreground">{item.establishmentName || "Estabelecimento"}</span>
            </div>
            <p className="text-sm text-foreground/80 pl-5">{item.content}</p>
            <span className="text-[10px] text-muted-foreground/50 pl-5 mt-1 block">
              {new Date(item.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
