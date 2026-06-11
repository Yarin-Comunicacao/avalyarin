import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Store, BarChart3, QrCode, FileText, Megaphone, ChevronDown, Plus, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type TabId = "cardapio" | "posts" | "avaliacoes" | "insights" | "promos";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "cardapio", label: "Cardápio", icon: Utensils },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "avaliacoes", label: "Avaliações", icon: () => <span className="text-sm">⭐</span> },
  { id: "insights", label: "Insights", icon: BarChart3 },
  { id: "promos", label: "Promos", icon: Megaphone },
];

export default function BusinessProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("cardapio");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedEstabIndex, setSelectedEstabIndex] = useState(0);

  const { data: myEstabs } = trpc.business.myEstablishments.useQuery(undefined, { enabled: !!user });

  const establishments = myEstabs ?? [];
  const currentEstab = establishments[selectedEstabIndex] as any;
  const estabId = currentEstab?.id;

  const { data: insights } = trpc.analytics.businessInsights.useQuery(
    { establishmentId: estabId ?? 0 },
    { enabled: !!estabId }
  );



  return (
    <div className="pb-20">
      {/* Establishment Selector Dropdown */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 w-full"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <span className="font-semibold text-foreground text-base">
                {currentEstab?.name || "Meu Estabelecimento"}
              </span>
              {establishments.length > 1 && (
                <p className="text-xs text-muted-foreground">{establishments.length} estabelecimentos</p>
              )}
            </div>
            {establishments.length > 1 && (
              <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")} />
            )}
          </button>

          {/* Dropdown */}
          {dropdownOpen && establishments.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {establishments.map((estab: any, idx: number) => (
                <button
                  key={estab.id}
                  onClick={() => { setSelectedEstabIndex(idx); setDropdownOpen(false); }}
                  className={cn(
                    "w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-secondary/50 transition-colors",
                    idx === selectedEstabIndex && "bg-orange-500/10"
                  )}
                >
                  <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center">
                    <Store className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{estab.name}</span>
                    <p className="text-xs text-muted-foreground">{estab.neighborhood}</p>
                  </div>
                  {idx === selectedEstabIndex && (
                    <span className="text-orange-500 text-xs font-bold">✓</span>
                  )}
                </button>
              ))}
              <button className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-secondary/50 border-t border-border/50">
                <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Adicionar estabelecimento</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 text-center">
            <span className="text-lg font-bold text-foreground">{insights?.overview?.avgScore?.toFixed(1) ?? "—"}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">nota média</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 text-center">
            <span className="text-lg font-bold text-foreground">{insights?.overview?.totalRatings ?? 0}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">avaliações</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 text-center">
            <span className="text-lg font-bold text-foreground">{insights?.overview?.promoUses ?? 0}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">visitantes</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <button className="flex-1 py-2 px-3 rounded-lg bg-orange-500 text-white text-sm font-medium flex items-center justify-center gap-1.5">
            <Utensils className="w-4 h-4" />
            Cardápio
          </button>
          <button className="flex-1 py-2 px-3 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50 flex items-center justify-center gap-1.5">
            <FileText className="w-4 h-4" />
            Novo Post
          </button>
          <button className="py-2 px-3 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50 flex items-center justify-center">
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-border/50">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors",
                  isActive ? "border-orange-500 text-orange-500" : "border-transparent text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4">
        <PlaceholderTab text={`Conteúdo de ${TABS.find(t => t.id === activeTab)?.label}`} />
      </div>
    </div>
  );
}

function PlaceholderTab({ text }: { text: string }) {
  return (
    <div className="text-center text-muted-foreground py-8">
      <Store className="w-12 h-12 mx-auto mb-2 text-orange-500/30" />
      <p>{text}</p>
    </div>
  );
}
