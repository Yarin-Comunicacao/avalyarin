import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { QRCodeCanvas } from "qrcode.react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Store, ArrowLeft, ClipboardCheck, UtensilsCrossed, Edit,
  Plus, Trash2, CheckCircle, Clock, XCircle, Send, Building2,
  Bell, AlertTriangle, Image as ImageIcon, Star, QrCode as QrCodeIcon, Tag, Download, Copy, Crown, Check, Loader2, Zap, TrendingUp, BarChart3
} from "lucide-react";

export default function BusinessPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"establishments" | "claims" | "menu" | "notifications" | "qrcode" | "promo" | "partnerships" | "plan" | "insights">("establishments");
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl tracking-wider text-primary">PAINEL EMPRESARIAL</h1>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{user?.name}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border/30">
        <div className="container overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {[
              { id: "establishments" as const, label: "Meus Estab.", labelFull: "Meus Estabelecimentos", icon: Store },
              { id: "claims" as const, label: "Solicitações", labelFull: "Solicitações", icon: ClipboardCheck },
              { id: "menu" as const, label: "Cardápio", labelFull: "Cardápio", icon: UtensilsCrossed },
              { id: "notifications" as const, label: "Alertas", labelFull: "Notificações", icon: Bell },
              { id: "qrcode" as const, label: "QR Code", labelFull: "QR Code", icon: QrCodeIcon },
              { id: "promo" as const, label: "Códigos", labelFull: "Códigos Promocionais", icon: Tag },
              { id: "partnerships" as const, label: "Parcerias", labelFull: "Parcerias", icon: Building2 },
              { id: "plan" as const, label: "Plano", labelFull: "Meu Plano", icon: Crown },
              { id: "insights" as const, label: "Insights", labelFull: "Insights", icon: TrendingUp },
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
      </div>
    </div>
  );
}

