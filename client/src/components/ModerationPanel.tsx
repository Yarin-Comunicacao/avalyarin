/**
 * ModerationPanel — Admin panel tab for reviewing AI-flagged content and user reports.
 * Shows two sub-tabs: "Moderação IA" (auto-flagged) and "Denúncias" (user reports).
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Eye, Ban, MessageSquareWarning,
  Flag, Clock, Filter, ChevronDown, ChevronUp, Loader2
} from "lucide-react";

type ModerationTab = "ai" | "reports";

export default function ModerationPanel() {
  const [tab, setTab] = useState<ModerationTab>("ai");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="font-display text-2xl tracking-wider text-foreground">MODERAÇÃO</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 border-b border-border/30 pb-3">
        <button
          onClick={() => setTab("ai")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "ai" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Moderação IA
        </button>
        <button
          onClick={() => setTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === "reports" ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flag className="w-4 h-4" />
          Denúncias
        </button>
      </div>

      {tab === "ai" && <AIModerationTab />}
      {tab === "reports" && <ReportsTab />}
    </div>
  );
}

// ============================================================
// AI MODERATION TAB
// ============================================================
function AIModerationTab() {
  const [statusFilter, setStatusFilter] = useState<"flagged" | "rejected" | "approved" | "pending" | undefined>("flagged");
  const { data, isLoading, refetch } = trpc.admin.moderationQueue.useQuery({ status: statusFilter, limit: 50 });
  const { data: stats } = trpc.admin.moderationStats.useQuery();
  const reviewMutation = trpc.admin.reviewModeration.useMutation({
    onSuccess: () => {
      toast.success("Ação aplicada com sucesso");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const severityColors: Record<string, string> = {
    none: "text-green-400",
    low: "text-yellow-400",
    medium: "text-orange-400",
    high: "text-red-400",
    critical: "text-red-600",
  };

  const severityLabels: Record<string, string> = {
    none: "Nenhuma",
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    flagged: "Flagrado",
    rejected: "Rejeitado",
    approved: "Aprovado",
  };

  // Stats summary
  const totalFlagged = stats?.find((s: any) => s.status === "flagged")?.count || 0;
  const totalRejected = stats?.find((s: any) => s.status === "rejected")?.count || 0;
  const totalPending = stats?.find((s: any) => s.status === "pending")?.count || 0;

  return (
    <div>
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground">Flagrados</span>
          </div>
          <p className="font-numbers text-2xl font-bold text-orange-400">{totalFlagged}</p>
        </div>
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-muted-foreground">Rejeitados</span>
          </div>
          <p className="font-numbers text-2xl font-bold text-red-400">{totalRejected}</p>
        </div>
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Pendentes</span>
          </div>
          <p className="font-numbers text-2xl font-bold text-yellow-400">{totalPending}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Filtrar:</span>
        {(["flagged", "rejected", "pending", "approved"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? undefined : s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "bg-card border border-border/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Items list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !data?.items?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400/50" />
          <p>Nenhum item encontrado com este filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item: any) => (
            <ModerationItem
              key={item.id}
              item={item}
              severityColors={severityColors}
              severityLabels={severityLabels}
              statusLabels={statusLabels}
              onReview={(action, note) => {
                reviewMutation.mutate({ moderationId: item.id, action, note });
              }}
              reviewing={reviewMutation.isPending}
            />
          ))}
          {data.total > 50 && (
            <p className="text-center text-xs text-muted-foreground pt-4">
              Mostrando 50 de {data.total} itens
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ModerationItem({
  item,
  severityColors,
  severityLabels,
  statusLabels,
  onReview,
  reviewing,
}: {
  item: any;
  severityColors: Record<string, string>;
  severityLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  onReview: (action: "approve" | "remove" | "warn" | "ban", note?: string) => void;
  reviewing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const categories = item.categories ? JSON.parse(item.categories) : [];

  const categoryLabels: Record<string, string> = {
    sexual_content: "Conteúdo Sexual",
    hate_speech: "Discurso de Ódio",
    violence: "Violência",
    financial_scam: "Golpe Financeiro",
    phishing: "Phishing",
    false_identity: "Falsa Identidade",
    misinformation: "Desinformação",
    restricted_goods: "Bens Restritos",
    spam: "Spam",
    other: "Outro",
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-border/80 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              item.targetType === "photo" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
            }`}>
              {item.targetType === "photo" ? "Foto" : "Comentário"}
            </span>
            <span className={`text-xs font-medium ${severityColors[item.severity] || "text-muted-foreground"}`}>
              {severityLabels[item.severity] || item.severity}
            </span>
            {categories.map((cat: string) => (
              <span key={cat} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                {categoryLabels[cat] || cat}
              </span>
            ))}
          </div>
          <p className="text-sm text-foreground mt-2 line-clamp-2">{item.reason}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>Usuário: {item.userName || "Desconhecido"}</span>
            <span>ID: #{item.targetId}</span>
            {item.confidence && <span>Confiança: {Math.round(item.confidence * 100)}%</span>}
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="text-xs text-muted-foreground mb-3">
            <p>Rating ID: {item.ratingId} | Criado: {new Date(item.createdAt).toLocaleString("pt-BR")}</p>
            {item.reviewedAt && <p>Revisado em: {new Date(item.reviewedAt).toLocaleString("pt-BR")} | Ação: {item.reviewAction}</p>}
          </div>
          {/* Action buttons */}
          {item.status !== "approved" && !item.reviewedAt && (
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                onClick={() => onReview("approve")}
                disabled={reviewing}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
                onClick={() => onReview("remove")}
                disabled={reviewing}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Remover
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                onClick={() => onReview("warn")}
                disabled={reviewing}
              >
                <MessageSquareWarning className="w-3.5 h-3.5 mr-1" />
                Avisar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                onClick={() => onReview("ban")}
                disabled={reviewing}
              >
                <Ban className="w-3.5 h-3.5 mr-1" />
                Banir
              </Button>
            </div>
          )}
          {item.reviewedAt && (
            <p className="text-xs text-green-400">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Já revisado: {item.reviewAction}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// REPORTS TAB
// ============================================================
function ReportsTab() {
  const [statusFilter, setStatusFilter] = useState<"pending" | "reviewed" | "dismissed" | "actioned" | undefined>("pending");
  const { data, isLoading, refetch } = trpc.admin.reportQueue.useQuery({ status: statusFilter, limit: 50 });
  const { data: stats } = trpc.admin.reportStats.useQuery();
  const reviewMutation = trpc.admin.reviewReport.useMutation({
    onSuccess: () => {
      toast.success("Denúncia processada");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const totalPending = stats?.find((s: any) => s.status === "pending")?.count || 0;
  const totalActioned = stats?.find((s: any) => s.status === "actioned")?.count || 0;

  const reasonLabels: Record<string, string> = {
    sexual_content: "Conteúdo Sexual",
    hate_speech: "Discurso de Ódio",
    violence: "Violência",
    financial_scam: "Golpe Financeiro",
    phishing: "Phishing",
    false_identity: "Falsa Identidade",
    cloaking: "Cloaking",
    account_integrity: "Integridade da Conta",
    misinformation: "Desinformação",
    restricted_goods: "Bens Restritos",
    cybersecurity: "Cibersegurança",
    spam: "Spam",
    other: "Outro",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    reviewed: "Revisado",
    dismissed: "Descartado",
    actioned: "Ação Tomada",
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Flag className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-muted-foreground">Pendentes</span>
          </div>
          <p className="font-numbers text-2xl font-bold text-orange-400">{totalPending}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Resolvidas</span>
          </div>
          <p className="font-numbers text-2xl font-bold text-green-400">{totalActioned}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Filtrar:</span>
        {(["pending", "actioned", "dismissed"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? undefined : s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              statusFilter === s ? "bg-primary/20 text-primary border border-primary/30" : "bg-card border border-border/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !data?.items?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400/50" />
          <p>Nenhuma denúncia encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((report: any) => (
            <div key={report.id} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      {reasonLabels[report.reason] || report.reason}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      report.targetType === "rating" ? "bg-blue-500/20 text-blue-400" :
                      report.targetType === "photo" ? "bg-purple-500/20 text-purple-400" :
                      report.targetType === "user" ? "bg-orange-500/20 text-orange-400" :
                      "bg-gray-500/20 text-gray-400"
                    }`}>
                      {report.targetType === "rating" ? "Avaliação" :
                       report.targetType === "photo" ? "Foto" :
                       report.targetType === "user" ? "Usuário" : "Comentário"}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-sm text-foreground mb-2">{report.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Reportado por: {report.reporterName || "Anônimo"}</span>
                    <span>Alvo ID: #{report.targetId}</span>
                    <span>{new Date(report.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {report.status === "pending" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-muted-foreground border-border/30 hover:bg-muted/20"
                    onClick={() => reviewMutation.mutate({ reportId: report.id, action: "dismiss" })}
                    disabled={reviewMutation.isPending}
                  >
                    Descartar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                    onClick={() => reviewMutation.mutate({ reportId: report.id, action: "warn" })}
                    disabled={reviewMutation.isPending}
                  >
                    Avisar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
                    onClick={() => reviewMutation.mutate({ reportId: report.id, action: "remove_content" })}
                    disabled={reviewMutation.isPending}
                  >
                    Remover
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                    onClick={() => reviewMutation.mutate({ reportId: report.id, action: "ban_user" })}
                    disabled={reviewMutation.isPending}
                  >
                    Banir
                  </Button>
                </div>
              )}
              {report.status !== "pending" && (
                <p className="text-xs text-green-400 mt-2">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  {statusLabels[report.status]} {report.reviewAction && `(${report.reviewAction})`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
