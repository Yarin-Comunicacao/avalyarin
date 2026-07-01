import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Users, Clock, Star, MessageSquare, MapPin, ThumbsDown,
  TrendingUp, RefreshCw, BarChart3, DollarSign, PieChart,
  TrendingDown, Ticket, Calendar, Award, LineChart, Volume2,
  Sun, Lightbulb, Filter, Lock, Sparkles
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Clock, Star, MessageSquare, MapPin, ThumbsDown,
  TrendingUp, RefreshCw, BarChart3, DollarSign, PieChart,
  TrendingDown, Ticket, Calendar, Award, LineChart, Volume2,
  Sun, Lightbulb, Filter,
};

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Diário", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  2: { label: "Semanal", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  3: { label: "Mensal", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  4: { label: "Estratégico", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

export default function BusinessInsightsNewTab() {
  const { data: establishments, isLoading: loadingEstabs } = trpc.business.myEstablishments.useQuery();
  const [selectedEstId, setSelectedEstId] = useState<number | null>(null);
  const [activeTier, setActiveTier] = useState<number | null>(null);

  const estId = selectedEstId || (establishments && establishments.length > 0 ? establishments[0].id : null);

  const { data: fullData, isLoading: loadingData } = trpc.analytics.fullInsights.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  if (loadingEstabs) return <div className="text-muted-foreground animate-pulse">Carregando...</div>;

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">SEM DADOS</h3>
        <p className="text-muted-foreground text-sm">Vincule um estabelecimento para ver insights.</p>
      </div>
    );
  }

  const plan = fullData?.plan || "free";
  const insights = fullData?.insights || [];
  const filteredInsights = activeTier ? insights.filter(i => i.tier === activeTier) : insights;

  // Free plan can see Tier 1 fully, rest is blurred
  const canSeeTier = (tier: number) => plan === "premium" || tier === 1;

  return (
    <div className="space-y-6">
      {/* Header + selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider text-foreground">20 INSIGHTS</h2>
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

      {/* Plan badge */}
      {plan === "free" && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Plano Free</p>
              <p className="text-xs text-muted-foreground">Tier 1 (5 insights) desbloqueado. Assine Pro para ver todos os 20.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">R$97/mês</span>
        </div>
      )}

      {/* Tier filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTier(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
            activeTier === null ? "bg-primary/20 text-primary border-primary/30" : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
          }`}
        >
          Todos (20)
        </button>
        {[1, 2, 3, 4].map(tier => (
          <button
            key={tier}
            onClick={() => setActiveTier(tier === activeTier ? null : tier)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              activeTier === tier ? TIER_LABELS[tier].color : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
            }`}
          >
            Tier {tier} — {TIER_LABELS[tier].label}
          </button>
        ))}
      </div>

      {/* Insights grid */}
      {loadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-card/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredInsights.map(insight => {
            const Icon = ICON_MAP[insight.icon] || BarChart3;
            const isLocked = !canSeeTier(insight.tier);

            return (
              <div
                key={insight.id}
                className={`relative p-5 rounded-xl border transition-all ${
                  isLocked
                    ? "bg-card/30 border-border/30"
                    : "bg-card border-border/50 hover:border-primary/30"
                }`}
              >
                {/* Tier badge */}
                <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full border font-medium ${TIER_LABELS[insight.tier].color}`}>
                  T{insight.tier}
                </span>

                {/* Content */}
                <div className={isLocked ? "filter blur-sm select-none pointer-events-none" : ""}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-display text-sm tracking-wider text-foreground">{insight.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{insight.description}</p>
                  {insight.value && (
                    <p className="font-numbers text-xl font-bold text-foreground">{insight.value}</p>
                  )}
                  {insight.detail && (
                    <p className="text-xs text-muted-foreground mt-1">{insight.detail}</p>
                  )}
                </div>

                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[1px]">
                    <div className="flex flex-col items-center gap-1">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">Pro</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upgrade CTA for free users */}
      {plan === "free" && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-display text-xl tracking-wider text-foreground mb-2">DESBLOQUEIE TODOS OS INSIGHTS</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Acesse os 20 insights + ações sugeridas por IA por apenas R$97/mês.
          </p>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Assinar Pro — R$97/mês
          </button>
        </div>
      )}
    </div>
  );
}
