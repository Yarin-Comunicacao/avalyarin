// ShareStoryCard — Generates a 9:16 visual card for Instagram Stories sharing
// Uses html2canvas to render a styled div as an image
import { useRef, useState } from "react";
import { X, Share2, Download, Star, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ShareStoryCardProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentName: string;
  categoryName?: string;
  neighborhood?: string;
  score: number;
  items: string[];
  mode: "direto" | "analitico";
  date?: string;
}

// Score label helper
function getScoreLabel(score: number): string {
  if (score >= 9.5) return "EXCEPCIONAL";
  if (score >= 8.5) return "EXCELENTE";
  if (score >= 7.5) return "MUITO BOM";
  if (score >= 6.5) return "BOM";
  if (score >= 5.0) return "REGULAR";
  return "ABAIXO DA MÉDIA";
}

function getScoreColor(score: number): string {
  if (score >= 8.5) return "#22c55e";
  if (score >= 7.0) return "#eab308";
  if (score >= 5.0) return "#f97316";
  return "#ef4444";
}

export default function ShareStoryCard({
  isOpen,
  onClose,
  establishmentName,
  categoryName,
  neighborhood,
  score,
  items,
  mode,
  date,
}: ShareStoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const displayDate = date
    ? new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current!, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        width: 360,
        height: 640,
      });

      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          toast.error("Erro ao gerar imagem");
          setIsGenerating(false);
          return;
        }

        const file = new File([blob], `avalyarin-${establishmentName.toLowerCase().replace(/\s+/g, "-")}.png`, {
          type: "image/png",
        });

        // Try native share (mobile)
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Minha avaliação - ${establishmentName}`,
              text: `Avaliei ${establishmentName} no AvaLyarin! Nota: ${score.toFixed(1)}`,
            });
            toast.success("Compartilhado!");
            onClose();
          } catch (e: any) {
            if (e.name !== "AbortError") {
              // Fallback: download
              downloadImage(canvas);
            }
          }
        } else {
          // Desktop fallback: download
          downloadImage(canvas);
        }
        setIsGenerating(false);
      }, "image/png");
    } catch (e) {
      console.error("Share error:", e);
      toast.error("Erro ao gerar imagem para compartilhamento");
      setIsGenerating(false);
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement("a");
    link.download = `avalyarin-${establishmentName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Imagem salva! Compartilhe nos seus Stories.");
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current!, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        width: 360,
        height: 640,
      });
      downloadImage(canvas);
      setIsGenerating(false);
    } catch (e) {
      console.error("Download error:", e);
      toast.error("Erro ao gerar imagem");
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Card Preview (9:16 ratio) */}
        <div
          ref={cardRef}
          className="relative overflow-hidden"
          style={{
            width: 360,
            height: 640,
            borderRadius: 24,
            background: "linear-gradient(160deg, #0a0a0a 0%, #1a1207 40%, #0a0a0a 100%)",
          }}
        >
          {/* Top pattern */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 200,
              background: "radial-gradient(ellipse at 50% 0%, rgba(217, 169, 78, 0.15) 0%, transparent 70%)",
            }}
          />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, padding: "40px 28px", height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🧄</span>
              <span style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 3, color: "#d9a94e", textTransform: "uppercase" as const }}>
                AVALYARIN
              </span>
            </div>

            {/* Date & Mode */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{displayDate}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>•</span>
              <span style={{ fontSize: 11, color: "rgba(217,169,78,0.6)", textTransform: "uppercase" as const, letterSpacing: 1 }}>
                {mode === "direto" ? "Avaliação Direta" : "Avaliação Analítica"}
              </span>
            </div>

            {/* Score circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: `3px solid ${scoreColor}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `radial-gradient(circle, ${scoreColor}15 0%, transparent 70%)`,
                }}
              >
                <span style={{ fontSize: 40, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                  {score.toFixed(1)}
                </span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>/10</span>
              </div>
              <span
                style={{
                  marginTop: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 3,
                  color: scoreColor,
                  textTransform: "uppercase" as const,
                }}
              >
                {scoreLabel}
              </span>
            </div>

            {/* Establishment name */}
            <div style={{ marginBottom: 16 }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#d9a94e",
                  letterSpacing: 2,
                  textTransform: "uppercase" as const,
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                {establishmentName}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                {categoryName && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 6 }}>
                    {categoryName}
                  </span>
                )}
                {neighborhood && (
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 3 }}>
                    📍 {neighborhood}
                  </span>
                )}
              </div>
            </div>

            {/* Items rated */}
            {items.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, letterSpacing: 2 }}>
                  Itens avaliados
                </span>
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                  {items.slice(0, 6).map((item, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        color: "rgba(217,169,78,0.8)",
                        background: "rgba(217,169,78,0.08)",
                        border: "1px solid rgba(217,169,78,0.15)",
                        padding: "4px 10px",
                        borderRadius: 8,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                  {items.length > 6 && (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", padding: "4px 6px" }}>
                      +{items.length - 6} mais
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Bottom CTA */}
            <div style={{ textAlign: "center" as const, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                Avalie seus bares e restaurantes favoritos
              </p>
              <p style={{ fontSize: 14, color: "#d9a94e", fontWeight: 600, letterSpacing: 1 }}>
                avaliabar.manus.space
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons below card */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {isGenerating ? "Gerando..." : "Compartilhar"}
          </button>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary/50 border border-border/30 text-foreground font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Salvar Imagem
          </button>
        </div>
      </div>
    </>
  );
}