function MyEstablishmentsTab() {
  const { data: establishments, isLoading } = trpc.business.myEstablishments.useQuery();
  const updateMutation = trpc.business.updateEstablishment.useMutation();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    name?: string;
    address?: string;
    phone?: string;
    instagram?: string;
  }>({});

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

  const handleSave = async (id: number) => {
    try {
      await updateMutation.mutateAsync({ establishmentId: id, ...editData });
      utils.business.myEstablishments.invalidate();
      setEditing(null);
      setEditData({});
      toast.success("Estabelecimento atualizado!");
    } catch {
      toast.error("Erro ao atualizar");
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider text-foreground mb-6">MEUS ESTABELECIMENTOS</h2>
      <div className="space-y-4">
        {establishments.map((est: any) => (
          <div key={est.id} className="p-5 rounded-xl bg-card border border-border/50">
            {editing === est.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  defaultValue={est.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
                />
                <input
                  type="text"
                  defaultValue={est.address || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
                />
                <input
                  type="text"
                  defaultValue={est.phone || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Telefone"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
                />
                <input
                  type="text"
                  defaultValue={est.instagram || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="Instagram"
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(est.id)}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => { setEditing(null); setEditData({}); }}
                    className="px-4 py-2 text-sm border border-border text-muted-foreground rounded-lg hover:text-foreground transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{est.name}</h3>
                  <p className="text-sm text-muted-foreground">{est.address}</p>
                  {est.phone && <p className="text-xs text-muted-foreground mt-1">Tel: {est.phone}</p>}
                  {est.instagram && <p className="text-xs text-primary mt-1">@{est.instagram}</p>}
                </div>
                <button
                  onClick={() => { setEditing(est.id); setEditData({}); }}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MyClaimsTab() {
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

function MenuManagementTab() {
  const { data: establishments, isLoading } = trpc.business.myEstablishments.useQuery();
  const [selectedEst, setSelectedEst] = useState<number | null>(null);
  const { data: estData } = trpc.establishments.getWithMenu.useQuery(
    { slug: establishments?.find((e: any) => e.id === selectedEst)?.slug || "" },
    { enabled: !!selectedEst && !!establishments }
  );
  const addItemMutation = trpc.business.addMenuItem.useMutation();
  const deleteItemMutation = trpc.business.deleteMenuItem.useMutation();
  const utils = trpc.useUtils();
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", category: "" });

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

          {/* Current menu items */}
          {estData?.menu && estData.menu.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                {estData.menu.length} itens no cardápio
              </p>
              {estData.menu.map((item: any) => (
                <div key={item.id} className="p-3 rounded-lg bg-card border border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {item.category && <span className="capitalize">{item.category}</span>}
                      {item.price && <span>R$ {Number(item.price).toFixed(2)}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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

function NotificationsTab() {
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
function QRCodeTab() {
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
function PromoCodesTab() {
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

function PartnershipsTab() {
  const { data: establishments } = trpc.business.myEstablishments.useQuery();
  const [selectedEstab, setSelectedEstab] = useState<number | null>(null);
  const [showPropose, setShowPropose] = useState(false);
  const [proposeInfluencerId, setProposeInfluencerId] = useState<number | null>(null);
  const [proposeTerms, setProposeTerms] = useState("");

  const estabId = selectedEstab || (establishments && establishments.length > 0 ? establishments[0].id : null);

  const { data: partnerships, isLoading } = trpc.business.partnerships.useQuery(
    { establishmentId: estabId! },
    { enabled: !!estabId }
  );
  const { data: influencers } = trpc.business.availableInfluencers.useQuery(
    undefined,
    { enabled: showPropose }
  );
  const respondMutation = trpc.business.respondPartnership.useMutation();
  const proposeMutation = trpc.business.proposePartnership.useMutation();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<Record<number, string>>({});

  const handlePropose = async () => {
    if (!estabId || !proposeInfluencerId) return;
    try {
      await proposeMutation.mutateAsync({
        establishmentId: estabId,
        influencerId: proposeInfluencerId,
        terms: proposeTerms || undefined,
      });
      utils.business.partnerships.invalidate();
      toast.success("Proposta de parceria enviada!");
      setShowPropose(false);
      setProposeInfluencerId(null);
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
      toast.success(accept ? "Parceria aceita! Aguardando aprovação do admin." : "Parceria recusada.");
    } catch {
      toast.error("Erro ao responder parceria");
    }
  };

  const statusLabels: Record<string, string> = {
    pending_estab: "Aguardando sua resposta",
    pending_admin: "Aguardando admin",
    active: "Ativa",
    rejected_estab: "Recusada por você",
    rejected_admin: "Rejeitada pelo admin",
    cancelled: "Cancelada",
    expired: "Expirada",
  };

  const statusColors: Record<string, string> = {
    pending_estab: "text-orange-400",
    pending_admin: "text-blue-400",
    active: "text-green-400",
    rejected_estab: "text-destructive",
    rejected_admin: "text-destructive",
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
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Influencer</label>
              <select
                value={proposeInfluencerId || ""}
                onChange={(e) => setProposeInfluencerId(Number(e.target.value))}
                className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
              >
                <option value="">Selecione um influencer...</option>
                {influencers?.map((inf: any) => (
                  <option key={inf.id} value={inf.id}>{inf.name || inf.username || `Influencer #${inf.id}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Termos da parceria (opcional)</label>
              <input
                type="text"
                value={proposeTerms}
                onChange={(e) => setProposeTerms(e.target.value)}
                placeholder="Ex: 2 avaliações por mês, divulgação no perfil..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePropose}
                disabled={!proposeInfluencerId || proposeMutation.isPending}
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
          {partnerships?.map((p) => (
            <div key={p.id} className="p-5 rounded-xl bg-card border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground">{p.influencerName || "Influencer"}</h3>
                  <p className="text-xs text-muted-foreground">
                    Proposta em {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className={`text-xs font-medium ${statusColors[p.status]}`}>
                  {statusLabels[p.status] || p.status}
                </span>
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


function BusinessPlanTab() {
  const { data: establishments } = trpc.business.myEstablishments.useQuery();
  const [selectedEst, setSelectedEst] = useState<number | null>(null);

  const estId = selectedEst || (establishments && establishments.length > 0 ? establishments[0].id : null);
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
      {/* Select establishment */}
      {establishments.length > 1 && (
        <div className="mb-6">
          <label className="text-sm text-muted-foreground block mb-2">Estabelecimento</label>
          <select
            className="w-full p-3 rounded-lg bg-card border border-border/50 text-foreground"
            value={estId || ""}
            onChange={(e) => setSelectedEst(Number(e.target.value))}
          >
            {establishments.map((est: any) => (
              <option key={est.id} value={est.id}>{est.name}</option>
            ))}
          </select>
        </div>
      )}

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
              {currentPlan === "premium" ? "R$ 29,90/mês" : "Grátis"}
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
              {["Códigos promo ilimitados", "Analytics e métricas", "Destaque no app", "Tudo do Básico"].map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                  <span className="text-foreground/70">{f}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-numbers text-lg font-bold text-primary">R$ 29,90<span className="text-xs text-muted-foreground font-normal">/mês</span></p>
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

function BusinessInsightsTab() {
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
