/**
 * Business Insights — 4 abas:
 * 1. Meu Plano (assinatura e upgrade)
 * 2. Dashboard (gráficos + linha temporal com outliers)
 * 3. Desempenho (20 insights por tema: Público, Produto, Experiência, Competição, Marketing)
 * 4. Plano de Ação (sugestões IA + outliers detectados)
 *
 * Dropdown de estabelecimento fica ACIMA das abas — navegação entre abas mantém o estab selecionado.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { LayoutDashboard, TrendingUp, Lightbulb, BarChart3, Crown, Store } from "lucide-react";
import { ScrollableTabs } from "@/components/ScrollableTabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import BusinessDashboardTab from "./BusinessDashboardTab";
import BusinessDesempenhoTab from "./BusinessDesempenhoTab";
import BusinessPlanoAcaoTab from "./BusinessPlanoAcaoTab";
import { BusinessPlanTab } from "./BusinessPanel";

type TabId = "meu-plano" | "dashboard" | "desempenho" | "plano-acao";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "meu-plano", label: "Meu Plano", labelFull: "Meu Plano", icon: Crown },
  { id: "dashboard", label: "Dashboard", labelFull: "Dashboard", icon: LayoutDashboard },
  { id: "desempenho", label: "Desempenho", labelFull: "Desempenho", icon: TrendingUp },
  { id: "plano-acao", label: "Plano de Ação", labelFull: "Plano de Ação", icon: Lightbulb },
];

export default function BusinessInsights() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("meu-plano");
  const [selectedEstabId, setSelectedEstabId] = useState<number | null>(null);

  // Fetch establishments at this level so all tabs share the same selection
  const { data: establishments } = trpc.business.myEstablishments.useQuery(undefined, {
    enabled: !!user,
  });

  const estabId = selectedEstabId || establishments?.[0]?.id || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-6">
          <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">INSIGHTS</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar os insights do seu negócio.
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Entrar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg tracking-wider text-primary">INSIGHTS</h1>
          </div>
          <span className="text-xs text-muted-foreground">{user?.name}</span>
        </div>
      </header>

      {/* Establishment Selector — ABOVE tabs */}
      {establishments && establishments.length > 0 && (
        <div className="container pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-muted-foreground shrink-0" />
            {establishments.length === 1 ? (
              <span className="text-sm font-medium text-foreground">{establishments[0].name}</span>
            ) : (
              <Select
                value={String(estabId)}
                onValueChange={(v) => setSelectedEstabId(Number(v))}
              >
                <SelectTrigger className="w-full max-w-[280px] h-9 text-sm">
                  <SelectValue placeholder="Selecione o estabelecimento" />
                </SelectTrigger>
                <SelectContent>
                  {establishments.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <ScrollableTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Content */}
      <div className="container py-6">
        {activeTab === "meu-plano" && <BusinessPlanTab establishmentId={estabId} />}
        {activeTab === "dashboard" && <BusinessDashboardTab establishmentId={estabId} />}
        {activeTab === "desempenho" && <BusinessDesempenhoTab establishmentId={estabId} />}
        {activeTab === "plano-acao" && <BusinessPlanoAcaoTab establishmentId={estabId} />}
      </div>
    </div>
  );
}
