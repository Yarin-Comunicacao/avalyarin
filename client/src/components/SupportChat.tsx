import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle, Send, ArrowLeft, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SupportChat — usado pelo role "support" para conversar 1:1 com clientes.
 * Exibe lista de conversas e permite abrir/enviar mensagens.
 */
export default function SupportChat() {
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  if (!user) return null;

  return (
    <div>
      {selectedUserId ? (
        <ChatThread
          supportUserId={user.id}
          partnerId={selectedUserId}
          onBack={() => setSelectedUserId(null)}
        />
      ) : (
        <ConversationList
          supportUserId={user.id}
          onSelect={(id) => setSelectedUserId(id)}
        />
      )}
    </div>
  );
}

function ConversationList({ supportUserId, onSelect }: { supportUserId: number; onSelect: (id: number) => void }) {
  const { data: conversations, isLoading } = trpc.chat.supportConversations.useQuery();
  const [newChatUsername, setNewChatUsername] = useState("");
  const searchMutation = trpc.chat.findUserForChat.useMutation({
    onSuccess: (data) => {
      if (data?.id) {
        onSelect(data.id);
      } else {
        toast.error("Usuário não encontrado");
      }
    },
    onError: () => toast.error("Usuário não encontrado"),
  });

  return (
    <div>
      {/* New chat */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newChatUsername}
          onChange={(e) => setNewChatUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newChatUsername.trim()) {
              searchMutation.mutate({ username: newChatUsername.trim() });
            }
          }}
          placeholder="Iniciar chat com @username..."
          className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-teal-500/50"
        />
        <Button
          size="sm"
          onClick={() => {
            if (newChatUsername.trim()) searchMutation.mutate({ username: newChatUsername.trim() });
          }}
          disabled={!newChatUsername.trim() || searchMutation.isPending}
          className="bg-teal-500 hover:bg-teal-600"
        >
          <MessageCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Conversations list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </div>
      ) : !conversations || conversations.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Use o campo acima para iniciar um chat</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv: any) => (
            <button
              key={conv.partnerId}
              onClick={() => onSelect(conv.partnerId)}
              className="w-full p-3 rounded-lg bg-card border border-border/50 hover:border-teal-500/30 transition-all flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-teal-500">
                  {(conv.partnerName || "?")[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    @{conv.partnerUsername || "anon"}
                  </span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-medium",
                    conv.partnerRole === "business" ? "bg-amber-500/20 text-amber-300" :
                    conv.partnerRole === "influencer" ? "bg-yellow-500/20 text-yellow-300" :
                    conv.partnerRole === "critic" ? "bg-blue-500/20 text-blue-300" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {conv.partnerRole?.toUpperCase() || "USER"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.lastMessage || "Sem mensagens"}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatThread({ supportUserId, partnerId, onBack }: { supportUserId: number; partnerId: number; onBack: () => void }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages, refetch } = trpc.chat.supportMessages.useQuery(
    { partnerId },
    { refetchInterval: 3000 }
  );
  const markReadMutation = trpc.chat.markRead.useMutation();
  const sendMutation = trpc.chat.sendSupportMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
    },
    onError: () => toast.error("Erro ao enviar mensagem"),
  });

  useEffect(() => {
    if (messages && messages.length > 0) {
      markReadMutation.mutate({ senderId: partnerId });
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate({ recipientId: partnerId, content: trimmed });
  };

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar às conversas
      </button>

      {/* Messages */}
      <div className="h-80 overflow-y-auto rounded-xl border border-border/30 bg-background/50 p-4 space-y-3 mb-3">
        {(!messages || messages.length === 0) ? (
          <div className="text-center py-8">
            <MessageCircle className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Início da conversa</p>
          </div>
        ) : (
          [...messages].reverse().map((msg: any) => {
            const isMine = msg.senderId === supportUserId;
            return (
              <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] px-3 py-2 rounded-xl text-sm",
                  isMine
                    ? "bg-teal-500 text-white rounded-br-sm"
                    : "bg-card border border-border/50 text-foreground rounded-bl-sm"
                )}>
                  <p className="break-words">{msg.content}</p>
                  <span className={cn(
                    "text-[10px] mt-1 block",
                    isMine ? "text-teal-100" : "text-muted-foreground/60"
                  )}>
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
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-teal-500/50"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
          className="bg-teal-500 hover:bg-teal-600"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * UserSupportChat — usado por qualquer role para conversar com o suporte.
 * Mostra apenas o thread com o suporte (se houver).
 */
export function UserSupportChat() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages, refetch } = trpc.chat.mySupportMessages.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );
  const sendMutation = trpc.chat.sendToSupport.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
    },
    onError: () => toast.error("Erro ao enviar mensagem"),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) return null;

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate({ content: trimmed });
  };

  return (
    <div>
      <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">CHAT COM SUPORTE</h3>

      {/* Messages */}
      <div className="h-64 overflow-y-auto rounded-xl border border-border/30 bg-background/50 p-4 space-y-3 mb-3">
        {(!messages || messages.length === 0) ? (
          <div className="text-center py-8">
            <MessageCircle className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Envie uma mensagem para o suporte</p>
          </div>
        ) : (
          [...messages].reverse().map((msg: any) => {
            const isMine = msg.senderId === user.id;
            return (
              <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[75%] px-3 py-2 rounded-xl text-sm",
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-teal-500/10 border border-teal-500/20 text-foreground rounded-bl-sm"
                )}>
                  {!isMine && (
                    <span className="text-[9px] text-teal-500 font-medium block mb-0.5">SUPORTE</span>
                  )}
                  <p className="break-words">{msg.content}</p>
                  <span className={cn(
                    "text-[10px] mt-1 block",
                    isMine ? "text-primary-foreground/60" : "text-muted-foreground/60"
                  )}>
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
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Mensagem para o suporte..."
          className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
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
    </div>
  );
}
