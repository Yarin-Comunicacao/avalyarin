import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import {
  Store, ClipboardCheck, UtensilsCrossed, Bell, QrCode as QrCodeIcon,
  Crown, Sparkles, Building2, MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

// Lazy import the tab components from BusinessPanel
// We'll import them directly since they're in the same codebase
import {
  MyEstablishmentsTab,
  MyClaimsTab,
  MenuManagementTab,
  NotificationsTab,
  QRCodeTab,
  BusinessPlanTab,
  DestaquesTab,
} from "./BusinessPanelTabs";

type TabId = "locais" | "solicitacoes" | "cardapio" | "notificacoes" | "qrcode" | "plano" | "destaques";

const TABS: { id: TabId; label: string; labelFull: string; icon: React.ElementType }[] = [
  { id: "locais", label: "Locais", labelFull: "Meus Locais", icon: Store },
  { id: "solicitacoes", label: "Solicitações", labelFull: "Solicitações", icon: ClipboardCheck },
  { id: "cardapio", label: "Cardápio", labelFull: "Cardápio", icon: UtensilsCrossed },
  { id: "notificacoes", label: "Alertas", labelFull: "Notificações", icon: Bell },
  { id: "qrcode", label: "QR Code", labelFull: "QR Code", icon: QrCodeIcon },
  { id: "plano", label: "Plano", labelFull: "Meu Plano", icon: Crown },
  { id: "destaques", label: "Destaques", labelFull: "Destaques", icon: Sparkles },
];

export default function BusinessLocais() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("locais");
  const { data: notifications } = trpc.business.notifications.useQuery(undefined, {
    enabled: isAuthenticated,
  });

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
          <Building2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">MEUS LOCAIS</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para gerenciar seus estabelecimentos.
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
            <Store className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg tracking-wider text-primary">MEUS LOCAIS</h1>
          </div>
          <span className="text-xs text-muted-foreground">{user?.name}</span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border/30">
        <div className="container overflow-x-auto scrollbar-hide">
          <div className="flex gap-0 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.labelFull}</span>
                  {tab.id === "notificacoes" && notifications && notifications.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {activeTab === "locais" && <MyEstablishmentsTab />}
        {activeTab === "solicitacoes" && <MyClaimsTab />}
        {activeTab === "cardapio" && <MenuManagementTab />}
        {activeTab === "notificacoes" && <NotificationsTab />}
        {activeTab === "qrcode" && <QRCodeTab />}
        {activeTab === "plano" && <BusinessPlanTab />}
        {activeTab === "destaques" && <DestaquesTab />}
      </div>
    </div>
  );
}
