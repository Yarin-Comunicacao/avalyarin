import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { QRCodeCanvas } from "qrcode.react";
import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Store, ArrowLeft, ClipboardCheck, UtensilsCrossed,
  Plus, Trash2, CheckCircle, Clock, XCircle, Send, Building2,
  Bell, AlertTriangle, Image as ImageIcon, Star, QrCode as QrCodeIcon, Tag, Download, Copy, Crown, Check, Loader2, Zap, TrendingUp, BarChart3, CalendarDays, Users, HelpCircle, ThumbsDown, ExternalLink, Megaphone, Sparkles, Upload, Ticket, MapPin, DollarSign, Music
} from "lucide-react";
import BusinessBroadcast from "@/components/BusinessBroadcast";
import { getConnectYarinUrl } from "@shared/const";
import { validateAddress, VALID_LOGRADOUROS } from "@shared/address-validation";

export default function BusinessPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  
  // Map sub-routes to tabs
  const getTabFromPath = (): string | null => {
    const path = window.location.pathname;
    if (path === "/painel-empresarial/insights") return "insights";
    if (path === "/painel-empresarial/notificacoes") return "notifications";
    if (path === "/painel-empresarial/calendario") return "calendar";
    if (path === "/painel-empresarial/config") return "establishments";
    return null;
  };
  
  const initialTab = (getTabFromPath() || searchParams.get("tab") || "establishments") as "establishments" | "claims" | "menu" | "notifications" | "qrcode" | "promo" | "partnerships" | "plan" | "insights" | "calendar" | "destaques" | "broadcast" | "eventos";
  const [activeTab, setActiveTab] = useState(initialTab);
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
          <h1 className="font-display text-2xl text-foreground mb-2">PAINEL EMPRESARIAL</h1>
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
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">

            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl tracking-wider text-primary">PAINEL EMPRESARIAL</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.username && (
              <a
                href={getConnectYarinUrl(user.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Connect Yarin
              </a>
            )}
            <span className="text-xs text-muted-foreground">{user?.name}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border/30">
        <div className="container overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {[
              { id: "establishments" as const, label: "Meus Locais", labelFull: "Meus Locais", icon: Store },
              { id: "claims" as const, label: "Solicitações", labelFull: "Solicitações", icon: ClipboardCheck },
              { id: "menu" as const, label: "Cardápio", labelFull: "Cardápio", icon: UtensilsCrossed },
              { id: "notifications" as const, label: "Alertas", labelFull: "Notificações", icon: Bell },
              { id: "qrcode" as const, label: "QR Code", labelFull: "QR Code", icon: QrCodeIcon },
              { id: "promo" as const, label: "Códigos", labelFull: "Códigos Promocionais", icon: Tag },
              { id: "partnerships" as const, label: "Parcerias", labelFull: "Parcerias", icon: Building2 },
              { id: "plan" as const, label: "Plano", labelFull: "Meu Plano", icon: Crown },
              { id: "insights" as const, label: "Insights", labelFull: "Insights", icon: TrendingUp },
              { id: "calendar" as const, label: "Calendário", labelFull: "Calendário de Eventos", icon: CalendarDays },
              { id: "destaques" as const, label: "Destaques", labelFull: "Destaques", icon: Sparkles },
              { id: "broadcast" as const, label: "Transmissões", labelFull: "Lista de Transmissão", icon: Megaphone },
              { id: "eventos" as const, label: "Eventos", labelFull: "Eventos do Estab.", icon: CalendarDays },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.labelFull}</span>
                {tab.id === "notifications" && notifications && notifications.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
                    {notifications.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {activeTab === "establishments" && <MyEstablishmentsTab />}
        {activeTab === "claims" && <MyClaimsTab />}
        {activeTab === "menu" && <MenuManagementTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "qrcode" && <QRCodeTab />}
        {activeTab === "promo" && <PromoCodesTab />}
        {activeTab === "partnerships" && <PartnershipsTab />}
        {activeTab === "plan" && <BusinessPlanTab />}
        {activeTab === "insights" && <BusinessInsightsTab />}
        {activeTab === "calendar" && <CalendarioBusinessTab />}
        {activeTab === "destaques" && <DestaquesTab />}
        {activeTab === "broadcast" && <BroadcastTab />}
        {activeTab === "eventos" && <EventosEstabTab />}
      </div>
    </div>
  );
}

export function MyEstablishmentsTab({ qrButton }: { qrButton?: (est: any) => React.ReactNode } = {}) {
  const { data: establishments, isLoading } = trpc.business.myEstablishments.useQuery();
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportPreMessage, setSupportPreMessage] = useState("");

  if (isLoading) return <div className="text-muted-foreground">Carregando seus estabelecimentos...</div>;

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">NENHUM ESTABELECIMENTO</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Você ainda não possui estabelecimentos vinculados. Vá até a aba "Solicitações" para reivindicar um estabelecimento.
        </p>
      </div>
    );
  }

  const handleRequestChange = (est: any) => {
    setSupportPreMessage(`Olá, gostaria de solicitar alteração nas informações do estabelecimento "${est.name}" (ID: ${est.id}).`);
    setShowSupportChat(true);
  };

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider text-foreground mb-6">MEUS LOCAIS</h2>
      
      {/* Chat com suporte (expandível) */}
      {showSupportChat && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-teal-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider text-teal-400">CHAT COM SUPORTE</h3>
            <button
              onClick={() => setShowSupportChat(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Fechar
            </button>
          </div>
          <InlineSupportChat preMessage={supportPreMessage} />
        </div>
      )}

      <div className="space-y-4">
        {establishments.map((est: any) => (
          <EstablishmentCard key={est.id} est={est} onRequestChange={handleRequestChange} qrButton={qrButton} />
        ))}
      </div>
    </div>
  );
}

