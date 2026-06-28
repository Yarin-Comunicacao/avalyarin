import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import {
  Tag, Building2, Megaphone, CalendarDays
} from "lucide-react";
import { ScrollableTabs } from "@/components/ScrollableTabs";

import {
  PromoCodesTab,
  PartnershipsTab,
  BroadcastTab,
  EventosEstabTab,
} from "./BusinessPanelTabs";

type TabId = "codigos" | "parcerias" | "transmissao" | "eventos";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "codigos", label: "Códigos", labelFull: "Códigos Promocionais", icon: Tag },
  { id: "parcerias", label: "Parcerias", labelFull: "Parcerias", icon: Building2 },
  { id: "transmissao", label: "Transmissão", labelFull: "Lista de Transmissão", icon: Megaphone },
  { id: "eventos", label: "Eventos", labelFull: "Eventos do Estab.", icon: CalendarDays },
];

export default function BusinessDivulgacoes() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("codigos");

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

      {/* Tabs */}
      <ScrollableTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Content */}
      <div className="container py-6">
        {activeTab === "codigos" && <PromoCodesTab />}
        {activeTab === "parcerias" && <PartnershipsTab />}
        {activeTab === "transmissao" && <BroadcastTab />}
        {activeTab === "eventos" && <EventosEstabTab />}
      </div>
    </div>
  );
}
