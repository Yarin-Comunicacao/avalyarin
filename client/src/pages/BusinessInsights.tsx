import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import {
  TrendingUp, Crown, CalendarDays, BarChart3, Activity, Zap
} from "lucide-react";
import { ScrollableTabs } from "@/components/ScrollableTabs";

import {
  BusinessPlanTab,
  CalendarioBusinessTab,
} from "./BusinessPanelTabs";
import BusinessPainelTab from "./BusinessPainelTab";
import BusinessInsightsNewTab from "./BusinessInsightsNewTab";
import BusinessActionsTab from "./BusinessActionsTab";

type TabId = "plano" | "painel" | "insights" | "acoes" | "calendario";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "plano", label: "Plano", labelFull: "Meu Plano", icon: Crown },
  { id: "painel", label: "Painel", labelFull: "Diagnóstico Rápido", icon: Activity },
  { id: "insights", label: "Insights", labelFull: "20 Insights", icon: TrendingUp },
  { id: "acoes", label: "Ações", labelFull: "Ações Sugeridas", icon: Zap },
  { id: "calendario", label: "Calendário", labelFull: "Calendário de Eventos", icon: CalendarDays },
];

export default function BusinessInsights() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("painel");

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
        {activeTab === "plano" && <BusinessPlanTab />}
        {activeTab === "painel" && <BusinessPainelTab />}
        {activeTab === "insights" && <BusinessInsightsNewTab />}
        {activeTab === "acoes" && <BusinessActionsTab />}
        {activeTab === "calendario" && <CalendarioBusinessTab />}
      </div>
    </div>
  );
}
