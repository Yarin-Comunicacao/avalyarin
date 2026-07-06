import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle, Send, ChevronRight, MapPin, FileText, User } from "lucide-react";
import { Link } from "wouter";

export default function GroupChat({ groupId }: { groupId: number }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { data: messages, refetch } = trpc.groups.messages.useQuery(
    { groupId, limit: 50, offset: 0 },
    { enabled: open, refetchInterval: open ? 5000 : false }
  );
  const sendMutation = trpc.groups.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
    },
    onError: () => toast.error("Erro ao enviar mensagem"),
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate({ groupId, content: trimmed });
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 rounded-xl bg-primary/10 border border-primary/30 hover:border-primary/60 transition-all flex items-center justify-between group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Chat do Grupo</p>
            <p className="text-xs text-muted-foreground">Converse com os membros</p>
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 text-primary transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-border/30 bg-background/50 overflow-hidden">
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
            {(!messages || messages.length === 0) ? (
              <div className="text-center py-8">
                <MessageCircle className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhuma mensagem ainda. Comece a conversa!</p>
              </div>
            ) : (
              messages.map((msg: any) => (
                <div key={msg.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-primary">
                      {(msg.senderName || "?")[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">@{msg.senderUsername || "anon"}</span>
                      {msg.senderRole === "critic" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">CRÍTICO</span>
                      )}
                      {msg.senderRole === "specialist" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-medium">INFLUENCER</span>
                      )}
                      <span className="text-[10px] text-muted-foreground/60">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    {msg.type && msg.type !== "text" ? (
                      <Link href={`/${msg.referenceSlug || ""}`}>
                        <div className="mt-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
                          {msg.type === "share_establishment" && <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />}
                          {msg.type === "share_rating" && <FileText className="w-3.5 h-3.5 text-primary shrink-0" />}
                          {msg.type === "share_profile" && <User className="w-3.5 h-3.5 text-primary shrink-0" />}
                          <span className="text-xs text-foreground/80">{msg.content}</span>
                        </div>
                      </Link>
                    ) : (
                      <p className="text-sm text-foreground/90 break-words">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/30 p-3 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 140))}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Mensagem (máx. 140 caracteres)..."
              className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              maxLength={140}
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
          <div className="px-3 pb-2">
            <span className="text-[10px] text-muted-foreground/50">{message.length}/140</span>
          </div>
        </div>
      )}
    </div>
  );
}
