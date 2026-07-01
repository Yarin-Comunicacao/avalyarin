import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Zap, AlertTriangle, ArrowUp, Minus, ArrowDown,
  CheckCircle2, X, ChevronDown, ChevronUp, BarChart3,
  Lock, Sparkles, Loader2
} from "lucide-react";

const PRIORITY_CONFIG = {
  urgent: { label: "Urgente", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
  high: { label: "Alta", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: ArrowUp },
  medium: { label: "Média", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Minus },
  low: { label: "Baixa", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: ArrowDown },
};

export default function BusinessActionsTab() {
  const { data: establishments, isLoading: loadingEstabs } = trpc.business.myEstablishments.useQuery();
  const [selectedEstId, setSelectedEstId] = useState<number | null>(null);
  const [expandedAction, setExpandedAction] = useState<number | null>(null);

  const estId = selectedEstId || (establishments && establishments.length > 0 ? establishments[0].id : null);

  const { data: fullData, isLoading: loadingData } = trpc.analytics.fullInsights.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  if (loadingEstabs) return <div className="text-muted-foreground animate-pulse">Carregando...</div>;

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">SEM DADOS</h3>
        <p className="text-muted-foreground text-sm">Vincule um estabelecimento para ver ações sugeridas.</p>
      </div>
    );
  }

  const plan = fullData?.plan || "free";
  const actions = fullData?.actions || [];
  const isLocked = plan === "free";

  return (
    <div className="space-y-6">
      {/* Header + selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider text-foreground">AÇÕES</h2>
        {establishments.length > 1 && (
          <select
            value={estId || ""}
            onChange={(e) => setSelectedEstId(Number(e.target.value))}
            className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
          >
            {establishments.map((est: any) => (
              <option key={est.id} value={est.id}>{est.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Description */}
      <div className="p-4 rounded-xl bg-card/50 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Gerado por IA</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Ações práticas baseadas nas avaliações dos seus clientes, feedbacks "O que faltou para o 10?" e padrões identificados nos dados.
        </p>
      </div>

      {/* Lock overlay for free */}
      {isLocked ? (
        <div className="relative">
          {/* Show 2 blurred preview actions */}
          <div className="space-y-3 filter blur-sm select-none pointer-events-none">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                    Urgente
                  </span>
                  <span className="text-sm font-medium text-foreground">Ação sugerida #{i}</span>
                </div>
                <p className="text-xs text-muted-foreground">Descrição da ação baseada em dados reais do seu negócio...</p>
                <div className="flex gap-4 mt-3">
                  <span className="text-xs text-muted-foreground">Impacto: +0.5 nota</span>
                  <span className="text-xs text-muted-foreground">Investimento: R$0</span>
                </div>
              </div>
            ))}
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[2px]">
            <div className="text-center p-6">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display text-lg text-foreground mb-2">AÇÕES PRO</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Assine o plano Pro para receber ações personalizadas geradas por IA.
              </p>
              <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Assinar Pro — R$97/mês
              </button>
            </div>
          </div>
        </div>
      ) : loadingData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="text-sm text-muted-foreground ml-3">Gerando ações com IA...</span>
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="font-display text-xl text-foreground mb-2">TUDO CERTO!</h3>
          <p className="text-muted-foreground text-sm">Nenhuma ação urgente identificada. Continue monitorando.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-center">
              <p className="font-numbers text-xl font-bold text-red-400">
                {actions.filter(a => a.priority === "urgent").length}
              </p>
              <p className="text-xs text-muted-foreground">Urgentes</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-center">
              <p className="font-numbers text-xl font-bold text-orange-400">
                {actions.filter(a => a.priority === "high").length}
              </p>
              <p className="text-xs text-muted-foreground">Alta</p>
            </div>
            <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-center">
              <p className="font-numbers text-xl font-bold text-yellow-400">
                {actions.filter(a => a.priority === "medium" || a.priority === "low").length}
              </p>
              <p className="text-xs text-muted-foreground">Média/Baixa</p>
            </div>
          </div>

          {/* Action cards */}
          {actions.map((action) => {
            const config = PRIORITY_CONFIG[action.priority];
            const PriorityIcon = config.icon;
            const isExpanded = expandedAction === action.id;

            return (
              <div
                key={action.id}
                className="rounded-xl bg-card border border-border/50 overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${config.color}`}>
                      <PriorityIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{action.source}</span>
                      </div>
                      <h4 className="text-sm font-medium text-foreground">{action.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-emerald-400">↑ {action.impact}</span>
                        <span className="text-xs text-muted-foreground">💰 {action.investmentEstimate}</span>
                        <span className="text-xs text-muted-foreground">⏱ {action.timeEstimate}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border/30 pt-4">
                    <h5 className="text-xs font-medium text-foreground uppercase tracking-wider mb-3">O QUE FAZER</h5>
                    <ol className="space-y-2">
                      {action.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="text-xs text-muted-foreground pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marcar como feito
                      </button>
                      <button className="py-2 px-4 rounded-lg bg-card border border-border/50 text-xs text-muted-foreground hover:border-border transition-colors flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        Ignorar
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
