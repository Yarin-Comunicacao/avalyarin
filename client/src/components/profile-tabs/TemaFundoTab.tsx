import { Palette, Image as ImageIcon, Check } from "lucide-react";
import { useTheme, THEME_OPTIONS, ThemeName } from "@/contexts/ThemeContext";
import { useBackground, BACKGROUND_OPTIONS } from "@/contexts/BackgroundContext";
import { toast } from "sonner";

export default function TemaFundoTab() {
  const { theme, setTheme } = useTheme();
  const { background, setBackground } = useBackground();

  const handleThemeChange = (t: ThemeName) => {
    try {
      setTheme(t);
      const label = THEME_OPTIONS.find(opt => opt.id === t)?.label || t;
      toast.success(`Tema "${label}" aplicado!`);
    } catch {
      toast.error("Erro ao aplicar tema");
    }
  };

  const handleBackgroundChange = (bgId: string) => {
    try {
      setBackground(bgId);
      const label = BACKGROUND_OPTIONS.find(opt => opt.id === bgId)?.label || bgId;
      toast.success(`Fundo "${label}" aplicado!`);
    } catch {
      toast.error("Erro ao aplicar plano de fundo");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tema Visual */}
      <div>
        <h3 className="font-display text-sm tracking-wider text-foreground mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> TEMA VISUAL
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {THEME_OPTIONS.map(t => (
            <button
              key={t.id}
              onClick={() => handleThemeChange(t.id)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm transition-all ${
                theme === t.id
                  ? "bg-primary/10 border-2 border-primary text-primary"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <div className="w-5 h-5 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: t.preview }} />
              <div className="text-left">
                <span className="block text-xs font-medium">{t.label}</span>
                <span className="block text-[10px] text-muted-foreground">{t.description}</span>
              </div>
              {theme === t.id && <Check className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Imagem de Fundo */}
      <div>
        <h3 className="font-display text-sm tracking-wider text-foreground mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" /> PLANO DE FUNDO
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_OPTIONS.map(bg => (
            <button
              key={bg.id}
              onClick={() => handleBackgroundChange(bg.id)}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                background === bg.id ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-primary/30"
              }`}
            >
              <img src={bg.thumbnail} alt={bg.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/30 flex items-end p-1.5">
                <span className="text-[9px] text-white font-medium">{bg.label}</span>
              </div>
              {background === bg.id && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
