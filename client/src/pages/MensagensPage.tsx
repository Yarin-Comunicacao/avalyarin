import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Loader2, Send, MessageCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MensagensPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  if (!username) {
    return <ConversationsList />;
  }

  return <DirectChat partnerUsername={username} />;
}

// ============ CONVERSATIONS LIST ============
function ConversationsList() {
  const { data: conversations, isLoading } = trpc.social.dmConversations.useQuery();
  const { data: mutuals } = trpc.social.mutuals.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar  />

      <div className="container pt-20 pb-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <h1 className="font-display text-2xl tracking-wider text-primary text-glow-amber mb-6">MENSAGENS</h1>

        {/* Conversations */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="space-y-2 mb-8">
            {conversations.map((conv: any) => (
              <Link key={conv.partnerId} href={`/mensagens/${conv.partnerUsername}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {(conv.partnerName || "?")[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">@{conv.partnerUsername}</span>
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString("pt-BR") : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm mb-8">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p>Nenhuma conversa ainda.</p>
          </div>
        )}

        {/* Mutual follows (start new conversation) */}
        {mutuals && mutuals.length > 0 && (
          <div>
            <h2 className="font-display text-lg tracking-wider text-foreground mb-3">INICIAR CONVERSA</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Você pode conversar com seguidores mútuos:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {mutuals.map((m: any) => (
                <Link key={m.id} href={`/mensagens/${m.username}`}>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {(m.name || "?")[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground truncate block">@{m.username}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <UserCheck className="w-2.5 h-2.5" /> Mútuo
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ DIRECT CHAT ============
function DirectChat({ partnerUsername }: { partnerUsername: string }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Resolve partner by username
  const { data: partnerProfile } = trpc.profile.publicByUsername.useQuery(
    { username: partnerUsername },
    { enabled: !!partnerUsername }
  );

  const { data: messages, refetch } = trpc.social.dmMessages.useQuery(
    { partnerId: partnerProfile?.id || 0 },
    { enabled: !!partnerProfile?.id, refetchInterval: 5000 }
  );

  const markRead = trpc.social.dmMarkRead.useMutation();
  const sendDM = trpc.social.dmSend.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Mark as read when opening
  useEffect(() => {
    if (partnerProfile?.id) {
      markRead.mutate({ senderId: partnerProfile.id });
    }
  }, [partnerProfile?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !partnerProfile?.id) return;
    sendDM.mutate({ recipientId: partnerProfile.id, content: message.trim() });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar  />

      <div className="container pt-20 pb-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => window.history.back()} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href={`/perfil/${partnerUsername}`}>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {(partnerProfile?.name || "?")[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">@{partnerUsername}</span>
            </div>
          </Link>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[200px] max-h-[60vh] px-1">
          {!messages || messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
              <p>Envie a primeira mensagem!</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary border border-border/30 text-foreground rounded-bl-sm"
                  }`}>
                    <p className="break-words">{msg.content}</p>
                    <span className={`text-[9px] mt-0.5 block ${isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border/30 pt-3 flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Digite sua mensagem..."
            maxLength={500}
            className="flex-1 bg-secondary border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || sendDM.isPending}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
