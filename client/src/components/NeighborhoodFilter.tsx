import { useState } from "react";
import { MapPin, ChevronDown } from "lucide-react";

// Bairros organizados por zona de São Paulo
const ZONES: Record<string, string[]> = {
  "Zona Oeste": [
    "Pinheiros",
    "Vila Madalena",
    "Vila Madalena/Sumarezinho",
    "Alto de Pinheiros",
    "Perdizes",
    "Lapa",
    "Barra Funda",
  ],
  "Zona Central": [
    "Consolação",
    "República",
    "Bela Vista",
    "Liberdade",
    "Santa Cecília",
    "Bom Retiro",
    "Sé",
    "Cambuci",
  ],
  "Zona Sul": [
    "Jardim Paulista",
    "Itaim Bibi",
    "Moema",
    "Vila Mariana",
    "Campo Belo",
    "Ipiranga",
    "Saúde",
    "Cursino",
    "Morumbi",
  ],
  "Zona Norte": [
    "Santana",
  ],
  "Jardins": [
    "Jardins",
  ],
};

interface NeighborhoodFilterProps {
  selectedNeighborhood: string | null;
  onSelect: (neighborhood: string | null) => void;
  availableNeighborhoods?: string[];
}

export default function NeighborhoodFilter({
  selectedNeighborhood,
  onSelect,
  availableNeighborhoods,
}: NeighborhoodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  // Filter zones to only show those with available neighborhoods
  const filteredZones = Object.entries(ZONES).reduce((acc, [zone, neighborhoods]) => {
    const available = availableNeighborhoods
      ? neighborhoods.filter(n => availableNeighborhoods.includes(n))
      : neighborhoods;
    if (available.length > 0) {
      acc[zone] = available;
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
          selectedNeighborhood
            ? "bg-primary/10 border-primary/40 text-primary"
            : "bg-card border-border/50 text-foreground hover:border-primary/30"
        }`}
      >
        <MapPin className="w-4 h-4" />
        <span>{selectedNeighborhood || "Filtrar por Bairro"}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setExpandedZone(null);
            }}
          />
          
          {/* Panel */}
          <div className="absolute top-full left-0 mt-2 z-50 w-72 max-h-[70vh] overflow-y-auto rounded-xl bg-card border border-border/50 shadow-xl p-3 space-y-1">
            {/* Clear filter */}
            {selectedNeighborhood && (
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                  setExpandedZone(null);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                Limpar filtro
              </button>
            )}

            {/* Zones */}
            {Object.entries(filteredZones).map(([zone, neighborhoods]) => (
              <div key={zone} className="space-y-0.5">
                {/* Zone header */}
                <button
                  onClick={() => setExpandedZone(expandedZone === zone ? null : zone)}
                  onMouseEnter={() => setExpandedZone(zone)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-foreground hover:bg-primary/5 transition-colors"
                >
                  <span>{zone}</span>
                  <span className="text-xs text-muted-foreground">{neighborhoods.length}</span>
                </button>

                {/* Expanded neighborhoods */}
                {expandedZone === zone && (
                  <div className="pl-3 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                    {neighborhoods.map((neighborhood) => (
                      <button
                        key={neighborhood}
                        onClick={() => {
                          onSelect(neighborhood);
                          setIsOpen(false);
                          setExpandedZone(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedNeighborhood === neighborhood
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                        }`}
                      >
                        {neighborhood}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
