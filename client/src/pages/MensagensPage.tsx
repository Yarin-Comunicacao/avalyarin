import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Loader2, Send, MessageCircle, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ChatMediaControls from "@/components/ChatMediaControls";
import type { ChatMediaKind, UploadedChatMedia } from "@/lib/chat-media";

// ============ DATE SEPARATOR HELPER ============
function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return "Hoje";
  if (msgDate.getTime() === yesterday.getTime()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

export default function MensagensPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // On desktop, show split view; on mobile, show list or chat
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return <DesktopLayout activeUsername={username} />;
  }

  // Mobile: show list or individual chat
  if (!username) {
    return <MobileConversationsList />;
  }
  return <MobileDirectChat partnerUsername={username} />;
}

// ============ MEDIA QUERY HOOK ============
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

// ============ DESKTOP SPLIT LAYOUT ============
function DesktopLayout({ activeUsername }: { activeUsername?: string }) {
  const [, navigate] = useLocation();
  const { data: conversations, isLoading } = trpc.social.dmConversations.useQuery();
  const { data: mutuals } = trpc.social.mutuals.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-20 pb-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <h1 className="font-display text-2xl tracking-wider text-primary text-glow-amber mb-4">MENSAGENS</h1>

        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Left panel - Conversations list */}
          <div className="w-80 shrink-0 border border-border/30 rounded-xl bg-card overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border/30">
              <h2 className="font-display text-sm tracking-wider text-foreground">CONVERSAS</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!isLoading && (
                <>
                  {/* Existing conversations */}
                  {conversations && conversations.length > 0 && (
                    <div className="p-2 space-y-1">
                      {conversations.map((conv: any) => (
                        <div
                          key={conv.partnerId}
                          onClick={() => navigate(`/mensagens/${conv.partnerUsername}`)}
                          className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                            activeUsername === conv.partnerUsername
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-secondary/50 border border-transparent"
                          }`}
                        >
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {(conv.partnerName || "?")[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">@{conv.partnerUsername}</span>
                              {conv.unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mutual follows section */}
                  {mutuals && mutuals.length > 0 && (
                    <div className="p-2 border-t border-border/20">
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider px-2 py-1">Seguidores mútuos</p>
                      <div className="space-y-1">
                        {mutuals.map((m: any) => (
                          <div
                            key={m.id}
                            onClick={() => navigate(`/mensagens/${m.username}`)}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                              activeUsername === m.username
                                ? "bg-primary/10 border border-primary/30"
                                : "hover:bg-secondary/50 border border-transparent"
                            }`}
                          >
                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-primary">
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
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right panel - Active chat */}
          <div className="flex-1 border border-border/30 rounded-xl bg-card overflow-hidden flex flex-col">
            {activeUsername ? (
              <ChatPanel partnerUsername={activeUsername} />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Selecione uma conversa ao lado</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CHAT PANEL (used in desktop right side) ============
function ChatPanel({ partnerUsername }: { partnerUsername: string }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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
    onError: (err: any) => toast.error(err.message),
  });

  useEffect(() => {
    if (partnerProfile?.id) {
      markRead.mutate({ senderId: partnerProfile.id });
    }
  }, [partnerProfile?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !partnerProfile?.id) return;
    sendDM.mutate({ recipientId: partnerProfile.id, content: message.trim() });
  };

  const handleSendMedia = async (kind: ChatMediaKind, media: UploadedChatMedia) => {
    if (!partnerProfile?.id) return;
    const labels: Record<ChatMediaKind, string> = { audio: "Áudio", image: "Foto", video: "Vídeo" };
    await sendDM.mutateAsync({
      recipientId: partnerProfile.id,
      content: `📎 ${labels[kind]}`,
      type: kind,
      mediaUrl: media.url,
      mediaStorageKey: media.key,
      mediaMimeType: media.mimeType,
      mediaDurationSeconds: media.durationSeconds || undefined,
      mediaSizeBytes: media.sizeBytes,
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border/30">
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
      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {!messages || messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p>Envie a primeira mensagem!</p>
          </div>
        ) : (
          messages.map((msg: any, idx: number) => {
            const isMe = msg.senderId === user?.id;
            const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const prevDate = prevMsg?.createdAt ? new Date(prevMsg.createdAt) : null;

            // Show date separator if this is the first message or date changed
            let showSeparator = false;
            if (msgDate) {
              if (!prevDate) {
                showSeparator = true;
              } else {
                const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
                const prevDay = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
                showSeparator = msgDay.getTime() !== prevDay.getTime();
              }
            }

            return (
              <div key={msg.id}>
                {showSeparator && msgDate && <DateSeparator label={getDateLabel(msgDate)} />}
                <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-secondary border border-border/30 text-foreground rounded-bl-sm"
                  }`}>
                    {msg.type === "image" && msg.mediaUrl ? (
                      <a href={msg.mediaUrl} target="_blank" rel="noreferrer"><img src={msg.mediaUrl} alt="Imagem enviada" className="max-w-full max-h-64 rounded-lg object-cover" loading="lazy" /></a>
                    ) : msg.type === "video" && msg.mediaUrl ? (
                      <video src={msg.mediaUrl} controls playsInline className="max-w-full max-h-72 rounded-lg" />
                    ) : msg.type === "audio" && msg.mediaUrl ? (
                      <audio src={msg.mediaUrl} controls className="max-w-full" />
                    ) : (
                      <p className="break-words">{msg.content}</p>
                    )}
                    <span className={`text-[9px] mt-0.5 block ${isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                      {msgDate ? msgDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/30 p-3 flex items-center gap-2">
        <ChatMediaControls onSendMedia={handleSendMedia} disabled={sendDM.isPending} videoMaxSeconds={90} />
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
    </>
  );
}

// ============ MOBILE CONVERSATIONS LIST ============
function MobileConversationsList() {
  const { data: conversations, isLoading } = trpc.social.dmConversations.useQuery();
  const { data: mutuals } = trpc.social.mutuals.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container pt-20 pb-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <h1 className="font-display text-2xl tracking-wider text-primary text-glow-amber mb-6">MENSAGENS</h1>

        {/* Conversations list - always show, no empty state balloon */}
        {!isLoading && (
          <>
            {conversations && conversations.length > 0 && (
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
          </>
        )}
      </div>
    </div>
  );
}

// ============ MOBILE DIRECT CHAT ============
function MobileDirectChat({ partnerUsername }: { partnerUsername: string }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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
    onError: (err: any) => toast.error(err.message),
  });

  useEffect(() => {
    if (partnerProfile?.id) {
      markRead.mutate({ senderId: partnerProfile.id });
    }
  }, [partnerProfile?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !partnerProfile?.id) return;
    sendDM.mutate({ recipientId: partnerProfile.id, content: message.trim() });
  };

  const handleSendMedia = async (kind: ChatMediaKind, media: UploadedChatMedia) => {
    if (!partnerProfile?.id) return;
    const labels: Record<ChatMediaKind, string> = { audio: "Áudio", image: "Foto", video: "Vídeo" };
    await sendDM.mutateAsync({
      recipientId: partnerProfile.id,
      content: `📎 ${labels[kind]}`,
      type: kind,
      mediaUrl: media.url,
      mediaStorageKey: media.key,
      mediaMimeType: media.mimeType,
      mediaDurationSeconds: media.durationSeconds || undefined,
      mediaSizeBytes: media.sizeBytes,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="container pt-20 pb-[200px] flex-1 flex flex-col">
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
            messages.map((msg: any, idx: number) => {
              const isMe = msg.senderId === user?.id;
              const msgDate = msg.createdAt ? new Date(msg.createdAt) : null;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const prevDate = prevMsg?.createdAt ? new Date(prevMsg.createdAt) : null;

              let showSeparator = false;
              if (msgDate) {
                if (!prevDate) {
                  showSeparator = true;
                } else {
                  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
                  const prevDay = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate());
                  showSeparator = msgDay.getTime() !== prevDay.getTime();
                }
              }

              return (
                <div key={msg.id}>
                  {showSeparator && msgDate && <DateSeparator label={getDateLabel(msgDate)} />}
                  <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary border border-border/30 text-foreground rounded-bl-sm"
                    }`}>
                      {msg.type === "image" && msg.mediaUrl ? (
                        <a href={msg.mediaUrl} target="_blank" rel="noreferrer"><img src={msg.mediaUrl} alt="Imagem enviada" className="max-w-full max-h-64 rounded-lg object-cover" loading="lazy" /></a>
                      ) : msg.type === "video" && msg.mediaUrl ? (
                        <video src={msg.mediaUrl} controls playsInline className="max-w-full max-h-72 rounded-lg" />
                      ) : msg.type === "audio" && msg.mediaUrl ? (
                        <audio src={msg.mediaUrl} controls className="max-w-full" />
                      ) : (
                        <p className="break-words">{msg.content}</p>
                      )}
                      <span className={`text-[9px] mt-0.5 block ${isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                        {msgDate ? msgDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - fixed at bottom above owner bottomnav */}
        <div className="fixed bottom-[160px] left-0 right-0 z-40 bg-background border-t border-border/30 px-4 py-3 flex items-center gap-2">
          <ChatMediaControls onSendMedia={handleSendMedia} disabled={sendDM.isPending} videoMaxSeconds={90} />
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
