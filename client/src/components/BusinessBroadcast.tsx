import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Megaphone, Send, Users, Loader2 } from "lucide-react";

/**
 * BusinessBroadcast — usado pelo business para enviar mensagens em broadcast
 * para todos os seguidores (quem salvou o estabelecimento).
 */
export default function BusinessBroadcast({ establishmentId }: { establishmentId: number }) {
  const [message, setMessage] = useState("");
  const { data: broadcasts, refetch, isLoading } = trpc.business.broadcasts.useQuery({ establishmentId });
  const { data: followerCount } = trpc.business.followerCount.useQuery({ establishmentId });
  const sendMutation = trpc.business.sendBroadcast.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
      toast.success("Mensagem enviada para todos os seguidores!");
    },
    onError: () => toast.error("Erro ao enviar transmissão"),
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate({ establishmentId, content: trimmed });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm tracking-wider text-foreground">TRANSMISSÕES</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{followerCount ?? 0} seguidores</span>
        </div>
      </div>

      {/* Send new broadcast */}
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
        <p className="text-xs text-muted-foreground mb-2">
          Envie uma mensagem para todos que salvaram seu estabelecimento
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Novidade, promoção, evento..."
            className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            maxLength={500}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || sendMutation.isPending}
            className="bg-primary hover:bg-primary/80"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <span className="text-[10px] text-muted-foreground/50 mt-1 block">{message.length}/500</span>
      </div>

      {/* Broadcast history */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : !broadcasts || broadcasts.length === 0 ? (
          <div className="text-center py-6 bg-background/50 rounded-xl border border-border/30">
            <Megaphone className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma transmissão enviada ainda</p>
          </div>
        ) : (
          broadcasts.map((b: any) => (
            <div key={b.id} className="p-3 rounded-lg bg-card border border-border/50">
              <p className="text-sm text-foreground">{b.content}</p>
              <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                {new Date(b.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
