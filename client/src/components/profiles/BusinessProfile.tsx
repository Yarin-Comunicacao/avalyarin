import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Store, BarChart3, ChevronDown, Plus, Bell,
  UtensilsCrossed, MapPin, Phone, Clock, Instagram,
  Pencil, Heart, Crown, Palette, Flag, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getConnectYarinUrl } from "@shared/const";
import ProfileEditarTab from "@/components/profile-tabs/EditarTab";
import PreferenciasTab from "@/components/profile-tabs/PreferenciasTab";
import PlanosTab from "@/components/profile-tabs/PlanosTab";
import TemaFundoTab from "@/components/profile-tabs/TemaFundoTab";
import SalvosTab from "@/components/profile-tabs/SalvosTab";

/** Clean hours string from JSON artifacts like {"" */
function cleanHours(hours: string | null | undefined): string {
  if (!hours) return "";
  return hours.replace(/[{}"\\]/g, "").replace(/,/g, ", ").trim();
}

type TabId = "cardapio" | "salvos" | "editar" | "preferencias" | "planos" | "tema";

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

  // Fetch menu for current establishment
  const { data: profileData } = trpc.business.profileData.useQuery(
    { establishmentId: estabId },
    { enabled: !!estabId, placeholderData: (prev: any) => prev }
  );

  const menu = profileData?.menu ?? [];

  // Group menu items by category
  const menuByCategory: Record<string, any[]> = {};
  menu.forEach((item: any) => {
    const cat = item.category || "Outros";
    if (!menuByCategory[cat]) menuByCategory[cat] = [];
    menuByCategory[cat].push(item);
  });

  return (
    <div className="pb-20">
      {/* Profile Header — Left aligned */}
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar / Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden border-2 border-orange-500/30">
              {currentEstab?.logo ? (
                <img src={currentEstab.logo} alt={currentEstab.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-8 h-8 text-white" />
              )}
            </div>
          </div>

          {/* Metrics row */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-around text-center">
              <div>
                <span className="text-lg font-bold text-foreground">{insights?.overview?.totalRatings ?? 0}</span>
                <p className="text-[11px] text-muted-foreground">avaliações</p>
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">0</span>
                <p className="text-[11px] text-muted-foreground">seguidores</p>
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">0</span>
                <p className="text-[11px] text-muted-foreground">seguindo</p>
              </div>
            </div>
          </div>

          {/* Notification bell */}
          <Link href="/notificacoes">
            <button className="p-2 rounded-full hover:bg-secondary/50 transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
        </div>

        {/* Name + dropdown */}
        <div className="mt-3 relative">
          <button
            onClick={() => establishments.length > 1 && setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 ${establishments.length > 1 ? "cursor-pointer" : ""}`}
          >
            <h2 className="font-semibold text-base text-foreground">
              {currentEstab?.name || "Meu Estabelecimento"}
            </h2>
            {establishments.length > 1 && (
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            )}
          </button>
          {establishments.length > 1 && (
            <p className="text-xs text-muted-foreground">{establishments.length} estabelecimentos</p>
          )}

          {/* Dropdown */}
          {dropdownOpen && establishments.length > 1 && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border/50 rounded-xl shadow-lg z-50 py-2">
              {establishments.map((estab: any, idx: number) => (
                <button
                  key={estab.id}
                  onClick={() => { setSelectedEstabIndex(idx); setDropdownOpen(false); }}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm hover:bg-primary/5 transition-colors flex items-center gap-3",
                    idx === selectedEstabIndex ? "text-primary font-medium" : "text-foreground"
                  )}
                >
                  <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center">
                    <Store className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm">{estab.name}</span>
                    {estab.neighborhood && <p className="text-xs text-muted-foreground">{estab.neighborhood}</p>}
                  </div>
                  {idx === selectedEstabIndex && <span className="text-orange-500 text-xs font-bold">✓</span>}
                </button>
              ))}
              <button className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-secondary/50 border-t border-border/50">
                <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Adicionar estabelecimento</span>
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        {currentEstab?.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {currentEstab.description}
          </p>
        )}

        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
          {currentEstab?.neighborhood && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {currentEstab.neighborhood}
            </span>
          )}
          {currentEstab?.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {currentEstab.phone}
            </span>
          )}
          {currentEstab?.hours && cleanHours(currentEstab.hours) && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {cleanHours(currentEstab.hours)}
            </span>
          )}
          {currentEstab?.instagram && (
            <span className="flex items-center gap-1">
              <Instagram className="w-3 h-3" />
              @{currentEstab.instagram.replace("@", "")}
            </span>
          )}
        </div>

        {/* Rating */}
        {insights?.overview?.avgScore != null && insights.overview.avgScore > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-sm font-bold text-primary">{insights.overview.avgScore.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">nota média</span>
          </div>
        )}
      </div>

            {/* Action icons row */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2">
          {([
            { id: "editar" as TabId, icon: Pencil, label: "Editar" },
            { id: "preferencias" as TabId, icon: Heart, label: "Prefer\u00eancias" },
            { id: "planos" as TabId, icon: Crown, label: "Planos" },
            { id: "tema" as TabId, icon: Palette, label: "Temas" },
          ]).map(action => (
            <button
              key={action.id}
              onClick={() => setActiveTab(activeTab === action.id ? "cardapio" : action.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors",
                activeTab === action.id
                  ? "bg-orange-500/10 border border-orange-500/40 text-orange-500"
                  : "bg-secondary border border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <action.icon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{action.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              navigator.share?.({
                title: currentEstab?.name || "Estabelecimento",
                url: window.location.href,
              }).catch(() => {});
            }}
            className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-[10px] font-medium">Enviar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-border/50 mt-3">
        <div className="flex">
          {([
            { id: "cardapio" as TabId, label: "Card\u00e1pio", icon: UtensilsCrossed },
            { id: "salvos" as TabId, label: "Salvos", icon: Flag },
          ]).map((tab) => {
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
        {activeTab === "cardapio" && (
          <MenuTab menu={menu} menuByCategory={menuByCategory} />
        )}
        {activeTab === "salvos" && (
          <SalvosTab />
        )}
        {activeTab === "editar" && (
          <ProfileEditarTab />
        )}
        {activeTab === "preferencias" && (
          <PreferenciasTab />
        )}
        {activeTab === "planos" && (
          <PlanosTab />
        )}
        {activeTab === "tema" && (
          <TemaFundoTab />
        )}
      </div>
    </div>
  );
}

/** Menu tab content */
function MenuTab({ menu, menuByCategory }: { menu: any[]; menuByCategory: Record<string, any[]> }) {
  if (menu.length === 0) {
    return (
      <div className="text-center py-12 bg-card/50 rounded-xl border border-border/30">
        <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum item no cardápio ainda</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Adicione itens pelo painel empresarial
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(menuByCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-orange-500 mb-3 uppercase tracking-wider">
            {category}
          </h3>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/30"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.price != null && (
                  <span className="text-sm font-medium text-orange-500 flex-shrink-0">
                    R$ {item.price.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


/** Editar Perfil tab (Business-specific, kept for reference) */
function BusinessEditarLocal() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">Edite as informações do seu estabelecimento</p>
      <Link href="/painel-empresarial/config">
        <button className="w-full py-3 px-4 rounded-lg bg-orange-500 text-white text-sm font-medium">
          Editar no Painel Empresarial
        </button>
      </Link>
      <Link href="/conta">
        <button className="w-full py-3 px-4 rounded-lg bg-secondary text-foreground text-sm font-medium border border-border/50">
          Configurações da Conta
        </button>
      </Link>
    </div>
  );
}
