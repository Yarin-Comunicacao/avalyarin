import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Loader2, ChevronDown, Store, MapPin, Phone, Clock, Instagram, UtensilsCrossed, Users, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/** Clean hours string from JSON artifacts like {"" */
function cleanHours(hours: string | null | undefined): string {
  if (!hours) return "";
  return hours.replace(/[{}"\\]/g, "").replace(/,/g, ", ").trim();
}

type TabId = "cardapio" | "grupos" | "editar";

export default function BusinessProfilePage() {
  const [selectedEstabId, setSelectedEstabId] = useState<number | undefined>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("cardapio");

  const { data, isLoading } = trpc.business.profileData.useQuery(
    { establishmentId: selectedEstabId },
    { placeholderData: (prev) => prev }
  );

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!data || data.establishments.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 text-center pb-24">
          <Store className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="font-display text-2xl tracking-wider text-foreground mb-2">NENHUM ESTABELECIMENTO</h1>
          <p className="text-sm text-muted-foreground">
            Você ainda não possui estabelecimentos vinculados.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const selectedEstab = data.establishments.find(e => e.id === data.selectedEstablishmentId) || data.establishments[0];
  const hasMultiple = data.establishments.length > 1;

  // Group menu items by category
  const menuByCategory: Record<string, typeof data.menu> = {};
  data.menu.forEach((item: any) => {
    const cat = item.category || "Outros";
    if (!menuByCategory[cat]) menuByCategory[cat] = [];
    menuByCategory[cat].push(item);
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <div className="container pt-20">
        {/* Profile Header — Left aligned like user profile */}
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-start gap-4">
            {/* Logo / Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden border-2 border-orange-500/30">
                {selectedEstab.logo ? (
                  <img src={selectedEstab.logo} alt={selectedEstab.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-white" />
                )}
              </div>
            </div>

            {/* Metrics row */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-around text-center">
                <div>
                  <span className="text-lg font-bold text-foreground">{selectedEstab.reviewCount ?? 0}</span>
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
              onClick={() => hasMultiple && setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2 ${hasMultiple ? "cursor-pointer" : ""}`}
            >
              <h2 className="font-semibold text-base text-foreground">
                {selectedEstab.name}
              </h2>
              {hasMultiple && (
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && hasMultiple && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border/50 rounded-xl shadow-lg z-50 py-2">
                {data.establishments.map((estab: any) => (
                  <button
                    key={estab.id}
                    onClick={() => {
                      setSelectedEstabId(estab.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-primary/5 transition-colors ${
                      estab.id === selectedEstab.id ? "text-primary font-medium" : "text-foreground"
                    }`}
                  >
                    {estab.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {selectedEstab.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {selectedEstab.description}
            </p>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {selectedEstab.neighborhood && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {selectedEstab.neighborhood}
              </span>
            )}
            {selectedEstab.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {selectedEstab.phone}
              </span>
            )}
            {selectedEstab.hours && cleanHours(selectedEstab.hours) && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {cleanHours(selectedEstab.hours)}
              </span>
            )}
            {selectedEstab.instagram && (
              <span className="flex items-center gap-1">
                <Instagram className="w-3 h-3" />
                @{selectedEstab.instagram.replace("@", "")}
              </span>
            )}
          </div>

          {/* Rating */}
          {selectedEstab.rating != null && selectedEstab.rating > 0 && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-sm font-bold text-primary">{selectedEstab.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">nota média</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-t border-border/50 mt-2">
          <div className="flex">
            {([
              { id: "cardapio" as TabId, label: "Cardápio", icon: UtensilsCrossed },
              { id: "grupos" as TabId, label: "Grupos", icon: Users },
              { id: "editar" as TabId, label: "Editar Perfil", icon: Settings },
            ]).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors",
                    isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground"
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
            <MenuTab menu={data.menu} menuByCategory={menuByCategory} />
          )}
          {activeTab === "grupos" && (
            <GruposTab />
          )}
          {activeTab === "editar" && (
            <EditarTab estab={selectedEstab} />
          )}
        </div>
      </div>

      <BottomNav />
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
          <h3 className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
            {category}
          </h3>
          <div className="space-y-3">
            {(items as any[]).map((item: any) => (
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
                  <span className="text-sm font-medium text-primary flex-shrink-0">
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

/** Grupos tab — shows groups related to this business */
function GruposTab() {
  return (
    <div className="text-center py-12">
      <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">Seus grupos aparecerão aqui</p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Gerencie grupos e solicitações de participação
      </p>
      <Link href="/grupos">
        <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          Ver Grupos
        </button>
      </Link>
    </div>
  );
}

/** Editar Perfil tab — redirects to account/settings */
function EditarTab({ estab }: { estab: any }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">Edite as informações do seu estabelecimento</p>
      <Link href="/painel-empresarial/config">
        <button className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
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
