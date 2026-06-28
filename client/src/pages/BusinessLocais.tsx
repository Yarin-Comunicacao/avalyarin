import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { getLoginUrl } from "@/const";
import {
  Store, ClipboardCheck, UtensilsCrossed, Bell, QrCode as QrCodeIcon,
  Crown, Sparkles, Building2, MessageCircle, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

// Import tab components from BusinessPanel
import {
  MyEstablishmentsTab,
  MyClaimsTab,
  MenuManagementTab,
  NotificationsTab,
  QRCodeTab,
  BusinessPlanTab,
  DestaquesTab,
} from "./BusinessPanelTabs";

type TabId = "locais" | "solicitacoes" | "cardapio" | "notificacoes" | "qrcode" | "plano" | "destaques" | "chat";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "locais", label: "Locais", labelFull: "Meus Locais", icon: Store },
  { id: "solicitacoes", label: "Solicitações", labelFull: "Solicitações", icon: ClipboardCheck },
  { id: "cardapio", label: "Cardápio", labelFull: "Cardápio", icon: UtensilsCrossed },
  { id: "notificacoes", label: "Alertas", labelFull: "Notificações", icon: Bell },
  { id: "qrcode", label: "QR Code", labelFull: "QR Code", icon: QrCodeIcon },
  { id: "plano", label: "Plano", labelFull: "Meu Plano", icon: Crown },
  { id: "destaques", label: "Destaques", labelFull: "Destaques", icon: Sparkles },
  { id: "chat", label: "Chat", labelFull: "Chat", icon: MessageCircle },
];

// ===== Chat por Estabelecimento =====
function EstabChatTab() {
  const { user } = useAuth();
  const { data: establishments, isLoading } = trpc.business.myEstablishments.useQuery();
  const [selectedEstab, setSelectedEstab] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, refetch: refetchMessages } = trpc.chat.estabMessages.useQuery(
    { establishmentId: selectedEstab! },
    { enabled: !!selectedEstab, refetchInterval: 5000 }
  );

  const sendMutation = trpc.chat.sendEstabMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchMessages();
    },
  });

  const markReadMutation = trpc.chat.markEstabRead.useMutation();

  useEffect(() => {
    if (selectedEstab) {
      markReadMutation.mutate({ establishmentId: selectedEstab });
    }
  }, [selectedEstab, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) return <div className="text-muted-foreground">Carregando...</div>;

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">SEM ESTABELECIMENTOS</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Você precisa ter um estabelecimento aprovado para usar o chat com o suporte.
        </p>
      </div>
    );
  }

  const handleSend = () => {
    if (!message.trim() || !selectedEstab) return;
    sendMutation.mutate({ establishmentId: selectedEstab, content: message.trim() });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sort messages chronologically (oldest first)
  const sortedMessages = messages ? [...messages].reverse() : [];

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider text-foreground mb-4">CHAT COM SUPORTE</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Converse com o suporte sobre cada estabelecimento separadamente.
      </p>

      {/* Seleção de Estabelecimento */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground block mb-1">Selecione o Estabelecimento</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {establishments.map((est: any) => (
            <button
              key={est.id}
              onClick={() => setSelectedEstab(est.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                selectedEstab === est.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border/50 bg-card hover:border-primary/30 text-foreground"
              )}
            >
              <Store className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium truncate">{est.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedEstab && (
        <div className="mt-6 rounded-xl border border-border/50 bg-card overflow-hidden">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-border/30 bg-card/80">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {establishments.find((e: any) => e.id === selectedEstab)?.name}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                Chat com Suporte
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {sortedMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma mensagem ainda. Inicie uma conversa sobre este estabelecimento.
                  </p>
                </div>
              </div>
            ) : (
              sortedMessages.map((msg: any) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] px-3 py-2 rounded-xl text-sm",
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      )}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className={cn(
                        "text-[10px] mt-1",
                        isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                      )}>
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border/30 bg-card/80">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                maxLength={500}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BusinessLocais() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("locais");
  const { data: notifications } = trpc.business.notifications.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">MEUS LOCAIS</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para gerenciar seus estabelecimentos.
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Entrar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg tracking-wider text-primary">MEUS LOCAIS</h1>
          </div>
          <span className="text-xs text-muted-foreground">{user?.name}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border/30">
        <div className="container overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.labelFull}</span>
                  {tab.id === "notificacoes" && notifications && notifications.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {activeTab === "locais" && <MyEstablishmentsTab />}
        {activeTab === "solicitacoes" && <MyClaimsTab />}
        {activeTab === "cardapio" && <MenuManagementTab />}
        {activeTab === "notificacoes" && <NotificationsTab />}
        {activeTab === "qrcode" && <QRCodeTab />}
        {activeTab === "plano" && <BusinessPlanTab />}
        {activeTab === "destaques" && <DestaquesTab />}
        {activeTab === "chat" && <EstabChatTab />}
      </div>
    </div>
  );
}
