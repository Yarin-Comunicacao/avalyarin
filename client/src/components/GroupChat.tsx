import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  MessageCircle, Send, MapPin, FileText, User, Lock,
  MoreHorizontal, Reply, Smile, Pin, X, PinOff, BarChart3, Check
} from "lucide-react";
import { Link } from "wouter";
import ChatMediaControls from "@/components/ChatMediaControls";
import type { ChatMediaKind, UploadedChatMedia } from "@/lib/chat-media";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

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
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-border/40" />
      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider px-2">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}

interface GroupChatProps {
  groupId: number;
  groupType?: string;
}

export default function GroupChat({ groupId, groupType }: GroupChatProps) {
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: messages, refetch } = trpc.groups.messagesEnhanced.useQuery(
    { groupId, limit: 50, offset: 0 },
    { refetchInterval: 5000 }
  );

  const { data: pinnedMessage } = trpc.groups.pinnedMessage.useQuery({ groupId });

  const { data: canSendData } = trpc.broadcastGroups.canSend.useQuery(
    { groupId },
    { enabled: groupType === "broadcast" }
  );

  const utils = trpc.useUtils();

  const sendMutation = trpc.groups.sendMessageEnhanced.useMutation({
    onSuccess: () => {
      setMessage("");
      setReplyTo(null);
      refetch();
    },
    onError: (err) => toast.error(err.message || "Erro ao enviar mensagem"),
  });

  const reactMutation = trpc.groups.react.useMutation({
    onSuccess: () => {
      refetch();
      setShowEmojiPicker(null);
    },
  });

  const pinMutation = trpc.groups.pinMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem fixada!");
      utils.groups.pinnedMessage.invalidate({ groupId });
      setActiveMenu(null);
    },
  });

  const unpinMutation = trpc.groups.pinMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem desafixada");
      utils.groups.pinnedMessage.invalidate({ groupId });
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate({
      groupId,
      content: trimmed,
      replyToId: replyTo?.id,
    });
  };

  const handleSendMedia = async (kind: ChatMediaKind, media: UploadedChatMedia) => {
    const labels: Record<ChatMediaKind, string> = { audio: "Áudio", image: "Foto", video: "Vídeo" };
    await sendMutation.mutateAsync({
      groupId,
      content: `📎 ${labels[kind]}`,
      type: kind,
      replyToId: replyTo?.id,
      mediaUrl: media.url,
      mediaStorageKey: media.key,
      mediaMimeType: media.mimeType,
      mediaDurationSeconds: media.durationSeconds || undefined,
      mediaSizeBytes: media.sizeBytes,
    });
    setReplyTo(null);
  };

  const handleReact = (messageId: number, emoji: string) => {
    reactMutation.mutate({ groupId, messageId, emoji });
  };

  const handlePin = (messageId: number) => {
    pinMutation.mutate({ groupId, messageId });
  };

  const handleUnpin = () => {
    unpinMutation.mutate({ groupId, messageId: null });
  };

  // Close menus on outside click
  const menuRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages load or update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(null);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isBroadcast = groupType === "broadcast";
  const canSend = isBroadcast ? canSendData?.allowed : true;

  return (
    <div className="rounded-xl border border-border/30 bg-background/50 flex flex-col" style={{ overflow: 'visible', position: 'relative' }}>
      {/* Pinned message */}
      {pinnedMessage && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/20 flex items-center gap-2">
          <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-primary font-medium truncate">
              {pinnedMessage.senderName}
            </p>
            <p className="text-xs text-foreground/80 truncate">{pinnedMessage.content}</p>
          </div>
          <button
            onClick={handleUnpin}
            className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
            title="Desafixar"
          >
            <PinOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="overflow-y-auto p-4" style={{ height: '360px' }}>
        <div className="flex flex-col gap-3">
        {(!messages || messages.length === 0) ? (
          <div className="text-center py-8">
            <MessageCircle className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {isBroadcast ? "Nenhuma transmissão ainda." : "Nenhuma mensagem ainda. Comece a conversa!"}
            </p>
          </div>
        ) : (
          messages.map((msg: any, idx: number) => {
            const isOwn = msg.senderId === user?.id;
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
              <div className={`group flex items-start gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                {/* Action menu (three dots) - LEFT side for own messages */}
                {isOwn && (
                  <div
                    ref={activeMenu === msg.id ? menuRef : undefined}
                    className={`relative shrink-0 mt-2 transition-opacity ${activeMenu === msg.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenu(activeMenu === msg.id ? null : msg.id);
                      }}
                      className="p-1 rounded-full hover:bg-card border border-transparent hover:border-border/50 transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {activeMenu === msg.id && (
                      <div
                        className="absolute z-[100] right-0 top-7 bg-card border border-border/50 rounded-lg shadow-lg py-1 min-w-[140px]"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setReplyTo(msg); setActiveMenu(null); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" /> Responder
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowEmojiPicker(msg.id); setActiveMenu(null); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                        >
                          <Smile className="w-3.5 h-3.5" /> Reagir
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handlePin(msg.id); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                        >
                          <Pin className="w-3.5 h-3.5" /> Fixar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className={`relative max-w-[75%]`}>
                  {/* Message bubble */}
                  <div className={`rounded-2xl px-3.5 py-2 ${
                    isOwn
                      ? "bg-primary/20 border border-primary/30 rounded-br-md"
                      : "bg-card border border-border/50 rounded-bl-md"
                  }`}>
                    {/* Sender info (for others' messages) */}
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium text-primary">@{msg.senderUsername || "anon"}</span>
                        {msg.senderRole === "critic" && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">CRÍTICO</span>
                        )}
                        {msg.senderRole === "specialist" && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-medium">INFLUENCER</span>
                        )}
                      </div>
                    )}

                    {/* Reply preview */}
                    {msg.replyTo && (
                      <div className="mb-1.5 pl-2 border-l-2 border-primary/40 bg-primary/5 rounded-r px-2 py-1">
                        <p className="text-[10px] text-primary font-medium">{msg.replyTo.senderName}</p>
                        <p className="text-[11px] text-muted-foreground italic truncate">{msg.replyTo.content}</p>
                      </div>
                    )}

                    {/* Content */}
                    {msg.type === "image" && msg.mediaUrl ? (
                      <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="block">
                        <img src={msg.mediaUrl} alt="Imagem enviada no chat" className="max-w-full max-h-64 rounded-lg object-cover" loading="lazy" />
                      </a>
                    ) : msg.type === "video" && msg.mediaUrl ? (
                      <video src={msg.mediaUrl} controls playsInline className="max-w-full max-h-72 rounded-lg" />
                    ) : msg.type === "audio" && msg.mediaUrl ? (
                      <audio src={msg.mediaUrl} controls className="max-w-full" />
                    ) : msg.type === "poll" && msg.referenceId ? (
                      <InlinePollCard pollId={msg.referenceId} />
                    ) : (msg.type === "event" || msg.type === "reservation") && msg.referenceId ? (
                      <InlineEventCard eventId={msg.referenceId} type={msg.type} />
                    ) : msg.type && msg.type !== "text" ? (
                      <Link href={`/${msg.referenceSlug || ""}`}>
                        <div className="flex items-center gap-2 py-0.5 hover:opacity-80 transition-opacity cursor-pointer">
                          {msg.type === "share_establishment" && <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />}
                          {msg.type === "share_rating" && <FileText className="w-3.5 h-3.5 text-primary shrink-0" />}
                          {msg.type === "share_profile" && <User className="w-3.5 h-3.5 text-primary shrink-0" />}
                          <span className="text-xs text-foreground/80">{msg.content}</span>
                        </div>
                      </Link>
                    ) : (
                      <p className="text-sm text-foreground/90 break-words">{msg.content}</p>
                    )}

                    {/* Timestamp */}
                    <p className={`text-[10px] mt-0.5 ${isOwn ? "text-primary/50 text-right" : "text-muted-foreground/50"}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>

                  {/* Reactions display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(
                        msg.reactions.reduce((acc: Record<string, { emoji: string; count: number; users: string[] }>, r: any) => {
                          if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
                          acc[r.emoji].count++;
                          acc[r.emoji].users.push(r.userName);
                          return acc;
                        }, {})
                      ).map(([emoji, data]: [string, any]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(msg.id, emoji)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-card border border-border/50 hover:border-primary/30 text-xs transition-colors"
                          title={data.users.join(", ")}
                        >
                          <span>{data.emoji}</span>
                          <span className="text-[10px] text-muted-foreground">{data.count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action menu - RIGHT side for others' messages */}
                  {/* (own messages have the menu on the left, rendered above) */}

                  {/* Emoji picker */}
                  {showEmojiPicker === msg.id && (
                    <div
                      ref={emojiRef}
                      className="fixed z-[9999]"
                      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Picker
                        data={data}
                        onEmojiSelect={(emoji: any) => handleReact(msg.id, emoji.native)}
                        theme="dark"
                        locale="pt"
                        previewPosition="none"
                        skinTonePosition="none"
                        maxFrequentRows={1}
                        perLine={7}
                      />
                    </div>
                  )}
                </div>

                {/* Action menu (three dots) - RIGHT side for others' messages */}
                {!isOwn && (
                  <div
                    ref={activeMenu === msg.id ? menuRef : undefined}
                    className={`relative shrink-0 mt-2 transition-opacity ${activeMenu === msg.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveMenu(activeMenu === msg.id ? null : msg.id);
                      }}
                      className="p-1 rounded-full hover:bg-card border border-transparent hover:border-border/50 transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {activeMenu === msg.id && (
                      <div
                        className="absolute z-[100] left-0 top-7 bg-card border border-border/50 rounded-lg shadow-lg py-1 min-w-[140px]"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setReplyTo(msg); setActiveMenu(null); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" /> Responder
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowEmojiPicker(msg.id); setActiveMenu(null); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                        >
                          <Smile className="w-3.5 h-3.5" /> Reagir
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handlePin(msg.id); }}
                          className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2 cursor-pointer"
                        >
                          <Pin className="w-3.5 h-3.5" /> Fixar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="px-4 py-2 bg-primary/5 border-t border-primary/20 flex items-center gap-2">
          <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-primary font-medium">{replyTo.senderName || replyTo.senderUsername}</p>
            <p className="text-xs text-muted-foreground truncate italic">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 rounded hover:bg-primary/10 text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input */}
      {canSend ? (
        <>
          <div className="border-t border-border/30 p-3 flex items-center gap-2">
            <ChatMediaControls onSendMedia={handleSendMedia} disabled={sendMutation.isPending} videoMaxSeconds={90} />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 140))}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isBroadcast ? "Enviar transmissão..." : "Mensagem (máx. 140 caracteres)..."}
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
        </>
      ) : (
        <div className="border-t border-border/30 p-3 flex items-center gap-2 justify-center">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {isBroadcast && canSendData?.reason === "needs_business_pro"
              ? "Assine o Business Pro para enviar transmissões"
              : "Apenas o criador pode enviar mensagens neste canal"}
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== Inline Poll Card (rendered inside chat messages) ====================

function InlinePollCard({ pollId }: { pollId: number }) {
  const { user } = useAuth();
  const { data: poll, refetch } = trpc.groups.getPollDetails.useQuery({ pollId });
  const voteMutation = trpc.groups.votePoll.useMutation({
    onSuccess: () => { refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const closePollMutation = trpc.groups.closePoll.useMutation({
    onSuccess: () => { refetch(); toast.success("Enquete encerrada!"); },
    onError: (err: any) => toast.error(err.message),
  });

  if (!poll) return <div className="text-xs text-muted-foreground">Carregando enquete...</div>;

  const myVotes = (poll as any).myVotes || [];
  const totalVotes = poll.options.reduce((sum: number, o: any) => sum + (o.voteCount || 0), 0);
  const hasVoted = myVotes.length > 0;

  const handleVote = (optionId: number) => {
    if (poll.closed) return;
    voteMutation.mutate({ optionId, pollId: poll.id });
  };

  const pollTypeLabel = { texto: "Texto", data: "Data", estab: "Estab", total: "Total" };

  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-1.5 mb-1">
        <BarChart3 className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] text-primary/70 font-medium">
          Enquete • {pollTypeLabel[(poll as any).pollType || "texto"]}
          {poll.closed && " • Encerrada"}
        </span>
      </div>
      <p className="text-xs font-medium text-foreground mb-1">{poll.question}</p>
      {poll.description && <p className="text-[10px] text-muted-foreground mb-2">{poll.description}</p>}

      <div className="space-y-1.5">
        {poll.options.map((opt: any) => {
          const isVoted = myVotes?.includes(opt.id);
          const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              onClick={() => handleVote(opt.id)}
              disabled={poll.closed || voteMutation.isPending}
              className={`w-full relative overflow-hidden rounded-md border text-left px-2.5 py-1.5 transition-all ${
                isVoted
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/30 hover:border-primary/30"
              } ${poll.closed ? "opacity-70 cursor-default" : "cursor-pointer"}`}
            >
              {/* Progress bar background */}
              {(hasVoted || poll.closed) && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between gap-2">
                <span className="text-[11px] text-foreground/90 flex items-center gap-1">
                  {isVoted && <Check className="w-3 h-3 text-primary" />}
                  {opt.text}
                  {opt.dateValue && <span className="text-muted-foreground"> ({opt.dateValue.split('-').reverse().join('/')})</span>}
                </span>
                {(hasVoted || poll.closed) && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {opt.voteCount} ({pct}%)
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {totalVotes > 0 && (
        <p className="text-[10px] text-muted-foreground/60 mt-1.5">
          {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
          {poll.multipleChoice && " • Múltipla escolha"}
        </p>
      )}

      {/* Custom location info for "total" type */}
      {(poll as any).customAddress && (
        <div className="mt-2 pt-1.5 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Local extra: {(poll as any).customAddress}, {(poll as any).customNumber}
            {(poll as any).customComplement && ` - ${(poll as any).customComplement}`}
          </p>
        </div>
      )}
      {/* Botão Encerrar - apenas para o criador */}
      {user && (poll as any).createdBy === user.id && !poll.closed && (
        <div className="mt-2 pt-1.5 border-t border-border/20 flex justify-end">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={() => closePollMutation.mutate({ pollId })}
            disabled={closePollMutation.isPending}
          >
            Encerrar
          </Button>
        </div>
      )}
    </div>
  );
}


// ─── Inline Event/Reservation Card ─────────────────────────────────────────

function InlineEventCard({ eventId, type }: { eventId: number; type: string }) {
  const { user } = useAuth();
  const { data: event, refetch } = trpc.events.getById.useQuery({ eventId });
  const rsvpMutation = trpc.events.rsvp.useMutation({
    onSuccess: () => refetch(),
  });

  if (!event) return <div className="text-xs text-muted-foreground">Carregando...</div>;

  const isReservation = type === "reservation" || (event as any).eventType === "reservation";
  const accentColor = isReservation ? "text-red-400" : "text-primary";
  const borderColor = isReservation ? "border-red-400/30" : "border-primary/30";
  const bgColor = isReservation ? "bg-red-400/5" : "bg-primary/5";

  const myRsvp = (event.rsvps || []).find((r: any) => r.userId === user?.id);
  const confirmedCount = (event.rsvps || []).filter((r: any) => r.status === "confirmed").length;
  const maybeCount = (event.rsvps || []).filter((r: any) => r.status === "maybe").length;
  const declinedCount = (event.rsvps || []).filter((r: any) => r.status === "declined").length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // Check if RSVP deadline has passed
  const now = new Date();
  const eventDate = new Date((event as any).eventDate);
  const rsvpDeadline = (event as any).rsvpDeadline
    ? new Date((event as any).rsvpDeadline)
    : new Date(eventDate.getTime() - 30 * 60 * 1000); // default 30min antes
  const isRsvpExpired = now > rsvpDeadline;

  const handleRsvp = (status: "confirmed" | "maybe" | "declined") => {
    if (rsvpMutation.isPending || isRsvpExpired) return;
    rsvpMutation.mutate({ eventId, status });
  };

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-3 max-w-[280px]`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`text-[10px] font-medium uppercase tracking-wider ${accentColor}`}>
          {isReservation ? "🎉 Reserva" : "🍷 Evento"}
        </span>
      </div>
      <p className="text-xs font-medium text-foreground mb-1">{(event as any).title}</p>
      {(event as any).description && (
        <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{(event as any).description}</p>
      )}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
        <span>📅 {formatDate((event as any).eventDate)}</span>
        <span>🕐 {formatTime((event as any).eventDate)}</span>
      </div>
      {(event as any).establishmentName && (
        <p className="text-[10px] text-muted-foreground mb-2">📍 {(event as any).establishmentName}</p>
      )}

      {/* RSVP Expired Notice */}
      {isRsvpExpired ? (
        <div className="py-2 px-3 rounded bg-muted/50 border border-border/30 mb-2">
          <p className="text-[10px] text-muted-foreground text-center font-medium">
            ⏰ Prazo para confirmar presença encerrado
          </p>
        </div>
      ) : (
        /* RSVP Buttons */
        <div className="flex gap-1.5 mb-2">
          <button
            onClick={() => handleRsvp("confirmed")}
            disabled={rsvpMutation.isPending}
            className={`flex-1 py-1.5 rounded text-[10px] font-medium transition-all ${
              myRsvp?.status === "confirmed"
                ? "bg-green-500/20 text-green-400 border border-green-500/40"
                : "bg-card border border-border/40 text-muted-foreground hover:border-green-500/40 hover:text-green-400"
            }`}
          >
            ✓ Sim
          </button>
          <button
            onClick={() => handleRsvp("maybe")}
            disabled={rsvpMutation.isPending}
            className={`flex-1 py-1.5 rounded text-[10px] font-medium transition-all ${
              myRsvp?.status === "maybe"
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                : "bg-card border border-border/40 text-muted-foreground hover:border-yellow-500/40 hover:text-yellow-400"
            }`}
          >
            ? Talvez
          </button>
          <button
            onClick={() => handleRsvp("declined")}
            disabled={rsvpMutation.isPending}
            className={`flex-1 py-1.5 rounded text-[10px] font-medium transition-all ${
              myRsvp?.status === "declined"
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-card border border-border/40 text-muted-foreground hover:border-red-500/40 hover:text-red-400"
            }`}
          >
            ✗ Não
          </button>
        </div>
      )}

      {/* Vote counts */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="text-green-400">✓ {confirmedCount}</span>
        <span className="text-yellow-400">? {maybeCount}</span>
        <span className="text-red-400">✗ {declinedCount}</span>
      </div>
    </div>
  );
}
