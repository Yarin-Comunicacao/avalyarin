import { useTheme, THEME_OPTIONS, ThemeName } from "@/contexts/ThemeContext";
import { Palette, X, Check } from "lucide-react";

export default function ThemeSidebar() {
  const { theme, setTheme, sidebarOpen, setSidebarOpen } = useTheme();

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 bottom-4 z-40 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        aria-label="Alterar tema"
      >
        <Palette className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border shadow-2xl transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl tracking-wider text-foreground">TEMAS</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-72px)]">
          <p className="text-sm text-muted-foreground mb-4">
            Escolha o tema visual de sua preferência.
          </p>

          {THEME_OPTIONS.map((opt) => (
            <ThemeCard
              key={opt.id}
              id={opt.id}
              label={opt.label}
              description={opt.description}
              preview={opt.preview}
              isActive={theme === opt.id}
              onSelect={() => {
                setTheme(opt.id);
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function ThemeCard({
  id,
  label,
  description,
  preview,
  isActive,
  onSelect,
}: {
  id: ThemeName;
  label: string;
  description: string;
  preview: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  // Mini preview colors for each theme
  const previewColors: Record<ThemeName, { bg: string; card: string; accent: string; text: string }> = {
    escuro: { bg: "#0f0f0f", card: "#1a1a1a", accent: "#D4A843", text: "#e8e0d0" },
    claro: { bg: "#ffffff", card: "#f5f5f5", accent: "#2563eb", text: "#1a1a1a" },
    "azul-gelo": { bg: "#DEE6F3", card: "#c8d5e8", accent: "#4A6FA5", text: "#1e2a3a" },
    "azul-cinza": { bg: "#2a3448", card: "#354158", accent: "#9CB2D7", text: "#dee6f3" },
    rosa: { bg: "#FDF2F6", card: "#F5D6E0", accent: "#C4748A", text: "#3d1f2b" },
  };

  const colors = previewColors[id];

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${
        isActive
          ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
          : "border-border hover:border-primary/40 hover:scale-[1.01]"
      }`}
    >
      {/* Mini preview */}
      <div className="h-16 relative" style={{ backgroundColor: colors.bg }}>
        {/* Mini card */}
        <div
          className="absolute top-2 left-3 w-16 h-8 rounded"
          style={{ backgroundColor: colors.card }}
        />
        <div
          className="absolute top-2 right-3 w-10 h-8 rounded"
          style={{ backgroundColor: colors.card }}
        />
        {/* Mini accent bar */}
        <div
          className="absolute bottom-2 left-3 w-20 h-1.5 rounded-full"
          style={{ backgroundColor: colors.accent }}
        />
        {/* Mini text lines */}
        <div
          className="absolute top-4 left-5 w-10 h-1 rounded-full opacity-60"
          style={{ backgroundColor: colors.text }}
        />
        <div
          className="absolute top-6.5 left-5 w-6 h-1 rounded-full opacity-40"
          style={{ backgroundColor: colors.text }}
        />
      </div>

      {/* Label */}
      <div className="p-3 bg-card flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-foreground block">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
        {isActive && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}
