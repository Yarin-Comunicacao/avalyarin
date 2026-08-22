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
  MessageCircle, Send, UserSearch, Radio, EyeOff, Pencil, Check,
  ListOrdered, UserCircle, PlusCircle, MapPin, BarChart3, Image as ImageIcon
} from "lucide-react";
import { useOwnerView } from "@/contexts/OwnerViewContext";
import { Link, useLocation } from "wouter";
import GroupChat from "@/components/GroupChat";
import CreatePollModal, { PollTypeDropdown } from "@/components/CreatePollModal";
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
  const [type, setType] = useState<"private" | "specialist" | "broadcast">("private");
  const { user } = useAuth();
  const { viewingAs } = useOwnerView();
  const effectiveRole = viewingAs || user?.role || "user";
  const canCreateBroadcast = ["business", "specialist", "critic", "admin", "owner"].includes(effectiveRole);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl tracking-wider text-primary">CRIAR GRUPO</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type selection - hidden when at limit */}
        {!atLimit && (
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Tipo de grupo</label>
            <div className={`grid ${canCreateBroadcast ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
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
                <div className="text-xs text-muted-foreground">Compartilhe avaliações, sugestões e agende seus eventos com seus amigos</div>
              </button>
              {canCreateBroadcast && (
                <button
                  onClick={() => setType("broadcast")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    type === "broadcast"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/50 text-muted-foreground hover:border-border"
                  }`}
                >
                  <Radio className="w-5 h-5 mb-1" />
                  <div className="text-sm font-medium">Grupo de Transmissão</div>
                  <div className="text-xs text-muted-foreground">Compartilhe promoções, novas parcerias diretamente com quem te segue</div>
                </button>
              )}
            </div>
          </div>
        )}

        {atLimit ? (
          <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <Lock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-foreground mb-1 font-medium">
              Limite de {planInfo.maxGroups} grupos atingido
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Exclua um grupo para criar um novo ou vire um especialista e tenha grupos ilimitados
            </p>
            <Link href="/perfil">
              <Button
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10 font-display tracking-wider"
              >
                <Crown className="w-4 h-4 mr-1" /> VER PLANOS
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-1 block">Nome do grupo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Amigos Foodie"
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                maxLength={50}
              />
            </div>

            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-1 block">Descrição <span className="text-red-400">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo do grupo (mín. 25 caracteres)..."
                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none h-20"
                maxLength={500}
              />
              {description.length > 0 && description.length < 25 && (
                <p className="text-xs text-red-400 mt-1">Mínimo de 25 caracteres ({description.length}/25)</p>
              )}
            </div>

            <Button
              onClick={() => createMutation.mutate({ name, description, type })}
              disabled={
                !name.trim() ||
                name.length < 5 ||
                !description.trim() ||
                description.length < 25 ||
                createMutation.isPending
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
          </>
        )}
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
  const { user } = useAuth();
  // Determine effective role (owner viewing as another role uses window.__ownerViewingAs)
  const effectiveRole = (window as any).__ownerViewingAs || user?.role || "user";
  // Roles that can only invite mutual follows
  const restrictedRoles = ["user", "critic", "specialist"];
  const isRestricted = restrictedRoles.includes(effectiveRole);

  // Use mutual follows search for restricted roles, general search for others (business/admin/owner)
  // Show suggestions immediately (empty query returns all follows)
  const followsSearch = trpc.groups.searchFollowsForInvite.useQuery(
    { query },
    { enabled: isRestricted }
  );
  const generalSearch = trpc.groups.searchUsers.useQuery(
    { query },
    { enabled: !isRestricted && query.length >= 2 }
  );
  const searchResults = isRestricted ? followsSearch : generalSearch;

  const [invitingUsername, setInvitingUsername] = useState<string | null>(null);

  const inviteMutation = trpc.groups.invite.useMutation({
    onSuccess: () => {
      toast.success("Convite enviado!");
      setInvitingUsername(null);
      onClose();
    },
    onError: (err) => {
      setInvitingUsername(null);
      if (err.message.includes("MEMBER_LIMIT")) {
        toast.error("Limite de convidados atingido, vire um especialista e crie grupos sem limites de usuários");
      } else if (err.message.includes("ALREADY_MEMBER")) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4">
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
            placeholder={isRestricted ? "Buscar entre seus seguidores..." : "Buscar por @usuário..."}
            className="w-full bg-background border border-border/50 rounded-lg pl-10 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {searchResults.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}
          {searchResults.data?.length === 0 && (isRestricted || query.length >= 2) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {isRestricted
                ? (query ? `Você não segue ninguém chamado "${query}"` : "Você ainda não segue ninguém")
                : "Nenhum usuário encontrado"
              }
            </p>
          )}
          {searchResults.data?.map((user: any) => (
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
                onClick={() => {
                  setInvitingUsername(user.username!);
                  inviteMutation.mutate({ groupId, username: user.username! });
                }}
                disabled={inviteMutation.isPending && invitingUsername === user.username}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                {inviteMutation.isPending && invitingUsername === user.username ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                )}
                Convidar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Members Popup (shows "XX Membros" button, click to see list) ────────────

function MembersPopup({
  members,
  creatorId,
  isBroadcast,
}: {
  members: any[];
  creatorId: number;
  isBroadcast: boolean;
}) {
  const [showPopup, setShowPopup] = useState(false);

  // Sort members by joinedAt ascending (earliest first)
  const sortedMembers = [...members].sort((a, b) => {
    const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
    const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
    return aTime - bTime;
  });

  return (
    <div className="mb-6 relative">
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all cursor-pointer"
      >
        <Users className="w-3.5 h-3.5" />
        <span>{members.length} {members.length === 1 ? "Membro" : "Membros"}</span>
      </button>

      {showPopup && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowPopup(false)} />
          {/* Popup */}
          <div className="absolute top-10 left-0 z-50 w-72 max-h-80 bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 border-b border-border/30 flex items-center justify-between">
              <h4 className="font-display text-sm tracking-wider text-foreground">
                {isBroadcast ? "AMIGOS QUE SEGUEM" : "MEMBROS"}
              </h4>
              <button onClick={() => setShowPopup(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-64 p-2 space-y-1">
              {sortedMembers.map((m: any) => (
                <Link key={m.userId} href={`/perfil/${m.username}`}>
                  <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                    <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold flex-shrink-0">
                      {(m.name || m.username || "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {m.name || m.username}
                      </p>
                      {m.username && (
                        <p className="text-[10px] text-muted-foreground">@{m.username}</p>
                      )}
                    </div>
                    {m.userId === creatorId && <Crown className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Create Event Inline Modal ──────────────────────────────────────────────

function CreateEventInlineModal({ groupId, onClose }: { groupId: number; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState<"manual" | "establishment">("manual");
  // Manual location fields
  const [manualAddress, setManualAddress] = useState("");
  const [manualNumber, setManualNumber] = useState("");
  const [manualComplement, setManualComplement] = useState("");
  // Establishment search
  const [estabSearch, setEstabSearch] = useState("");
  const [selectedEstab, setSelectedEstab] = useState<{ id: number; name: string; neighborhood?: string } | null>(null);
  // Date as dd/mm/aaaa
  const [dateDay, setDateDay] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateYear, setDateYear] = useState("");
  // Time roulette
  const [eventTime, setEventTime] = useState<{ hours: number; minutes: number }>({ hours: 20, minutes: 0 });
  const [showTimeRoulette, setShowTimeRoulette] = useState(false);
  const utils = trpc.useUtils();

  // Search establishments (enabled when 3+ chars)
  const { data: searchData } = trpc.establishments.search.useQuery(
    { query: estabSearch },
    { enabled: locationType === "establishment" && estabSearch.length >= 3 }
  );
  const searchResults = searchData?.establishments || [];

  const createMutation = trpc.events.createWithLocation.useMutation({
    onSuccess: () => {
      toast.success("Evento criado com sucesso!");
      utils.events.listByGroup.invalidate({ groupId });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar evento"),
  });

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("Preencha o título"); return; }
    if (!dateDay || !dateMonth || !dateYear) { toast.error("Preencha a data completa"); return; }
    const day = parseInt(dateDay, 10);
    const month = parseInt(dateMonth, 10);
    const year = parseInt(dateYear, 10);
    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 2024) {
      toast.error("Data inválida"); return;
    }
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const timeStr = `${String(eventTime.hours).padStart(2, "0")}:${String(eventTime.minutes).padStart(2, "0")}`;
    const dateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();

    if (locationType === "manual" && !manualAddress.trim()) {
      toast.error("Preencha o endereço"); return;
    }
    if (locationType === "establishment" && !selectedEstab) {
      toast.error("Selecione um estabelecimento"); return;
    }

    const fullAddress = locationType === "manual"
      ? `${manualAddress.trim()}${manualNumber ? ", " + manualNumber : ""}${manualComplement ? " - " + manualComplement : ""}`
      : undefined;

    createMutation.mutate({
      groupId,
      title: title.trim(),
      description: description.trim() || undefined,
      eventDate: dateTime,
      locationMode: "defined",
      establishmentId: locationType === "establishment" ? selectedEstab!.id : undefined,
      manualLocationName: locationType === "manual" ? (manualAddress.trim().split(",")[0] || "Meu Local") : undefined,
      manualLocationAddress: fullAddress,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl tracking-wider text-primary">CRIAR EVENTO</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Happy Hour no Beco"
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              maxLength={100}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o evento..."
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none h-20"
              maxLength={500}
            />
          </div>

          {/* Tipo de Local - Radio Buttons */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Local *</label>
            <div className="flex gap-4 mb-3">
              <label onClick={() => setLocationType("establishment")} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  locationType === "establishment" ? "border-primary" : "border-muted-foreground/40"
                }`}>
                  {locationType === "establishment" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm text-foreground">Estabelecimento Cadastrado</span>
              </label>
              <label onClick={() => setLocationType("manual")} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  locationType === "manual" ? "border-primary" : "border-muted-foreground/40"
                }`}>
                  {locationType === "manual" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm text-foreground">Meu Local</span>
              </label>
            </div>

            {/* Meu Local - endereço, número, complemento */}
            {locationType === "manual" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Endereço (Rua, Avenida...)"
                    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    placeholder="Número"
                    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                  <input
                    type="text"
                    value={manualComplement}
                    onChange={(e) => setManualComplement(e.target.value)}
                    placeholder="Complemento"
                    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            )}

            {/* Estabelecimento Cadastrado - busca inteligente */}
            {locationType === "establishment" && (
              <div className="space-y-2">
                {selectedEstab ? (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground flex-1">{selectedEstab.name}{selectedEstab.neighborhood ? ` — ${selectedEstab.neighborhood}` : ""}</span>
                    <button onClick={() => { setSelectedEstab(null); setEstabSearch(""); }} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary flex-shrink-0" />
                      <input
                        type="text"
                        value={estabSearch}
                        onChange={(e) => setEstabSearch(e.target.value)}
                        placeholder="Buscar estabelecimento (mín. 3 letras)..."
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    {estabSearch.length >= 3 && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {searchResults.map((est: any) => (
                          <button
                            key={est.id}
                            onClick={() => { setSelectedEstab({ id: est.id, name: est.name, neighborhood: est.neighborhood }); setEstabSearch(""); }}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors border-b border-border/20 last:border-0"
                          >
                            <span className="font-medium">{est.name}</span>
                            {est.neighborhood && <span className="text-muted-foreground ml-1">— {est.neighborhood}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {estabSearch.length >= 3 && searchResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-10 px-3 py-2">
                        <span className="text-sm text-muted-foreground">Nenhum estabelecimento encontrado</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data dd/mm/aaaa */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Data *</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={dateDay}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); setDateDay(v); if (v.length === 2) (document.getElementById("evt-month") as HTMLInputElement)?.focus(); }}
                placeholder="DD"
                maxLength={2}
                className="w-14 text-center bg-background border border-border/50 rounded-lg px-2 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              <span className="text-muted-foreground">/</span>
              <input
                id="evt-month"
                type="text"
                value={dateMonth}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); setDateMonth(v); if (v.length === 2) (document.getElementById("evt-year") as HTMLInputElement)?.focus(); }}
                placeholder="MM"
                maxLength={2}
                className="w-14 text-center bg-background border border-border/50 rounded-lg px-2 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              <span className="text-muted-foreground">/</span>
              <input
                id="evt-year"
                type="text"
                value={dateYear}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setDateYear(v); }}
                placeholder="AAAA"
                maxLength={4}
                className="w-20 text-center bg-background border border-border/50 rounded-lg px-2 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Horário - Roleta Militar */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Horário *</label>
            <button
              type="button"
              onClick={() => setShowTimeRoulette(!showTimeRoulette)}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-left text-foreground focus:outline-none focus:border-primary/50 flex items-center justify-between"
            >
              <span className="font-numbers">{String(eventTime.hours).padStart(2, "0")}:{String(eventTime.minutes).padStart(2, "0")}</span>
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </button>
            {showTimeRoulette && (
              <div className="mt-2 bg-background border border-border/50 rounded-lg p-3">
                <TimeRouletteInline value={eventTime} onChange={setEventTime} />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || !dateDay || !dateMonth || !dateYear || createMutation.isPending}
          className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CalendarDays className="w-4 h-4 mr-2" />
          )}
          CRIAR EVENTO
        </Button>
      </div>
    </div>
  );
}

// Inline Time Roulette (simplified version for the event modal)
function TimeRouletteInline({ value, onChange }: { value: { hours: number; minutes: number }; onChange: (t: { hours: number; minutes: number }) => void }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 36;

  useEffect(() => {
    if (hourRef.current) hourRef.current.scrollTo({ top: value.hours * ITEM_H, behavior: "smooth" });
    if (minuteRef.current) minuteRef.current.scrollTo({ top: (value.minutes / 5) * ITEM_H, behavior: "smooth" });
  }, []);

  const handleHourScroll = useCallback(() => {
    if (!hourRef.current) return;
    const idx = Math.round(hourRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, 23));
    if (clamped !== value.hours) onChange({ ...value, hours: clamped });
  }, [value, onChange]);

  const handleMinuteScroll = useCallback(() => {
    if (!minuteRef.current) return;
    const idx = Math.round(minuteRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, 11));
    if (clamped * 5 !== value.minutes) onChange({ ...value, minutes: clamped * 5 });
  }, [value, onChange]);

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Hours column */}
      <div className="relative w-14">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 border-y border-primary/40 bg-primary/5 rounded pointer-events-none z-10" />
        <div
          ref={hourRef}
          onScroll={handleHourScroll}
          className="h-[108px] overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          style={{ scrollSnapType: "y mandatory" }}
        >
          <div style={{ height: ITEM_H }} />
          {hours.map(h => (
            <div
              key={h}
              className={`h-9 flex items-center justify-center text-sm snap-start cursor-pointer ${
                h === value.hours ? "text-primary font-bold" : "text-muted-foreground/50"
              }`}
              onClick={() => { onChange({ ...value, hours: h }); hourRef.current?.scrollTo({ top: h * ITEM_H, behavior: "smooth" }); }}
            >
              {String(h).padStart(2, "0")}
            </div>
          ))}
          <div style={{ height: ITEM_H }} />
        </div>
      </div>
      <span className="text-xl font-bold text-primary">:</span>
      {/* Minutes column */}
      <div className="relative w-14">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 border-y border-primary/40 bg-primary/5 rounded pointer-events-none z-10" />
        <div
          ref={minuteRef}
          onScroll={handleMinuteScroll}
          className="h-[108px] overflow-y-auto scrollbar-hide snap-y snap-mandatory"
          style={{ scrollSnapType: "y mandatory" }}
        >
          <div style={{ height: ITEM_H }} />
          {minutes.map(m => (
            <div
              key={m}
              className={`h-9 flex items-center justify-center text-sm snap-start cursor-pointer ${
                m === value.minutes ? "text-primary font-bold" : "text-muted-foreground/50"
              }`}
              onClick={() => { onChange({ ...value, minutes: m }); minuteRef.current?.scrollTo({ top: (m / 5) * ITEM_H, behavior: "smooth" }); }}
            >
              {String(m).padStart(2, "0")}
            </div>
          ))}
          <div style={{ height: ITEM_H }} />
        </div>
      </div>
    </div>
  );
}

// ─── Create Reservation Modal ────────────────────────────────

function CreateReservationModal({ groupId, onClose }: { groupId: number; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState<"manual" | "establishment">("establishment");
  const [manualAddress, setManualAddress] = useState("");
  const [manualNumber, setManualNumber] = useState("");
  const [manualComplement, setManualComplement] = useState("");
  const [estabSearch, setEstabSearch] = useState("");
  const [selectedEstab, setSelectedEstab] = useState<{ id: number; name: string; neighborhood?: string } | null>(null);
  const [dateDay, setDateDay] = useState("");
  const [dateMonth, setDateMonth] = useState("");
  const [dateYear, setDateYear] = useState("");
  const [eventTime, setEventTime] = useState<{ hours: number; minutes: number }>({ hours: 20, minutes: 0 });
  const [showTimeRoulette, setShowTimeRoulette] = useState(false);
  const [maxGuests, setMaxGuests] = useState("");
  const utils = trpc.useUtils();

  const { data: searchData } = trpc.establishments.search.useQuery(
    { query: estabSearch },
    { enabled: locationType === "establishment" && estabSearch.length >= 3 }
  );
  const searchResults = searchData?.establishments || [];

  const createMutation = trpc.events.createWithLocation.useMutation({
    onSuccess: () => {
      toast.success("Reserva criada com sucesso!");
      utils.events.listByGroup.invalidate({ groupId });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar reserva"),
  });

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("Preencha o título"); return; }
    if (!dateDay || !dateMonth || !dateYear) { toast.error("Preencha a data completa"); return; }
    const day = parseInt(dateDay, 10);
    const month = parseInt(dateMonth, 10);
    const year = parseInt(dateYear, 10);
    if (isNaN(day) || isNaN(month) || isNaN(year) || day < 1 || day > 31 || month < 1 || month > 12 || year < 2024) {
      toast.error("Data inválida"); return;
    }
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const timeStr = `${String(eventTime.hours).padStart(2, "0")}:${String(eventTime.minutes).padStart(2, "0")}`;
    const dateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();

    if (locationType === "manual" && !manualAddress.trim()) {
      toast.error("Preencha o endereço"); return;
    }
    if (locationType === "establishment" && !selectedEstab) {
      toast.error("Selecione um estabelecimento"); return;
    }

    const fullAddress = locationType === "manual"
      ? `${manualAddress.trim()}${manualNumber ? ", " + manualNumber : ""}${manualComplement ? " - " + manualComplement : ""}`
      : undefined;

    createMutation.mutate({
      groupId,
      title: title.trim(),
      description: description.trim() || undefined,
      eventDate: dateTime,
      eventType: "reservation",
      maxGuests: maxGuests ? parseInt(maxGuests, 10) : undefined,
      locationMode: "defined",
      establishmentId: locationType === "establishment" ? selectedEstab!.id : undefined,
      manualLocationName: locationType === "manual" ? (manualAddress.trim().split(",")[0] || "Meu Local") : undefined,
      manualLocationAddress: fullAddress,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl tracking-wider text-red-400">CRIAR RESERVA</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reserva para aniversário"
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              maxLength={100}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a reserva..."
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none h-20"
              maxLength={500}
            />
          </div>

          {/* Nº de pessoas */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Nº máximo de pessoas</label>
            <input
              type="text"
              value={maxGuests}
              onChange={(e) => setMaxGuests(e.target.value.replace(/\D/g, ""))}
              placeholder="Ex: 10"
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Tipo de Local */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Local *</label>
            <div className="flex gap-4 mb-3">
              <label onClick={() => setLocationType("establishment")} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  locationType === "establishment" ? "border-primary" : "border-muted-foreground/40"
                }`}>
                  {locationType === "establishment" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm text-foreground">Estabelecimento Cadastrado</span>
              </label>
              <label onClick={() => setLocationType("manual")} className="flex items-center gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  locationType === "manual" ? "border-primary" : "border-muted-foreground/40"
                }`}>
                  {locationType === "manual" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm text-foreground">Meu Local</span>
              </label>
            </div>

            {locationType === "manual" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Endereço (Rua, Avenida...)"
                    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={manualNumber} onChange={(e) => setManualNumber(e.target.value)} placeholder="Número" className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
                  <input type="text" value={manualComplement} onChange={(e) => setManualComplement(e.target.value)} placeholder="Complemento" className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
                </div>
              </div>
            )}

            {locationType === "establishment" && (
              <div className="space-y-2">
                {selectedEstab ? (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground flex-1">{selectedEstab.name}{selectedEstab.neighborhood ? ` — ${selectedEstab.neighborhood}` : ""}</span>
                    <button onClick={() => { setSelectedEstab(null); setEstabSearch(""); }} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary flex-shrink-0" />
                      <input
                        type="text"
                        value={estabSearch}
                        onChange={(e) => setEstabSearch(e.target.value)}
                        placeholder="Buscar estabelecimento (mín. 3 letras)..."
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    {estabSearch.length >= 3 && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {searchResults.map((est: any) => (
                          <button
                            key={est.id}
                            onClick={() => { setSelectedEstab({ id: est.id, name: est.name, neighborhood: est.neighborhood }); setEstabSearch(""); }}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors border-b border-border/20 last:border-0"
                          >
                            <span className="font-medium">{est.name}</span>
                            {est.neighborhood && <span className="text-muted-foreground ml-1">— {est.neighborhood}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {estabSearch.length >= 3 && searchResults.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-lg z-10 px-3 py-2">
                        <span className="text-sm text-muted-foreground">Nenhum estabelecimento encontrado</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RSVP Info */}
          <div className="p-3 rounded-lg bg-red-400/5 border border-red-400/20">
            <p className="text-xs text-red-400 font-medium mb-1">Confirmação de presença</p>
            <p className="text-xs text-muted-foreground">Após criar a reserva, os membros do grupo poderão votar: Sim, Talvez ou Não. Os que votarem "Sim" serão contabilizados na lista enviada ao estabelecimento.</p>
          </div>

          {/* Data */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Data *</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={dateDay}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); setDateDay(v); if (v.length === 2) (document.getElementById("res-month") as HTMLInputElement)?.focus(); }}
                placeholder="DD"
                maxLength={2}
                className="w-14 text-center bg-background border border-border/50 rounded-lg px-2 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              <span className="text-muted-foreground">/</span>
              <input
                id="res-month"
                type="text"
                value={dateMonth}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); setDateMonth(v); if (v.length === 2) (document.getElementById("res-year") as HTMLInputElement)?.focus(); }}
                placeholder="MM"
                maxLength={2}
                className="w-14 text-center bg-background border border-border/50 rounded-lg px-2 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              <span className="text-muted-foreground">/</span>
              <input
                id="res-year"
                type="text"
                value={dateYear}
                onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setDateYear(v); }}
                placeholder="AAAA"
                maxLength={4}
                className="w-20 text-center bg-background border border-border/50 rounded-lg px-2 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Horário */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Horário *</label>
            <button
              type="button"
              onClick={() => setShowTimeRoulette(!showTimeRoulette)}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-left text-foreground focus:outline-none focus:border-primary/50 flex items-center justify-between"
            >
              <span className="font-numbers">{String(eventTime.hours).padStart(2, "0")}:{String(eventTime.minutes).padStart(2, "0")}</span>
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </button>
            {showTimeRoulette && (
              <div className="mt-2 bg-background border border-border/50 rounded-lg p-3">
                <TimeRouletteInline value={eventTime} onChange={setEventTime} />
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || !dateDay || !dateMonth || !dateYear || createMutation.isPending}
          className="w-full mt-6 bg-red-500 text-foreground hover:bg-red-600 font-display tracking-wider"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CalendarDays className="w-4 h-4 mr-2" />
          )}
          CRIAR RESERVA
        </Button>
      </div>
    </div>
  );
}

// ─── Group Tabs (Conversa / Lista / Membros) ────────────────────────────────

function GroupTabs({
  groupId,
  groupType,
  group,
  groupEvents,
  feed,
}: {
  groupId: number;
  groupType?: string;
  group: any;
  groupEvents: any;
  feed: any;
}) {
  const [activeTab, setActiveTab] = useState<"conversa" | "lista" | "membros" | "eventos" | "midias">("conversa");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showPollTypeSelect, setShowPollTypeSelect] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showCreateReservation, setShowCreateReservation] = useState(false);
  const { user } = useAuth();
  const isOwner = group?.creatorId === user?.id;
  // Check if current user is creator or moderador (can manage lists)
  const currentMemberRole = group?.members?.find((m: any) => m.userId === user?.id)?.role;
  const canManageLists = isOwner || currentMemberRole === 'admin';
  const isBroadcast = groupType === "broadcast";

  const { refetch: refetchPolls } = trpc.groups.getPolls.useQuery({ groupId });

  const tabs = [
    { id: "conversa" as const, label: "Conversa", icon: MessageCircle },
    { id: "lista" as const, label: "Lista", icon: ListOrdered },
    { id: "membros" as const, label: "Membros", icon: Users },
    { id: "eventos" as const, label: "Eventos", icon: CalendarDays },
    { id: "midias" as const, label: "Mídias", icon: ImageIcon },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border/30 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium tracking-wide transition-all ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "conversa" && (
        <div>
          {/* Add button */}
          <div className="flex justify-end mb-3 relative">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Adicionar
            </Button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 top-9 z-50 bg-card border border-border/50 rounded-lg shadow-lg py-1 min-w-[160px]">
                  <button
                    onClick={() => { setShowPollTypeSelect(true); setShowAddMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-primary" /> Enquete
                  </button>
                  <button
                    onClick={() => { setActiveTab("lista"); setShowAddMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-primary" /> Lista
                  </button>
                  <button
                    onClick={() => { setShowCreateEvent(true); setShowAddMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-primary" /> Evento
                  </button>
                  <button
                    onClick={() => { setShowCreateReservation(true); setShowAddMenu(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-foreground hover:bg-primary/10 flex items-center gap-2"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-red-400" /> Reserva
                  </button>
                </div>
              </>
            )}
          </div>

          <GroupChat groupId={groupId} groupType={groupType} />

          {/* Poll Type Selector */}
          {showPollTypeSelect && (
            <PollTypeDropdown
              onSelect={() => { setShowPollTypeSelect(false); setShowCreatePoll(true); }}
              onCancel={() => setShowPollTypeSelect(false)}
            />
          )}
          {/* Create Poll Modal */}
          {showCreatePoll && (
            <CreatePollModal groupId={groupId} onClose={() => setShowCreatePoll(false)} onCreated={() => refetchPolls()} />
          )}
          {/* Create Event Modal */}
          {showCreateEvent && (
            <CreateEventInlineModal groupId={groupId} onClose={() => setShowCreateEvent(false)} />
          )}
          {showCreateReservation && (
            <CreateReservationModal groupId={groupId} onClose={() => setShowCreateReservation(false)} />
          )}

          {/* Feed */}
          {feed && feed.length > 0 && (
            <div className="mt-4">
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
      )}

      {activeTab === "lista" && (
        <GroupListsTab groupId={groupId} canManageLists={canManageLists} />
      )}

      {activeTab === "membros" && (
        <GroupMembersTab members={group.members || []} creatorId={group.creatorId} isBroadcast={isBroadcast} groupId={group.id} />
      )}

      {activeTab === "eventos" && (
        <GroupEventosTab groupId={groupId} groupEvents={groupEvents} />
      )}

      {activeTab === "midias" && (
        <GroupMidiasTab groupId={groupId} />
      )}
    </div>
  );
}

// ─── Group Lists Tab ─────────────────────────────────────────────────────────

function GroupListsTab({ groupId, canManageLists }: { groupId: number; canManageLists: boolean }) {
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: lists, refetch: refetchLists } = trpc.groups.getLists.useQuery({ groupId });
  const { data: listItems, refetch: refetchItems } = trpc.groups.listItems.useQuery(
    { groupId, listId: selectedListId! },
    { enabled: !!selectedListId }
  );

  const { data: searchData } = trpc.establishments.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );
  const searchResults = searchData?.establishments || [];

  const createListMutation = trpc.groups.createList.useMutation({
    onSuccess: () => {
      toast.success("Lista criada!");
      setNewListName("");
      setShowCreateList(false);
      refetchLists();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteListMutation = trpc.groups.deleteList.useMutation({
    onSuccess: () => {
      toast.success("Lista excluída");
      setSelectedListId(null);
      refetchLists();
    },
    onError: (err) => toast.error(err.message),
  });

  const addToListMutation = trpc.groups.addToList.useMutation({
    onSuccess: () => {
      toast.success("Adicionado à lista!");
      refetchItems();
      setSearchQuery("");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeFromListMutation = trpc.groups.removeFromList.useMutation({
    onSuccess: () => {
      toast.success("Removido da lista");
      refetchItems();
    },
    onError: (err) => toast.error(err.message),
  });

  // If viewing a specific list
  if (selectedListId) {
    const currentList = lists?.find((l: any) => l.id === selectedListId);
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSelectedListId(null)}
            className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="font-display text-sm tracking-wider text-foreground">{currentList?.name || "Lista"}</h3>
        </div>

        {/* Search to add establishments */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar estabelecimento para adicionar..."
            className="w-full bg-background border border-border/50 rounded-lg pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Search results */}
        {searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
          <div className="mb-4 space-y-1 max-h-40 overflow-y-auto">
            {searchResults.map((estab: any) => (
              <div key={estab.id} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/30">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate">{estab.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-primary"
                  onClick={() => addToListMutation.mutate({ groupId, listId: selectedListId, establishmentId: estab.id })}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* List items */}
        {(!listItems || listItems.length === 0) ? (
          <div className="text-center py-8">
            <ListOrdered className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Nenhum estabelecimento nesta lista ainda.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Use a busca acima para adicionar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {listItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                <Link href={`/estabelecimento/${item.establishmentSlug || item.establishmentId}`}>
                  <div className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{item.establishmentName}</p>
                      {item.addedByName && (
                        <p className="text-[10px] text-muted-foreground">Adicionado por {item.addedByName}</p>
                      )}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => removeFromListMutation.mutate({ groupId, listId: selectedListId, establishmentId: item.establishmentId })}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Lists overview
  return (
    <div>
      {/* Create list button (creator or moderador) */}
      {canManageLists && (
        <div className="mb-4">
          {showCreateList ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Nome da lista..."
                className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                maxLength={100}
              />
              <Button
                size="sm"
                onClick={() => createListMutation.mutate({ groupId, name: newListName })}
                disabled={!newListName.trim() || createListMutation.isPending}
                className="bg-primary hover:bg-primary/80"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateList(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateList(true)}
              className="text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Nova Lista
            </Button>
          )}
        </div>
      )}

      {/* Lists */}
      {(!lists || lists.length === 0) ? (
        <div className="text-center py-8">
          <ListOrdered className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nenhuma lista criada neste grupo.</p>
          {canManageLists && <p className="text-[10px] text-muted-foreground/60 mt-1">Crie uma lista para organizar estabelecimentos.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list: any) => (
            <div
              key={list.id}
              className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => setSelectedListId(list.id)}
            >
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm text-foreground">{list.name}</p>
                  <p className="text-[10px] text-muted-foreground">{list.itemCount || 0} estabelecimentos</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canManageLists && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Excluir esta lista?")) deleteListMutation.mutate({ groupId, listId: list.id });
                    }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Group Members Tab ───────────────────────────────────────────────────────

function GroupMembersTab({
  members,
  creatorId,
  isBroadcast,
  groupId,
}: {
  members: any[];
  creatorId: number;
  isBroadcast: boolean;
  groupId: number;
}) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const sortedMembers = [...members].sort((a, b) => {
    const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
    const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
    return aTime - bTime;
  });

  // Check if current user is creator or moderador
  const currentMember = members.find((m: any) => m.userId === user?.id);
  const canManageRoles = currentMember?.role === 'creator' || currentMember?.role === 'admin';
  const isCreator = currentMember?.role === 'creator';

  const setRoleMutation = trpc.groups.setMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Cargo atualizado");
      utils.groups.getById.invalidate({ groupId });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao alterar cargo"),
  });

  const handleToggleModerador = (memberId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setRoleMutation.mutate({ groupId, userId: memberId, role: newRole });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">
          {members.length} {members.length === 1 ? "membro" : "membros"}
        </span>
      </div>
      <div className="space-y-1">
        {sortedMembers.map((m: any) => (
          <div key={m.userId} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
            <Link href={`/perfil/${m.username}`} className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-bold flex-shrink-0">
                {(m.userName || m.username || "?").charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {m.userName || m.username}
                </p>
                {m.username && (
                  <p className="text-[10px] text-muted-foreground">@{m.username}</p>
                )}
              </div>
            </Link>
            {/* Role badges */}
            {m.userId === creatorId && <Crown className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            {m.role === 'admin' && m.userId !== creatorId && (
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium flex-shrink-0">MODERADOR</span>
            )}
            {/* Promote/demote button - only for creator (promote to moderador) or creator/moderador (demote) */}
            {canManageRoles && m.userId !== creatorId && m.userId !== user?.id && (
              <button
                onClick={() => handleToggleModerador(m.userId, m.role)}
                className="text-[9px] px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex-shrink-0"
                disabled={setRoleMutation.isPending}
                title={m.role === 'admin' ? 'Remover moderador' : 'Promover a moderador'}
              >
                {m.role === 'admin' ? 'Remover moderador' : 'Tornar moderador'}
              </button>
            )}
          </div>
        ))}
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const renameMutation = trpc.groups.update.useMutation({
    onSuccess: () => {
      toast.success("Grupo renomeado");
      utils.groups.getById.invalidate({ groupId });
      utils.groups.myGroups.invalidate();
      setIsRenaming(false);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao renomear"),
  });

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

  const broadcastLeaveMutation = trpc.broadcastGroups.leave.useMutation({
    onSuccess: () => {
      toast.success("Você saiu do grupo de transmissão");
      utils.broadcastGroups.myBroadcasts.invalidate();
      utils.broadcastGroups.hidden.invalidate();
      onBack();
    },
  });

  const broadcastHideMutation = trpc.broadcastGroups.toggleHide.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.hide ? "Grupo silenciado" : "Grupo reativado");
      utils.broadcastGroups.myBroadcasts.invalidate();
      utils.broadcastGroups.hidden.invalidate();
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
  const isBroadcast = group.type === "broadcast";

  return (
    <div>
      {showInvite && (
        <InviteUserModal groupId={groupId} onClose={() => setShowInvite(false)} />
      )}

      {/* Header */}
      <div className="mb-6">
        {/* Mobile: sticky header with back arrow (WhatsApp style) */}
        <div className="md:hidden sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/30 mb-4 flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded-full hover:bg-card transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <span className="font-display text-lg tracking-wider text-foreground truncate">{group?.name || "Grupo"}</span>
        </div>
        {/* Desktop: simple back link */}
        <button onClick={onBack} className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-card border border-primary/30 rounded px-2 py-1 text-foreground font-display text-xl tracking-wider focus:outline-none focus:border-primary"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newName.trim().length >= 5) {
                        renameMutation.mutate({ groupId, name: newName.trim() });
                      } else if (e.key === "Escape") {
                        setIsRenaming(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newName.trim().length >= 5) {
                        renameMutation.mutate({ groupId, name: newName.trim() });
                      } else {
                        toast.error("Nome deve ter pelo menos 5 caracteres");
                      }
                    }}
                    className="text-primary hover:text-primary/80"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsRenaming(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl tracking-wider text-foreground">{group.name}</h2>
                  {isCreator && (
                    <button
                      onClick={() => { setNewName(group.name); setIsRenaming(true); }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title="Renomear grupo"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
              {isEspecialista && <Crown className="w-5 h-5 text-primary" />}
              {isBroadcast && <Radio className="w-5 h-5 text-primary" />}
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {group.memberCount} {group.memberCount === 1 ? "membro" : "membros"}
              {isBroadcast && " · Canal de Transmissão"}
            </p>
          </div>
          <div className="flex gap-2">
            {isCreator && !isEspecialista && !isBroadcast && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInvite(true)}
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <UserPlus className="w-4 h-4 mr-1" /> Convidar
              </Button>
            )}
            {isCreator && !isBroadcast && (
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
            {/* Broadcast group actions for non-creators */}
            {!isCreator && isBroadcast && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => broadcastHideMutation.mutate({ groupId, hide: true })}
                  className="border-border/50 text-muted-foreground hover:bg-secondary"
                  title="Silenciar (ocultar)"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Deseja sair deste grupo de transmissão?")) {
                      broadcastLeaveMutation.mutate({ groupId });
                    }
                  }}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Sair
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Conversa / Lista / Membros */}
      {group.isMember && (
        <GroupTabs groupId={groupId} groupType={group.type} group={group} groupEvents={groupEvents} feed={feed} />
      )}

      {!group.isMember && group.members && group.members.length > 0 && (
        <MembersPopup members={group.members as any[]} creatorId={group.creatorId} isBroadcast={isBroadcast} />
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
  onGoToPessoas,
}: {
  followedGroups: any[] | undefined;
  loadingFollowed: boolean;
  onSelectGroup: (id: number) => void;
  onGoToPessoas: () => void;
}) {
  const [subTab, setSubTab] = useState<"seguindo" | "transmissoes" | "ocultos">("seguindo");

  const utils = trpc.useUtils();
  const { data: broadcastGroups, isLoading: loadingBroadcast } = trpc.broadcastGroups.myBroadcasts.useQuery();
  const { data: hiddenGroups, isLoading: loadingHidden } = trpc.broadcastGroups.hidden.useQuery();

  const leaveMutation = trpc.broadcastGroups.leave.useMutation({
    onSuccess: () => {
      toast.success("Você saiu do grupo");
      utils.broadcastGroups.myBroadcasts.invalidate();
      utils.broadcastGroups.hidden.invalidate();
    },
  });

  const hideMutation = trpc.broadcastGroups.toggleHide.useMutation({
    onSuccess: () => {
      toast.success("Grupo atualizado");
      utils.broadcastGroups.myBroadcasts.invalidate();
      utils.broadcastGroups.hidden.invalidate();
    },
  });

  const subTabs = [
    { id: "seguindo" as const, label: "Seguindo" },
    { id: "transmissoes" as const, label: "Transmissões" },
    { id: "ocultos" as const, label: "Ocultos" },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-secondary/30 rounded-lg border border-border/30 mb-4">
        {subTabs.map((st) => (
          <button
            key={st.id}
            onClick={() => setSubTab(st.id)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-all ${
              subTab === st.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Sub-tab: Seguindo (grupos onde fui convidado) */}
      {subTab === "seguindo" && (
        <>
          {loadingFollowed ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !followedGroups || followedGroups.length === 0 ? (
            <div className="text-center py-16 bg-card/50 rounded-xl border border-border/30">
              <Crown className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-1">Nenhum grupo seguido</p>
              <p className="text-xs text-muted-foreground/60 mb-4">
                Siga especialistas e críticos para ver seus grupos aqui
              </p>
              <button
                onClick={onGoToPessoas}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
              >
                <UserSearch className="w-4 h-4" />
                Encontre seus amigos
              </button>
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

      {/* Sub-tab: Grupos de Transmissões */}
      {subTab === "transmissoes" && (
        <>
          {loadingBroadcast ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !broadcastGroups || broadcastGroups.length === 0 ? (
            <div className="text-center py-16 bg-card/50 rounded-xl border border-border/30">
              <Radio className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-1">Nenhum grupo de transmissão</p>
              <p className="text-xs text-muted-foreground/60">
                Salve estabelecimentos ou siga especialistas para receber transmissões
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcastGroups.map((g: any) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onSelectGroup(g.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-primary flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {g.memberCount} membros
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => hideMutation.mutate({ groupId: g.id, hide: true })}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                        title="Ocultar grupo"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Deseja sair deste grupo de transmissão?")) {
                            leaveMutation.mutate({ groupId: g.id });
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-red-400"
                        title="Sair do grupo"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sub-tab: Grupos Ocultos */}
      {subTab === "ocultos" && (
        <>
          {loadingHidden ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !hiddenGroups || hiddenGroups.length === 0 ? (
            <div className="text-center py-16 bg-card/50 rounded-xl border border-border/30">
              <EyeOff className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-1">Nenhum grupo oculto</p>
              <p className="text-xs text-muted-foreground/60">
                Grupos ocultos não enviam notificações
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hiddenGroups.map((g: any) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-card border border-border/50 transition-all opacity-70"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onSelectGroup(g.id)}
                    >
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {g.memberCount} membros · Silenciado
                      </p>
                    </div>
                    <button
                      onClick={() => hideMutation.mutate({ groupId: g.id, hide: false })}
                      className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary"
                      title="Mostrar grupo novamente"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          {results?.map((person: any) => (
            <div
              key={person.id}
              onClick={() => navigate(`/perfil/${person.username || person.id}`)}
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

export default function GruposPage({ embedded }: { embedded?: boolean } = {}) {
  const [location, navigate] = useLocation();
  const getTabFromUrl = useCallback((path: string) => {
    const tab = new URLSearchParams(path.split("?")[1] || "").get("tab");
    return tab === "meus" || tab === "sigo" || tab === "pessoas" ? tab : "particular";
  }, []);
  const [activeTab, setActiveTab] = useState<"particular" | "meus" | "sigo" | "pessoas">(() => getTabFromUrl(location));

  useEffect(() => {
    const tabFromUrl = getTabFromUrl(location);
    setActiveTab((currentTab) => currentTab === tabFromUrl ? currentTab : tabFromUrl);
  }, [location, getTabFromUrl]);

  const changeTab = useCallback((tab: "particular" | "meus" | "sigo" | "pessoas") => {
    setActiveTab(tab);
    const nextPath = tab === "particular" ? "/grupos" : `/grupos?tab=${tab}`;
    if (location !== nextPath) navigate(nextPath);
  }, [location, navigate]);
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
    { id: "particular" as const, label: "Particular", icon: MessageCircle },
    { id: "meus" as const, label: "Meus Grupos", icon: Users },
    { id: "sigo" as const, label: "Seguindo", icon: Crown },
    { id: "pessoas" as const, label: "Pessoas", icon: UserSearch },
  ];

  // Not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={embedded ? "" : "min-h-screen bg-background"}>
        {!embedded && <Navbar />}
        <div className="container py-20 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl tracking-wider text-foreground mb-2">MENSAGENS</h2>
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
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && <Navbar />}

      {showCreate && planInfo && (
        <CreateGroupModal onClose={() => setShowCreate(false)} planInfo={planInfo} />
      )}

      <div className="container pt-20 pb-24">
        {/* ═══ MOBILE LAYOUT (< md): list OR detail ═══ */}
        <div className="md:hidden">
          {selectedGroupId ? (
            <GroupDetail groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />
          ) : (
            <GroupListPanel
              activeTab={activeTab}
              setActiveTab={changeTab}
              tabs={tabs}
              loadingMy={loadingMy}
              myGroups={myGroups}
              followedGroups={followedGroups}
              loadingFollowed={loadingFollowed}
              selectedGroupId={selectedGroupId}
              onSelectGroup={(id) => setSelectedGroupId(id)}
              onGoToPessoas={() => changeTab("pessoas")}
              onShowCreate={() => setShowCreate(true)}
            />
          )}
        </div>

        {/* ═══ DESKTOP/TABLET LAYOUT (md+): split 30/70 with slide animation ═══ */}
        <div className="hidden md:flex h-[calc(100vh-200px)] gap-0 overflow-hidden rounded-xl border border-border/30">
          {/* Left Panel — Group List */}
          <div
            className={`transition-all duration-300 ease-in-out border-r border-border/30 overflow-y-auto ${
              selectedGroupId ? "w-[30%]" : "w-full"
            }`}
          >
            <div className="p-4">
              <GroupListPanel
                activeTab={activeTab}
                setActiveTab={changeTab}
                tabs={tabs}
                loadingMy={loadingMy}
                myGroups={myGroups}
                followedGroups={followedGroups}
                loadingFollowed={loadingFollowed}
                selectedGroupId={selectedGroupId}
                onSelectGroup={(id) => setSelectedGroupId(id)}
                onGoToPessoas={() => changeTab("pessoas")}
                onShowCreate={() => setShowCreate(true)}
                compact={!!selectedGroupId}
              />
            </div>
          </div>

          {/* Right Panel — Chat/Detail */}
          {selectedGroupId && (
            <div className="w-[70%] overflow-y-auto transition-all duration-300 ease-in-out">
              <div className="p-6">
                <GroupDetail groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Particular Tab (DMs) ────────────────────────────────────────────────────
function ParticularTabSection() {
  const { data: conversations, isLoading } = trpc.social.dmConversations.useQuery();
  const { data: mutuals } = trpc.social.mutuals.useQuery();
  const [, navigate] = useLocation();

  return (
    <div>
      {/* Conversations */}
      {!isLoading && conversations && conversations.length > 0 ? (
        <div className="space-y-2 mb-6">
          {conversations.map((conv: any) => (
            <div
              key={conv.partnerId}
              onClick={() => navigate(`/mensagens/${conv.partnerUsername}`)}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">
                  {(conv.partnerName || "?")[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">@{conv.partnerUsername}</span>
                  {conv.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString("pt-BR") : ""}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Mutual follows (start new conversation) */}
      {mutuals && mutuals.length > 0 && (
        <div>
          <h2 className="font-display text-sm tracking-wider text-foreground mb-3">INICIAR CONVERSA</h2>
          <div className="grid grid-cols-2 gap-2">
            {mutuals.map((m: any) => (
              <div
                key={m.id}
                onClick={() => navigate(`/mensagens/${m.username}`)}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {(m.name || "?")[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-medium text-foreground truncate block">@{m.username}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Extracted Group List Panel (shared between mobile and desktop) ──────────
function GroupListPanel({
  activeTab,
  setActiveTab,
  tabs,
  loadingMy,
  myGroups,
  followedGroups,
  loadingFollowed,
  selectedGroupId,
  onSelectGroup,
  onGoToPessoas,
  onShowCreate,
  compact,
}: {
  activeTab: "particular" | "meus" | "sigo" | "pessoas";
  setActiveTab: (tab: "particular" | "meus" | "sigo" | "pessoas") => void;
  tabs: { id: "particular" | "meus" | "sigo" | "pessoas"; label: string; icon: any }[];
  loadingMy: boolean;
  myGroups: any[] | undefined;
  followedGroups: any[] | undefined;
  loadingFollowed: boolean;
  selectedGroupId: number | null;
  onSelectGroup: (id: number) => void;
  onGoToPessoas: () => void;
  onShowCreate: () => void;
  compact?: boolean;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center mb-4">
        <h1 className={`font-display tracking-wider text-primary text-glow-amber ${compact ? "text-xl" : "text-3xl"}`}>
          MENSAGENS
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-card rounded-lg border border-border/50 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {!compact && <span className="hidden sm:inline">{tab.label}</span>}
            {compact && <span className="text-[10px]">{tab.id === "meus" ? "Meus" : tab.id === "sigo" ? "Sigo" : "🔍"}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "particular" && (
        <ParticularTabSection />
      )}

      {activeTab === "meus" && (
        <div>
          {loadingMy ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !myGroups || myGroups.length === 0 ? (
            <div className="text-center py-12 bg-card/50 rounded-xl border border-border/30">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-1">Nenhum grupo ainda</p>
              {!compact && (
                <p className="text-xs text-muted-foreground/60 mb-4">
                  Crie um grupo e convide amigos para compartilhar avaliações
                </p>
              )}
              <Button
                onClick={onShowCreate}
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-1" /> Criar grupo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myGroups.map((g: any) => (
                <div
                  key={g.id}
                  onClick={() => onSelectGroup(g.id)}
                  className={`p-3 rounded-xl bg-card border transition-all cursor-pointer ${
                    selectedGroupId === g.id
                      ? "border-primary/60 bg-primary/5"
                      : "border-border/50 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {g.type === "specialist" ? (
                          <Crown className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : g.type === "broadcast" ? (
                          <Radio className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Users className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium text-foreground truncate">{g.name}</p>
                      </div>
                      {!compact && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {g.memberCount} {g.memberCount === 1 ? "membro" : "membros"}
                          {g.description && ` · ${g.description}`}
                        </p>
                      )}
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
          onSelectGroup={onSelectGroup}
          onGoToPessoas={onGoToPessoas}
        />
      )}

      {activeTab === "pessoas" && (
        <PeopleSearchSection />
      )}
    </>
  );
}


// ─── Group Eventos/Reservas Tab ─────────────────────────────────────────────

function GroupEventosTab({ groupId, groupEvents }: { groupId: number; groupEvents: any }) {
  const events = groupEvents || [];
  const reservations = events.filter((e: any) => e.eventType === "reservation");
  const regularEvents = events.filter((e: any) => e.eventType !== "reservation");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const renderCard = (ev: any, isReservation: boolean) => {
    const isExpanded = expandedId === ev.id;
    const borderColor = isReservation ? "border-red-400/20 hover:border-red-400/40" : "border-primary/20 hover:border-primary/40";
    const iconBg = isReservation ? "bg-red-400/10" : "bg-primary/10";
    const iconColor = isReservation ? "text-red-400" : "text-primary";
    const accentColor = isReservation ? "text-red-400" : "text-primary";

    return (
      <div key={ev.id} className={`rounded-lg bg-card border ${borderColor} transition-all overflow-hidden`}>
        {/* Collapsed card - clickable */}
        <div
          className="p-3 cursor-pointer"
          onClick={() => setExpandedId(isExpanded ? null : ev.id)}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <CalendarDays className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground truncate">{ev.title}</h4>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{formatDate(ev.eventDate)}</span>
                <span>{formatTime(ev.eventDate)}</span>
              </div>
              {ev.rsvpCounts && (
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className="text-green-400">✓ {ev.rsvpCounts.confirmed || 0}</span>
                  <span className="text-yellow-400">? {ev.rsvpCounts.maybe || 0}</span>
                  <span className="text-red-400">✗ {ev.rsvpCounts.declined || 0}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <ExpandedEventDetails ev={ev} isReservation={isReservation} accentColor={accentColor} navigate={navigate} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {regularEvents.length > 0 && (
        <div>
          <h3 className="font-display text-sm tracking-wider text-primary mb-3">EVENTOS</h3>
          <div className="space-y-2">
            {regularEvents.map((ev: any) => renderCard(ev, false))}
          </div>
        </div>
      )}

      {reservations.length > 0 && (
        <div>
          <h3 className="font-display text-sm tracking-wider text-red-400 mb-3">RESERVAS</h3>
          <div className="space-y-2">
            {reservations.map((ev: any) => renderCard(ev, true))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-8">
          <CalendarDays className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum evento ou reserva neste grupo.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Use +Adicionar na aba Conversa para criar.</p>
        </div>
      )}
    </div>
  );
}

// Expanded event/reservation details with participant photos
function ExpandedEventDetails({ ev, isReservation, accentColor, navigate }: { ev: any; isReservation: boolean; accentColor: string; navigate: (path: string) => void }) {
  const { data: eventDetail } = trpc.events.getById.useQuery({ eventId: ev.id });
  const rsvps = eventDetail?.rsvps || [];
  const confirmed = rsvps.filter((r: any) => r.status === 'confirmed');
  const maybe = rsvps.filter((r: any) => r.status === 'maybe');

  return (
    <div className="px-3 pb-3 border-t border-border/30 pt-3 space-y-3">
      {/* Description */}
      {ev.description && (
        <p className="text-xs text-muted-foreground">{ev.description}</p>
      )}

      {/* Location - clickable if establishment */}
      {ev.establishmentSlug ? (
        <div
          className={`flex items-center gap-2 cursor-pointer ${accentColor} hover:underline`}
          onClick={() => navigate(`/estabelecimento/${ev.establishmentSlug}`)}
        >
          <span className="text-xs">📍 {ev.establishmentName}</span>
          {ev.establishmentNeighborhood && <span className="text-xs text-muted-foreground">- {ev.establishmentNeighborhood}</span>}
        </div>
      ) : ev.manualLocationName ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>📍 {ev.manualLocationName}</span>
        </div>
      ) : null}

      {/* Confirmed participants - word cloud style photos */}
      {confirmed.length > 0 && (
        <div>
          <p className="text-xs text-green-400 font-medium mb-2">✓ Confirmados ({confirmed.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {confirmed.map((r: any, i: number) => (
              <div
                key={r.id}
                className="cursor-pointer hover:scale-110 transition-transform"
                onClick={() => navigate(`/perfil/${r.userUsername}`)}
                title={`@${r.userUsername}`}
                style={{ width: `${28 + (i % 3) * 4}px`, height: `${28 + (i % 3) * 4}px` }}
              >
                {r.userProfilePhoto ? (
                  <img
                    src={r.userProfilePhoto}
                    alt={r.userName}
                    className="w-full h-full rounded-full object-cover border-2 border-green-400/40"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-green-400/10 border-2 border-green-400/40 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-green-400">{(r.userName || '?')[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maybe participants */}
      {maybe.length > 0 && (
        <div>
          <p className="text-xs text-yellow-400 font-medium mb-2">? Talvez ({maybe.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {maybe.map((r: any, i: number) => (
              <div
                key={r.id}
                className="cursor-pointer hover:scale-110 transition-transform"
                onClick={() => navigate(`/perfil/${r.userUsername}`)}
                title={`@${r.userUsername}`}
                style={{ width: `${26 + (i % 3) * 3}px`, height: `${26 + (i % 3) * 3}px` }}
              >
                {r.userProfilePhoto ? (
                  <img
                    src={r.userProfilePhoto}
                    alt={r.userName}
                    className="w-full h-full rounded-full object-cover border-2 border-yellow-400/40"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-yellow-400/10 border-2 border-yellow-400/40 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-yellow-400">{(r.userName || '?')[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {rsvps.length === 0 && (
        <p className="text-xs text-muted-foreground/60">Nenhuma resposta ainda.</p>
      )}
    </div>
  );
}

// ─── Group Mídias Tab ─────────────────────────────────────────────────────────

function GroupMidiasTab({ groupId }: { groupId: number }) {
  // Fetch messages that contain shared ratings with photos
  const { data: messages } = trpc.groups.messagesEnhanced.useQuery({ groupId, limit: 100 });
  
  // Extract media from shared rating messages
  const mediaItems = ((messages as any)?.messages || messages || []).filter((item: any) => 
    item.type === "share_rating" && item.referenceSlug
  ).map((item: any) => ({
    url: null, // Media URLs would come from the rating photos
    establishmentName: item.content,
    userName: item.senderName,
    createdAt: item.createdAt,
  }));

  return (
    <div>
      {mediaItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-1">
          {mediaItems.map((media: any, idx: number) => (
            <div key={idx} className="aspect-square relative rounded-md overflow-hidden bg-card border border-border/30">
              <img
                src={media.url}
                alt={media.establishmentName || "Mídia"}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                <p className="text-[9px] text-foreground truncate">{media.establishmentName}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma mídia compartilhada neste grupo.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Fotos de avaliações compartilhadas aparecerão aqui.</p>
        </div>
      )}
    </div>
  );
}