/** Card de estabelecimento com upload de logo/capa */
function EstablishmentCard({ est, onRequestChange, qrButton }: { est: any; onRequestChange: (est: any) => void; qrButton?: (est: any) => React.ReactNode }) {
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const updateMutation = trpc.business.updateEstablishment.useMutation({
    onSuccess: () => {
      utils.business.myEstablishments.invalidate();
      toast.success("Atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são aceitas");
      return;
    }
    setLogoUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch("/api/upload-logo", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: buffer,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateMutation.mutate({ establishmentId: est.id, logo: data.url });
    } catch {
      toast.error("Erro ao enviar logo");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são aceitas");
      return;
    }
    setCoverUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch("/api/upload-cover", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: buffer,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateMutation.mutate({ establishmentId: est.id, image: data.url });
    } catch {
      toast.error("Erro ao enviar foto de capa");
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50">
      {/* Nome clicável + ID visível */}
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/estabelecimento/${est.slug}`} className="group">
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer">
            {est.name}
            <ExternalLink className="w-3.5 h-3.5 inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h3>
        </Link>
        <span className="text-[10px] text-muted-foreground/50 font-mono">ID: {est.id}</span>
      </div>

      {/* Logo + Capa uploads */}
      <div className="flex gap-4 mb-4">
        {/* Logo 1:1 */}
        <div className="flex flex-col items-center gap-2">
          <div
            onClick={() => logoInputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 flex items-center justify-center cursor-pointer overflow-hidden transition-colors bg-secondary/30"
          >
            {logoUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : est.logo ? (
              <img src={est.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">Logo (1:1)</span>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </div>

        {/* Capa */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div
            onClick={() => coverInputRef.current?.click()}
            className="w-full h-20 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 flex items-center justify-center cursor-pointer overflow-hidden transition-colors bg-secondary/30"
          >
            {coverUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : est.image ? (
              <img src={est.image} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/50">Foto de Capa</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">Capa (destaque)</span>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
        </div>
      </div>

      {/* Informações read-only */}
      <div className="space-y-2">
        {est.address && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 w-20 shrink-0">Endereço</span>
            <span className="text-sm text-muted-foreground">{est.address}</span>
          </div>
        )}
        {est.phone && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 w-20 shrink-0">Telefone</span>
            <span className="text-sm text-muted-foreground">{est.phone}</span>
          </div>
        )}
        {est.instagram && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 w-20 shrink-0">Instagram</span>
            <span className="text-sm text-primary">@{est.instagram}</span>
          </div>
        )}
      </div>

      {/* QR Code + Aviso de alteração via suporte */}
      <div className="mt-4 pt-3 border-t border-border/30">
        {qrButton && (
          <div className="mb-3">
            {qrButton(est)}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-yellow-400/80">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Para alterar nome, endereço, telefone ou @, solicite ao suporte.</span>
        </div>
        <button
          onClick={() => onRequestChange(est)}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors"
        >
          <Send className="w-3 h-3" />
          Solicitar alteração ao suporte
        </button>
      </div>
    </div>
  );
}

/** Componente de chat inline com suporte (usado dentro da aba Meus Locais) */
function InlineSupportChat({ preMessage }: { preMessage?: string }) {
  const { user } = useAuth();
  const [message, setMessage] = useState(preMessage || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: messages, refetch } = trpc.chat.mySupportMessages.useQuery(
    undefined,
    { refetchInterval: 5000 }
  );
  const sendMutation = trpc.chat.sendToSupport.useMutation({
    onSuccess: () => {
      setMessage("");
      refetch();
      toast.success("Mensagem enviada ao suporte!");
    },
    onError: () => toast.error("Erro ao enviar mensagem"),
  });

  if (!user) return null;

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMutation.mutate({ content: trimmed });
  };

  return (
    <div>
      {/* Messages */}
      <div className="h-48 overflow-y-auto rounded-xl border border-border/30 bg-background/50 p-3 space-y-2 mb-3">
        {(!messages || messages.length === 0) ? (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">Envie uma mensagem para o suporte</p>
          </div>
        ) : (
          [...messages].reverse().map((msg: any) => {
            const isMine = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-teal-500/10 border border-teal-500/20 text-foreground rounded-bl-sm"
                }`}>
                  {!isMine && (
                    <span className="text-[9px] text-teal-500 font-medium block mb-0.5">SUPORTE</span>
                  )}
                  <p className="break-words">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${
                    isMine ? "text-primary-foreground/60" : "text-muted-foreground/60"
                  }`}>
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
        <button
          onClick={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function MyClaimsTab() {
  const { data: claims, isLoading } = trpc.business.myClaims.useQuery();
  const submitMutation = trpc.business.submitClaim.useMutation();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults } = trpc.establishments.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 3 }
  );
  const [selectedEst, setSelectedEst] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    contactPhone: "",
    contactEmail: "",
    proofDescription: "",
  });

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };

  const statusIcons: Record<string, typeof CheckCircle> = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle,
  };

  const statusColors: Record<string, string> = {
    pending: "text-orange-400",
    approved: "text-green-400",
    rejected: "text-destructive",
  };

  const handleSubmit = async () => {
    if (!selectedEst) {
      toast.error("Selecione um estabelecimento");
      return;
    }
    if (!formData.businessName || !formData.contactPhone || !formData.contactEmail || !formData.proofDescription) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await submitMutation.mutateAsync({
        establishmentId: selectedEst.id,
        ...formData,
      });
      utils.business.myClaims.invalidate();
      setShowForm(false);
      setSelectedEst(null);
      setFormData({ businessName: "", contactPhone: "", contactEmail: "", proofDescription: "" });
      toast.success("Solicitação enviada! Aguarde a análise do administrador.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar solicitação");
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando solicitações...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl tracking-wider text-foreground">MINHAS SOLICITAÇÕES</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Solicitação
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 rounded-xl bg-card border border-primary/30">
          <h3 className="font-display text-lg text-foreground mb-4">REIVINDICAR ESTABELECIMENTO</h3>
          
          {/* Search establishment */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground block mb-1">Buscar Estabelecimento</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedEst(null); }}
              placeholder="Digite o nome do estabelecimento..."
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
            {searchResults && searchQuery.length >= 3 && !selectedEst && (
              <div className="mt-2 border border-border rounded-lg bg-background max-h-40 overflow-y-auto">
                {searchResults.establishments?.slice(0, 8).map((est: any) => (
                  <button
                    key={est.id}
                    onClick={() => { setSelectedEst({ id: est.id, name: est.name }); setSearchQuery(est.name); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b border-border/30 last:border-0"
                  >
                    <span className="text-foreground">{est.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{est.neighborhood}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedEst && (
              <p className="text-xs text-green-400 mt-1">Selecionado: {selectedEst.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Nome da Empresa</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Razão social ou nome fantasia"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Telefone de Contato</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">Email de Contato</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="contato@empresa.com"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-muted-foreground block mb-1">
              Comprovação (descreva como podemos verificar que você é o responsável)
            </label>
            <textarea
              value={formData.proofDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, proofDescription: e.target.value }))}
              placeholder="Ex: Sou o proprietário registrado no CNPJ, posso enviar contrato social..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm border border-border text-muted-foreground rounded-lg hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Claims list */}
      {claims?.length === 0 ? (
        <div className="text-center py-8">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Nenhuma solicitação enviada. Clique em "Nova Solicitação" para reivindicar um estabelecimento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims?.map((claim: any) => {
            const StatusIcon = statusIcons[claim.status];
            return (
              <div key={claim.id} className="p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{claim.establishmentName}</h4>
                    <p className="text-xs text-muted-foreground">{claim.businessName}</p>
                  </div>
                  <div className={`flex items-center gap-1 ${statusColors[claim.status]}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{statusLabels[claim.status]}</span>
                  </div>
                </div>
                {claim.adminNotes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Resposta do admin: {claim.adminNotes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== Edit Item Form (inline expansion) =====
function EditItemForm({ item, establishmentId, onClose, onSaved }: {
  item: any;
  establishmentId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item.name || "");
  const [description, setDescription] = useState(item.description || "");
  const [price, setPrice] = useState(item.price ? String(Number(item.price)) : "");
  const [category, setCategory] = useState(item.category || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const updateMutation = trpc.business.updateMenuItem.useMutation();

  const handleSave = async () => {
    try {
      let imageUrl: string | undefined;
      let imageKey: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          imageUrl = data.url;
          imageKey = data.key;
        }
      }

      await updateMutation.mutateAsync({
        menuItemId: item.id,
        name: name || undefined,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        category: category || undefined,
        imageUrl,
        imageKey,
      });
      toast.success("Item atualizado!");
      onSaved();
    } catch {
      toast.error("Erro ao atualizar item");
    }
  };

  return (
    <div className="mt-2 p-4 rounded-lg bg-card border border-primary/30 space-y-3">
      <h4 className="text-sm font-medium text-foreground">Editar: {item.name}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Categoria"
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição"
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
        />
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço (R$)"
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Foto do item</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="text-sm text-foreground file:mr-2 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {updateMutation.isPending ? "Salvando..." : "Salvar"}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function MenuManagementTab() {
  const { data: establishments, isLoading } = trpc.business.myEstablishments.useQuery();
  const [selectedEst, setSelectedEst] = useState<number | null>(null);
  const { data: estData } = trpc.establishments.getWithMenu.useQuery(
    { slug: establishments?.find((e: any) => e.id === selectedEst)?.slug || "" },
    { enabled: !!selectedEst && !!establishments }
  );
  const { data: notifications } = trpc.business.notifications.useQuery();
  const addItemMutation = trpc.business.addMenuItem.useMutation();
  const deleteItemMutation = trpc.business.deleteMenuItem.useMutation();
  const utils = trpc.useUtils();
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", category: "" });
  const [editingItem, setEditingItem] = useState<number | null>(null);

  if (isLoading) return <div className="text-muted-foreground">Carregando...</div>;

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">SEM ACESSO AO CARDÁPIO</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Você precisa ter um estabelecimento aprovado para gerenciar o cardápio.
        </p>
      </div>
    );
  }

  const handleAddItem = async () => {
    if (!selectedEst || !newItem.name) {
      toast.error("Preencha pelo menos o nome do item");
      return;
    }
    try {
      await addItemMutation.mutateAsync({
        establishmentId: selectedEst,
        name: newItem.name,
        description: newItem.description || undefined,
        price: newItem.price ? parseFloat(newItem.price) : undefined,
        category: newItem.category || undefined,
      });
      const slug = establishments?.find((e: any) => e.id === selectedEst)?.slug;
      if (slug) utils.establishments.getWithMenu.invalidate({ slug });
      setNewItem({ name: "", description: "", price: "", category: "" });
      toast.success("Item adicionado ao cardápio!");
    } catch {
      toast.error("Erro ao adicionar item");
    }
  };

  const handleDeleteItem = async (menuItemId: number) => {
    if (!confirm("Remover este item do cardápio?")) return;
    try {
      await deleteItemMutation.mutateAsync({ menuItemId });
      const slug = establishments?.find((e: any) => e.id === selectedEst)?.slug;
      if (slug) utils.establishments.getWithMenu.invalidate({ slug });
      toast.success("Item removido!");
    } catch {
      toast.error("Erro ao remover item");
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider text-foreground mb-6">GERENCIAR CARDÁPIO</h2>

      <div className="mb-4">
        <label className="text-sm text-muted-foreground block mb-1">Selecione o Estabelecimento</label>
        <select
          value={selectedEst || ""}
          onChange={(e) => setSelectedEst(e.target.value ? Number(e.target.value) : null)}
          className="w-full sm:w-auto px-4 py-2 bg-background border border-border rounded-lg text-foreground"
        >
          <option value="">Escolha...</option>
          {establishments.map((est: any) => (
            <option key={est.id} value={est.id}>{est.name}</option>
          ))}
        </select>
      </div>

      {selectedEst && (
        <>
          {/* Add new item form */}
          <div className="p-4 rounded-xl bg-card border border-primary/30 mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Adicionar Item
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do item *"
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="text"
                value={newItem.category}
                onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Categoria (ex: cerveja, petisco)"
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="text"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição"
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
              <input
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Preço (R$)"
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={handleAddItem}
              disabled={addItemMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {addItemMutation.isPending ? "Adicionando..." : "Adicionar"}
            </button>
          </div>

          {/* Pendências — itens sem foto */}
          {notifications && notifications.filter(n => n.severity === 'warning').length > 0 && selectedEst && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/30">
              <h3 className="flex items-center gap-2 text-sm font-medium text-red-400 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Itens com pendências ({notifications.filter(n => n.severity === 'warning').length})
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                Adicione fotos para melhorar a visibilidade do seu estabelecimento.
              </p>
            </div>
          )}

          {/* Current menu items */}
          {estData?.menu && estData.menu.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                {estData.menu.length} itens no cardápio
              </p>
              {estData.menu.map((item: any) => {
                const hasPendency = !item.imageUrl;
                return (
                  <div key={item.id} className="space-y-0">
                    <div className={`p-3 rounded-lg bg-card flex items-center justify-between ${
                      hasPendency
                        ? "border-2 border-red-500/50 bg-red-500/5"
                        : "border border-border/50"
                    }`}>
                      <div className="flex items-center gap-3">
                        {hasPendency && (
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4 text-red-400" />
                          </div>
                        )}
                        <div>
                          <p className={`text-sm font-medium ${hasPendency ? "text-red-400" : "text-foreground"}`}>{item.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {item.category && <span className="capitalize">{item.category}</span>}
                            {item.price && <span>R$ {Number(item.price).toFixed(2)}</span>}
                            {hasPendency && <span className="text-red-400 font-medium">• Sem foto</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasPendency && (
                          <button
                            onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            title="Editar item — adicionar foto"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {editingItem === item.id && (
                      <EditItemForm
                        item={item}
                        establishmentId={selectedEst!}
                        onClose={() => setEditingItem(null)}
                        onSaved={() => {
                          setEditingItem(null);
                          const slug = establishments?.find((e: any) => e.id === selectedEst)?.slug;
                          if (slug) utils.establishments.getWithMenu.invalidate({ slug });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhum item no cardápio ainda.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function NotificationsTab() {
  const { data: notifications, isLoading } = trpc.business.notifications.useQuery();
  const { data: ratingNotifs, isLoading: ratingLoading } = trpc.business.ratingNotifications.useQuery();
  const markRead = trpc.business.markNotificationRead.useMutation({
    onSuccess: () => trpc.useUtils().business.ratingNotifications.invalidate(),
  });

  if (isLoading && ratingLoading) return <div className="text-muted-foreground">Carregando notificações...</div>;

  const hasSystemNotifs = notifications && notifications.length > 0;
  const hasRatingNotifs = ratingNotifs && ratingNotifs.length > 0;

  if (!hasSystemNotifs && !hasRatingNotifs) {
    return (
      <div className="text-center py-12">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
        <h3 className="font-display text-xl text-foreground mb-2">TUDO CERTO!</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Seus estabelecimentos estão com todas as informações preenchidas. Nenhuma ação necessária.
        </p>
      </div>
    );
  }

  const errors = (notifications || []).filter(n => n.severity === 'error');
  const warnings = (notifications || []).filter(n => n.severity === 'warning');

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider text-foreground mb-6">NOTIFICAÇÕES</h2>

      {/* Critical errors — missing required fields */}
      {errors.length > 0 && (
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-sm font-medium text-red-400 mb-3">
            <AlertTriangle className="w-4 h-4" />
            Campos obrigatórios faltando ({errors.length})
          </h3>
          <div className="space-y-2">
            {errors.map((n, i) => (
              <div key={`err-${i}`} className="p-4 rounded-xl bg-red-500/5 border border-red-500/30 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O estabelecimento ficará oculto no app até que este campo seja preenchido.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings — items without photos */}
      {warnings.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-orange-400 mb-3">
            <ImageIcon className="w-4 h-4" />
            Itens sem foto ({warnings.length})
          </h3>
          <div className="space-y-2">
            {warnings.map((n, i) => (
              <div key={`warn-${i}`} className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/30 flex items-start gap-3">
                <ImageIcon className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicionar fotos melhora a experiência dos clientes e aumenta a visibilidade do seu estabelecimento.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating notifications — new reviews received */}
      {hasRatingNotifs && (
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-medium text-green-400 mb-3">
            <Star className="w-4 h-4" />
            Avaliações Recebidas ({ratingNotifs!.filter(n => !n.isRead).length} novas)
          </h3>
          <div className="space-y-2">
            {ratingNotifs!.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                  n.isRead
                    ? "bg-card/30 border border-border/30 opacity-60"
                    : "bg-green-500/5 border border-green-500/30"
                }`}
                onClick={() => !n.isRead && markRead.mutate({ notificationId: n.id })}
              >
                <Star className={`w-4 h-4 shrink-0 mt-0.5 ${n.isRead ? "text-muted-foreground" : "text-green-400"}`} />
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// QR CODE TAB
// ============================================================
export function QRCodeTab() {
  const { data: establishments } = trpc.business.myEstablishments.useQuery();
  const [selectedEst, setSelectedEst] = useState<number | null>(null);

  const selected = establishments?.find((e: any) => e.id === selectedEst);
  const qrUrl = selected ? `${window.location.origin}/e/${selected.slug}` : "";

  // Auto-select first establishment
  if (!selectedEst && establishments && establishments.length > 0) {
    setSelectedEst((establishments[0] as any).id);
  }

  const handleDownloadQR = () => {
    const canvas = document.querySelector("#qr-code-canvas canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrcode-${selected?.slug || "estab"}.png`;
    a.click();
    toast.success("QR Code baixado!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    toast.success("Link copiado!");
  };

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <QrCodeIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Você precisa ter um estabelecimento vinculado para gerar o QR Code.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Select establishment */}
      {establishments.length > 1 && (
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Selecione o estabelecimento:</label>
          <select
            value={selectedEst || ""}
            onChange={(e) => setSelectedEst(Number(e.target.value))}
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground"
          >
            {establishments.map((est: any) => (
              <option key={est.id} value={est.id}>{est.name}</option>
            ))}
          </select>
        </div>
      )}

      {selected && (
        <div className="text-center space-y-4">
          <h3 className="font-display text-xl text-foreground">{selected.name}</h3>
          <p className="text-sm text-muted-foreground">
            Imprima este QR Code e coloque na entrada ou nas mesas do seu estabelecimento.
          </p>

          {/* QR Code */}
          <div id="qr-code-canvas" className="inline-block bg-white p-6 rounded-xl">
            <QRCodeCanvas value={qrUrl} size={256} level="H" includeMargin={true} />
          </div>

          <p className="text-xs text-muted-foreground font-mono break-all">{qrUrl}</p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar PNG
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copiar Link
            </button>
          </div>

          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-xl text-left">
            <h4 className="font-semibold text-foreground text-sm mb-2">Como funciona:</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>O cliente escaneia o QR Code ao chegar no seu estabelecimento</li>
              <li>Ele é direcionado para o cardápio do seu local no Avalyarin</li>
              <li>Um pop-up pergunta se ele tem código promocional</li>
              <li>Após consumir, ele pode avaliar a experiência</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROMO CODES TAB
// ============================================================
export function PromoCodesTab() {
  const { data: myCodes, refetch } = trpc.promo.myCodes.useQuery();
  const createMutation = trpc.promo.create.useMutation({
    onSuccess: () => {
      toast.success("Código criado! Aguardando aprovação do admin.");
      refetch();
      setShowCreate(false);
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.promo.delete.useMutation({
    onSuccess: () => {
      toast.success("Código excluído.");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percentage" | "buy_one_get_one" | "free_item" | "fixed_discount">("percentage");
  const [formValue, setFormValue] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formFirstVisit, setFormFirstVisit] = useState(false);

  const resetForm = () => {
    setFormCode("");
    setFormType("percentage");
    setFormValue("");
    setFormDescription("");
    setFormMaxUses("");
    setFormFirstVisit(false);
  };

  const handleCreate = () => {
    if (!formCode.trim()) {
      toast.error("Informe o código");
      return;
    }
    createMutation.mutate({
      code: formCode.trim(),
      type: formType,
      value: formValue ? Number(formValue) : undefined,
      description: formDescription || undefined,
      maxUses: formMaxUses ? Number(formMaxUses) : undefined,
      firstVisitOnly: formFirstVisit,
    });
  };

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_approval: { text: "Aguardando", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
    active: { text: "Ativo", color: "text-green-400 bg-green-500/10 border-green-500/30" },
    paused: { text: "Pausado", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
    rejected: { text: "Rejeitado", color: "text-red-400 bg-red-500/10 border-red-500/30" },
    expired: { text: "Expirado", color: "text-muted-foreground bg-muted/50 border-border" },
  };

  const typeLabel: Record<string, string> = {
    percentage: "% Desconto",
    buy_one_get_one: "Pague 1 Leve 2",
    free_item: "Item Grátis",
    fixed_discount: "R$ Desconto",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-foreground">Meus Códigos</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Criar Código
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Código (ex: SAMBA10)</label>
            <input
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              placeholder="SAMBA10"
              maxLength={20}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono uppercase mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Tipo</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
              >
                <option value="percentage">% Desconto</option>
                <option value="buy_one_get_one">Pague 1 Leve 2</option>
                <option value="free_item">Item Grátis</option>
                <option value="fixed_discount">R$ Desconto</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Valor (se aplicável)</label>
              <input
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder="10"
                type="number"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Descrição (opcional)</label>
            <input
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="10% de desconto na conta"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Limite de usos (total)</label>
              <input
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
                placeholder="100"
                type="number"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={formFirstVisit}
                  onChange={(e) => setFormFirstVisit(e.target.checked)}
                  className="rounded border-border"
                />
                Só 1ª visita
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? "Criando..." : "Criar Código"}
            </button>
            <button
              onClick={() => { setShowCreate(false); resetForm(); }}
              className="px-4 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            * Todos os códigos precisam de aprovação do administrador antes de ficarem ativos.
          </p>
        </div>
      )}

      {/* List of codes */}
      {!myCodes || myCodes.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Você ainda não criou nenhum código promocional.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myCodes.map((code: any) => {
            const status = statusLabel[code.status] || statusLabel.expired;
            return (
              <div key={code.id} className="p-4 bg-card border border-border/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-lg font-bold text-primary">{code.code}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  {["pending_approval", "paused"].includes(code.status) && (
                    <button
                      onClick={() => deleteMutation.mutate({ codeId: code.id })}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{typeLabel[code.type] || code.type}</span>
                  {code.value && <span>• Valor: {code.type === "percentage" ? `${code.value}%` : `R$${code.value}`}</span>}
                  {code.maxUses && <span>• Limite: {code.maxUses} usos</span>}
                  {code.firstVisitOnly && <span>• Só 1ª visita</span>}
                </div>
                {code.description && (
                  <p className="text-xs text-muted-foreground/80 mt-1">{code.description}</p>
                )}
                {code.adminNotes && code.status === "rejected" && (
                  <p className="text-xs text-red-400 mt-1">Motivo: {code.adminNotes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PartnershipsTab() {
  const { data: establishments } = trpc.business.myEstablishments.useQuery();
  const [selectedEstab, setSelectedEstab] = useState<number | null>(null);
  const [showPropose, setShowPropose] = useState(false);
  const [partnershipType, setPartnershipType] = useState<"specialist" | "business">("specialist");
  const [proposeEspecialistaId, setProposeEspecialistaId] = useState<number | null>(null);
  const [proposePartnerEstabId, setProposePartnerEstabId] = useState<number | null>(null);
  const [proposeTerms, setProposeTerms] = useState("");

  const estabId = selectedEstab || (establishments && establishments.length > 0 ? establishments[0].id : null);

  const { data: partnerships, isLoading } = trpc.business.partnerships.useQuery(
    { establishmentId: estabId! },
    { enabled: !!estabId }
  );
    const { data: specialists } = trpc.business.availableSpecialists.useQuery(
    undefined,
    { enabled: showPropose && partnershipType === "specialist" }
  );
  const [partnerSearch, setPartnerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(partnerSearch), 300);
    return () => clearTimeout(timer);
  }, [partnerSearch]);

  const { data: availableEstabs } = trpc.business.availableEstablishments.useQuery(
    { excludeIds: estabId ? [estabId] : [], search: debouncedSearch || undefined },
    { enabled: showPropose && partnershipType === "business" }
  );
  const respondMutation = trpc.business.respondPartnership.useMutation();
  const proposeMutation = trpc.business.proposePartnership.useMutation();
  const respondB2BMutation = trpc.business.respondToB2BPartnership.useMutation();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<Record<number, string>>({});

  const handlePropose = async () => {
    if (!estabId) return;
    if (partnershipType === "specialist" && !proposeEspecialistaId) return;
    if (partnershipType === "business" && !proposePartnerEstabId) return;
    try {
      await proposeMutation.mutateAsync({
        partnershipType,
        establishmentId: estabId,
        specialistId: partnershipType === "specialist" ? proposeEspecialistaId! : undefined,
        partnerEstablishmentId: partnershipType === "business" ? proposePartnerEstabId! : undefined,
        terms: proposeTerms || undefined,
      });
      utils.business.partnerships.invalidate();
      toast.success("Proposta de parceria enviada!");
      setShowPropose(false);
      setProposeEspecialistaId(null);
      setProposePartnerEstabId(null);
      setProposeTerms("");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao propor parceria");
    }
  };

  const handleRespond = async (partnershipId: number, accept: boolean) => {
    try {
      await respondMutation.mutateAsync({
        partnershipId,
        accept,
        estabNotes: notes[partnershipId] || undefined,
      });
      utils.business.partnerships.invalidate();
      toast.success(accept ? "Parceria aceita! Aguardando aprovação." : "Parceria recusada.");
    } catch {
      toast.error("Erro ao responder parceria");
    }
  };

  const statusLabels: Record<string, string> = {
    pending_estab: "Aguardando resposta do parceiro",
    pending_support: "Aguardando Aprovação",
    active: "Ativa",
    rejected_estab: "Recusada pelo parceiro",
    rejected_support: "Rejeitada pela equipe",
    cancelled: "Cancelada",
    expired: "Expirada",
  };
  const statusDescriptions: Record<string, string> = {
    pending_support: "A revisão dos pedidos pode demorar até 24 horas.",
  };
  const statusColors: Record<string, string> = {
    pending_estab: "text-orange-400",
    pending_support: "text-blue-400",
    active: "text-green-400",
    rejected_estab: "text-destructive",
    rejected_support: "text-destructive",
    cancelled: "text-muted-foreground",
    expired: "text-muted-foreground",
  };

  if (!establishments || establishments.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Nenhum estabelecimento vinculado.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl tracking-wider text-foreground">PARCERIAS</h2>
        <div className="flex items-center gap-3">
          {establishments.length > 1 && (
            <select
              value={estabId || ""}
              onChange={(e) => setSelectedEstab(Number(e.target.value))}
              className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 text-foreground"
            >
              {establishments.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowPropose(!showPropose)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Propor Parceria
          </button>
        </div>
      </div>

      {/* Propose Partnership Form */}
      {showPropose && (
        <div className="mb-6 p-5 rounded-xl bg-card border border-primary/30">
          <h3 className="font-display text-lg tracking-wider text-primary mb-4">PROPOR PARCERIA</h3>
          <div className="space-y-3">
            {/* Dropdown tipo de parceria */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo de Parceria</label>
              <select
                value={partnershipType}
                onChange={(e) => {
                  setPartnershipType(e.target.value as "specialist" | "business");
                  setProposeEspecialistaId(null);
                  setProposePartnerEstabId(null);
                }}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              >
                <option value="specialist">Especialista</option>
                <option value="business">Business (outro estabelecimento)</option>
              </select>
            </div>

            {/* Seleção do estabelecimento de origem (se tiver mais de um) */}
            {establishments.length > 1 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Seu Estabelecimento</label>
                <select
                  value={estabId || ""}
                  onChange={(e) => setSelectedEstab(Number(e.target.value))}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {establishments.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Formulário condicional: Especialista */}
            {partnershipType === "specialist" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Especialista</label>
                <select
                  value={proposeEspecialistaId || ""}
                  onChange={(e) => setProposeEspecialistaId(Number(e.target.value))}
                  className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  <option value="">Selecione um especialista...</option>
                  {specialists?.map((inf: any) => (
                    <option key={inf.id} value={inf.id}>{inf.name || inf.username || `Especialista #${inf.id}`}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Formulário condicional: Business (B2B) */}
            {partnershipType === "business" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Estabelecimento Parceiro</label>
                <input
                  type="text"
                  value={partnerSearch}
                  onChange={(e) => {
                    setPartnerSearch(e.target.value);
                    if (!e.target.value) setProposePartnerEstabId(null);
                  }}
                  placeholder="Digite o nome do estabelecimento..."
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                />
                {partnerSearch.trim().length > 0 && availableEstabs && availableEstabs.length > 0 && !proposePartnerEstabId && (
                  <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-card">
                    {availableEstabs.map((e: any) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setProposePartnerEstabId(e.id);
                          setPartnerSearch(e.name + (e.neighborhood ? ` — ${e.neighborhood}` : ""));
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors border-b border-border/30 last:border-b-0"
                      >
                        <span className="font-medium">{e.name}</span>
                        {e.neighborhood && <span className="text-muted-foreground"> — {e.neighborhood}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {partnerSearch.trim().length > 0 && availableEstabs && availableEstabs.length === 0 && !proposePartnerEstabId && (
                  <p className="text-xs text-muted-foreground mt-1">Nenhum estabelecimento encontrado.</p>
                )}
                {proposePartnerEstabId && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-green-400">✓ Selecionado</span>
                    <button
                      type="button"
                      onClick={() => { setProposePartnerEstabId(null); setPartnerSearch(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Alterar
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Termos da parceria (opcional)</label>
              <input
                type="text"
                value={proposeTerms}
                onChange={(e) => setProposeTerms(e.target.value)}
                placeholder={partnershipType === "specialist" ? "Ex: 2 avaliações por mês, divulgação no perfil..." : "Ex: cross-promotion, evento conjunto, combo compartilhado..."}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePropose}
                disabled={(partnershipType === "specialist" ? !proposeEspecialistaId : !proposePartnerEstabId) || proposeMutation.isPending}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {proposeMutation.isPending ? "Enviando..." : "Enviar Proposta"}
              </button>
              <button
                onClick={() => setShowPropose(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando parcerias...</p>
      ) : partnerships?.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma parceria encontrada para este estabelecimento.</p>
      ) : (
        <div className="space-y-4">
          {partnerships?.map((p: any) => (
            <div key={p.id} className="p-5 rounded-xl bg-card border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      p.partnershipType === "business" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                    }`}>
                      {p.partnershipType === "business" ? "B2B" : "Especialista"}
                    </span>
                    <h3 className="font-medium text-foreground">
                      {p.partnershipType === "business" ? (p.partnerEstablishmentName || "Estabelecimento") : (p.especialistaName || "Especialista")}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Proposta em {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${statusColors[p.status]}`}>
                    {statusLabels[p.status] || p.status}
                  </span>
                  {statusDescriptions[p.status] && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {statusDescriptions[p.status]}
                    </p>
                  )}
                </div>
              </div>

              {p.terms && (
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-medium text-foreground">Termos:</span> {p.terms}
                </p>
              )}

              {p.status === "pending_estab" && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/30">
                  <input
                    type="text"
                    placeholder="Notas (opcional)"
                    value={notes[p.id] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(p.id, true)}
                      className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Aceitar
                    </button>
                    <button
                      onClick={() => handleRespond(p.id, false)}
                      className="flex items-center gap-1 px-4 py-2 text-sm bg-destructive hover:bg-destructive/80 text-white rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Recusar
                    </button>
                  </div>
                </div>
              )}

              {p.estabNotes && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Sua nota: {p.estabNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


interface BusinessPlanTabProps {
  establishmentId?: number | null;
}

export function BusinessPlanTab({ establishmentId }: BusinessPlanTabProps) {
  const { data: establishments } = trpc.business.myEstablishments.useQuery(undefined, {
    enabled: !establishmentId,
  });
  const [selectedEst, setSelectedEst] = useState<number | null>(null);

  const estId = establishmentId || selectedEst || (establishments && establishments.length > 0 ? establishments[0].id : null);
  const { data: planDetails, refetch } = trpc.plans.businessPlan.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  const upgradeMutation = trpc.plans.upgradeBusiness.useMutation({
    onSuccess: () => {
      toast.success("Plano empresarial ativado!", { description: "Seu estabelecimento agora é Premium." });
      refetch();
    },
    onError: (err) => toast.error("Erro ao ativar plano", { description: err.message }),
  });

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum estabelecimento vinculado.</p>
      </div>
    );
  }

  const currentPlan = planDetails?.plan ?? "free";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Establishment selector removed — controlled by parent */}

      {/* Current plan */}
      <div className="p-6 rounded-xl bg-card border border-border/50 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            currentPlan === "premium" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
          }`}>
            {currentPlan === "premium" ? <Zap className="w-5 h-5" /> : <Store className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-display text-lg tracking-wider text-foreground">
              {currentPlan === "premium" ? "PREMIUM" : "BÁSICO"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {currentPlan === "premium" ? "R$ 97,00/mês" : "Grátis"}
            </p>
          </div>
          {currentPlan === "premium" && (
            <span className="ml-auto px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-display tracking-wider">
              ATIVO
            </span>
          )}
        </div>

        {/* Features comparison */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className={`p-4 rounded-lg border ${currentPlan === "free" ? "border-primary/30 bg-primary/5" : "border-border/30"}`}>
            <h4 className="font-display text-sm tracking-wider text-foreground mb-3">BÁSICO</h4>
            <ul className="space-y-2">
              {["Perfil do estabelecimento", "QR Code personalizado", "1 código promo ativo", "Notificações"].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground/70">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={`p-4 rounded-lg border ${currentPlan === "premium" ? "border-primary/30 bg-primary/5" : "border-border/30"}`}>
            <h4 className="font-display text-sm tracking-wider text-primary mb-3">PREMIUM</h4>
            <ul className="space-y-2">
              {["Dashboard completo com gráficos", "20 insights de desempenho", "Plano de Ação com IA", "Detecção de outliers", "Códigos promo ilimitados", "Destaque no app", "Tudo do Básico"].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                  <span className="text-foreground/70">{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-numbers text-lg font-bold text-primary">R$ 97<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
          </div>
        </div>
      </div>

      {/* Upgrade button */}
      {currentPlan === "free" && (
        <button
          onClick={() => upgradeMutation.mutate({ establishmentId: estId! })}
          disabled={upgradeMutation.isPending}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display tracking-wider text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {upgradeMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Ativando...</>
          ) : (
            <><Crown className="w-4 h-4" /> ATIVAR PLANO PREMIUM</>
          )}
        </button>
      )}

      {currentPlan === "free" && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Na versão beta, o upgrade é concedido sem cobrança real.
        </p>
      )}
    </div>
  );
}

export function BusinessInsightsTab() {
  const { data: establishments, isLoading: loadingEstabs } = trpc.business.myEstablishments.useQuery();
  const [selectedEstId, setSelectedEstId] = useState<number | null>(null);

  // Auto-select first establishment
  const estId = selectedEstId || (establishments && establishments.length > 0 ? establishments[0].id : null);

  const { data: insights, isLoading: loadingInsights } = trpc.analytics.businessInsights.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  if (loadingEstabs) return <div className="text-muted-foreground">Carregando...</div>;

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">SEM DADOS</h3>
        <p className="text-muted-foreground text-sm">Você precisa ter estabelecimentos vinculados para ver insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider text-foreground">INSIGHTS</h2>
        {establishments.length > 1 && (
          <select
            value={estId || ""}
            onChange={(e) => setSelectedEstId(Number(e.target.value))}
            className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
          >
            {establishments.map((est: any) => (
              <option key={est.id} value={est.id}>{est.name}</option>
            ))}
          </select>
        )}
      </div>

      {loadingInsights ? (
        <div className="text-muted-foreground">Carregando insights...</div>
      ) : insights ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Total de Avaliações</p>
              <p className="font-numbers text-2xl font-bold text-foreground">{insights.overview.totalRatings}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Nota Média</p>
              <p className="font-numbers text-2xl font-bold text-primary">{insights.overview.avgScore}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Promos Criados</p>
              <p className="font-numbers text-2xl font-bold text-foreground">{insights.overview.totalPromos}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Códigos Usados</p>
              <p className="font-numbers text-2xl font-bold text-foreground">{insights.overview.promoUses}</p>
            </div>
          </div>

          {/* Score Over Time */}
          {insights.scoreOverTime.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Nota Média por Dia (30 dias)</h3>
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-end gap-1 h-24">
                  {insights.scoreOverTime.map((day: any, i: number) => {
                    const height = day.avgScore ? (day.avgScore / 10) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${day.date}: ${day.avgScore}`}>
                        <div
                          className="w-full bg-primary/80 rounded-t min-h-[2px]"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{insights.scoreOverTime[0]?.date?.slice(5) || ""}</span>
                  <span className="text-[10px] text-muted-foreground">{insights.scoreOverTime[insights.scoreOverTime.length - 1]?.date?.slice(5) || ""}</span>
                </div>
              </div>
            </div>
          )}

          {/* Top Items */}
          {insights.topItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Top Itens Avaliados</h3>
              <div className="space-y-2">
                {insights.topItems.map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-card border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-numbers text-sm font-bold text-primary/50 w-5">{i + 1}</span>
                      <span className="text-sm text-foreground">{item.itemName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{item.ratingCount}x</span>
                      <span className="font-numbers text-sm font-bold text-primary">{item.avgScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Trend */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Tendência Recente</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Últimos 7 dias</p>
                <p className="font-numbers text-xl font-bold text-foreground">
                  {insights.recentTrend.last7DaysAvg !== null ? insights.recentTrend.last7DaysAvg : "—"}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Últimos 30 dias</p>
                <p className="font-numbers text-xl font-bold text-foreground">
                  {insights.recentTrend.last30DaysAvg !== null ? insights.recentTrend.last30DaysAvg : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Worst Items */}
          {insights.worstItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Itens com Menor Nota</h3>
              <div className="space-y-2">
                {insights.worstItems.map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-card border border-red-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-numbers text-sm font-bold text-red-400/50 w-5">{i + 1}</span>
                      <span className="text-sm text-foreground">{item.itemName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{item.ratingCount}x</span>
                      <span className="font-numbers text-sm font-bold text-red-400">{item.avgScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}


// ============================================================
// CALENDÁRIO BUSINESS TAB — Eventos agendados nos estabelecimentos
// ============================================================

export function CalendarioBusinessTab() {
  const { data: establishments, isLoading: loadingEstabs } = trpc.business.myEstablishments.useQuery();
  const [selectedEstabId, setSelectedEstabId] = useState<number | null>(null);
  const [showPast, setShowPast] = useState(false);

  // Auto-select first establishment
  const estabId = selectedEstabId || (establishments && establishments.length > 0 ? establishments[0].id : null);

  const { data: events, isLoading: loadingEvents } = trpc.events.listByEstablishment.useQuery(
    { establishmentId: estabId!, upcoming: !showPast },
    { enabled: !!estabId }
  );

  if (loadingEstabs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum estabelecimento vinculado.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Solicite a vinculação de um estabelecimento para ver eventos agendados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Calendário de Eventos</h3>
          <p className="text-sm text-muted-foreground">Eventos agendados por grupos no seu estabelecimento</p>
        </div>

        {/* Establishment selector */}
        {establishments.length > 1 && (
          <select
            value={estabId || ''}
            onChange={(e) => setSelectedEstabId(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground"
          >
            {establishments.map((est: any) => (
              <option key={est.id} value={est.id}>{est.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Toggle upcoming/past */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPast(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !showPast ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Próximos
        </button>
        <button
          onClick={() => setShowPast(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showPast ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Passados
        </button>
      </div>

      {/* Events list */}
      {loadingEvents ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : !events || events.length === 0 ? (
        <div className="text-center py-12 border border-border/30 rounded-xl bg-card/50">
          <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {showPast ? 'Nenhum evento passado encontrado.' : 'Nenhum evento agendado para este estabelecimento.'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {!showPast && 'Quando grupos agendarem eventos aqui, eles aparecerão nesta lista.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => (
            <div key={event.id} className="p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{event.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Grupo: <span className="text-foreground/80">{event.groupName}</span>
                    {' · '}Criado por: <span className="text-foreground/80">{event.creatorName}</span>
                  </p>
                  {event.description && (
                    <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{event.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium text-primary">
                    {new Date(event.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.eventDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* RSVP counts */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center gap-1.5 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-medium">{event.rsvpCounts.confirmed}</span>
                  <span className="text-muted-foreground">confirmados</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">{event.rsvpCounts.maybe}</span>
                  <span className="text-muted-foreground">talvez</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 font-medium">{event.rsvpCounts.declined}</span>
                  <span className="text-muted-foreground">não vão</span>
                </div>
                {event.maxGuests && (
                  <div className="flex items-center gap-1.5 text-xs ml-auto">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {event.totalConfirmed}/{event.maxGuests} vagas
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function DestaquesTab() {
  const { data: estabs, isLoading } = trpc.business.myEstablishments.useQuery();
  const utils = trpc.useUtils();
  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success("Destaque criado com sucesso!");
      setShowForm(false);
      setTitle("");
      setDescription("");
      setImageUrl("");
      setLinkUrl("");
      setPostType("brand");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar destaque"),
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedEstab, setSelectedEstab] = useState<number | null>(null);
  const [postType, setPostType] = useState<"brand" | "menu_daily" | "promotion" | "event" | "new_item" | "collab">("brand");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const POST_TYPE_LABELS: Record<string, string> = {
    brand: "Divulgação (30 dias)",
    menu_daily: "Cardápio do Dia (1 dia)",
    promotion: "Promoção (7 dias)",
    event: "Evento (15 dias)",
    new_item: "Novidade (30 dias)",
    collab: "Parceria (21 dias)",
  };

  const POST_TYPE_DURATIONS: Record<string, number> = {
    brand: 30,
    menu_daily: 1,
    promotion: 7,
    event: 15,
    new_item: 30,
    collab: 21,
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload falhou");
      const data = await res.json();
      setImageUrl(data.url);
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedEstab) {
      toast.error("Selecione um estabelecimento");
      return;
    }
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!imageUrl) {
      toast.error("Imagem é obrigatória para o destaque");
      return;
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + POST_TYPE_DURATIONS[postType] * 24 * 60 * 60 * 1000);
    createPost.mutate({
      establishmentId: selectedEstab,
      type: postType,
      title: title.trim(),
      description: description.trim() || undefined,
      imageUrl,
      linkUrl: linkUrl.trim() || undefined,
      startsAt: now,
      expiresAt,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!estabs || estabs.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Você precisa ter um estabelecimento para criar destaques.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground/80">
          <strong>Destaques:</strong> Publique conteúdos em formato 9:16 que aparecem na Home do app para todos os usuários.
          Cada tipo de destaque tem uma duração específica e expira automaticamente.
        </p>
      </div>

      {!showForm ? (
        <button
          onClick={() => {
            setShowForm(true);
            if (estabs.length === 1) setSelectedEstab((estabs[0] as any).id);
          }}
          className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors flex items-center justify-center gap-2 text-primary"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Criar Novo Destaque</span>
        </button>
      ) : (
        <div className="p-5 rounded-xl border border-border/50 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-sm tracking-wider text-foreground">NOVO DESTAQUE</h4>
            <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Cancelar
            </button>
          </div>

          {/* Selecionar estabelecimento */}
          {estabs.length > 1 && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Estabelecimento</label>
              <select
                value={selectedEstab || ""}
                onChange={(e) => setSelectedEstab(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg bg-secondary border border-border/50 text-sm text-foreground"
              >
                <option value="">Selecione...</option>
                {estabs.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo de destaque */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Tipo de Destaque</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value as any)}
              className="w-full p-2.5 rounded-lg bg-secondary border border-border/50 text-sm text-foreground"
            >
              {Object.entries(POST_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Happy Hour com 30% OFF"
              className="w-full p-2.5 rounded-lg bg-secondary border border-border/50 text-sm text-foreground"
              maxLength={255}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais sobre o destaque..."
              className="w-full p-2.5 rounded-lg bg-secondary border border-border/50 text-sm text-foreground resize-none"
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Upload de imagem */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Imagem 9:16 *</label>
            {imageUrl ? (
              <div className="relative w-32 h-56 rounded-lg overflow-hidden border border-border/50">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center"
                >
                  <XCircle className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className="w-full p-6 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/40 transition-colors flex flex-col items-center gap-2 text-muted-foreground"
              >
                {imageUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
                <span className="text-xs">{imageUploading ? "Enviando..." : "Clique para enviar imagem (max 5MB)"}</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Link (opcional) */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Link (opcional)</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 rounded-lg bg-secondary border border-border/50 text-sm text-foreground"
            />
          </div>

          {/* Info de duração */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-200">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Este destaque ficará ativo por <strong>{POST_TYPE_DURATIONS[postType]} {POST_TYPE_DURATIONS[postType] === 1 ? "dia" : "dias"}</strong> após a publicação e expirará automaticamente.
            </p>
          </div>

          {/* Botão de enviar */}
          <button
            onClick={handleSubmit}
            disabled={createPost.isPending || !title.trim() || !imageUrl}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createPost.isPending ? "Publicando..." : "Publicar Destaque"}
          </button>
        </div>
      )}
    </div>
  );
}


export function BroadcastTab() {
  const { data: estabs, isLoading } = trpc.business.myEstablishments.useQuery();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!estabs || estabs.length === 0) {
    return (
      <div className="text-center py-12">
        <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Você precisa ter um estabelecimento para enviar transmissões.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground/80">
          <strong>Lista de Transmissão:</strong> Envie mensagens para todos que salvaram seu estabelecimento. 
          Eles recebem suas novidades automaticamente — como um canal de comunicação direto com seus clientes.
        </p>
      </div>
      {estabs.map((estab: any) => (
        <div key={estab.id} className="p-4 rounded-xl border border-border/50 bg-card">
          <h4 className="font-display text-sm tracking-wider text-foreground mb-4">{estab.name}</h4>
          <BusinessBroadcast establishmentId={estab.id} />
        </div>
      ))}
    </div>
  );
}


// ============================================================
// EVENTOS DO ESTABELECIMENTO TAB
// ============================================================
const EVENT_TYPE_OPTIONS = [
  { value: "esporte", label: "Esporte", icon: "⚽" },
  { value: "show", label: "Show", icon: "🎤" },
  { value: "festa", label: "Festa", icon: "🎉" },
  { value: "gastronomia", label: "Gastronomia", icon: "🍽️" },
  { value: "cultural", label: "Cultural", icon: "🎭" },
  { value: "stand_up", label: "Stand-Up", icon: "😂" },
  { value: "quiz", label: "Quiz / Trivia", icon: "🧠" },
  { value: "degustacao", label: "Degustação", icon: "🍷" },
  { value: "workshop", label: "Workshop", icon: "🔧" },
  { value: "karaoke", label: "Karaokê", icon: "🎵" },
  { value: "dj", label: "DJ Set", icon: "🎧" },
  { value: "sertanejo", label: "Sertanejo", icon: "🤠" },
  { value: "pagode", label: "Pagode", icon: "🥁" },
  { value: "forro", label: "Forró", icon: "💃" },
  { value: "samba", label: "Samba", icon: "🎶" },
  { value: "outro", label: "Outro", icon: "📌" },
];

export function EventosEstabTab() {
  const { data: estabs, isLoading } = trpc.business.myEstablishments.useQuery();
  const utils = trpc.useUtils();
  const createEvent = trpc.business.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Evento criado com sucesso!");
      resetForm();
      utils.business.listEvents.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar evento"),
  });
  const cancelEvent = trpc.business.cancelEvent.useMutation({
    onSuccess: () => {
      toast.success("Evento cancelado.");
      utils.business.listEvents.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cancelar"),
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedEstab, setSelectedEstab] = useState<number | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageKey, setCoverImageKey] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationType, setLocationType] = useState<"establishment" | "custom">("establishment");
  const [customAddress, setCustomAddress] = useState("");
  const [customAddressNumber, setCustomAddressNumber] = useState("");
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const [customCity, setCustomCity] = useState("São Paulo");
  const [entryType, setEntryType] = useState<"free" | "paid">("free");
  const [paidType, setPaidType] = useState<"single" | "batches">("single");
  const [singlePrice, setSinglePrice] = useState("");
  const [hasDoorPrice, setHasDoorPrice] = useState(false);
  const [doorPrice, setDoorPrice] = useState("");
  const [batches, setBatches] = useState<{ batchNumber: number; batchName: string; price: string; expiresAt: string }[]>([
    { batchNumber: 1, batchName: "1º Lote", price: "", expiresAt: "" },
  ]);
  const [eventType, setEventType] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [addressError, setAddressError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // List events for selected establishment
  const { data: eventsList } = trpc.business.listEvents.useQuery(
    { establishmentId: selectedEstab! },
    { enabled: !!selectedEstab }
  );

  const resetForm = () => {
    setShowForm(false);
    setTitle("");
    setDescription("");
    setCoverImageUrl("");
    setCoverImageKey("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setLocationType("establishment");
    setCustomAddress("");
    setCustomAddressNumber("");
    setCustomNeighborhood("");
    setCustomCity("São Paulo");
    setEntryType("free");
    setPaidType("single");
    setSinglePrice("");
    setHasDoorPrice(false);
    setDoorPrice("");
    setBatches([{ batchNumber: 1, batchName: "1º Lote", price: "", expiresAt: "" }]);
    setEventType("");
    setTicketUrl("");
    setAddressError("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-cover", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload falhou");
      const data = await res.json();
      setCoverImageUrl(data.url);
      setCoverImageKey(data.key || "");
      toast.success("Imagem de capa enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setImageUploading(false);
    }
  };

  const addBatch = () => {
    if (batches.length >= 10) {
      toast.error("Máximo de 10 lotes");
      return;
    }
    const next = batches.length + 1;
    setBatches([...batches, { batchNumber: next, batchName: `${next}º Lote`, price: "", expiresAt: "" }]);
  };

  const removeBatch = (index: number) => {
    if (batches.length <= 1) return;
    const updated = batches.filter((_, i) => i !== index).map((b, i) => ({
      ...b,
      batchNumber: i + 1,
      batchName: `${i + 1}º Lote`,
    }));
    setBatches(updated);
  };

  const handleCustomAddressChange = (val: string) => {
    setCustomAddress(val);
    if (val.trim()) {
      const result = validateAddress(val);
      setAddressError(result.valid ? "" : (result.error || ""));
    } else {
      setAddressError("");
    }
  };

  const handleSubmit = () => {
    if (!selectedEstab) { toast.error("Selecione um estabelecimento"); return; }
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    if (description.length < 200 || description.length > 550) { toast.error("Descrição deve ter entre 200 e 550 caracteres"); return; }
    if (!coverImageUrl) { toast.error("Foto de capa é obrigatória"); return; }
    if (!startDate || !startTime) { toast.error("Data e hora de início são obrigatórios"); return; }
    if (!endDate || !endTime) { toast.error("Data e hora de término são obrigatórios"); return; }
    if (!eventType) { toast.error("Selecione o tipo de atração"); return; }

    if (locationType === "custom") {
      const addrResult = validateAddress(customAddress);
      if (!addrResult.valid) { toast.error(addrResult.error || "Endereço inválido"); return; }
      if (!customNeighborhood.trim()) { toast.error("Bairro é obrigatório para local customizado"); return; }
    }

    const startTs = new Date(`${startDate}T${startTime}`).getTime();
    const endTs = new Date(`${endDate}T${endTime}`).getTime();

    if (endTs <= startTs) { toast.error("Horário de término deve ser posterior ao início"); return; }

    const payload: any = {
      establishmentId: selectedEstab,
      title: title.trim(),
      description: description.trim(),
      coverImageUrl,
      coverImageKey: coverImageKey || undefined,
      startDate: startTs,
      endDate: endTs,
      locationType,
      entryType,
      eventType,
      ticketUrl: ticketUrl.trim() || undefined,
    };

    if (locationType === "custom") {
      payload.customAddress = customAddress.trim();
      payload.customAddressNumber = customAddressNumber.trim() || undefined;
      payload.customNeighborhood = customNeighborhood.trim();
      payload.customCity = customCity.trim();
    }

    if (entryType === "paid") {
      payload.paidType = paidType;
      if (paidType === "single") {
        payload.singlePrice = parseFloat(singlePrice);
        if (isNaN(payload.singlePrice) || payload.singlePrice <= 0) { toast.error("Valor da entrada é obrigatório"); return; }
        payload.hasDoorPrice = hasDoorPrice;
        if (hasDoorPrice) {
          payload.doorPrice = parseFloat(doorPrice);
          if (isNaN(payload.doorPrice) || payload.doorPrice <= 0) { toast.error("Valor na porta é obrigatório"); return; }
        }
      } else {
        const parsedBatches = batches.map(b => ({
          batchNumber: b.batchNumber,
          batchName: b.batchName,
          price: parseFloat(b.price),
          expiresAt: b.expiresAt ? new Date(b.expiresAt + "T23:59:59").getTime() : undefined,
        }));
        if (parsedBatches.some(b => isNaN(b.price) || b.price <= 0)) { toast.error("Todos os lotes devem ter valor válido"); return; }
        payload.batches = parsedBatches;
      }
    }

    createEvent.mutate(payload);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!estabs || estabs.length === 0) {
    return (
      <div className="text-center py-12">
        <Ticket className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Você precisa ter um estabelecimento para criar eventos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground/80">
          <strong>Eventos do Estabelecimento:</strong> Crie eventos para seu bar ou restaurante — transmissões de jogos, shows, festas, degustações e mais. 
          Os eventos ficam visíveis na aba "Eventos" da página do seu estabelecimento até o fim do evento.
        </p>
      </div>

      {/* Establishment selector */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Estabelecimento</label>
        <select
          className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
          value={selectedEstab || ""}
          onChange={e => setSelectedEstab(Number(e.target.value) || null)}
        >
          <option value="">Selecione...</option>
          {estabs.map((e: any) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {selectedEstab && (
        <>
          {/* Create button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Novo Evento
            </button>
          )}

          {/* Creation form */}
          {showForm && (
            <div className="p-5 rounded-xl border border-primary/30 bg-card space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-lg tracking-wider text-primary">NOVO EVENTO</h4>
                <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
              </div>

              {/* 1. Cover Image */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Foto de Capa *</label>
                {coverImageUrl ? (
                  <div className="relative">
                    <img src={coverImageUrl} alt="Capa" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => { setCoverImageUrl(""); setCoverImageKey(""); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground hover:bg-background"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="w-full h-48 rounded-lg border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
                  >
                    {imageUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-8 h-8" />}
                    <span className="text-xs">{imageUploading ? "Enviando..." : "Clique para enviar imagem (max 5MB)"}</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Título do Evento *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Transmissão Brasil x Escócia"
                  className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                  maxLength={255}
                />
              </div>

              {/* 2. Start Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data de Início *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Horário de Início *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                  />
                </div>
              </div>

              {/* 3. End Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Data de Término *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Horário de Término *</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                  />
                </div>
              </div>

              {/* 4. Description */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Descrição * <span className={`${description.length < 200 ? "text-red-400" : description.length > 550 ? "text-red-400" : "text-green-400"}`}>({description.length}/550)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva o evento com detalhes (mínimo 200, máximo 550 caracteres)"
                  className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm min-h-[100px] resize-none"
                  maxLength={550}
                />
                {description.length > 0 && description.length < 200 && (
                  <p className="text-xs text-red-400 mt-1">Faltam {200 - description.length} caracteres para o mínimo</p>
                )}
              </div>

              {/* Local */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Local do Evento</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLocationType("establishment")}
                    className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                      locationType === "establishment"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <Store className="w-4 h-4 mx-auto mb-1" />
                    No Estabelecimento
                  </button>
                  <button
                    onClick={() => setLocationType("custom")}
                    className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                      locationType === "custom"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <MapPin className="w-4 h-4 mx-auto mb-1" />
                    Outro Local
                  </button>
                </div>

                {locationType === "custom" && (
                  <div className="mt-3 space-y-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Endereço *</label>
                      <input
                        type="text"
                        value={customAddress}
                        onChange={e => handleCustomAddressChange(e.target.value)}
                        placeholder="Ex: Rua Augusta, Avenida Paulista..."
                        className={`w-full p-2 rounded-lg bg-secondary border text-foreground text-sm ${addressError ? "border-red-400" : "border-border/50"}`}
                      />
                      {addressError && <p className="text-xs text-red-400 mt-1">{addressError}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Deve começar com: {VALID_LOGRADOUROS.slice(0, 6).join(", ")}...
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Número</label>
                        <input
                          type="text"
                          value={customAddressNumber}
                          onChange={e => setCustomAddressNumber(e.target.value)}
                          placeholder="123 ou s/n"
                          className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Bairro *</label>
                        <input
                          type="text"
                          value={customNeighborhood}
                          onChange={e => setCustomNeighborhood(e.target.value)}
                          placeholder="Ex: Vila Madalena"
                          className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Cidade</label>
                      <input
                        type="text"
                        value={customCity}
                        onChange={e => setCustomCity(e.target.value)}
                        className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Entry Type */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Tipo de Entrada *</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEntryType("free")}
                    className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                      entryType === "free"
                        ? "border-green-500 bg-green-500/10 text-green-400"
                        : "border-border/50 text-muted-foreground hover:border-green-500/30"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                    Entrada Gratuita
                  </button>
                  <button
                    onClick={() => setEntryType("paid")}
                    className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                      entryType === "paid"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <DollarSign className="w-4 h-4 mx-auto mb-1" />
                    Entrada Paga
                  </button>
                </div>

                {entryType === "free" && (
                  <div className="mt-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
                    <p className="text-sm text-green-400 font-medium">Evento Gratuito</p>
                  </div>
                )}

                {entryType === "paid" && (
                  <div className="mt-3 space-y-3">
                    {/* Paid type selection */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPaidType("single")}
                        className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                          paidType === "single"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        Pagamento Único
                      </button>
                      <button
                        onClick={() => setPaidType("batches")}
                        className={`flex-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                          paidType === "batches"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        Pagamento por Lotes
                      </button>
                    </div>

                    {/* Single price */}
                    {paidType === "single" && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Valor da Entrada (R$) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={singlePrice}
                            onChange={e => setSinglePrice(e.target.value)}
                            placeholder="100.00"
                            className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="hasDoorPrice"
                            checked={hasDoorPrice}
                            onChange={e => setHasDoorPrice(e.target.checked)}
                            className="rounded border-border/50"
                          />
                          <label htmlFor="hasDoorPrice" className="text-xs text-muted-foreground">Valor diferente na porta</label>
                        </div>
                        {hasDoorPrice && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Valor na Porta (R$) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={doorPrice}
                              onChange={e => setDoorPrice(e.target.value)}
                              placeholder="150.00"
                              className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Batches */}
                    {paidType === "batches" && (
                      <div className="space-y-3">
                        {batches.map((batch, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-16 shrink-0">{batch.batchName}</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={batch.price}
                                onChange={e => {
                                  const updated = [...batches];
                                  updated[index].price = e.target.value;
                                  setBatches(updated);
                                }}
                                placeholder="R$ 0,00"
                                className="flex-1 p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                              />
                              {batches.length > 1 && (
                                <button onClick={() => removeBatch(index)} className="text-red-400 hover:text-red-300">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div className="ml-16 pl-2">
                              <label className="text-[10px] text-muted-foreground/70">Virada automática em:</label>
                              <input
                                type="date"
                                value={batch.expiresAt}
                                onChange={e => {
                                  const updated = [...batches];
                                  updated[index].expiresAt = e.target.value;
                                  setBatches(updated);
                                }}
                                className="w-full p-1.5 rounded-lg bg-secondary border border-border/50 text-foreground text-xs mt-0.5"
                              />
                            </div>
                          </div>
                        ))}
                        {batches.length < 10 && (
                          <button
                            onClick={addBatch}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar Lote
                          </button>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 italic">Quando a data de virada chegar, o próximo lote será ativado automaticamente.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 6. Event Type / Attraction */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Tipo de Atração *</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {EVENT_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setEventType(opt.value)}
                      className={`p-2 rounded-lg border text-xs font-medium transition-all text-center ${
                        eventType === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      <span className="text-lg block mb-0.5">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Ticket URL */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Link de Compra de Ingresso (opcional)</label>
                <input
                  type="url"
                  value={ticketUrl}
                  onChange={e => setTicketUrl(e.target.value)}
                  placeholder="https://www.sympla.com.br/seu-evento"
                  className="w-full p-2 rounded-lg bg-secondary border border-border/50 text-foreground text-sm"
                />
                <p className="text-[10px] text-muted-foreground/60 mt-1">Cole o link do Sympla, Eventbrite ou outro site de venda de ingressos. Os usuários serão direcionados para lá.</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={createEvent.isPending}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createEvent.isPending ? "Criando..." : "Criar Evento"}
              </button>
            </div>
          )}

          {/* Events List */}
          {eventsList && eventsList.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-display text-sm tracking-wider text-foreground">EVENTOS CRIADOS</h4>
              {eventsList.map((ev: any) => {
                const now = Date.now();
                const isActive = ev.status === "active" && ev.endDate >= now;
                const isPast = ev.endDate < now;
                const isCancelled = ev.status === "cancelled";
                const startDt = new Date(ev.startDate);
                const endDt = new Date(ev.endDate);
                const typeInfo = EVENT_TYPE_OPTIONS.find(t => t.value === ev.eventType);

                return (
                  <div key={ev.id} className={`p-4 rounded-xl border ${isActive ? "border-primary/30 bg-card" : "border-border/30 bg-card/50 opacity-70"}`}>
                    {ev.coverImageUrl && (
                      <img src={ev.coverImageUrl} alt={ev.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {typeInfo && <span className="text-sm">{typeInfo.icon}</span>}
                          <h5 className="font-medium text-foreground text-sm">{ev.title}</h5>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{ev.description?.slice(0, 100)}...</p>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {startDt.toLocaleDateString("pt-BR")} {startDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            até {endDt.toLocaleDateString("pt-BR")} {endDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {ev.entryType === "free" && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Gratuito</span>
                          )}
                          {ev.entryType === "paid" && ev.paidType === "single" && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">R$ {ev.singlePrice?.toFixed(2)}</span>
                          )}
                          {ev.entryType === "paid" && ev.paidType === "batches" && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Lotes ({ev.batches?.length})</span>
                          )}
                          {isActive && <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Ativo</span>}
                          {isPast && !isCancelled && <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Encerrado</span>}
                          {isCancelled && <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Cancelado</span>}
                        </div>
                      </div>
                      {isActive && !isCancelled && (
                        <button
                          onClick={() => {
                            if (confirm("Tem certeza que deseja cancelar este evento?")) {
                              cancelEvent.mutate({ eventId: ev.id });
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs shrink-0"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {eventsList && eventsList.length === 0 && !showForm && (
            <div className="text-center py-8">
              <Ticket className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum evento criado para este estabelecimento.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
