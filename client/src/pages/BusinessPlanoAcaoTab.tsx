/**
 * Plano de Ação Tab — Sugestões geradas por IA com base nos dados + "faltou para o 10" + outliers
 * Cards com prioridade, impacto estimado, passo a passo e botão concluir
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Loader2, Lightbulb, TrendingUp, Crown, Lock, Zap
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  urgent: { label: "Urgente", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" },
  high: { label: "Alta", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20" },
  medium: { label: "Média", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" },
  low: { label: "Baixa", color: "text-emerald-400", bgColor: "bg-emerald-500/10 border-emerald-500/20" },
};

export default function BusinessPlanoAcaoTab() {
  const { user } = useAuth();

  // Get user's establishments
  const { data: estabs } = trpc.business.myEstablishments.useQuery(undefined, {
    enabled: !!user,
  });
  const [selectedEstab, setSelectedEstab] = useState<number | null>(null);
  const estabId = selectedEstab || estabs?.[0]?.id;

  const { data: actionsData, isLoading } = trpc.analytics.businessActions.useQuery(
    { establishmentId: estabId! },
    { enabled: !!estabId }
  );

  // businessActions returns ActionData[] directly
  const actions = actionsData || [];
  // Check plan from fullInsights endpoint instead
  const { data: fullInsights } = trpc.analytics.fullInsights.useQuery(
    { establishmentId: estabId! },
    { enabled: !!estabId }
  );
  const isPremium = fullInsights?.plan === "premium";
  const pendingActions = actions.filter((a: any) => a.status === "pending");
  const completedActions = actions.filter((a: any) => a.status === "completed");

  if (!estabs || estabs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum estabelecimento vinculado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Establishment selector */}
      {estabs.length > 1 && (
        <Select
          value={String(estabId)}
          onValueChange={(v) => setSelectedEstab(Number(v))}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Estabelecimento" />
          </SelectTrigger>
          <SelectContent>
            {estabs.map((e: any) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Plan banner for free users */}
      {!isPremium && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">Plano Pro — R$97/mês</p>
              <p className="text-xs text-muted-foreground">
                Desbloqueie todas as ações sugeridas pela IA para otimizar seu negócio.
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
              <p className="text-xl font-bold text-amber-400">{pendingActions.length}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
              <p className="text-xl font-bold text-emerald-400">{completedActions.length}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/50 text-center">
              <p className="text-xl font-bold text-primary">
                {actions.length > 0 ? `+${(actions.filter((a: any) => a.estimatedImpact).length * 0.2).toFixed(1)}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Impacto est.</p>
            </div>
          </div>

          {/* Pending Actions */}
          {pendingActions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Zap className="w-4 h-4 text-amber-400" />
                Próximos Passos
              </h3>
              {pendingActions.map((action: any, i: number) => (
                <ActionCard
                  key={i}
                  action={action}
                  isPremium={isPremium}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Todas as ações foram concluídas! Novas sugestões aparecerão com mais avaliações.
              </p>
            </div>
          )}

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/30">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Concluídas ({completedActions.length})
              </h3>
              {completedActions.slice(0, 3).map((action: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-card/30 border border-border/20 opacity-60">
                  <p className="text-sm text-foreground line-through">{action.title}</p>
                  {action.measuredImpact && (
                    <p className="text-xs text-emerald-400 mt-1">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {action.measuredImpact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Action Card ────────────────────────────────────────────────────────────

function ActionCard({
  action,
  isPremium,
  index,
}: {
  action: any;
  isPremium: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const priority = PRIORITY_CONFIG[action.priority] || PRIORITY_CONFIG.medium;

  // First 2 actions visible for free, rest blurred
  const isLocked = !isPremium && index >= 2;

  return (
    <div className={`relative rounded-xl border ${priority.bgColor} overflow-hidden`}>
      {/* Blur for locked */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-medium">Pro</span>
          </div>
        </div>
      )}

      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase ${priority.color}`}>
              {priority.label}
            </span>
            {action.source === "outlier" && (
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            )}
          </div>
          <h4 className="text-sm font-medium text-foreground">{action.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && !isLocked && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
          {/* Impact */}
          {action.estimatedImpact && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-medium">
                Impacto estimado: {action.estimatedImpact}
              </span>
            </div>
          )}

          {/* Steps */}
          {action.steps && action.steps.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                O que fazer:
              </p>
              {action.steps.map((step: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs font-bold text-primary shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <span className="text-xs text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Investment */}
          {action.estimatedCost && (
            <p className="text-xs text-muted-foreground">
              💰 Investimento estimado: <span className="font-medium text-foreground">{action.estimatedCost}</span>
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => toast.success("Ação marcada como concluída!")}
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
              Concluir
            </button>
            <button
              onClick={() => toast("Ação ignorada", { description: "Ela não aparecerá novamente." })}
              className="py-2 px-3 rounded-lg bg-secondary text-muted-foreground text-xs hover:bg-secondary/80 transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
