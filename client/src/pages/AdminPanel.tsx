import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AdminEstablishments from "@/components/AdminEstablishments";
import BrandbookTab from "@/components/BrandbookTab";
import { useState, useEffect, useMemo } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { toast } from "sonner";
import {
  BarChart3, Users, Store, Star, ClipboardCheck, ArrowLeft,
  CheckCircle, XCircle, Clock, Shield, Crown, User as UserIcon, FileCheck,
  Code, Download, RefreshCw, FileCode, BookOpen, Tag as TagIcon
} from "lucide-react";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const searchString = useSearch();
  const [, navigate] = useLocation();

  // Parse URL params to restore tab/category state
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const initialTab = (searchParams.get("tab") || "dashboard") as "dashboard" | "users" | "claims" | "establishments" | "age-verification" | "code-backup" | "brandbook" | "promos";
  const initialCategory = searchParams.get("category") || undefined;

  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab from URL when navigating back
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab as typeof activeTab);
    }
  }, [searchString]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="border-b border-border/30 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 px-4 sm:px-6 lg:px-8 lg:max-w-[1280px] lg:mx-auto" style={{ minWidth: 'max-content' }}>
          {[
            { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
            { id: "users" as const, label: "Usuários", icon: Users },
            { id: "claims" as const, label: "Solicitações", icon: ClipboardCheck },
            { id: "establishments" as const, label: "Estabelecimentos", icon: Store },
            { id: "age-verification" as const, label: "Verificação", icon: FileCheck },
            { id: "code-backup" as const, label: "Código", icon: Code },
            { id: "brandbook" as const, label: "Brandbook", icon: BookOpen },
            { id: "promos" as const, label: "Códigos", icon: TagIcon },
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
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
        {activeTab === "establishments" && <EstablishmentsTab initialCategoryId={initialCategory} />}
        {activeTab === "age-verification" && <AgeVerificationTab />}
        {activeTab === "code-backup" && <CodeBackupTab />}
        {activeTab === "brandbook" && <BrandbookTab />}
        {activeTab === "promos" && <PromoCodesAdminTab />}
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
  const [subTab, setSubTab] = useState<"establishments" | "influencers">("establishments");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl tracking-wider text-foreground">SOLICITAÇÕES</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab("establishments")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              subTab === "establishments"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Estabelecimentos
          </button>
          <button
            onClick={() => setSubTab("influencers")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              subTab === "influencers"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Influencers
          </button>
        </div>
      </div>

      {subTab === "establishments" && <EstablishmentClaimsSubTab />}
      {subTab === "influencers" && <InfluencerApplicationsSubTab />}
    </div>
  );
}

function EstablishmentClaimsSubTab() {
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
      <div className="flex gap-2 mb-4">
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

function InfluencerApplicationsSubTab() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | undefined>(undefined);
  const { data: applications, isLoading } = trpc.admin.influencerApplications.useQuery({ status: filter });
  const approveMutation = trpc.admin.approveInfluencer.useMutation();
  const rejectMutation = trpc.admin.rejectInfluencer.useMutation();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<Record<number, string>>({});

  if (isLoading) return <div className="text-muted-foreground">Carregando solicitações de influencer...</div>;

  const handleApprove = async (applicationId: number) => {
    try {
      await approveMutation.mutateAsync({ applicationId, adminNotes: notes[applicationId] });
      utils.admin.influencerApplications.invalidate();
      toast.success("Influencer aprovado!");
    } catch {
      toast.error("Erro ao aprovar");
    }
  };

  const handleReject = async (applicationId: number) => {
    const note = notes[applicationId];
    if (!note || note.trim().length === 0) {
      toast.error("Adicione uma nota explicando o motivo da rejeição");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ applicationId, adminNotes: note });
      utils.admin.influencerApplications.invalidate();
      toast.success("Solicitação rejeitada");
    } catch {
      toast.error("Erro ao rejeitar");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "text-orange-400",
    approved: "text-green-400",
    rejected: "text-destructive",
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
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

      {applications?.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma solicitação de influencer encontrada.</p>
      ) : (
        <div className="space-y-4">
          {applications?.map(app => (
            <div key={app.id} className="p-5 rounded-xl bg-card border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground">{app.userName || "Usuário"}</h3>
                  <p className="text-sm text-muted-foreground">{app.userEmail}</p>
                </div>
                <span className={`text-xs font-medium capitalize ${statusColors[app.status]}`}>
                  {app.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">Total avaliações:</span>{" "}
                  <span className="font-medium">{app.totalRatings}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Qualificadas:</span>{" "}
                  <span className="font-medium text-green-500">{app.qualifiedRatings}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Selecionadas:</span>{" "}
                  <span className="font-medium">{(app.selectedRatingIds as number[])?.length || 0}</span>
                </div>
              </div>

              {app.motivation && (
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">Motivação:</span> {app.motivation}
                </p>
              )}
              {app.socialMedia && (
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">Redes:</span> {app.socialMedia}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Enviada em {new Date(app.createdAt).toLocaleDateString("pt-BR")}
              </p>

              {app.status === "pending" && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/30">
                  <input
                    type="text"
                    placeholder="Notas do admin (obrigatório para rejeição)"
                    value={notes[app.id] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(app.id)}
                      className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      className="flex items-center gap-1 px-4 py-2 text-sm bg-destructive hover:bg-destructive/80 text-white rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </button>
                  </div>
                </div>
              )}

              {app.adminNotes && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Nota do admin: {app.adminNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EstablishmentsTab({ initialCategoryId }: { initialCategoryId?: string }) {
  return <AdminEstablishments initialCategoryId={initialCategoryId ? Number(initialCategoryId) : undefined} />;
}

function EstablishmentsTabLegacy() {
  const { data: categories } = trpc.categories.list.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const { data: estData } = trpc.admin.establishmentsByCategory.useQuery(
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
    region: "",
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
    if (!formData.address || !formData.neighborhood || !formData.phone || !formData.instagram || !formData.hours) {
      toast.error("Preencha todos os campos obrigatórios: endereço, bairro, telefone, Instagram e horário.");
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        name: formData.name,
        categoryId: formData.categoryId,
        address: formData.address,
        neighborhood: formData.neighborhood,
        region: formData.region,
        phone: formData.phone,
        instagram: formData.instagram,
        hours: formData.hours,
      });
      toast.success(`"${formData.name}" cadastrado com sucesso! (ID: ${result.id})`);
      setFormData({ name: "", categoryId: 0, address: "", neighborhood: "", region: "", phone: "", instagram: "", hours: "" });
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

            <div className="md:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Endereço completo *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="R. Fradique Coutinho, 1136 - Vila Madalena, São Paulo - SP, 05416-001, Brasil"
                required
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">Formato: Rua, nº - Bairro, São Paulo - SP, CEP, Brasil</span>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Bairro *</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="Vila Madalena"
                required
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">Ex: Pinheiros, Vila Madalena, Moema, Jardins</span>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Região <span className="text-muted-foreground/40">(opcional)</span></label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="Zona Oeste"
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">Ex: Zona Oeste, Zona Sul, Centro</span>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Telefone *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (v.length > 11) v = v.slice(0, 11);
                  if (v.length === 11) {
                    // Celular: (11) 99999-9999
                    v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
                  } else if (v.length === 10) {
                    // Fixo: (11) 3456-7890
                    v = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
                  } else if (v.length > 6) {
                    // Parcial com mais de 6 dígitos - tenta formatar como celular
                    v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
                  } else if (v.length > 2) {
                    v = `(${v.slice(0,2)}) ${v.slice(2)}`;
                  } else if (v.length > 0) {
                    v = `(${v}`;
                  }
                  setFormData(prev => ({ ...prev, phone: v }));
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="(11) 99999-9999"
                required
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">Formato: (DDD) XXXXX-XXXX</span>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Instagram *</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val && !val.startsWith('@')) val = '@' + val;
                    setFormData(prev => ({ ...prev, instagram: val }));
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                  placeholder="@nomedoperfil"
                  required
                />
              </div>
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">Apenas o handle, sem URL. Ex: @bardoze</span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-muted-foreground mb-1">Horário de Funcionamento *</label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
                placeholder="Seg a Sex: 18:00–02:00 | Sáb: 16:00–03:00 | Dom: Fechado"
                required
              />
              <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">Formato: Agrupe dias iguais. Use | para separar. Ex: Seg a Qui: 11:30–23:00 | Sex a Sáb: 11:30–01:00 | Dom: Fechado</span>
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

function AgeVerificationTab() {
  const { data: requests, isLoading, refetch } = trpc.ageVerification.list.useQuery({});
  const reviewMutation = trpc.ageVerification.review.useMutation({
    onSuccess: () => {
      toast.success("Verificação processada com sucesso");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando verificações...</div>;
  }

  const filteredRequests = (requests || []).filter(r => filter === "all" || r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-wider text-foreground">VERIFICAÇÃO DE IDADE</h2>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : f === "approved" ? "Aprovados" : "Rejeitados"}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma solicitação de verificação {filter !== "all" ? `com status "${filter}"` : ""}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div key={req.id} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground">{req.userName}</h3>
                  <p className="text-xs text-muted-foreground">{req.userEmail}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  req.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                  req.status === "approved" ? "bg-green-500/20 text-green-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {req.status === "pending" ? "Pendente" : req.status === "approved" ? "Aprovado" : "Rejeitado"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-xs text-muted-foreground">Data solicitada:</span>
                  <p className="text-foreground">{req.requestedBirthdate.split("-").reverse().join("/")}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Enviado em:</span>
                  <p className="text-foreground">{new Date(req.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              {/* Document preview */}
              <div className="mb-3">
                <span className="text-xs text-muted-foreground block mb-1">Documento enviado:</span>
                <a
                  href={req.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm hover:underline"
                >
                  Ver documento
                </a>
              </div>

              {req.status === "pending" && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <input
                    type="text"
                    placeholder="Notas do admin (opcional)"
                    value={notes[req.id] || ""}
                    onChange={(e) => setNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewMutation.mutate({
                        requestId: req.id,
                        status: "approved",
                        adminNotes: notes[req.id] || undefined,
                      })}
                      disabled={reviewMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                    </button>
                    <button
                      onClick={() => reviewMutation.mutate({
                        requestId: req.id,
                        status: "rejected",
                        adminNotes: notes[req.id] || undefined,
                      })}
                      disabled={reviewMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                  </div>
                </div>
              )}

              {req.adminNotes && req.status !== "pending" && (
                <div className="mt-2 p-2 rounded bg-secondary/30 text-xs text-muted-foreground">
                  <strong>Nota admin:</strong> {req.adminNotes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CodeBackupTab() {
  const { data: backups, isLoading, refetch } = trpc.admin.getCodeBackups.useQuery();
  const generateMutation = trpc.admin.generateCodeBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup gerado com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(`Erro ao gerar backup: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider text-foreground">CÓDIGO FONTE</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Backup completo do código do aplicativo para recuperação
          </p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {generateMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileCode className="w-4 h-4" />
              Gerar Novo Backup
            </>
          )}
        </button>
      </div>

      {/* Info card */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <Code className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground text-sm">Como funciona</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Ao clicar em "Gerar Novo Backup", o sistema coleta todos os arquivos de código fonte do aplicativo
              (TypeScript, CSS, configurações) e gera um documento Markdown estruturado com o conteúdo completo.
              Este arquivo pode ser usado para recuperação total do projeto em caso de perda de dados.
            </p>
          </div>
        </div>
      </div>

      {/* Backups list */}
      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">Carregando backups...</div>
      ) : !backups || backups.length === 0 ? (
        <div className="text-center py-12">
          <FileCode className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhum backup gerado ainda.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Clique em "Gerar Novo Backup" para criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-display text-lg tracking-wider text-foreground">BACKUPS DISPONÍVEIS</h3>
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="p-4 rounded-xl bg-card border border-border/50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{backup.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(backup.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                    {" • "}{backup.fileCount} arquivos{" • "}{backup.sizeKB} KB
                  </p>
                </div>
              </div>
              <a
                href={backup.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ============================================================
// PROMO CODES ADMIN TAB
// ============================================================
function PromoCodesAdminTab() {
  const [filter, setFilter] = useState<"pending_approval" | "active" | "rejected" | undefined>(undefined);
  const { data: codes, isLoading, refetch } = trpc.promo.adminList.useQuery({ status: filter });
  const approveMutation = trpc.promo.adminApprove.useMutation({
    onSuccess: () => { toast.success("Código aprovado!"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const rejectMutation = trpc.promo.adminReject.useMutation({
    onSuccess: () => { toast.success("Código rejeitado."); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const [notes, setNotes] = useState<Record<number, string>>({});

  if (isLoading) return <div className="text-muted-foreground">Carregando códigos...</div>;

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending_approval: { text: "Pendente", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl tracking-wider text-foreground">CÓDIGOS PROMOCIONAIS</h2>
        <div className="flex gap-2">
          {[
            { value: undefined, label: "Todos" },
            { value: "pending_approval" as const, label: "Pendentes" },
            { value: "active" as const, label: "Ativos" },
            { value: "rejected" as const, label: "Rejeitados" },
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

      {!codes || codes.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum código encontrado.</p>
      ) : (
        <div className="space-y-4">
          {codes.map((code: any) => {
            const status = statusLabel[code.status] || statusLabel.expired;
            return (
              <div key={code.id} className="p-5 rounded-xl bg-card border border-border/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-xl font-bold text-primary">{code.code}</span>
                    <span className={`ml-3 text-xs px-2 py-0.5 rounded-full border ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(code.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                  <p><span className="text-muted-foreground">Tipo:</span> {typeLabel[code.type] || code.type}</p>
                  {code.value && <p><span className="text-muted-foreground">Valor:</span> {code.type === "percentage" ? `${code.value}%` : `R$${code.value}`}</p>}
                  <p><span className="text-muted-foreground">Criado por:</span> {code.ownerType} (ID: {code.ownerId})</p>
                  {code.maxUses && <p><span className="text-muted-foreground">Limite:</span> {code.maxUses} usos</p>}
                  {code.firstVisitOnly && <p><span className="text-muted-foreground">Restrição:</span> Apenas 1ª visita</p>}
                </div>

                {code.description && (
                  <p className="text-sm text-muted-foreground mb-3">{code.description}</p>
                )}

                {code.status === "pending_approval" && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/30">
                    <input
                      type="text"
                      placeholder="Notas do admin (opcional)"
                      value={notes[code.id] || ""}
                      onChange={(e) => setNotes(prev => ({ ...prev, [code.id]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveMutation.mutate({ codeId: code.id, notes: notes[code.id] })}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" /> Aprovar
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate({ codeId: code.id, notes: notes[code.id] || "Rejeitado" })}
                        disabled={rejectMutation.isPending}
                        className="flex items-center gap-1 px-4 py-2 text-sm bg-destructive hover:bg-destructive/80 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Rejeitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
