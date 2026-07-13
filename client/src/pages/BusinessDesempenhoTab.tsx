/**
 * Desempenho Tab — 20 insights organizados por 5 temas:
 * Público, Produto, Experiência, Competição, Marketing
 * Com blur/paywall para plano Free
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
  Users, ShoppingBag, Sparkles, Swords, Megaphone,
  Lock, ChevronDown, ChevronUp, Loader2, Crown
} from "lucide-react";

// Map insight IDs to themes
const THEME_MAP: Record<string, { ids: number[]; label: string; icon: React.ElementType; color: string }> = {
  publico: {
    ids: [1, 4, 5, 11],
    label: "Público",
    icon: Users,
    color: "text-blue-400",
  },
  produto: {
    ids: [3, 10, 12, 13],
    label: "Produto",
    icon: ShoppingBag,
    color: "text-amber-400",
  },
  experiencia: {
    ids: [2, 6, 8, 14, 19],
    label: "Experiência",
    icon: Sparkles,
    color: "text-emerald-400",
  },
  competicao: {
    ids: [9, 15, 17, 18],
    label: "Competição",
    icon: Swords,
    color: "text-purple-400",
  },
  marketing: {
    ids: [7, 16, 20],
    label: "Marketing",
    icon: Megaphone,
    color: "text-rose-400",
  },
};

interface BusinessDesempenhoTabProps {
  establishmentId?: number | null;
}

export default function BusinessDesempenhoTab({ establishmentId }: BusinessDesempenhoTabProps) {
  const { user } = useAuth();
  const [expandedTheme, setExpandedTheme] = useState<string | null>("publico");

  // Use shared establishmentId from parent, fallback to fetching own
  const { data: estabs } = trpc.business.myEstablishments.useQuery(undefined, {
    enabled: !!user && !establishmentId,
  });
  const estabId = establishmentId || estabs?.[0]?.id;

  const { data: fullInsights, isLoading } = trpc.analytics.fullInsights.useQuery(
    { establishmentId: estabId! },
    { enabled: !!estabId }
  );

  const plan = fullInsights?.plan;
  const insights = fullInsights?.insights || [];
  const isPremium = plan === "premium";

  if (!estabId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum estabelecimento vinculado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Plan banner for free users */}
      {!isPremium && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">Plano Premium — Assine para desbloquear</p>
              <p className="text-xs text-muted-foreground">
                Desbloqueie todos os insights e tenha acesso completo aos dados do seu negócio.
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
        <div className="space-y-3">
          {Object.entries(THEME_MAP).map(([key, theme]) => {
            const Icon = theme.icon;
            const isExpanded = expandedTheme === key;
            const themeInsights = insights.filter(i => theme.ids.includes(i.id));

            return (
              <div key={key} className="rounded-xl border border-border/50 overflow-hidden">
                {/* Theme Header */}
                <button
                  onClick={() => setExpandedTheme(isExpanded ? null : key)}
                  className="w-full flex items-center gap-3 p-4 bg-card hover:bg-card/80 transition-colors"
                >
                  <Icon className={`w-5 h-5 ${theme.color} shrink-0`} />
                  <span className="text-sm font-semibold text-foreground flex-1 text-left">
                    {theme.label}
                  </span>
                  <span className="text-xs text-muted-foreground mr-2">
                    {themeInsights.filter(i => i.value !== null).length}/{themeInsights.length} ativos
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Theme Content */}
                {isExpanded && (
                  <div className="border-t border-border/30 p-4 space-y-3 bg-card/50">
                    {themeInsights.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Sem dados suficientes para este tema.
                      </p>
                    ) : (
                      themeInsights.map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          isPremium={isPremium}
                          themeColor={theme.color}
                        />
                      ))
                    )}
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

// ─── Insight Card ───────────────────────────────────────────────────────────

function InsightCard({
  insight,
  isPremium,
  themeColor,
}: {
  insight: any;
  isPremium: boolean;
  themeColor: string;
}) {
  // Free users can see tier 1 insights (ids 1-5), rest is blurred
  const isLocked = !isPremium && insight.tier > 1;

  return (
    <div className={`relative p-3 rounded-lg bg-background/50 border border-border/30 ${isLocked ? "overflow-hidden" : ""}`}>
      {/* Blur overlay for locked insights */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-medium">Pro</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-foreground">{insight.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
        </div>
        {insight.value && (
          <span className={`text-sm font-bold ${themeColor} shrink-0`}>
            {insight.value}
          </span>
        )}
      </div>

      {insight.detail && !isLocked && (
        <p className="text-xs text-muted-foreground/80 mt-2 pl-0 border-l-2 border-border/50 ml-0 pl-2">
          {insight.detail}
        </p>
      )}
    </div>
  );
}
