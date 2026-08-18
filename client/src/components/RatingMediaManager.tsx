import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, GripVertical, Loader2, Video } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RatingMediaItem {
  id: number;
  url: string;
  mediaType?: "image" | "video" | null;
  position?: number | null;
}

interface RatingMediaManagerProps {
  ratingId: number;
  media: RatingMediaItem[];
  canEdit: boolean;
  onSaved?: () => void;
}

export default function RatingMediaManager({ ratingId, media, canEdit, onSaved }: RatingMediaManagerProps) {
  const [items, setItems] = useState(media);
  const reorderMutation = trpc.ratings.reorderPhotos.useMutation({
    onSuccess: () => {
      toast.success("Ordem da avaliação atualizada.");
      onSaved?.();
    },
    onError: (error) => toast.error(error.message || "Não foi possível reordenar a mídia."),
  });

  useEffect(() => setItems(media), [media]);
  if (!canEdit || items.length < 2) return null;

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length || reorderMutation.isPending) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    reorderMutation.mutate({ ratingId, photoIds: next.map((item) => item.id) });
  };

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-primary">Organizar mídia da avaliação</p>
        {reorderMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
      </div>
      <p className="text-[10px] text-muted-foreground mb-2">Use as setas para definir qual foto ou vídeo aparece primeiro.</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item, index) => (
          <div key={item.id} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border/40 bg-background">
            {item.mediaType === "video" ? (
              <div className="w-full h-full flex items-center justify-center bg-foreground/20"><Video className="w-6 h-6 text-primary" /></div>
            ) : (
              <img src={item.url} alt={`Mídia ${index + 1}`} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-foreground/70 px-1">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || reorderMutation.isPending} className="p-0.5 text-foreground disabled:opacity-30" aria-label="Mover para esquerda"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="inline-flex items-center gap-0.5 text-[9px] text-foreground"><GripVertical className="w-2.5 h-2.5" />{index + 1}</span>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1 || reorderMutation.isPending} className="p-0.5 text-foreground disabled:opacity-30" aria-label="Mover para direita"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
