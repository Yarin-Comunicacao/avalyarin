import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  BarChart3, Users, Store, Star, ClipboardCheck, ArrowLeft,
  CheckCircle, XCircle, Clock, Shield, Crown, User as UserIcon
} from "lucide-react";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "claims" | "establishments">("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          <Link href="/">
            <span className="text-primary hover:underline mt-4 inline-block">Voltar ao início</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
              <Crown className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl tracking-wider text-primary">PAINEL ADMIN</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{user.name}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">
              {user.role === "owner" ? "OWNER" : "ADMIN"}
            </span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border/30">
        <div className="container flex gap-1 overflow-x-auto">
          {[
            { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
            { id: "users" as const, label: "Usuários", icon: Users },
            { id: "claims" as const, label: "Solicitações", icon: ClipboardCheck },
            { id: "establishments" as const, label: "Estabelecimentos", icon: Store },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "claims" && <ClaimsTab />}
        {activeTab === "establishments" && <EstablishmentsTab />}
      </div>
    </div>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

  if (isLoading) return <div className="text-muted-foreground">Carregando estatísticas...</div>;
  if (!stats) return <div className="text-destructive">Erro ao carregar estatísticas</div>;

  const cards = [
    { label: "Estabelecimentos", value: stats.establishments, icon: Store, color: "text-primary" },
    { label: "Categorias", value: stats.categories, icon: BarChart3, color: "text-blue-400" },
    { label: "Usuários", value: stats.users, icon: Users, color: "text-green-400" },
    { label: "Avaliações", value: stats.ratings, icon: Star, color: "text-yellow-400" },
    { label: "Itens Cardápio", value: stats.menuItems, icon: ClipboardCheck, color: "text-purple-400" },
    { label: "Solicitações Pendentes", value: stats.pendingClaims, icon: Clock, color: "text-orange-400" },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider text-foreground mb-6">VISÃO GERAL</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-sm text-muted-foreground">{card.label}</span>
            </div>
            <p className="font-numbers text-3xl font-bold text-foreground">
              {card.value.toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = trpc.admin.users.useQuery({});
  const updateRole = trpc.admin.updateUserRole.useMutation();
  const utils = trpc.useUtils();

  if (isLoading) return <div className="text-muted-foreground">Carregando usuários...</div>;

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    business: "Empresa",
    user: "Usuário",
  };

  const roleColors: Record<string, string> = {
    owner: "bg-yellow-500/20 text-yellow-400",
    admin: "bg-blue-500/20 text-blue-400",
    business: "bg-green-500/20 text-green-400",
    user: "bg-muted text-muted-foreground",
  };

  const handleRoleChange = async (userId: number, role: "user" | "admin" | "owner" | "business") => {
    try {
      await updateRole.mutateAsync({ userId, role });
      utils.admin.users.invalidate();
      toast.success("Role atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar role");
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl tracking-wider text-foreground mb-6">USUÁRIOS</h2>
      <div className="space-y-3">
        {users?.map(u => (
          <div key={u.id} className="p-4 rounded-xl bg-card border border-border/50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                {u.role === "owner" ? <Crown className="w-5 h-5 text-primary" /> :
                 u.role === "admin" ? <Shield className="w-5 h-5 text-blue-400" /> :
                 <UserIcon className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-medium text-foreground">{u.name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded font-medium ${roleColors[u.role]}`}>
                {roleLabels[u.role]}
              </span>
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                className="text-xs bg-background border border-border rounded px-2 py-1 text-foreground"
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
                <option value="business">Empresa</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClaimsTab() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | undefined>(undefined);
  const { data: claims, isLoading } = trpc.admin.claims.useQuery({ status: filter });
  const reviewMutation = trpc.admin.reviewClaim.useMutation();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<Record<number, string>>({});

  if (isLoading) return <div className="text-muted-foreground">Carregando solicitações...</div>;

  const handleReview = async (claimId: number, status: "approved" | "rejected") => {
    try {
      await reviewMutation.mutateAsync({ claimId, status, adminNotes: notes[claimId] });
      utils.admin.claims.invalidate();
      toast.success(status === "approved" ? "Solicitação aprovada!" : "Solicitação rejeitada!");
    } catch {
      toast.error("Erro ao processar solicitação");
    }
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl tracking-wider text-foreground">SOLICITAÇÕES</h2>
        <div className="flex gap-2">
          {[
            { value: undefined, label: "Todas" },
            { value: "pending" as const, label: "Pendentes" },
            { value: "approved" as const, label: "Aprovadas" },
            { value: "rejected" as const, label: "Rejeitadas" },
          ].map(f => (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === f.value
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {claims?.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma solicitação encontrada.</p>
      ) : (
        <div className="space-y-4">
          {claims?.map(claim => {
            const StatusIcon = statusIcons[claim.status];
            return (
              <div key={claim.id} className="p-5 rounded-xl bg-card border border-border/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-foreground">{claim.establishmentName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Solicitado por: {claim.userName} ({claim.userEmail})
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${statusColors[claim.status]}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-xs font-medium capitalize">{claim.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                  <p><span className="text-muted-foreground">Empresa:</span> {claim.businessName}</p>
                  <p><span className="text-muted-foreground">Telefone:</span> {claim.contactPhone}</p>
                  <p><span className="text-muted-foreground">Email:</span> {claim.contactEmail}</p>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-medium">Justificativa:</span> {claim.proofDescription}
                </p>

                {claim.status === "pending" && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/30">
                    <input
                      type="text"
                      placeholder="Notas do admin (opcional)"
                      value={notes[claim.id] || ""}
                      onChange={(e) => setNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(claim.id, "approved")}
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Aprovar
                      </button>
                      <button
                        onClick={() => handleReview(claim.id, "rejected")}
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-destructive hover:bg-destructive/80 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Rejeitar
                      </button>
                    </div>
                  </div>
                )}

                {claim.adminNotes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Nota do admin: {claim.adminNotes}
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

function EstablishmentsTab() {
  const { data: categories } = trpc.categories.list.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const { data: estData } = trpc.establishments.byCategory.useQuery(
    { categorySlug: selectedCategory, limit: 50 },
    { enabled: !!selectedCategory }
  );
  const deleteMutation = trpc.admin.deleteEstablishment.useMutation();
  const createMutation = trpc.admin.createEstablishment.useMutation();
  const utils = trpc.useUtils();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    categoryId: 0,
    address: "",
    neighborhood: "",
    region: "Pinheiros",
    phone: "",
    instagram: "",
    hours: "",
  });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${name}"? Esta ação é irreversível.`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      utils.establishments.byCategory.invalidate();
      toast.success(`"${name}" excluído com sucesso!`);
    } catch {
      toast.error("Erro ao excluir estabelecimento");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        name: formData.name,
        categoryId: formData.categoryId,
        address: formData.address || undefined,
        neighborhood: formData.neighborhood || undefined,
        region: formData.region || undefined,
        phone: formData.phone || undefined,
        instagram: formData.instagram || undefined,
        hours: formData.hours || undefined,
      });
      toast.success(`"${formData.name}" cadastrado com sucesso! (ID: ${result.id})`);
      setFormData({ name: "", categoryId: 0, address: "", neighborhood: "", region: "Pinheiros", phone: "", instagram: "", hours: "" });
      setShowForm(false);
      utils.establishments.byCategory.invalidate();
      utils.admin.stats.invalidate();
    } catch {
      toast.error("Erro ao cadastrar estabelecimento");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl tracking-wider text-foreground">ESTABELECIMENTOS</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Novo Estabelecimento"}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-6 rounded-xl bg-card border border-primary/30 space-y-4">
          <h3 className="font-display text-lg tracking-wider text-primary mb-2">CADASTRAR ESTABELECIMENTO</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="Ex: Bar do Zé"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Categoria *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                required
              >
                <option value={0}>Selecione...</option>
                {categories?.map(cat => (
                  <option key={cat.slug} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Endereço</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="Rua, número"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Bairro</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="Ex: Pinheiros"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Região</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="Ex: Pinheiros"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Instagram</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="@nomedoperfil"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Horário de Funcionamento</label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="Seg-Sex: 18h-02h"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "Salvando..." : "Cadastrar Estabelecimento"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      
      {/* Category filter and list */}
      <div className="mb-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 bg-background border border-border rounded-lg text-foreground"
        >
          <option value="">Selecione uma categoria para listar</option>
          {categories?.map(cat => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name} ({cat.establishmentCount})
            </option>
          ))}
        </select>
      </div>

      {estData && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">
            Mostrando {estData.length} estabelecimentos
          </p>
          {estData.map((est: any) => (
            <div key={est.id} className="p-3 rounded-lg bg-card border border-border/50 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">{est.name}</p>
                <p className="text-xs text-muted-foreground">{est.neighborhood} • {est.address}</p>
              </div>
              <button
                onClick={() => handleDelete(est.id, est.name)}
                className="text-xs px-3 py-1 text-destructive border border-destructive/30 rounded hover:bg-destructive/10 transition-colors"
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
