import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, FileText, User, Settings, ClipboardList, Shield, Crown, Loader2, Rocket, Plus, X, ChevronDown, ChevronUp, Search, ArrowUpDown } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const ACTION_ICONS: Record<string, typeof FileText> = {
  create: ClipboardList,
  update: Settings,
  delete: Shield,
  change_role: Crown,
  system_update: Rocket,
  default: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  create: "text-green-400 bg-green-500/10 border-green-500/20",
  update: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  delete: "text-red-400 bg-red-500/10 border-red-500/20",
  change_role: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  system_update: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  default: "text-muted-foreground bg-secondary border-border/50",
};

function getActionCategory(action: string): string {
  if (action === "system_update") return "system_update";
  if (action.startsWith("create")) return "create";
  if (action.startsWith("update") || action.startsWith("edit")) return "update";
  if (action.startsWith("delete") || action.startsWith("remove")) return "delete";
  if (action.includes("role")) return "change_role";
  return "default";
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OwnerLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: logs, isLoading, refetch } = trpc.systemLogs.list.useQuery({ limit: 200, offset: 0 });
  const createUpdate = trpc.systemLogs.createUpdate.useMutation({
    onSuccess: () => {
      toast.success("Atualização registrada no log!");
      refetch();
      setShowForm(false);
      setDescription("");
      setVersion("");
      setChanges([""]);
    },
    onError: (err) => {
      toast.error("Erro ao registrar: " + err.message);
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [changes, setChanges] = useState<string[]>([""]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort logs
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    let result = [...logs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((log) => {
        const descMatch = log.description.toLowerCase().includes(query);
        const actionMatch = log.action.toLowerCase().includes(query);
        const entityMatch = log.entity?.toLowerCase().includes(query);
        const userMatch = (log.userName || log.userEmail || "").toLowerCase().includes(query);
        let metadataMatch = false;
        if (log.metadata) {
          try {
            const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
            metadataMatch = JSON.stringify(meta).toLowerCase().includes(query);
          } catch {}
        }
        return descMatch || actionMatch || entityMatch || userMatch || metadataMatch;
      });
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [logs, searchQuery, sortOrder]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (authLoading) {
    return (
      <div className="safe-area-screen min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="safe-area-screen min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Acesso restrito ao Owner.</p>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!description.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }
    const validChanges = changes.filter((c) => c.trim());
    createUpdate.mutate({
      description: description.trim(),
      version: version.trim() || undefined,
      changes: validChanges.length > 0 ? validChanges : undefined,
    });
  };

  return (
    <div className="safe-area-screen min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-yellow-900/20 to-background border-b border-yellow-500/20 px-4 pt-6 pb-4">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/perfil">
              <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display text-2xl tracking-wider text-yellow-500">LOGS DO SISTEMA</h1>
              <p className="text-xs text-muted-foreground">Histórico cronológico de todas as alterações</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/20 transition-colors"
            >
              {showForm ? <X className="w-4 h-4 text-yellow-500" /> : <Plus className="w-4 h-4 text-yellow-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Form to register system update */}
      {showForm && (
        <div className="container px-4 py-4 border-b border-border/50">
          <div className="bg-card border border-yellow-500/20 rounded-xl p-4 space-y-3">
            <h3 className="font-display text-sm tracking-wider text-yellow-500">REGISTRAR ATUALIZAÇÃO</h3>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descrição *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Reorganização do menu Owner — removidas ações rápidas duplicadas, adicionado Survey no Controle"
                className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Versão (checkpoint)</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="Ex: f5e2528f"
                className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Alterações (uma por linha)</label>
              {changes.map((change, i) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <input
                    type="text"
                    value={change}
                    onChange={(e) => {
                      const updated = [...changes];
                      updated[i] = e.target.value;
                      setChanges(updated);
                    }}
                    placeholder={`Alteração ${i + 1}`}
                    className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50"
                  />
                  {changes.length > 1 && (
                    <button
                      onClick={() => setChanges(changes.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setChanges([...changes, ""])}
                className="text-xs text-yellow-500 hover:text-yellow-400 mt-1"
              >
                + Adicionar alteração
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={createUpdate.isPending}
              className="w-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 rounded-lg py-2 text-sm font-medium hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
            >
              {createUpdate.isPending ? "Registrando..." : "Registrar no Log"}
            </button>
          </div>
        </div>
      )}

      {/* Search + Filter bar */}
      <div className="container px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nos logs..."
              className="w-full bg-card border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Sort filter button */}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border/50 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-yellow-500/30 transition-colors whitespace-nowrap"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">{sortOrder === "desc" ? "Mais recente" : "Mais antigo"}</span>
          </button>
        </div>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-2">
            {filteredLogs.length} {filteredLogs.length === 1 ? "resultado" : "resultados"} para "{searchQuery}"
          </p>
        )}
      </div>

      {/* Logs List */}
      <div className="container px-4 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !filteredLogs || filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? "Nenhum log encontrado para essa busca." : "Nenhum log registrado ainda."}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {searchQuery ? "Tente outra palavra-chave." : "As alterações feitas no sistema aparecerão aqui em ordem cronológica."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const category = getActionCategory(log.action);
              const Icon = ACTION_ICONS[category] || ACTION_ICONS.default;
              const colorClass = ACTION_COLORS[category] || ACTION_COLORS.default;
              const isExpanded = expandedIds.has(log.id);
              let metadata: Record<string, any> | null = null;
              if (log.metadata) {
                try {
                  metadata = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
                } catch {}
              }
              const hasExpandableContent = (category === "system_update" && metadata?.changes && Array.isArray(metadata.changes)) || (log.entity && category !== "system_update");

              return (
                <div
                  key={log.id}
                  className="rounded-xl bg-card border border-border/50 overflow-hidden"
                >
                  {/* Card header — always visible, fixed height */}
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-secondary/30 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Title / Description */}
                      <p className="text-sm text-foreground leading-snug line-clamp-1">
                        {log.description}
                      </p>
                      {/* User + Date immediately below title */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {log.userName || log.userEmail || `ID ${log.userId}`}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground/40">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </span>
                        {metadata?.version && (
                          <>
                            <span className="text-xs text-muted-foreground/40">•</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 font-mono">
                              v{metadata.version}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Expand/collapse arrow */}
                    <div className="flex-shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expandable content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-border/30">
                      {/* Full description if truncated */}
                      <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
                        {log.description}
                      </p>

                      {/* Changes list for system_update */}
                      {category === "system_update" && metadata?.changes && Array.isArray(metadata.changes) && (
                        <ul className="mt-3 space-y-1 pl-1">
                          {metadata.changes.map((change: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-yellow-500 mt-0.5">•</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Entity info for non-system_update */}
                      {log.entity && category !== "system_update" && (
                        <div className="mt-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground uppercase tracking-wider">
                            {log.entity}{log.entityId ? ` #${log.entityId}` : ""}
                          </span>
                        </div>
                      )}

                      {/* Action type badge */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {log.action}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
