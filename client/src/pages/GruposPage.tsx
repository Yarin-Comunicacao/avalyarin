import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users, Plus, Crown, Lock, ArrowLeft, UserPlus, Search,
  ChevronRight, Star, Trash2, LogOut, X, Loader2, Eye, CalendarDays,
  MessageCircle, Send, UserSearch
} from "lucide-react";
import { Link, useLocation } from "wouter";
import GroupChat from "@/components/GroupChat";
import FourPointStar from "@/components/FourPointStar";

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
  const [type, setType] = useState<"private" | "specialist">("private");
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
        toast.error("Grupos de especialista requerem plano premium");
      } else if (err.message.includes("PLAN_LIMIT")) {
        toast.error("Limite de grupos atingido no plano gratuito. Faça upgrade!");
      } else {
        toast.error("Erro ao criar grupo");
      }
    },
  });

  const atLimit = planInfo.maxGroups !== null && planInfo.groupCount >= planInfo.maxGroups;

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
              <div className="text-xs text-muted-foreground">Compartilhe avaliações, sugestões e agende seus eventos</div>
            </button>
            <Link href="/specialist/planos">
              <div
                className="p-3 rounded-lg border text-left transition-all border-border/50 text-muted-foreground hover:border-primary/30 cursor-pointer"
              >
                <Crown className="w-5 h-5 mb-1 text-primary" />
                <div className="text-sm font-medium">Vire um Especialista</div>
                <div className="text-xs text-muted-foreground">Crie grupos ilimitados e outras vantagens</div>
              </div>
            </Link>
          </div>
        </div>



        {atLimit && type === "private" && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-primary">
              <Lock className="w-4 h-4 inline mr-1" />
              Você atingiu o limite de {planInfo.maxGroups} grupos.
            </p>
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
  const isEspecialista = group.type === "specialist";

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
              {isEspecialista && <Crown className="w-5 h-5 text-primary" />}
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {group.memberCount} {group.memberCount === 1 ? "membro" : "membros"}
            </p>
          </div>
          <div className="flex gap-2">
            {isCreator && !isEspecialista && (
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
            {!isCreator && isEspecialista && (
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
          <div className="flex flex-wrap gap-2">
            {(group.members as any[]).map((m: any) => (
              <Link key={m.userId} href={`/perfil/${m.username}`}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs text-foreground hover:border-primary/30 transition-all cursor-pointer">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">
                    {(m.name || m.username || "?").charAt(0).toUpperCase()}
                  </span>
                  {m.name || m.username}
                  {m.userId === group.creatorId && <Crown className="w-3 h-3 text-primary" />}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Group Chat */}
      {group.isMember && (
        <div className="mb-6">
          <GroupChat groupId={groupId} />
        </div>
      )}

      {/* Events */}
      {groupEvents && groupEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">EVENTOS</h3>
          <div className="space-y-2">
            {groupEvents.map((ev: any) => (
              <Link key={ev.id} href={`/eventos/${ev.id}`}>
                <div className="p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{ev.title}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Feed */}
      {feed && feed.length > 0 && (
        <div>
          <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">ATIVIDADE</h3>
          <div className="space-y-3">
            {feed.map((item: any) => (
              <div key={item.id} className="p-3 rounded-lg bg-card border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">{item.userName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Discover Especialista Groups ──────────────────────────────────────────────

// ─── Following Tab Section (with group search) ─────────────────────────────────────

function FollowingTabSection({
  followedGroups,
  loadingFollowed,
  onSelectGroup,
}: {
  followedGroups: any[] | undefined;
  loadingFollowed: boolean;
  onSelectGroup: (id: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: searchLoading } = trpc.groups.searchGroups.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const showSearch = debouncedQuery.length >= 2;

  return (
    <div>
      {/* Search bar for groups */}
      <div className="mb-4">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-secondary/30 focus-within:border-primary/50 transition-all">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar grupos por nome ou @criador..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="p-0.5">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {showSearch ? (
        <div>
          {searchLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : !searchResults || searchResults.length === 0 ? (
            <div className="text-center py-10 bg-card/50 rounded-xl border border-border/30">
              <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum grupo encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((g: any) => (
                <div
                  key={g.id}
                  onClick={() => onSelectGroup(g.id)}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-primary flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground truncate">
                          {g.name} <span className="text-muted-foreground font-normal">(@{g.creatorUsername})</span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {g.type === "specialist" ? "Especialista" : "Privado"} · {g.memberCount} membros
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {loadingFollowed ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !followedGroups || followedGroups.length === 0 ? (
            <div className="text-center py-16 bg-card/50 rounded-xl border border-border/30">
              <Crown className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-1">Nenhum grupo seguido</p>
              <p className="text-xs text-muted-foreground/60">
                Siga especialistas para ver suas avaliações e recomendações
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followedGroups.map((g: any) => (
                <div
                  key={g.id}
                  onClick={() => onSelectGroup(g.id)}
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
        </>
      )}
    </div>
  );
}

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

// ─── People Search Section ──────────────────────────────────────────────────

function PeopleSearchSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, navigate] = useLocation();

  const handleQueryChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // "professional" maps to both critic and specialist on the backend
  const roleParam = roleFilter === "all" ? undefined : roleFilter;
  const { data: results, isLoading } = trpc.groups.searchPeople.useQuery(
    { query: debouncedQuery, role: roleParam },
    { enabled: debouncedQuery.length >= 2 }
  );

  const roleFilters = [
    { id: "all", label: "Todos" },
    { id: "user", label: "Usuários" },
    { id: "professional", label: "Profissionais" },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "critic":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-medium">
            <FourPointStar variant="critic" size={10} />
            Crítico
          </span>
        );
      case "specialist":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-medium">
            <FourPointStar variant="specialist" size={10} />
            Especialista
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted border border-border/50 text-[10px] text-muted-foreground font-medium">
            Usuário
          </span>
        );
    }
  };

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Buscar pessoas por nome ou @usuário..."
          className="w-full bg-background border border-border/50 rounded-lg pl-10 pr-3 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Role filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {roleFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setRoleFilter(filter.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              roleFilter === filter.id
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-card text-muted-foreground border border-border/50 hover:border-border"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {debouncedQuery.length < 2 ? (
        <div className="text-center py-12 bg-card/50 rounded-xl border border-border/30">
          <UserSearch className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">Encontre pessoas</p>
          <p className="text-xs text-muted-foreground/60">
            Busque por nome ou @usuário para encontrar críticos, especialistas e outros usuários
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !results || results.length === 0 ? (
        <div className="text-center py-12 bg-card/50 rounded-xl border border-border/30">
          <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma pessoa encontrada</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Tente outro nome ou ajuste os filtros
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((person) => (
            <div
              key={person.id}
              onClick={() => person.username && navigate(`/perfil/${person.username}`)}
              className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar placeholder */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  person.role === "critic"
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : person.role === "specialist"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}>
                  {(person.name || person.username || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {person.name || person.username}
                    </p>
                    {getRoleBadge(person.role)}
                  </div>
                  {person.username && (
                    <p className="text-xs text-muted-foreground mt-0.5">@{person.username}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GruposPage() {
  const [activeTab, setActiveTab] = useState<"meus" | "sigo" | "pessoas">("meus");
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
    { id: "sigo" as const, label: "Seguindo", icon: Crown },
    { id: "pessoas" as const, label: "Pessoas", icon: UserSearch },
  ];

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar hideSearch />
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
      <Navbar hideSearch />

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

            {/* Plan info removed — no upgrade banner for users */}

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-card rounded-lg border border-border/50 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.id === "meus" ? "Meus" : tab.id === "sigo" ? "Seguindo" : "Pessoas"}</span>
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
                              {g.type === "specialist" ? (
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
              <FollowingTabSection
                followedGroups={followedGroups}
                loadingFollowed={loadingFollowed}
                onSelectGroup={(id) => setSelectedGroupId(id)}
              />
            )}

            {activeTab === "pessoas" && (
              <PeopleSearchSection />
            )}
          </>
        )}
      </div>
    </div>
  );
}
