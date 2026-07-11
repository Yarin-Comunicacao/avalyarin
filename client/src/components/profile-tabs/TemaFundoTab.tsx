import { useState, useRef } from "react";
import { Palette, Image as ImageIcon, Check, Upload, Trash2, Loader2 } from "lucide-react";
import { useTheme, THEME_OPTIONS, ThemeName } from "@/contexts/ThemeContext";
import { useBackground, BACKGROUND_OPTIONS } from "@/contexts/BackgroundContext";
import { toast } from "sonner";

export default function TemaFundoTab() {
  const { theme, setTheme } = useTheme();
  const { background, setBackground, customBackgroundUrl, setCustomBackground } = useBackground();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const response = await fetch("/api/upload/document", {
        method: "POST",
        headers: { "Content-Type": file.type, "X-File-Name": `bg_${Date.now()}.${file.type.split("/")[1]}` },
        body: buffer,
      });
      if (!response.ok) throw new Error("Upload failed");
      const { url } = await response.json();
      setCustomBackground(url);
      toast.success("Fundo personalizado aplicado!");
    } catch {
      toast.error("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveCustom = () => {
    setCustomBackground(null);
    toast.success("Fundo personalizado removido");
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

        {/* Opções Diurno/Noturno */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {BACKGROUND_OPTIONS.map(bg => (
            <button
              key={bg.id}
              onClick={() => handleBackgroundChange(bg.id)}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                background === bg.id ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-primary/30"
              }`}
            >
              <img src={bg.thumbnail} alt={bg.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                <span className="text-xs text-white font-medium">{bg.label}</span>
              </div>
              {background === bg.id && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Upload Personalizado */}
        <div className="border-t border-border/30 pt-4">
          <p className="text-xs text-muted-foreground mb-3">Ou envie sua própria imagem de fundo:</p>

          {customBackgroundUrl ? (
            <div className="space-y-3">
              <div className={`relative aspect-video rounded-xl overflow-hidden border-2 ${
                background === "custom" ? "border-primary ring-2 ring-primary/30" : "border-border/50"
              }`}>
                <img src={customBackgroundUrl} alt="Fundo personalizado" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-end p-2">
                  <span className="text-xs text-white font-medium">Personalizado</span>
                </div>
                {background === "custom" && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setBackground("custom"); toast.success("Fundo personalizado ativado!"); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    background === "custom"
                      ? "bg-primary/20 border border-primary/40 text-primary"
                      : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Usar este fundo
                </button>
                <button
                  onClick={handleRemoveCustom}
                  className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 cursor-pointer transition-colors">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {uploading ? "Enviando..." : "Toque para enviar imagem"}
              </span>
              <span className="text-[10px] text-muted-foreground/60">JPG, PNG ou WebP • Máx. 5MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCustomUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
