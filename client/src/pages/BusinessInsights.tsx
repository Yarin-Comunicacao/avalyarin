/**
 * Business Insights — URL-based tabs for analytics tracking:
 * /business/insights → redirects to /business/insights/plano
 * /business/insights/plano → Meu Plano (assinatura e upgrade)
 * /business/insights/dashboard → Dashboard (gráficos + linha temporal)
 * /business/insights/desempenho → Desempenho (20 insights por tema)
 * /business/insights/plano-acao → Plano de Ação (sugestões IA)
 *
 * Dropdown de estabelecimento fica ACIMA das abas — navegação entre abas mantém o estab selecionado.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
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
import { useLocation, useRoute, Link } from "wouter";

import BusinessDashboardTab from "./BusinessDashboardTab";
import BusinessDesempenhoTab from "./BusinessDesempenhoTab";
import BusinessPlanoAcaoTab from "./BusinessPlanoAcaoTab";
import { BusinessPlanTab } from "./BusinessPanel";

type TabId = "plano" | "dashboard" | "desempenho" | "plano-acao";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "plano", label: "Meu Plano", labelFull: "Meu Plano", icon: Crown },
  { id: "dashboard", label: "Dashboard", labelFull: "Dashboard", icon: LayoutDashboard },
  { id: "desempenho", label: "Desempenho", labelFull: "Desempenho", icon: TrendingUp },
  { id: "plano-acao", label: "Plano de Ação", labelFull: "Plano de Ação", icon: Lightbulb },
];

export default function BusinessInsights() {
  const { user, loading, isAuthenticated } = useAuth();
  const [selectedEstabId, setSelectedEstabId] = useState<number | null>(null);
  const [location, navigate] = useLocation();

  // Extract active tab from URL path
  const getActiveTab = (): TabId => {
    if (location.includes("/business/insights/dashboard")) return "dashboard";
    if (location.includes("/business/insights/desempenho")) return "desempenho";
    if (location.includes("/business/insights/plano-acao")) return "plano-acao";
    if (location.includes("/business/insights/plano")) return "plano";
    return "plano"; // default
  };

  const activeTab = getActiveTab();

  // Redirect /business/insights to /business/insights/plano
  useEffect(() => {
    if (location === "/business/insights") {
      navigate("/business/insights/plano", { replace: true });
    }
  }, [location, navigate]);

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

  const handleTabChange = (tabId: string) => {
    navigate(`/business/insights/${tabId}`);
  };

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

      {/* Tabs — clicking navigates to URL */}
      <ScrollableTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Content */}
      <div className="container py-6">
        {activeTab === "plano" && (
          <div className="space-y-6">
            <BusinessPlanTab establishmentId={estabId} />
            <Link href="/business/plano">
              <div className="p-5 rounded-xl bg-card border border-primary/30 hover:border-primary/60 transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Crown className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm tracking-wider text-foreground">VER TODOS OS PLANOS</h4>
                      <p className="text-xs text-muted-foreground">Compare planos empresariais e faça upgrade</p>
                    </div>
                  </div>
                  <span className="text-primary text-sm">→</span>
                </div>
              </div>
            </Link>
          </div>
        )}
        {activeTab === "dashboard" && <BusinessDashboardTab establishmentId={estabId} />}
        {activeTab === "desempenho" && <BusinessDesempenhoTab establishmentId={estabId} />}
        {activeTab === "plano-acao" && <BusinessPlanoAcaoTab establishmentId={estabId} />}
      </div>
    </div>
  );
}
