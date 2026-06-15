import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users, Plus, Crown, Lock, ArrowLeft, UserPlus, Search,
  ChevronRight, Star, Trash2, LogOut, X, Loader2, Eye, CalendarDays
} from "lucide-react";
import { Link, useLocation } from "wouter";

// ─── Create Group Modal ──────────────────────────────────────────────────────

function CreateGroupModal({
  onClose,
  planInfo,
}: {
  onClose: () => void;
  planInfo: { plan: string; groupCount: number; maxGroups: number | null };
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"private" | "influencer">("private");
  const utils = trpc.useUtils();

  const createMutation = trpc.groups.create.useMutation({
    onSuccess: () => {
      toast.success("Grupo criado com sucesso!");
      utils.groups.myGroups.invalidate();
      utils.groups.myPlan.invalidate();
      onClose();
    },
    onError: (err) => {
      if (err.message.includes("PLAN_REQUIRED")) {
        toast.error("Grupos de influencer requerem plano premium");
      } else if (err.message.includes("PLAN_LIMIT")) {
        toast.error("Limite de grupos atingido no plano gratuito. Faça upgrade!");
      } else {
        toast.error("Erro ao criar grupo");
      }
    },
  });

  const atLimit = planInfo.plan === "free" && planInfo.groupCount >= (planInfo.maxGroups ?? 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl tracking-wider text-primary">CRIAR GRUPO</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type selection */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-2 block">Tipo de grupo</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setType("private")}
              className={`p-3 rounded-lg border text-left transition-all ${
                type === "private"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              <Users className="w-5 h-5 mb-1" />
              <div className="text-sm font-medium">Privado</div>
              <div className="text-xs text-muted-foreground">Compartilhe avaliações com amigos</div>
            </button>
            <button
              onClick={() => setType("influencer")}
              className={`p-3 rounded-lg border text-left transition-all relative ${
                type === "influencer"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/50 text-muted-foreground hover:border-border"
              } ${planInfo.plan === "free" ? "opacity-60" : ""}`}
            >
              {planInfo.plan === "free" && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-primary" />
                </div>
              )}
              <Crown className="w-5 h-5 mb-1" />
              <div className="text-sm font-medium">Influencer</div>
              <div className="text-xs text-muted-foreground">Publique para seguidores</div>
            </button>
          </div>
        </div>

        {type === "influencer" && planInfo.plan === "free" && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary">
              <Crown className="w-4 h-4 inline mr-1" />
              Grupos de influencer requerem plano premium.
            </p>
            <Link href="/conta/planos">
              <span className="text-xs text-primary underline mt-1 inline-block">Ver planos</span>
            </Link>
          </div>
        )}

        {atLimit && type === "private" && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary">
              <Lock className="w-4 h-4 inline mr-1" />
              Você atingiu o limite de {planInfo.maxGroups} grupos no plano gratuito.
            </p>
            <Link href="/conta/planos">
              <span className="text-xs text-primary underline mt-1 inline-block">Fazer upgrade</span>
            </Link>
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1 block">Nome do grupo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Amigos Foodie"
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            maxLength={255}
          />
        </div>

        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-1 block">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sobre o que é esse grupo..."
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none h-20"
            maxLength={500}
          />
        </div>

        <Button
          onClick={() => createMutation.mutate({ name, description: description || undefined, type })}
          disabled={
            !name.trim() ||
            name.length < 2 ||
            createMutation.isPending ||
            (type === "influencer" && planInfo.plan === "free") ||
            (atLimit && type === "private")
          }
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          CRIAR GRUPO
        </Button>
      </div>
    </div>
  );
}

// ─── Invite User Modal ───────────────────────────────────────────────────────

function InviteUserModal({
  groupId,
  onClose,
}: {
  groupId: number;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchResults = trpc.groups.searchUsers.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );
  const inviteMutation = trpc.groups.invite.useMutation({
    onSuccess: () => {
      toast.success("Convite enviado!");
      onClose();
    },
    onError: (err) => {
      if (err.message.includes("ALREADY_MEMBER")) {
        toast.error("Usuário já é membro deste grupo");
      } else if (err.message.includes("ALREADY_INVITED")) {
        toast.error("Convite já enviado para este usuário");
      } else if (err.message.includes("não encontrado")) {
        toast.error("Usuário não encontrado");
      } else {
        toast.error("Erro ao enviar convite");
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg tracking-wider text-primary">CONVIDAR MEMBRO</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por @usuário..."
            className="w-full bg-background border border-border/50 rounded-lg pl-10 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {searchResults.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {searchResults.data?.length === 0 && query.length >= 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum usuário encontrado
            </p>
          )}
          {searchResults.data?.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/30"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => inviteMutation.mutate({ groupId, username: user.username! })}
                disabled={inviteMutation.isPending}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                Convidar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Group Detail View ───────────────────────────────────────────────────────

function GroupDetail({
  groupId,
  onBack,
}: {
  groupId: number;
  onBack: () => void;
}) {
  const { data: group, isLoading } = trpc.groups.getById.useQuery({ groupId });
  const { data: feed } = trpc.groups.feed.useQuery(
    { groupId, limit: 20, offset: 0 },
    { enabled: !!group?.isMember }
  );
  const { data: groupEvents } = trpc.events.listByGroup.useQuery(
    { groupId, status: "active" },
    { enabled: !!group?.isMember }
  );
  const [showInvite, setShowInvite] = useState(false);
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const deleteMutation = trpc.groups.delete.useMutation({
    onSuccess: () => {
      toast.success("Grupo excluído");
      utils.groups.myGroups.invalidate();
      utils.groups.myPlan.invalidate();
      onBack();
    },
  });

  const unfollowMutation = trpc.groups.unfollow.useMutation({
    onSuccess: () => {
      toast.success("Você deixou de seguir este grupo");
      utils.groups.followedGroups.invalidate();
      onBack();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Grupo não encontrado</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const isCreator = user?.id === group.creatorId;
  const isInfluencer = group.type === "influencer";

  return (
    <div>
      {showInvite && (
        <InviteUserModal groupId={groupId} onClose={() => setShowInvite(false)} />
      )}

      {/* Header */}
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl tracking-wider text-foreground">{group.name}</h2>
              {isInfluencer && <Crown className="w-5 h-5 text-primary" />}
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {group.memberCount} {group.memberCount === 1 ? "membro" : "membros"}
            </p>
          </div>
          <div className="flex gap-2">
            {isCreator && !isInfluencer && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInvite(true)}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <UserPlus className="w-4 h-4 mr-1" /> Convidar
              </Button>
            )}
            {isCreator && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir este grupo?")) {
                    deleteMutation.mutate({ groupId });
                  }
                }}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            {!isCreator && isInfluencer && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => unfollowMutation.mutate({ groupId })}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-1" /> Deixar de seguir
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      {group.members && group.members.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">MEMBROS</h3>
          <div className="space-y-2">
            {group.members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {(m.userName || "?")[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{m.userName}</p>
                    <p className="text-xs text-muted-foreground">@{m.username}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {m.role === "admin" || m.role === "creator" ? "Admin" : m.role === "follower" ? "Seguidor" : "Membro"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Button */}
      {!isInfluencer && group.isMember && (
        <div className="mb-6">
          <Link href={`/grupo/${groupId}/calendario`}>
            <button className="w-full p-4 rounded-xl bg-primary/10 border border-primary/30 hover:border-primary/60 transition-all flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  {groupEvents && groupEvents.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {groupEvents.length}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Calendário de Eventos</p>
                  <p className="text-xs text-muted-foreground">
                    {groupEvents && groupEvents.length > 0
                      ? `${groupEvents.length} evento${groupEvents.length > 1 ? "s" : ""} próximo${groupEvents.length > 1 ? "s" : ""}`
                      : "Agende encontros com o grupo"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>
      )}

      {/* Feed */}
      <div>
        <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
          {isInfluencer ? "PUBLICAÇÕES" : "AVALIAÇÕES COMPARTILHADAS"}
        </h3>
        {(!feed || feed.length === 0) ? (
          <div className="text-center py-10 bg-background/50 rounded-xl border border-border/30">
            <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {isInfluencer
                ? "Nenhuma publicação ainda"
                : "Nenhuma avaliação compartilhada ainda"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isCreator
                ? "Compartilhe suas avaliações com o grupo!"
                : "Aguarde os membros compartilharem avaliações"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map((item: any) => (
              <Link key={item.id} href={`/estabelecimento/${item.establishmentSlug}`}>
                <div className="p-4 rounded-xl bg-background/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">
                        {(item.sharerName || "?")[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">@{item.sharerUsername}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.establishmentImage && (
                      <img
                        src={item.establishmentImage}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.establishmentName}
                      </p>
                      {item.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.note}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {typeof item.overallScore === "number" ? item.overallScore.toFixed(1) : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">{item.ratingType}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Discover Influencer Groups ──────────────────────────────────────────────

function DiscoverSection() {
  const { data: groups, isLoading } = trpc.groups.discover.useQuery();
  const utils = trpc.useUtils();

  const followMutation = trpc.groups.follow.useMutation({
    onSuccess: () => {
      toast.success("Você agora segue este grupo!");
      utils.groups.followedGroups.invalidate();
      utils.groups.discover.invalidate();
    },
    onError: (err) => {
      if (err.message.includes("ALREADY_FOLLOWING")) {
        toast.error("Você já segue este grupo");
      } else {
        toast.error("Erro ao seguir grupo");
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!groups || groups.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-4">
        DESCOBRIR INFLUENCERS
      </h3>
      <div className="space-y-3">
        {groups.map((g: any) => (
          <div
            key={g.id}
            className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  por @{g.creatorUsername} · {g.memberCount} seguidores
                </p>
                {g.description && (
                  <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{g.description}</p>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => followMutation.mutate({ groupId: g.id })}
                disabled={followMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 ml-3"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Seguir
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GruposPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"meus" | "sigo">("meus");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data: myGroups, isLoading: loadingMy } = trpc.groups.myGroups.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: followedGroups, isLoading: loadingFollowed } = trpc.groups.followedGroups.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: planInfo } = trpc.groups.myPlan.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const tabs = [
    { id: "meus" as const, label: "Meus Grupos", icon: Users },
    { id: "sigo" as const, label: "Grupos que Sigo", icon: Crown },
  ];

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <Navbar onMenuOpen={() => setMenuOpen(true)} />
        <div className="container py-20 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl tracking-wider text-foreground mb-2">GRUPOS</h2>
          <p className="text-muted-foreground mb-6">
            Faça login para criar e participar de grupos
          </p>
          <a href={getLoginUrl()}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider">
              ENTRAR
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      {showCreate && planInfo && (
        <CreateGroupModal onClose={() => setShowCreate(false)} planInfo={planInfo} />
      )}

      <div className="container py-6 pb-24">
        {selectedGroupId ? (
          <GroupDetail groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display text-3xl tracking-wider text-primary text-glow-amber">
                GRUPOS
              </h1>
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" /> CRIAR
              </Button>
            </div>

            {/* Plan info */}
            {planInfo && planInfo.plan === "free" && (
              <div className="mb-4 p-3 rounded-lg bg-card border border-border/50 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{planInfo.groupCount}</span>/{planInfo.maxGroups} grupos no plano gratuito
                </div>
                <Link href="/conta/planos">
                  <span className="text-xs text-primary font-medium">Upgrade</span>
                </Link>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-card rounded-lg border border-border/50 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {activeTab === "meus" && (
              <div>
                {loadingMy ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !myGroups || myGroups.length === 0 ? (
                  <div className="text-center py-16 bg-card/50 rounded-xl border border-border/30">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-1">Nenhum grupo ainda</p>
                    <p className="text-xs text-muted-foreground/60 mb-4">
                      Crie um grupo e convide amigos para compartilhar avaliações
                    </p>
                    <Button
                      onClick={() => setShowCreate(true)}
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Criar meu primeiro grupo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myGroups.map((g: any) => (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGroupId(g.id)}
                        className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {g.type === "influencer" ? (
                                <Crown className="w-4 h-4 text-primary flex-shrink-0" />
                              ) : (
                                <Users className="w-4 h-4 text-primary flex-shrink-0" />
                              )}
                              <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                                {g.role === "admin" || g.role === "creator" ? "Admin" : "Membro"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {g.memberCount} {g.memberCount === 1 ? "membro" : "membros"}
                              {g.description && ` · ${g.description}`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "sigo" && (
              <div>
                {loadingFollowed ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : !followedGroups || followedGroups.length === 0 ? (
                  <div className="text-center py-16 bg-card/50 rounded-xl border border-border/30">
                    <Crown className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-1">Nenhum grupo seguido</p>
                    <p className="text-xs text-muted-foreground/60">
                      Siga influencers para ver suas avaliações e recomendações
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {followedGroups.map((g: any) => (
                      <div
                        key={g.id}
                        onClick={() => setSelectedGroupId(g.id)}
                        className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-primary flex-shrink-0" />
                              <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              por @{g.creatorUsername} · {g.memberCount} seguidores
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Discover section */}
                <DiscoverSection />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
