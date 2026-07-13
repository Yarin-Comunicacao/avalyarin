import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AdminEstablishments from "@/components/AdminEstablishments";
import BrandbookTab from "@/components/BrandbookTab";
import { useState, useEffect, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import { toast } from "sonner";
import {
  BarChart3, Users, Store, Star, ClipboardCheck, ArrowLeft,
  CheckCircle, XCircle, Clock, Shield, Crown, User as UserIcon, FileCheck,
  Code, Download, RefreshCw, FileCode, BookOpen, Tag as TagIcon, TrendingUp, Activity, Plug, Eye, EyeOff, Save, Trash2, ExternalLink, Newspaper, Loader2,
  Plus, Pencil, Sparkles, CreditCard, Percent, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const searchString = useSearch();
  const [, navigate] = useLocation();

  // Parse URL params to restore tab/category state
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  
  // Determine active section from path
  const getSectionFromPath = (): "equipe" | "negocio" | "permissoes" | "config" => {
    const path = window.location.pathname;
    if (path.startsWith("/admin/equipe")) return "equipe";
    if (path.startsWith("/admin/negocio")) return "negocio";
    if (path.startsWith("/admin/permissoes")) return "permissoes";
    if (path.startsWith("/admin/config")) return "config";
    // Legacy routes mapping
    if (path === "/admin/usuarios") return "equipe";
    if (path === "/admin/especialistas") return "permissoes";
    if (path === "/admin/estabs") return "negocio";
    if (path === "/admin/analytics") return "negocio";
    return "equipe";
  };

  const [activeSection, setActiveSection] = useState(getSectionFromPath());
  const initialCategory = searchParams.get("category") || undefined;

  // Sub-tab state per section
  const [equipeTab, setEquipeTab] = useState<"user" | "critic" | "specialist" | "business" | "support">("user");
  const [negocioTab, setNegocioTab] = useState<"dashboard" | "establishments" | "promos" | "planos">("dashboard");
  const [permissoesTab, setPermissoesTab] = useState<"claims" | "age-verification" | "insights" | "role-requests">("claims");
  const [configTab, setConfigTab] = useState<"integrations">("integrations");

  // Sync section from URL when navigating
  useEffect(() => {
    const section = getSectionFromPath();
    if (section !== activeSection) {
      setActiveSection(section);
    }
  }, [searchString, window.location.pathname]);

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
          <button onClick={() => window.history.back()} className="text-primary hover:underline mt-4 inline-block">Voltar</button>
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

      {/* Section Tabs */}
      <div className="border-b border-border/30 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 px-4 sm:px-6 lg:px-8 lg:max-w-[1280px] lg:mx-auto">
          {activeSection === "equipe" && (
            <>
              {(["user", "critic", "specialist", "business", "support"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setEquipeTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    equipeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {{ user: "User", critic: "Critic", specialist: "Especialista", business: "Business", support: "Support" }[tab]}
                </button>
              ))}
            </>
          )}
          {activeSection === "negocio" && (
            <>
              {(["dashboard", "establishments", "promos", "planos"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setNegocioTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    negocioTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {{ dashboard: "Dashboard", establishments: "Estabelecimentos", promos: "Promoções", planos: "Planos" }[tab]}
                </button>
              ))}
            </>
          )}
          {activeSection === "permissoes" && (
            <>
              {(["claims", "age-verification", "role-requests", "insights"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setPermissoesTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    permissoesTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {{ claims: "Solicitações", "age-verification": "Verificação", "role-requests": "Perfis", insights: "Insights" }[tab]}
                </button>
              ))}
            </>
          )}
          {activeSection === "config" && (
            <>
              {(["integrations"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setConfigTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    configTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {{ integrations: "Integrações" }[tab]}
                </button>
              ))}
              {/* Owner-only tabs */}
              {user?.role === "owner" && (
                <>
                  <button
                    onClick={() => setConfigTab("integrations")}
                    className="flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 border-transparent text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
                  >
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {/* Equipe section */}
        {activeSection === "equipe" && <UsersTab filterRole={equipeTab} />}

        {/* Negócio section */}
        {activeSection === "negocio" && negocioTab === "dashboard" && <DashboardTab />}
        {activeSection === "negocio" && negocioTab === "establishments" && <EstablishmentsTab initialCategoryId={initialCategory} />}
        {activeSection === "negocio" && negocioTab === "promos" && <PromoCodesAdminTab />}
        {activeSection === "negocio" && negocioTab === "planos" && <PlanosTab />}

        {/* Permissões section */}
        {activeSection === "permissoes" && permissoesTab === "claims" && <ClaimsTab />}
        {activeSection === "permissoes" && permissoesTab === "age-verification" && <AgeVerificationTab />}
        {activeSection === "permissoes" && permissoesTab === "role-requests" && <RoleRequestsTab />}
        {activeSection === "permissoes" && permissoesTab === "insights" && <InsightsTab />}

        {/* Config section */}
        {activeSection === "config" && configTab === "integrations" && <IntegrationsTab />}
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

function UsersTab({ filterRole }: { filterRole?: "user" | "critic" | "specialist" | "business" | "support" }) {
  const { data: users, isLoading } = trpc.admin.users.useQuery({});
  // Map "critic" to actual role name if needed (critics are stored as "user" with critic flag or separate role)
  const filteredUsers = users?.filter(u => {
    if (!filterRole) return true;
    if (filterRole === "critic") return u.role === "critic" || (u as any).isCritic;
    return u.role === filterRole;
  });
  const updateRole = trpc.admin.updateUserRole.useMutation();
  const utils = trpc.useUtils();

  if (isLoading) return <div className="text-muted-foreground">Carregando usuários...</div>;

  const roleLabels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    support: "Support",
    business: "Business",
    specialist: "Especialista",
    user: "User",
  };

  const roleColors: Record<string, string> = {
    owner: "bg-yellow-500/20 text-yellow-400",
    admin: "bg-red-500/20 text-red-400",
    support: "bg-teal-500/20 text-teal-400",
    business: "bg-orange-500/20 text-orange-400",
    specialist: "bg-yellow-400/20 text-yellow-300",
    user: "bg-muted text-muted-foreground",
  };

  const handleRoleChange = async (userId: number, role: "user" | "admin" | "owner" | "business" | "specialist" | "support") => {
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
        {(filteredUsers || []).map(u => (
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
                <option value="user">User</option>
                <option value="specialist">Especialista</option>
                <option value="business">Business</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClaimsTab() {
  const [subTab, setSubTab] = useState<"establishments" | "specialists">("establishments");

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
            onClick={() => setSubTab("specialists")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              subTab === "specialists"
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Especialistas
          </button>
        </div>
      </div>

      {subTab === "establishments" && <EstablishmentClaimsSubTab />}
      {subTab === "specialists" && <SpecialistApplicationsSubTab />}
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

function SpecialistApplicationsSubTab() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | undefined>(undefined);
  const { data: applications, isLoading } = trpc.admin.specialistApplications.useQuery({ status: filter });
  const approveMutation = trpc.admin.approveSpecialist.useMutation();
  const rejectMutation = trpc.admin.rejectSpecialist.useMutation();
  const utils = trpc.useUtils();
  const [notes, setNotes] = useState<Record<number, string>>({});

  if (isLoading) return <div className="text-muted-foreground">Carregando solicitações de especialista...</div>;

  const handleApprove = async (applicationId: number) => {
    try {
      await approveMutation.mutateAsync({ applicationId, adminNotes: notes[applicationId] });
      utils.admin.specialistApplications.invalidate();
      toast.success("Especialista aprovado!");
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
      utils.admin.specialistApplications.invalidate();
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
        <p className="text-muted-foreground text-center py-8">Nenhuma solicitação de especialista encontrada.</p>
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
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(backup.url);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup-${backup.id}.md`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    toast.success("Download iniciado!");
                  } catch {
                    toast.error("Erro ao baixar backup");
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-primary/30 text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar
              </button>
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

function InsightsTab() {
  const { data, isLoading } = trpc.analytics.adminDashboard.useQuery();

  if (isLoading) return <div className="text-muted-foreground">Carregando insights...</div>;
  if (!data) return <div className="text-destructive">Erro ao carregar insights</div>;

  return (
    <div className="space-y-8">
      <h2 className="font-display text-2xl tracking-wider text-foreground">INSIGHTS DA PLATAFORMA</h2>

      {/* Growth Cards */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Crescimento</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Novos Usuários (7d)", value: data.growth.usersLast7Days, color: "text-green-400" },
            { label: "Novos Usuários (30d)", value: data.growth.usersLast30Days, color: "text-green-400" },
            { label: "Avaliações (7d)", value: data.growth.ratingsLast7Days, color: "text-blue-400" },
            { label: "Avaliações (30d)", value: data.growth.ratingsLast30Days, color: "text-blue-400" },
          ].map(card => (
            <div key={card.label} className="p-4 rounded-xl bg-card border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              <p className={`font-numbers text-2xl font-bold ${card.color}`}>
                {card.value.toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* User Activity */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Atividade de Usuários</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Ativos (7 dias)</p>
            </div>
            <p className="font-numbers text-2xl font-bold text-foreground">{data.userActivity.activeUsersLast7Days}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Ativos (30 dias)</p>
            </div>
            <p className="font-numbers text-2xl font-bold text-foreground">{data.userActivity.activeUsersLast30Days}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-muted-foreground">Média Aval./Usuário</p>
            </div>
            <p className="font-numbers text-2xl font-bold text-foreground">{data.userActivity.avgRatingsPerUser}</p>
          </div>
        </div>
      </div>

      {/* Rating Types */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Tipos de Avaliação</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Avaliação Direta</p>
            <p className="font-numbers text-2xl font-bold text-foreground">{data.ratingTypes.direct.toLocaleString("pt-BR")}</p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${((data.ratingTypes.direct / (data.ratingTypes.direct + data.ratingTypes.analytic)) * 100) || 0}%` }}
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Avaliação Analítica</p>
            <p className="font-numbers text-2xl font-bold text-foreground">{data.ratingTypes.analytic.toLocaleString("pt-BR")}</p>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{ width: `${((data.ratingTypes.analytic / (data.ratingTypes.direct + data.ratingTypes.analytic)) * 100) || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Over Time */}
      {data.ratingsOverTime.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Avaliações por Dia (últimos 30 dias)</h3>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-end gap-1 h-32">
              {data.ratingsOverTime.map((day, i) => {
                const maxCount = Math.max(...data.ratingsOverTime.map(d => d.count));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${day.date}: ${day.count} avaliações`}>
                    <div
                      className="w-full bg-primary/80 rounded-t min-h-[2px]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                {data.ratingsOverTime[0]?.date?.slice(5) || ""}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {data.ratingsOverTime[data.ratingsOverTime.length - 1]?.date?.slice(5) || ""}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category Distribution */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Distribuição por Categoria</h3>
        <div className="space-y-2">
          {data.categoryDistribution.map(cat => {
            const maxRatings = Math.max(...data.categoryDistribution.map(c => c.ratingCount));
            const width = maxRatings > 0 ? (cat.ratingCount / maxRatings) * 100 : 0;
            return (
              <div key={cat.categoryId} className="p-3 rounded-lg bg-card border border-border/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{cat.categoryName}</span>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{cat.establishmentCount} estabs</span>
                    <span>{cat.ratingCount} avaliações</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Establishments */}
      {data.topEstablishments.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Top 10 Estabelecimentos (mín. 3 avaliações)</h3>
          <div className="space-y-2">
            {data.topEstablishments.map((est, i) => (
              <div key={est.id} className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-3">
                <span className="font-numbers text-lg font-bold text-primary/50 w-6 text-center">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{est.name}</p>
                  <p className="text-xs text-muted-foreground">{est.neighborhood || "—"}</p>
                </div>
                <div className="text-right">
                  <p className="font-numbers text-lg font-bold text-primary">{est.avgScore}</p>
                  <p className="text-[10px] text-muted-foreground">{est.ratingCount} aval.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// INTEGRATIONS TAB
// ============================================================

const INTEGRATION_FIELDS = [
  {
    key: "connect_yarin_token",
    label: "Connect Yarin — API Token",
    description: "Token de autenticação para a API do Connect Yarin (Bearer token). Permite consultar estatísticas de visitas e cliques no perfil.",
    placeholder: "cole o token aqui...",
    sensitive: true,
  },
  {
    key: "gtm_id",
    label: "Google Tag Manager — Container ID",
    description: "ID do container GTM (formato: GTM-XXXXXXX). Será injetado automaticamente em todas as páginas do app.",
    placeholder: "GTM-XXXXXXX",
    sensitive: false,
  },
];

function IntegrationsTab() {
  const { data: integrationsList, isLoading } = trpc.integrations.list.useQuery();
  const setMutation = trpc.integrations.set.useMutation();
  const deleteMutation = trpc.integrations.delete.useMutation();
  const utils = trpc.useUtils();

  const [values, setValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Sync from server
  useEffect(() => {
    if (integrationsList) {
      const map: Record<string, string> = {};
      integrationsList.forEach((item: any) => {
        map[item.key] = item.value || "";
      });
      setValues(prev => ({ ...prev, ...map }));
    }
  }, [integrationsList]);

  const handleSave = async (key: string, label: string) => {
    const value = values[key]?.trim();
    if (!value) {
      toast.error("O campo não pode estar vazio");
      return;
    }
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await setMutation.mutateAsync({ key, value, label });
      utils.integrations.list.invalidate();
      utils.integrations.getGtmId.invalidate();
      toast.success(`${label} salvo com sucesso!`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar");
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleDelete = async (key: string, label: string) => {
    if (!confirm(`Tem certeza que deseja remover "${label}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ key });
      utils.integrations.list.invalidate();
      utils.integrations.getGtmId.invalidate();
      setValues(prev => ({ ...prev, [key]: "" }));
      toast.success(`${label} removido`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover");
    }
  };

  const isConfigured = (key: string) => {
    return integrationsList?.some((item: any) => item.key === key && item.value);
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando integrações...</div>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-wider text-foreground mb-2">INTEGRAÇÕES</h2>
        <p className="text-sm text-muted-foreground">
          Configure tokens e IDs de serviços externos. Os valores são salvos de forma segura no banco de dados.
        </p>
      </div>

      <div className="space-y-6">
        {INTEGRATION_FIELDS.map(field => {
          const configured = isConfigured(field.key);
          return (
            <div key={field.key} className="p-5 rounded-xl bg-card border border-border/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plug className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">{field.label}</h3>
                  {configured && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 font-bold">
                      ATIVO
                    </span>
                  )}
                </div>
                {configured && (
                  <button
                    onClick={() => handleDelete(field.key, field.label)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remover integração"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">{field.description}</p>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={field.sensitive && !showValues[field.key] ? "password" : "text"}
                    value={values[field.key] || ""}
                    onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 font-mono"
                  />
                  {field.sensitive && (
                    <button
                      onClick={() => setShowValues(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showValues[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleSave(field.key, field.label)}
                  disabled={saving[field.key] || !values[field.key]?.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving[field.key] ? "Salvando..." : "Salvar"}
                </button>
              </div>

              {field.key === "gtm_id" && configured && (
                <p className="text-xs text-green-400/80 mt-3 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  GTM ativo — o script será carregado em todas as páginas automaticamente.
                </p>
              )}
              {field.key === "connect_yarin_token" && configured && (
                <p className="text-xs text-green-400/80 mt-3 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Token configurado — as estatísticas do Connect Yarin serão exibidas nos perfis.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="mt-8 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-primary" />
          Precisa adicionar outra integração?
        </h4>
        <p className="text-xs text-muted-foreground">
          Para adicionar novos tokens ou chaves de API, entre em contato com o suporte técnico ou solicite via chat.
          A estrutura suporta qualquer integração key/value.
        </p>
      </div>
    </div>
  );
}


// ============================================================
// CRITICS TAB — Gerenciamento de Críticos Gastronômicos
// ============================================================
function CriticsTab() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | undefined>(undefined);
  const { data: applications, isLoading } = trpc.critic.adminList.useQuery({ status: filter });
  const utils = trpc.useUtils();

  const approveMutation = trpc.critic.adminApprove.useMutation({
    onSuccess: () => {
      utils.critic.adminList.invalidate();
      toast.success("Crítico aprovado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.critic.adminReject.useMutation({
    onSuccess: () => {
      utils.critic.adminList.invalidate();
      toast.success("Solicitação rejeitada.");
    },
    onError: (err) => toast.error(err.message),
  });

  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-wider text-foreground">CRÍTICOS GASTRONÔMICOS</h2>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? undefined : status)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                filter === status
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                  : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "pending" ? "Pendentes" : status === "approved" ? "Aprovados" : "Rejeitados"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !applications || applications.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">Nenhuma solicitação {filter ? `com status "${filter}"` : ""} encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => (
            <div key={app.id} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{app.displayName}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      app.status === "approved" ? "bg-green-500/20 text-green-400" :
                      app.status === "rejected" ? "bg-red-500/20 text-red-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {app.status === "approved" ? "APROVADO" : app.status === "rejected" ? "REJEITADO" : "PENDENTE"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Veículo:</span> {app.publication}
                  </p>
                  {app.specialty && (
                    <p className="text-xs text-muted-foreground mt-0.5">Especialidade: {app.specialty}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Usuário: {app.userName || app.username} ({app.userEmail || "sem email"})
                  </p>
                  {app.bio && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{app.bio}"</p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Enviado em: {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {app.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveMutation.mutate({ applicationId: app.id })}
                      disabled={approveMutation.isPending}
                      className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => setRejectId(app.id)}
                      className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5 inline mr-1" />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>

              {app.adminNotes && (
                <div className="mt-2 p-2 rounded bg-secondary/50 text-xs text-muted-foreground">
                  <span className="font-medium">Notas admin:</span> {app.adminNotes}
                </div>
              )}

              {/* Reject dialog inline */}
              {rejectId === app.id && (
                <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <label className="text-xs text-muted-foreground block mb-1">Motivo da rejeição:</label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground resize-none"
                    placeholder="Explique o motivo..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (!rejectNotes.trim()) {
                          toast.error("Informe o motivo da rejeição.");
                          return;
                        }
                        rejectMutation.mutate({ applicationId: app.id, adminNotes: rejectNotes });
                        setRejectId(null);
                        setRejectNotes("");
                      }}
                      disabled={rejectMutation.isPending}
                      className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Confirmar Rejeição
                    </button>
                    <button
                      onClick={() => { setRejectId(null); setRejectNotes(""); }}
                      className="px-3 py-1.5 text-xs bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function PlanosTab() {
  const { data: plansData, isLoading, refetch } = trpc.plans.adminListPlans.useQuery();
  const { data: promosData, refetch: refetchPromos } = trpc.plans.adminListPromos.useQuery();
  const createPlan = trpc.plans.adminCreatePlan.useMutation({ onSuccess: () => { refetch(); toast.success("Plano criado!"); setShowPlanForm(false); } });
  const updatePlan = trpc.plans.adminUpdatePlan.useMutation({ onSuccess: () => { refetch(); toast.success("Plano atualizado!"); setEditingPlan(null); } });
  const deletePlan = trpc.plans.adminDeletePlan.useMutation({ onSuccess: () => { refetch(); toast.success("Plano removido!"); } });
  const createPromo = trpc.plans.adminCreatePromo.useMutation({ onSuccess: () => { refetchPromos(); toast.success("Código criado!"); setShowPromoForm(false); } });
  const deletePromo = trpc.plans.adminDeletePromo.useMutation({ onSuccess: () => { refetchPromos(); toast.success("Código removido!"); } });

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Plan form state
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [planHighlighted, setPlanHighlighted] = useState(false);
  const [planMaxRatings, setPlanMaxRatings] = useState("3");
  const [planRoles, setPlanRoles] = useState<string[]>(["user"]);
  const [planWizardSteps, setPlanWizardSteps] = useState<{title: string; description?: string; type: string}[]>([]);

  // Promo form state
  const [promoCode, setPromoCode] = useState("");
  const [promoType, setPromoType] = useState<"percentage" | "fixed">("percentage");
  const [promoValue, setPromoValue] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [promoPlanId, setPromoPlanId] = useState<string>("");
  const [promoMaxUses, setPromoMaxUses] = useState("");
  const [promoValidUntil, setPromoValidUntil] = useState("");

  const resetPlanForm = () => {
    setPlanName(""); setPlanDesc(""); setPlanPrice(""); setPlanFeatures(""); setPlanHighlighted(false); setPlanMaxRatings("3");
    setPlanRoles(["user"]); setPlanWizardSteps([]);
  };

  const resetPromoForm = () => {
    setPromoCode(""); setPromoType("percentage"); setPromoValue(""); setPromoDesc(""); setPromoPlanId(""); setPromoMaxUses(""); setPromoValidUntil("");
  };

  const handleCreatePlan = () => {
    createPlan.mutate({
      name: planName,
      description: planDesc || undefined,
      price: parseFloat(planPrice) || 0,
      features: planFeatures.split("\n").filter(f => f.trim()),
      roles: planRoles as any,
      wizardSteps: planWizardSteps as any,
      highlighted: planHighlighted,
      maxRatingsPerDay: parseInt(planMaxRatings) || 3,
      sortOrder: (plansData?.length || 0),
    });
    resetPlanForm();
  };

  const handleUpdatePlan = () => {
    if (!editingPlan) return;
    updatePlan.mutate({
      id: editingPlan.id,
      name: planName,
      description: planDesc || undefined,
      price: parseFloat(planPrice) || 0,
      features: planFeatures.split("\n").filter(f => f.trim()),
      roles: planRoles as any,
      wizardSteps: planWizardSteps as any,
      highlighted: planHighlighted,
      maxRatingsPerDay: parseInt(planMaxRatings) || 3,
    });
    resetPlanForm();
  };

  const startEdit = (plan: any) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDesc(plan.description || "");
    setPlanPrice(String(plan.price));
    setPlanFeatures((plan.features || []).join("\n"));
    setPlanHighlighted(plan.highlighted);
    setPlanMaxRatings(String(plan.maxRatingsPerDay));
    setPlanRoles(plan.roles || ["user"]);
    setPlanWizardSteps(plan.wizardSteps || []);
  };

  const handleCreatePromo = () => {
    createPromo.mutate({
      code: promoCode,
      discountType: promoType,
      discountValue: parseFloat(promoValue) || 0,
      description: promoDesc || undefined,
      planId: promoPlanId ? parseInt(promoPlanId) : null,
      maxUses: promoMaxUses ? parseInt(promoMaxUses) : null,
      validUntil: promoValidUntil || null,
    });
    resetPromoForm();
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider text-foreground">PLANOS</h2>
        <Button onClick={() => { resetPlanForm(); setEditingPlan(null); setShowPlanForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Plano
        </Button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plansData?.map((plan: any) => (
          <div key={plan.id} className={`relative p-6 rounded-xl border transition-all ${
            plan.highlighted ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20' : 'border-border/50 bg-card'
          } ${!plan.active ? 'opacity-50' : ''}`}>
            {plan.highlighted && (
              <div className="absolute -top-3 left-4 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> DESTAQUE
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-lg tracking-wider text-foreground">{plan.name}</h3>
                {!plan.active && <span className="text-xs text-red-400">(Inativo)</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(plan)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => { if (confirm(`Excluir plano "${plan.name}"?`)) deletePlan.mutate({ id: plan.id }); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mb-3">
              <span className="text-3xl font-bold text-primary">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
            <div className="space-y-1.5 mb-3">
              {(plan.features || []).map((f: string, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            {plan.roles && plan.roles.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {plan.roles.map((role: string) => (
                  <span key={role} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium uppercase">{role}</span>
                ))}
              </div>
            )}
            {plan.wizardSteps && plan.wizardSteps.length > 0 && (
              <div className="mb-3 pt-2 border-t border-border/20">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Wizard ({plan.wizardSteps.length} passos)</p>
                <div className="flex gap-1">
                  {plan.wizardSteps.map((_: any, i: number) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary/40" />
                  ))}
                </div>
              </div>
            )}
            <div className="pt-3 border-t border-border/30">
              <p className="text-xs text-muted-foreground">Máx. {plan.maxRatingsPerDay} avaliações/dia</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Form (Create/Edit) */}
      {(showPlanForm || editingPlan) && (
        <div className="p-6 rounded-xl bg-card border border-primary/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg tracking-wider text-primary">
              {editingPlan ? 'EDITAR PLANO' : 'NOVO PLANO'}
            </h3>
            <button onClick={() => { setShowPlanForm(false); setEditingPlan(null); resetPlanForm(); }} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome do Plano</label>
              <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Ex: Premium" className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preço (R$/mês)</label>
              <input value={planPrice} onChange={e => setPlanPrice(e.target.value)} type="number" step="0.01" placeholder="9.90" className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Máx. Avaliações/Dia</label>
              <input value={planMaxRatings} onChange={e => setPlanMaxRatings(e.target.value)} type="number" placeholder="3" className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={planHighlighted} onChange={e => setPlanHighlighted(e.target.checked)} id="highlighted" className="rounded" />
              <label htmlFor="highlighted" className="text-sm text-foreground">Plano em destaque</label>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
            <input value={planDesc} onChange={e => setPlanDesc(e.target.value)} placeholder="Descrição curta do plano" className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Benefícios (um por linha)</label>
            <textarea value={planFeatures} onChange={e => setPlanFeatures(e.target.value)} rows={4} placeholder={"Até 5 avaliações por dia\nDouble no primeiro pedido\nDescontos exclusivos"} className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm resize-none" />
          </div>

          {/* Roles Selection */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Roles (para quais perfis este plano é visível)</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {["user", "critic", "specialist", "business", "support"].map(role => (
                <label key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm ${
                  planRoles.includes(role) ? 'border-primary/60 bg-primary/10 text-primary' : 'border-border/50 bg-background text-muted-foreground hover:border-border'
                }`}>
                  <input
                    type="checkbox"
                    checked={planRoles.includes(role)}
                    onChange={e => {
                      if (e.target.checked) setPlanRoles([...planRoles, role]);
                      else setPlanRoles(planRoles.filter(r => r !== role));
                    }}
                    className="sr-only"
                  />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Wizard Steps */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Passos do Wizard (fluxo de assinatura)</label>
            <div className="space-y-3 mt-1">
              {planWizardSteps.map((step: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-background border border-border/50 space-y-3">
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-bold w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">{i + 1}</span>
                    <input
                      value={step.title}
                      onChange={e => {
                        const updated = [...planWizardSteps];
                        updated[i] = { ...updated[i], title: e.target.value };
                        setPlanWizardSteps(updated);
                      }}
                      placeholder="Título do passo"
                      className="flex-1 px-2 py-1.5 rounded-lg bg-card border border-border/30 text-foreground text-sm"
                    />
                    <select
                      value={step.type}
                      onChange={e => {
                        const updated = [...planWizardSteps];
                        updated[i] = { ...updated[i], type: e.target.value };
                        setPlanWizardSteps(updated);
                      }}
                      className="px-2 py-1.5 rounded-lg bg-card border border-border/30 text-foreground text-xs"
                    >
                      <option value="info">Info</option>
                      <option value="form">Formulário</option>
                      <option value="payment">Pagamento</option>
                      <option value="review">Revisão</option>
                      <option value="confirmation">Confirmação</option>
                    </select>
                    {/* Reorder buttons */}
                    <button
                      onClick={() => {
                        if (i === 0) return;
                        const updated = [...planWizardSteps];
                        [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
                        setPlanWizardSteps(updated);
                      }}
                      disabled={i === 0}
                      className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                      title="Mover para cima"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                    <button
                      onClick={() => {
                        if (i === planWizardSteps.length - 1) return;
                        const updated = [...planWizardSteps];
                        [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
                        setPlanWizardSteps(updated);
                      }}
                      disabled={i === planWizardSteps.length - 1}
                      className="p-1 text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                      title="Mover para baixo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {/* Duplicate button */}
                    <button
                      onClick={() => {
                        const updated = [...planWizardSteps];
                        updated.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(step)), title: step.title + " (cópia)" });
                        setPlanWizardSteps(updated);
                      }}
                      className="p-1 text-muted-foreground hover:text-blue-400 transition-colors"
                      title="Duplicar passo"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={() => setPlanWizardSteps(planWizardSteps.filter((_: any, idx: number) => idx !== i))}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                      title="Excluir passo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block uppercase tracking-wider">Descrição do passo</label>
                    <textarea
                      value={step.description || ""}
                      onChange={e => {
                        const updated = [...planWizardSteps];
                        updated[i] = { ...updated[i], description: e.target.value };
                        setPlanWizardSteps(updated);
                      }}
                      placeholder="Texto explicativo que aparece neste passo..."
                      rows={2}
                      className="w-full px-2 py-1.5 rounded-lg bg-card border border-border/30 text-foreground text-xs resize-none"
                    />
                  </div>

                  {/* Benefits list */}
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-0.5 block uppercase tracking-wider">Benefícios / Itens (um por linha)</label>
                    <textarea
                      value={(step.benefits || []).join("\n")}
                      onChange={e => {
                        const updated = [...planWizardSteps];
                        updated[i] = { ...updated[i], benefits: e.target.value.split("\n").filter((b: string) => b.trim()) };
                        setPlanWizardSteps(updated);
                      }}
                      placeholder={"Benefício 1\nBenefício 2\nBenefício 3"}
                      rows={3}
                      className="w-full px-2 py-1.5 rounded-lg bg-card border border-border/30 text-foreground text-xs resize-none"
                    />
                  </div>

                  {/* Button text + Price row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block uppercase tracking-wider">Texto do botão</label>
                      <input
                        value={step.buttonText || ""}
                        onChange={e => {
                          const updated = [...planWizardSteps];
                          updated[i] = { ...updated[i], buttonText: e.target.value };
                          setPlanWizardSteps(updated);
                        }}
                        placeholder="Ex: Próximo, Enviar, Ativar"
                        className="w-full px-2 py-1.5 rounded-lg bg-card border border-border/30 text-foreground text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block uppercase tracking-wider">Preço (opcional)</label>
                      <input
                        value={step.price || ""}
                        onChange={e => {
                          const updated = [...planWizardSteps];
                          updated[i] = { ...updated[i], price: e.target.value ? parseFloat(e.target.value) : undefined };
                          setPlanWizardSteps(updated);
                        }}
                        type="number" step="0.01" placeholder="19.90"
                        className="w-full px-2 py-1.5 rounded-lg bg-card border border-border/30 text-foreground text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-0.5 block uppercase tracking-wider">Label do preço</label>
                      <input
                        value={step.priceLabel || ""}
                        onChange={e => {
                          const updated = [...planWizardSteps];
                          updated[i] = { ...updated[i], priceLabel: e.target.value };
                          setPlanWizardSteps(updated);
                        }}
                        placeholder="/mês"
                        className="w-full px-2 py-1.5 rounded-lg bg-card border border-border/30 text-foreground text-xs"
                      />
                    </div>
                  </div>

                  {/* Form Fields (only for type=form) */}
                  {step.type === "form" && (
                    <div className="pt-2 border-t border-border/20">
                      <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Campos do Formulário</label>
                      <div className="space-y-2">
                        {(step.formFields || []).map((field: any, fi: number) => (
                          <div key={fi} className="p-2.5 rounded-lg bg-card/50 border border-border/20 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                value={field.label}
                                onChange={e => {
                                  const updated = [...planWizardSteps];
                                  const fields = [...(updated[i].formFields || [])];
                                  fields[fi] = { ...fields[fi], label: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                                  updated[i] = { ...updated[i], formFields: fields };
                                  setPlanWizardSteps(updated);
                                }}
                                placeholder="Label do campo"
                                className="flex-1 px-2 py-1 rounded bg-background border border-border/30 text-foreground text-xs"
                              />
                              <select
                                value={field.type}
                                onChange={e => {
                                  const updated = [...planWizardSteps];
                                  const fields = [...(updated[i].formFields || [])];
                                  fields[fi] = { ...fields[fi], type: e.target.value };
                                  updated[i] = { ...updated[i], formFields: fields };
                                  setPlanWizardSteps(updated);
                                }}
                                className="px-2 py-1 rounded bg-background border border-border/30 text-foreground text-[10px]"
                              >
                                <option value="text">Texto</option>
                                <option value="textarea">Texto longo</option>
                                <option value="email">Email</option>
                                <option value="url">URL</option>
                                <option value="number">Número</option>
                                <option value="tel">Telefone</option>
                                <option value="select">Seleção</option>
                              </select>
                              <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <input
                                  type="checkbox"
                                  checked={field.required || false}
                                  onChange={e => {
                                    const updated = [...planWizardSteps];
                                    const fields = [...(updated[i].formFields || [])];
                                    fields[fi] = { ...fields[fi], required: e.target.checked };
                                    updated[i] = { ...updated[i], formFields: fields };
                                    setPlanWizardSteps(updated);
                                  }}
                                  className="rounded"
                                />
                                Obrig.
                              </label>
                              {/* Reorder field buttons */}
                              <button
                                onClick={() => {
                                  if (fi === 0) return;
                                  const updated = [...planWizardSteps];
                                  const fields = [...(updated[i].formFields || [])];
                                  [fields[fi - 1], fields[fi]] = [fields[fi], fields[fi - 1]];
                                  updated[i] = { ...updated[i], formFields: fields };
                                  setPlanWizardSteps(updated);
                                }}
                                disabled={fi === 0}
                                className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30"
                                title="Mover campo para cima"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (fi === (step.formFields || []).length - 1) return;
                                  const updated = [...planWizardSteps];
                                  const fields = [...(updated[i].formFields || [])];
                                  [fields[fi], fields[fi + 1]] = [fields[fi + 1], fields[fi]];
                                  updated[i] = { ...updated[i], formFields: fields };
                                  setPlanWizardSteps(updated);
                                }}
                                disabled={fi === (step.formFields || []).length - 1}
                                className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30"
                                title="Mover campo para baixo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                              </button>
                              <button
                                onClick={() => {
                                  const updated = [...planWizardSteps];
                                  const fields = (updated[i].formFields || []).filter((_: any, idx: number) => idx !== fi);
                                  updated[i] = { ...updated[i], formFields: fields };
                                  setPlanWizardSteps(updated);
                                }}
                                className="p-0.5 text-muted-foreground hover:text-red-400"
                                title="Excluir campo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            {/* Placeholder field */}
                            <input
                              value={field.placeholder || ""}
                              onChange={e => {
                                const updated = [...planWizardSteps];
                                const fields = [...(updated[i].formFields || [])];
                                fields[fi] = { ...fields[fi], placeholder: e.target.value };
                                updated[i] = { ...updated[i], formFields: fields };
                                setPlanWizardSteps(updated);
                              }}
                              placeholder="Placeholder do campo (texto de exemplo)"
                              className="w-full px-2 py-1 rounded bg-background border border-border/20 text-foreground text-[10px] placeholder:text-muted-foreground/40"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const updated = [...planWizardSteps];
                            const fields = [...(updated[i].formFields || []), { name: "", label: "", type: "text", required: false }];
                            updated[i] = { ...updated[i], formFields: fields };
                            setPlanWizardSteps(updated);
                          }}
                          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
                        >
                          <Plus className="w-3 h-3" /> Adicionar campo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => setPlanWizardSteps([...planWizardSteps, { title: "", type: "info" }])}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar passo
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={editingPlan ? handleUpdatePlan : handleCreatePlan} disabled={!planName || !planPrice} className="gap-2">
              <Save className="w-4 h-4" /> {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
            </Button>
            <Button variant="outline" onClick={() => { setShowPlanForm(false); setEditingPlan(null); resetPlanForm(); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Promo Codes Section */}
      <div className="pt-6 border-t border-border/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl tracking-wider text-foreground">CÓDIGOS PROMOCIONAIS</h3>
          </div>
          <Button variant="outline" onClick={() => { resetPromoForm(); setShowPromoForm(true); }} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> Novo Código
          </Button>
        </div>

        {/* Promo list */}
        {promosData && promosData.length > 0 ? (
          <div className="space-y-2">
            {promosData.map((promo: any) => (
              <div key={promo.id} className={`flex items-center justify-between p-4 rounded-lg border ${promo.active ? 'border-border/50 bg-card' : 'border-border/30 bg-card/50 opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <code className="px-3 py-1 rounded bg-primary/10 text-primary font-mono font-bold text-sm">{promo.code}</code>
                  <span className="text-sm text-foreground">
                    {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `R$ ${promo.discountValue.toFixed(2)} OFF`}
                  </span>
                  {promo.description && <span className="text-xs text-muted-foreground">— {promo.description}</span>}
                  {promo.maxUses && <span className="text-xs text-muted-foreground">({promo.currentUses}/{promo.maxUses} usos)</span>}
                  {promo.validUntil && <span className="text-xs text-muted-foreground">até {new Date(promo.validUntil).toLocaleDateString('pt-BR')}</span>}
                </div>
                <button onClick={() => { if (confirm(`Excluir código "${promo.code}"?`)) deletePromo.mutate({ id: promo.id }); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum código promocional cadastrado.</p>
        )}

        {/* Promo Form */}
        {showPromoForm && (
          <div className="mt-4 p-6 rounded-xl bg-card border border-primary/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg tracking-wider text-primary">NOVO CÓDIGO</h4>
              <button onClick={() => { setShowPromoForm(false); resetPromoForm(); }} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Código</label>
                <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="YARIN20" className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo de Desconto</label>
                <select value={promoType} onChange={e => setPromoType(e.target.value as any)} className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm">
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valor do Desconto</label>
                <input value={promoValue} onChange={e => setPromoValue(e.target.value)} type="number" step="0.01" placeholder={promoType === 'percentage' ? '20' : '5.00'} className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Plano (opcional)</label>
                <select value={promoPlanId} onChange={e => setPromoPlanId(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm">
                  <option value="">Todos os planos</option>
                  {plansData?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Máx. Usos (vazio = ilimitado)</label>
                <input value={promoMaxUses} onChange={e => setPromoMaxUses(e.target.value)} type="number" placeholder="100" className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Válido até</label>
                <input value={promoValidUntil} onChange={e => setPromoValidUntil(e.target.value)} type="date" className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descrição (opcional)</label>
              <input value={promoDesc} onChange={e => setPromoDesc(e.target.value)} placeholder="Desconto de lançamento" className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-foreground text-sm" />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreatePromo} disabled={!promoCode || !promoValue} className="gap-2">
                <Save className="w-4 h-4" /> Criar Código
              </Button>
              <Button variant="outline" onClick={() => { setShowPromoForm(false); resetPromoForm(); }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// ROLE REQUESTS TAB — Solicitações para virar Critic/Specialist
// ============================================================
function RoleRequestsTab() {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | undefined>("pending");
  const [reviewDialog, setReviewDialog] = useState<{
    id: number;
    action: "approved" | "rejected";
    userName: string;
    requestedRole: string;
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const utils = trpc.useUtils();

  const { data: requests, isLoading } = trpc.roleRequests.list.useQuery({ status: filter });
  const { data: pendingCount } = trpc.roleRequests.pendingCount.useQuery();

  const reviewMutation = trpc.roleRequests.review.useMutation({
    onSuccess: (result) => {
      toast.success(
        result.newRole
          ? `Perfil aprovado! Usuário promovido para ${result.newRole}.`
          : "Solicitação rejeitada."
      );
      utils.roleRequests.list.invalidate();
      utils.roleRequests.pendingCount.invalidate();
      setReviewDialog(null);
      setReviewNote("");
    },
    onError: (err) => {
      toast.error("Erro ao processar", { description: err.message });
    },
  });

  const handleReview = () => {
    if (!reviewDialog) return;
    reviewMutation.mutate({
      requestId: reviewDialog.id,
      action: reviewDialog.action,
      reviewNote: reviewNote || undefined,
    });
  };

  const roleLabels: Record<string, string> = {
    critic: "Crítico",
    specialist: "Especialista",
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendente", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
    approved: { label: "Aprovado", color: "text-green-400 bg-green-500/10 border-green-500/30" },
    rejected: { label: "Rejeitado", color: "text-red-400 bg-red-500/10 border-red-500/30" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl tracking-wider text-primary">SOLICITAÇÕES DE PERFIL</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie solicitações de usuários para se tornarem Críticos ou Especialistas
          </p>
        </div>
        {pendingCount && pendingCount.count > 0 && (
          <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium">
            {pendingCount.count} pendente{pendingCount.count > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {([
          { value: "pending", label: "Pendentes" },
          { value: "approved", label: "Aprovados" },
          { value: "rejected", label: "Rejeitados" },
          { value: undefined, label: "Todos" },
        ] as const).map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-card border border-border/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : requests?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma solicitação {filter === "pending" ? "pendente" : filter === "approved" ? "aprovada" : filter === "rejected" ? "rejeitada" : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests?.map((req) => {
            const status = statusLabels[req.status] || statusLabels.pending;
            return (
              <div key={req.id} className="p-4 rounded-xl bg-card border border-border/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">{req.userName || "Usuário"}</span>
                      {req.userUsername && (
                        <span className="text-xs text-muted-foreground">@{req.userUsername}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>Quer ser: <strong className="text-foreground">{roleLabels[req.requestedRole] || req.requestedRole}</strong></span>
                      <span>•</span>
                      <span>Role atual: {req.userRole || "user"}</span>
                      <span>•</span>
                      <span>{new Date(req.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>

                    {/* Message */}
                    <div className="mt-2 p-3 rounded-lg bg-background border border-border/30">
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{req.message}</p>
                    </div>

                    {/* Extra fields */}
                    {req.experience && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Experiência:</p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{req.experience}</p>
                      </div>
                    )}
                    {req.portfolio && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Portfólio:</p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{req.portfolio}</p>
                      </div>
                    )}
                    {req.specialties && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Especialidades:</p>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{req.specialties}</p>
                      </div>
                    )}

                    {/* Review note */}
                    {req.reviewNote && (
                      <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-xs text-muted-foreground">Nota do revisor:</p>
                        <p className="text-sm text-foreground/80">{req.reviewNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {req.status === "pending" && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => setReviewDialog({
                          id: req.id,
                          action: "approved",
                          userName: req.userName || "Usuário",
                          requestedRole: req.requestedRole,
                        })}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewDialog({
                          id: req.id,
                          action: "rejected",
                          userName: req.userName || "Usuário",
                          requestedRole: req.requestedRole,
                        })}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs"
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={() => { setReviewDialog(null); setReviewNote(""); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">
              {reviewDialog?.action === "approved" ? "APROVAR SOLICITAÇÃO" : "REJEITAR SOLICITAÇÃO"}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog?.action === "approved"
                ? `Ao aprovar, ${reviewDialog?.userName} será promovido(a) para ${roleLabels[reviewDialog?.requestedRole || ""] || reviewDialog?.requestedRole}.`
                : `Rejeitar a solicitação de ${reviewDialog?.userName} para se tornar ${roleLabels[reviewDialog?.requestedRole || ""] || reviewDialog?.requestedRole}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-1 block">
              Nota (opcional)
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={reviewDialog?.action === "approved"
                ? "Ex: Bem-vindo ao time de profissionais!"
                : "Ex: Precisamos de mais informações sobre sua experiência..."}
              className="w-full min-h-[80px] p-3 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              maxLength={500}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReviewDialog(null); setReviewNote(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className={reviewDialog?.action === "approved"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {reviewMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...</>
              ) : reviewDialog?.action === "approved" ? (
                "CONFIRMAR APROVAÇÃO"
              ) : (
                "CONFIRMAR REJEIÇÃO"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
