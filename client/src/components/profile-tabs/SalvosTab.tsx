import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Bookmark, MapPin, Trash2, Megaphone } from "lucide-react";
import { Link } from "wouter";
import { getCategoryCover } from "@/lib/categoryCoverImages";

export default function SalvosTab() {
  const utils = trpc.useUtils();
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

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  if (!savedPlaces || savedPlaces.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum local salvo ainda</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Salve locais que deseja visitar para encontrá-los aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">{savedPlaces.length} locais salvos</p>
      {savedPlaces.map((place) => (
        <div key={place.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all group">
          <Link href={`/estabelecimento/${place.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
              {place.imageUrl ? (
                <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <img src={getCategoryCover(place.categorySlug || "")} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{place.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {place.neighborhood || ""}
                </span>
              </div>
            </div>
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

      {/* Novidades dos Salvos */}
      <BroadcastFeedMini />
    </div>
  );
}

function BroadcastFeedMini() {
  const { data: feed, isLoading } = trpc.posts.broadcastFeed.useQuery();
  if (isLoading || !feed || feed.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="w-4 h-4 text-primary" />
        <h3 className="font-display text-sm tracking-wider text-primary">NOVIDADES</h3>
      </div>
      <div className="space-y-2">
        {feed.slice(0, 5).map((item: any) => (
          <div key={item.id} className="p-3 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-3 h-3 text-primary/60" />
              <span className="text-xs font-medium text-foreground">{item.establishmentName || "Estabelecimento"}</span>
            </div>
            <p className="text-xs text-foreground/80 pl-5">{item.content}</p>
            <span className="text-[10px] text-muted-foreground/50 pl-5 mt-1 block">
              {new Date(item.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
