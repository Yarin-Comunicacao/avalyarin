import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as LucideIcons from "lucide-react";

// Popular emojis for surveys/categories
const POPULAR_EMOJIS = [
  { name: "Cerveja", emoji: "🍺" },
  { name: "Vinho", emoji: "🍷" },
  { name: "Coquetel", emoji: "🍸" },
  { name: "Café", emoji: "☕" },
  { name: "Pizza", emoji: "🍕" },
  { name: "Hambúrguer", emoji: "🍔" },
  { name: "Bolo", emoji: "🎂" },
  { name: "Sorvete", emoji: "🍦" },
  { name: "Sushi", emoji: "🍣" },
  { name: "Churrasco", emoji: "🥩" },
  { name: "Salada", emoji: "🥗" },
  { name: "Pão", emoji: "🍞" },
  { name: "Croissant", emoji: "🥐" },
  { name: "Taco", emoji: "🌮" },
  { name: "Maçã", emoji: "🍎" },
  { name: "Uva", emoji: "🍇" },
  { name: "Estrela", emoji: "⭐" },
  { name: "Coração", emoji: "❤️" },
  { name: "Fogo", emoji: "🔥" },
  { name: "Troféu", emoji: "🏆" },
  { name: "Medalha", emoji: "🥇" },
  { name: "Coroa", emoji: "👑" },
  { name: "Música", emoji: "🎵" },
  { name: "Festa", emoji: "🎉" },
  { name: "Dinheiro", emoji: "💰" },
  { name: "Relógio", emoji: "⏰" },
  { name: "Localização", emoji: "📍" },
  { name: "Casa", emoji: "🏠" },
  { name: "Loja", emoji: "🏪" },
  { name: "Restaurante", emoji: "🍽️" },
  { name: "Garfo e Faca", emoji: "🍴" },
  { name: "Champagne", emoji: "🥂" },
  { name: "Whiskey", emoji: "🥃" },
  { name: "Folha", emoji: "🌿" },
  { name: "Globo", emoji: "🌍" },
  { name: "Sol", emoji: "☀️" },
  { name: "Lua", emoji: "🌙" },
  { name: "Raio", emoji: "⚡" },
  { name: "Diamante", emoji: "💎" },
  { name: "Alho", emoji: "🧄" },
];

// Get all Lucide icon names (filter out non-icon exports and *Icon duplicates)
const LUCIDE_ICON_NAMES: string[] = Object.keys(LucideIcons).filter(
  (key) => {
    const val = (LucideIcons as any)[key];
    return (
      key[0] === key[0].toUpperCase() &&
      !key.endsWith("Icon") && // Exclude duplicates like "AArrowDownIcon"
      key !== "default" &&
      key !== "createLucideIcon" &&
      key !== "icons" &&
      typeof val === "object" &&
      val !== null &&
      "displayName" in val
    );
  }
).sort();

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"lucide" | "emoji">("lucide");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Filter Lucide icons
  const filteredLucide = useMemo(() => {
    if (!search) return LUCIDE_ICON_NAMES.slice(0, 80); // Show first 80 by default
    const lower = search.toLowerCase();
    return LUCIDE_ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(lower)
    ).slice(0, 80);
  }, [search]);

  // Filter emojis
  const filteredEmojis = useMemo(() => {
    if (!search) return POPULAR_EMOJIS;
    const lower = search.toLowerCase();
    return POPULAR_EMOJIS.filter((e) =>
      e.name.toLowerCase().includes(lower) || e.emoji.includes(search)
    );
  }, [search]);

  // Render a Lucide icon by name
  const renderLucideIcon = (name: string, size = 18) => {
    const Icon = (LucideIcons as any)[name];
    if (!Icon || typeof Icon !== "object" || !("render" in Icon)) return null;
    const IconComponent = Icon as React.FC<{ size?: number; className?: string }>;
    return <IconComponent size={size} />;
  };

  // Get display for current value
  const renderCurrentValue = () => {
    if (!value) return <span className="text-muted-foreground text-sm">Selecionar ícone...</span>;
    // Check if it's an emoji
    const emojiMatch = POPULAR_EMOJIS.find((e) => e.emoji === value);
    if (emojiMatch) return <span className="text-lg">{emojiMatch.emoji}</span>;
    // Try as Lucide icon
    const icon = renderLucideIcon(value, 16);
    if (icon) return <span className="flex items-center gap-2">{icon}<span className="text-xs text-muted-foreground">{value}</span></span>;
    // Fallback: show raw value
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-xs text-muted-foreground mb-1 block">Ícone</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground hover:border-border transition-colors"
      >
        {renderCurrentValue()}
        {value && (
          <X
            className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
          />
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-full min-w-[280px] bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border/50">
            <button
              type="button"
              onClick={() => setTab("lucide")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "lucide" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lucide Icons
            </button>
            <button
              type="button"
              onClick={() => setTab("emoji")}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                tab === "emoji" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Emojis
            </button>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder={tab === "lucide" ? "Buscar ícone..." : "Buscar emoji..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
                autoFocus
              />
            </div>
          </div>

          {/* Grid */}
          <div className="max-h-[240px] overflow-y-auto p-2">
            {tab === "lucide" && (
              <div className="grid grid-cols-6 gap-1">
                {filteredLucide.map((name) => {
                  const isSelected = value === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => { onChange(name); setOpen(false); setSearch(""); }}
                      className={`w-full aspect-square flex items-center justify-center rounded-lg transition-colors ${
                        isSelected
                          ? "bg-primary/20 border border-primary/40"
                          : "hover:bg-secondary/80 border border-transparent"
                      }`}
                    >
                      {renderLucideIcon(name, 16)}
                    </button>
                  );
                })}
                {filteredLucide.length === 0 && (
                  <p className="col-span-6 text-xs text-muted-foreground text-center py-4">
                    Nenhum ícone encontrado
                  </p>
                )}
              </div>
            )}

            {tab === "emoji" && (
              <div className="grid grid-cols-6 gap-1">
                {filteredEmojis.map((item) => {
                  const isSelected = value === item.emoji;
                  return (
                    <button
                      key={item.emoji}
                      type="button"
                      title={item.name}
                      onClick={() => { onChange(item.emoji); setOpen(false); setSearch(""); }}
                      className={`w-full aspect-square flex items-center justify-center rounded-lg text-lg transition-colors ${
                        isSelected
                          ? "bg-primary/20 border border-primary/40"
                          : "hover:bg-secondary/80 border border-transparent"
                      }`}
                    >
                      {item.emoji}
                    </button>
                  );
                })}
                {filteredEmojis.length === 0 && (
                  <p className="col-span-6 text-xs text-muted-foreground text-center py-4">
                    Nenhum emoji encontrado
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
