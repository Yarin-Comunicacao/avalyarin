import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Share2, Send, Loader2, Users, X } from "lucide-react";

type ShareType = "share_rating" | "share_establishment" | "share_profile";

interface ShareToGroupProps {
  type: ShareType;
  referenceId?: number;
  referenceSlug?: string;
  label?: string;
  /** Trigger element — if not provided, renders a default Share button */
  trigger?: React.ReactNode;
}

/**
 * ShareToGroup — modal/dropdown para compartilhar conteúdo para dentro de um grupo.
 * Suporta: avaliações, estabelecimentos e perfis.
 */
export default function ShareToGroup({ type, referenceId, referenceSlug, label, trigger }: ShareToGroupProps) {
  const [open, setOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const { data: groups } = trpc.groups.myGroups.useQuery(undefined, { enabled: open });
  const sendMutation = trpc.groups.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("Compartilhado no grupo!");
      setOpen(false);
      setSelectedGroupId(null);
    },
    onError: () => toast.error("Erro ao compartilhar"),
  });

  const getShareText = () => {
    switch (type) {
      case "share_rating": return "📝 Compartilhou uma avaliação";
      case "share_establishment": return "📍 Compartilhou um estabelecimento";
      case "share_profile": return "👤 Compartilhou um perfil";
    }
  };

  const handleShare = (groupId: number) => {
    sendMutation.mutate({
      groupId,
      content: getShareText(),
      type,
      referenceId,
      referenceSlug,
    });
  };

  // Web Share API (external)
  const handleWebShare = async () => {
    const url = window.location.origin + (referenceSlug ? `/${referenceSlug}` : "");
    const shareData = {
      title: label || "Avalyarin",
      text: getShareText(),
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
        {trigger || (
          <>
            <Share2 className="w-3.5 h-3.5" />
            <span>{label || "Compartilhar"}</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-64 p-3 rounded-xl bg-card border border-border shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-foreground">Compartilhar</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Web Share (external) */}
          <button
            onClick={handleWebShare}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors mb-2 text-left"
          >
            <Share2 className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground">Compartilhar externamente</span>
          </button>

          <div className="border-t border-border/30 my-2" />

          {/* Groups list */}
          <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
            <Users className="w-3 h-3" /> Enviar para um grupo
          </p>

          {!groups || groups.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/60 text-center py-2">Você não participa de nenhum grupo</p>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {groups.map((group: any) => (
                <button
                  key={group.id}
                  onClick={() => handleShare(group.id)}
                  disabled={sendMutation.isPending}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-primary/10 transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {group.name?.charAt(0)?.toUpperCase() || "G"}
                  </div>
                  <span className="text-xs text-foreground truncate flex-1">{group.name}</span>
                  {sendMutation.isPending && selectedGroupId === group.id ? (
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  ) : (
                    <Send className="w-3 h-3 text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
