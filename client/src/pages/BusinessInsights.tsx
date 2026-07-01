/**
 * Business Insights — Reestruturado em 4 abas:
 * 1. Dashboard (gráficos + linha temporal com outliers)
 * 2. Desempenho (20 insights por tema: Público, Produto, Experiência, Competição, Marketing)
 * 3. Plano de Ação (sugestões IA + outliers detectados)
 * 4. Meu Plano (assinatura e upgrade)
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { LayoutDashboard, TrendingUp, Lightbulb, BarChart3, Crown } from "lucide-react";
import { ScrollableTabs } from "@/components/ScrollableTabs";

import BusinessDashboardTab from "./BusinessDashboardTab";
import BusinessDesempenhoTab from "./BusinessDesempenhoTab";
import BusinessPlanoAcaoTab from "./BusinessPlanoAcaoTab";
import { BusinessPlanTab } from "./BusinessPanel";

type TabId = "dashboard" | "desempenho" | "plano-acao" | "meu-plano";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", labelFull: "Dashboard", icon: LayoutDashboard },
  { id: "desempenho", label: "Desempenho", labelFull: "Desempenho", icon: TrendingUp },
  { id: "plano-acao", label: "Plano de Ação", labelFull: "Plano de Ação", icon: Lightbulb },
  { id: "meu-plano", label: "Meu Plano", labelFull: "Meu Plano", icon: Crown },
];

export default function BusinessInsights() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

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

      {/* Tabs */}
      <ScrollableTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Content */}
      <div className="container py-6">
        {activeTab === "dashboard" && <BusinessDashboardTab />}
        {activeTab === "desempenho" && <BusinessDesempenhoTab />}
        {activeTab === "plano-acao" && <BusinessPlanoAcaoTab />}
        {activeTab === "meu-plano" && <BusinessPlanTab />}
      </div>
    </div>
  );
}
