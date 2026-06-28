import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { getLoginUrl } from "@/const";
import {
  Store, ClipboardCheck, UtensilsCrossed,
  Crown, Building2, MessageCircle, Send, Bell, QrCode as QrCodeIcon, Download, Copy, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { ScrollableTabs } from "@/components/ScrollableTabs";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

// Import tab components from BusinessPanel
import {
  MyEstablishmentsTab,
  MyClaimsTab,
  MenuManagementTab,
  NotificationsTab,
  BusinessPlanTab,
} from "./BusinessPanelTabs";

type TabId = "locais" | "cardapio" | "chat" | "solicitacoes" | "plano";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "locais", label: "Locais", labelFull: "Meus Locais", icon: Store },
  { id: "cardapio", label: "Cardápio", labelFull: "Cardápio", icon: UtensilsCrossed },
  { id: "chat", label: "Chat", labelFull: "Chat", icon: MessageCircle },
  { id: "solicitacoes", label: "Solicitações", labelFull: "Solicitações", icon: ClipboardCheck },
  { id: "plano", label: "Plano", labelFull: "Meu Plano", icon: Crown },
];

// ===== Sub-abas do Cardápio =====
type CardapioSubTab = "cardapio" | "notificacoes";

function CardapioWithNotificationsTab() {
  const [subTab, setSubTab] = useState<CardapioSubTab>("cardapio");
  const { data: notifications } = trpc.business.notifications.useQuery();

  // Count total items with errors (sum of count from warning notifications)
  const totalItemErrors = notifications
    ? notifications.reduce((sum: number, n: any) => {
        if (n.severity === 'warning' && n.count) return sum + n.count;
        if (n.severity === 'error') return sum + 1;
        return sum;
      }, 0)
    : 0;

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 border-b border-border/30 pb-0">
        <button
          onClick={() => setSubTab("cardapio")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            subTab === "cardapio"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Cardápio
        </button>
        <button
          onClick={() => setSubTab("notificacoes")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5",
            subTab === "notificacoes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="w-3.5 h-3.5" />
          Notificações
          {totalItemErrors > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
              {totalItemErrors}
            </span>
          )}
        </button>
      </div>

      {/* Sub-tab content */}
      {subTab === "cardapio" && <MenuManagementTab />}
      {subTab === "notificacoes" && <NotificationsTab />}
    </div>
  );
}

// ===== QR Code Popup =====
function QRCodePopup({ est, onClose }: { est: any; onClose: () => void }) {
  const qrUrl = `${window.location.origin}/e/${est.slug}`;

  const handleDownloadQR = () => {
    const canvas = document.querySelector(`#qr-popup-canvas-${est.id} canvas`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${est.slug || "estab"}.png`;
    a.click();
    toast.success("QR Code baixado!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    toast.success("Link copiado!");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <h3 className="font-display text-lg tracking-wider text-foreground text-center pr-8">
          {est.name}
        </h3>
        <p className="text-xs text-muted-foreground text-center">
          Imprima este QR Code e coloque na entrada ou nas mesas.
        </p>

        {/* QR Code */}
        <div id={`qr-popup-canvas-${est.id}`} className="flex justify-center">
          <div className="bg-white p-4 rounded-xl">
            <QRCodeCanvas value={qrUrl} size={200} level="H" includeMargin={true} />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground font-mono text-center break-all">{qrUrl}</p>

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleDownloadQR}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar PNG
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar Link
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Meus Locais com QR Code button =====
function MyLocaisWithQR() {
  const [qrEstab, setQrEstab] = useState<any>(null);

  return (
    <div>
      <MyEstablishmentsTab qrButton={(est: any) => (
        <button
          onClick={() => setQrEstab(est)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-colors"
        >
          <QrCodeIcon className="w-3.5 h-3.5" />
          QR Code
        </button>
      )} />

      {/* QR Code Popup */}
      {qrEstab && (
        <QRCodePopup est={qrEstab} onClose={() => setQrEstab(null)} />
      )}
    </div>
  );
}

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

  // Badge for Cardápio tab: total items with errors (sum of count from warnings + count of errors)
  const cardapioBadge = notifications
    ? notifications.reduce((sum: number, n: any) => {
        if (n.severity === 'warning' && n.count) return sum + n.count;
        if (n.severity === 'error') return sum + 1;
        return sum;
      }, 0)
    : 0;

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
      <ScrollableTabs
        tabs={TABS.map(tab => ({
          ...tab,
          badge: tab.id === "cardapio" ? (cardapioBadge > 0 ? cardapioBadge : undefined) : undefined,
        }))}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Content */}
      <div className="container py-6">
        {activeTab === "locais" && <MyLocaisWithQR />}
        {activeTab === "cardapio" && <CardapioWithNotificationsTab />}
        {activeTab === "chat" && <EstabChatTab />}
        {activeTab === "solicitacoes" && <MyClaimsTab />}
        {activeTab === "plano" && <BusinessPlanTab />}
      </div>
    </div>
  );
}
