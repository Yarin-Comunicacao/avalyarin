import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Loader2, ChevronDown, Store, MapPin, Phone, Clock, Instagram, UtensilsCrossed } from "lucide-react";

export default function BusinessProfilePage() {
  const [selectedEstabId, setSelectedEstabId] = useState<number | undefined>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* Logo / Avatar */}
          <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center mb-4 overflow-hidden">
            {selectedEstab.logo ? (
              <img src={selectedEstab.logo} alt={selectedEstab.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-10 h-10 text-primary" />
            )}
          </div>

          {/* Establishment Name with Dropdown */}
          <div className="relative">
            <button
              onClick={() => hasMultiple && setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-2 font-display text-2xl tracking-wider text-foreground ${hasMultiple ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
            >
              {selectedEstab.name}
              {hasMultiple && (
                <ChevronDown className={`w-5 h-5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && hasMultiple && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-card border border-border/50 rounded-xl shadow-lg z-50 py-2">
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
            <p className="text-sm text-muted-foreground mt-3 max-w-md leading-relaxed">
              {selectedEstab.description}
            </p>
          )}

          {/* Info Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            {selectedEstab.neighborhood && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {selectedEstab.neighborhood}
              </span>
            )}
            {selectedEstab.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {selectedEstab.phone}
              </span>
            )}
            {selectedEstab.hours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {selectedEstab.hours}
              </span>
            )}
            {selectedEstab.instagram && (
              <span className="flex items-center gap-1">
                <Instagram className="w-3.5 h-3.5" />
                @{selectedEstab.instagram.replace("@", "")}
              </span>
            )}
          </div>

          {/* Rating */}
          {selectedEstab.rating && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{selectedEstab.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({selectedEstab.reviewCount || 0} avaliações)
              </span>
            </div>
          )}
        </div>

        {/* Menu Section */}
        <div className="border-t border-border/30 pt-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-lg tracking-wider text-foreground">CARDÁPIO</h2>
          </div>

          {data.menu.length === 0 ? (
            <div className="text-center py-12 bg-card/50 rounded-xl border border-border/30">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum item no cardápio ainda</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Adicione itens pelo painel empresarial
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
