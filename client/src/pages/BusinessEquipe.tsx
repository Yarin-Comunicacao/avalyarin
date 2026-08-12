import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { Users, Building2, Plus, Trash2, Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BusinessEquipe() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">EQUIPE LOCAL</h1>
          <p className="text-muted-foreground mb-6">Faça login para gerenciar sua equipe.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Entrar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center h-14">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg tracking-wider text-primary">EQUIPE LOCAL</h1>
          </div>
        </div>
      </header>
      <div className="container py-6">
        <EquipeLocalContent />
      </div>
    </div>
  );
}

function EquipeLocalContent() {
  const { data: establishments, isLoading: loadingEstabs } = trpc.business.myEstablishments.useQuery();
  const [selectedEstab, setSelectedEstab] = useState<number | null>(null);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "manager" | "staff">("manager");
  const [showInviteForm, setShowInviteForm] = useState(false);

  const estabId = selectedEstab || (establishments && establishments.length > 0 ? establishments[0].id : null);

  const { data: team, isLoading: loadingTeam, refetch: refetchTeam } = trpc.team.getTeam.useQuery(
    { establishmentId: estabId! },
    { enabled: !!estabId }
  );

  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success("Membro convidado com sucesso!");
      setInviteUsername("");
      setShowInviteForm(false);
      refetchTeam();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.team.remove.useMutation({
    onSuccess: () => {
      toast.success("Membro removido.");
      refetchTeam();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRoleMutation = trpc.team.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role atualizado.");
      refetchTeam();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loadingEstabs) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Você não possui estabelecimentos aprovados.</p>
        <p className="text-xs text-muted-foreground mt-2">Vá até "Meus Locais" para reivindicar um estabelecimento.</p>
      </div>
    );
  }

  const roleBadgeColors: Record<string, string> = {
    owner: "bg-amber-100 text-amber-800 border-amber-300",
    manager: "bg-blue-100 text-blue-800 border-blue-300",
    staff: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <div className="space-y-6">
      {/* Establishment selector */}
      {establishments.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Estabelecimento:</label>
          <select
            value={estabId || ""}
            onChange={(e) => setSelectedEstab(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm flex-1"
          >
            {establishments.map((est: any) => (
              <option key={est.id} value={est.id}>{est.name}</option>
            ))}
          </select>
        </div>
      )}

      {establishments.length === 1 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border/50">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{establishments[0].name}</span>
        </div>
      )}

      {/* Team list */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Membros da equipe</h3>
        {loadingTeam ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {team && team.length > 0 ? (
              team.map((member: any) => (
                <div key={member.claimId} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                  <div className="flex items-center gap-3">
                    {member.profilePhotoUrl ? (
                      <img src={member.profilePhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground text-sm">{member.userName || member.username || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground">@{member.username || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={member.businessRole}
                      onChange={(e) => {
                        updateRoleMutation.mutate({
                          establishmentId: estabId!,
                          claimId: member.claimId,
                          newRole: e.target.value as "owner" | "manager" | "staff",
                        });
                      }}
                      className={`text-xs px-2 py-1 rounded-full border font-medium ${roleBadgeColors[member.businessRole] || roleBadgeColors.staff}`}
                    >
                      <option value="owner">Proprietário</option>
                      <option value="manager">Gerente</option>
                      <option value="staff">Funcionário</option>
                    </select>
                    <button
                      onClick={() => {
                        if (confirm(`Remover ${member.userName || member.username} da equipe?`)) {
                          removeMutation.mutate({ establishmentId: estabId!, claimId: member.claimId });
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Remover membro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 rounded-xl border border-dashed border-border/50">
                <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum membro na equipe ainda.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Convide gerentes e funcionários para ajudar na gestão.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite button / form */}
      {!showInviteForm ? (
        <button
          onClick={() => setShowInviteForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Convidar Membro
        </button>
      ) : (
        <div className="p-4 rounded-xl border border-primary/30 bg-card space-y-4">
          <h3 className="font-medium text-foreground text-sm">Convidar novo membro</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="@username do usuário"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Função:</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "owner" | "manager" | "staff")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="owner">Proprietário — acesso total</option>
                <option value="manager">Gerente — reservas, avaliações, métricas</option>
                <option value="staff">Funcionário — apenas visualizar</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!inviteUsername.trim()) {
                  toast.error("Digite o username do usuário.");
                  return;
                }
                inviteMutation.mutate({
                  establishmentId: estabId!,
                  username: inviteUsername.replace("@", "").trim(),
                  role: inviteRole,
                });
              }}
              disabled={inviteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar Convite
            </button>
            <button
              onClick={() => { setShowInviteForm(false); setInviteUsername(""); }}
              className="px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <h4 className="text-xs font-medium text-foreground mb-2">Níveis de acesso:</h4>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p><span className="font-medium text-amber-700">Proprietário:</span> Acesso total — editar cardápio, aceitar reservas, ver métricas, gerenciar equipe</p>
          <p><span className="font-medium text-blue-700">Gerente:</span> Aceitar reservas, responder avaliações, ver métricas</p>
          <p><span className="font-medium text-gray-700">Funcionário:</span> Apenas visualizar reservas e eventos</p>
        </div>
      </div>
    </div>
  );
}
