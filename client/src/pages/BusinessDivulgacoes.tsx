/**
 * Business Divulgações — URL-based tabs for analytics tracking:
 * /business/divulgacoes → redirects to /business/divulgacoes/destaques
 * /business/divulgacoes/destaques → Destaques
 * /business/divulgacoes/codigos → Códigos Promocionais
 * /business/divulgacoes/parcerias → Parcerias
 * /business/divulgacoes/transmissao → Lista de Transmissão
 * /business/divulgacoes/eventos → Eventos do Estab.
 * /business/divulgacoes/grupos → Grupos
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { getLoginUrl } from "@/const";
import {
  Tag, Building2, Megaphone, CalendarDays, Sparkles, Users
} from "lucide-react";
import { ScrollableTabs } from "@/components/ScrollableTabs";
import { useLocation } from "wouter";

import {
  PromoCodesTab,
  PartnershipsTab,
  BroadcastTab,
  EventosEstabTab,
  DestaquesTab,
} from "./BusinessPanelTabs";
import { BusinessPromoRequests } from "@/components/BusinessPromoRequests";
import GruposPage from "./GruposPage";

type TabId = "destaques" | "codigos" | "parcerias" | "transmissao" | "eventos" | "grupos";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "destaques", label: "Destaques", labelFull: "Destaques", icon: Sparkles },
  { id: "codigos", label: "Códigos", labelFull: "Códigos Promocionais", icon: Tag },
  { id: "parcerias", label: "Parcerias", labelFull: "Parcerias", icon: Building2 },
  { id: "transmissao", label: "Transmissão", labelFull: "Lista de Transmissão", icon: Megaphone },
  { id: "eventos", label: "Eventos", labelFull: "Eventos do Estab.", icon: CalendarDays },
  { id: "grupos", label: "Grupos", labelFull: "Grupos", icon: Users },
];

export default function BusinessDivulgacoes() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();

  // Extract active tab from URL path
  const getActiveTab = (): TabId => {
    if (location.includes("/business/divulgacoes/codigos")) return "codigos";
    if (location.includes("/business/divulgacoes/parcerias")) return "parcerias";
    if (location.includes("/business/divulgacoes/transmissao")) return "transmissao";
    if (location.includes("/business/divulgacoes/eventos")) return "eventos";
    if (location.includes("/business/divulgacoes/grupos")) return "grupos";
    if (location.includes("/business/divulgacoes/destaques")) return "destaques";
    return "destaques"; // default
  };

  const activeTab = getActiveTab();

  // Redirect /business/divulgacoes to /business/divulgacoes/destaques
  useEffect(() => {
    if (location === "/business/divulgacoes") {
      navigate("/business/divulgacoes/destaques", { replace: true });
    }
  }, [location, navigate]);

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
          <Megaphone className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">DIVULGAÇÃO</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar as ferramentas de divulgação.
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
    navigate(`/business/divulgacoes/${tabId}`);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg tracking-wider text-primary">DIVULGAÇÃO</h1>
          </div>
          <span className="text-xs text-muted-foreground">{user?.name}</span>
        </div>
      </header>

      {/* Tabs — clicking navigates to URL */}
      <ScrollableTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Content */}
      <div className="container py-6">
        {activeTab === "destaques" && <DestaquesTab />}
        {activeTab === "codigos" && (
          <div className="space-y-8">
            <BusinessPromoRequests />
            <div className="border-t border-border/30 pt-6">
              <PromoCodesTab />
            </div>
          </div>
        )}
        {activeTab === "parcerias" && <PartnershipsTab />}
        {activeTab === "transmissao" && <BroadcastTab />}
        {activeTab === "eventos" && <EventosEstabTab />}
        {activeTab === "grupos" && <BusinessGruposEmbed />}
      </div>
    </div>
  );
}

/**
 * Embedded Grupos view for Business Divulgação tab.
 * Renders the GruposPage component inline (without its own navbar).
 */
function BusinessGruposEmbed() {
  return (
    <div className="-mx-4">
      <GruposPage embedded />
    </div>
  );
}
