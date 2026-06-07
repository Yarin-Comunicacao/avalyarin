import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Store, ArrowLeft, ClipboardCheck, UtensilsCrossed, Edit,
  Plus, Trash2, CheckCircle, Clock, XCircle, Send, Building2,
  Bell, AlertTriangle, Image as ImageIcon
} from "lucide-react";

export default function BusinessPanel() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"establishments" | "claims" | "menu" | "notifications">("establishments");
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

  if (isLoading) return <div className="text-muted-foreground">Carregando notificações...</div>;

  if (!notifications || notifications.length === 0) {
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

  const errors = notifications.filter(n => n.severity === 'error');
  const warnings = notifications.filter(n => n.severity === 'warning');

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
    </div>
  );
}
