// ShareStoryCard — Generates a 9:16 visual card for Instagram Stories sharing
// Uses native Canvas API for reliable image generation (no html2canvas dependency)
import { useState } from "react";
import { X, Share2, Download } from "lucide-react";
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

function generateCardCanvas(props: {
  establishmentName: string;
  categoryName?: string;
  neighborhood?: string;
  score: number;
  items: string[];
  mode: string;
  date: string;
}): HTMLCanvasElement {
  const { establishmentName, categoryName, neighborhood, score, items, mode, date } = props;
  const W = 720;
  const H = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.6, H);
  bgGrad.addColorStop(0, "#0a0a0a");
  bgGrad.addColorStop(0.4, "#1a1207");
  bgGrad.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Top radial glow
  const topGlow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 400);
  topGlow.addColorStop(0, "rgba(217, 169, 78, 0.12)");
  topGlow.addColorStop(1, "transparent");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 400);

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  // Logo
  ctx.font = "24px monospace";
  ctx.fillStyle = "#d9a94e";
  ctx.textAlign = "left";
  ctx.fillText("🧄 AVALYARIN", 56, 80);

  // Date & mode
  ctx.font = "22px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText(date, 56, 120);
  ctx.fillStyle = "rgba(217,169,78,0.6)";
  const modeText = mode === "direto" ? "AVALIAÇÃO DIRETA" : "AVALIAÇÃO ANALÍTICA";
  ctx.fillText(`  •  ${modeText}`, 56 + ctx.measureText(date).width, 120);

  // Score circle
  const cx = W / 2;
  const cy = 320;
  const radius = 100;

  // Circle border
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = scoreColor;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Inner glow
  const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  innerGlow.addColorStop(0, scoreColor + "20");
  innerGlow.addColorStop(1, "transparent");
  ctx.fillStyle = innerGlow;
  ctx.fill();

  // Score text
  ctx.textAlign = "center";
  ctx.font = "bold 72px sans-serif";
  ctx.fillStyle = scoreColor;
  ctx.fillText(score.toFixed(1), cx, cy + 20);
  ctx.font = "20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("/10", cx, cy + 50);

  // Score label
  ctx.font = "bold 26px sans-serif";
  ctx.fillStyle = scoreColor;
  ctx.fillText(scoreLabel, cx, cy + radius + 50);

  // Establishment name
  ctx.textAlign = "left";
  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "#d9a94e";
  const nameLines = wrapText(ctx, establishmentName.toUpperCase(), W - 112, 40);
  let nameY = 540;
  nameLines.forEach(line => {
    ctx.fillText(line, 56, nameY);
    nameY += 50;
  });

  // Category & neighborhood
  ctx.font = "22px sans-serif";
  let metaY = nameY + 20;
  if (categoryName) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(categoryName, 56, metaY);
    metaY += 30;
  }
  if (neighborhood) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(`📍 ${neighborhood}`, 56, metaY);
    metaY += 30;
  }

  // Items
  if (items.length > 0) {
    metaY += 20;
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("ITENS AVALIADOS", 56, metaY);
    metaY += 30;

    ctx.font = "20px sans-serif";
    const displayItems = items.slice(0, 6);
    let itemX = 56;
    let itemY = metaY;
    displayItems.forEach(item => {
      const textW = ctx.measureText(item).width + 24;
      if (itemX + textW > W - 56) {
        itemX = 56;
        itemY += 40;
      }
      // Pill background
      ctx.fillStyle = "rgba(217,169,78,0.08)";
      roundRect(ctx, itemX, itemY - 18, textW, 30, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(217,169,78,0.15)";
      ctx.lineWidth = 1;
      roundRect(ctx, itemX, itemY - 18, textW, 30, 8);
      ctx.stroke();
      // Pill text
      ctx.fillStyle = "rgba(217,169,78,0.8)";
      ctx.fillText(item, itemX + 12, itemY + 2);
      itemX += textW + 10;
    });
    if (items.length > 6) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText(`+${items.length - 6} mais`, itemX + 8, itemY + 2);
    }
  }

  // Bottom CTA
  ctx.textAlign = "center";
  // Separator line
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, H - 120);
  ctx.lineTo(W - 56, H - 120);
  ctx.stroke();

  ctx.font = "20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("Avalie seus bares e restaurantes favoritos", cx, H - 80);
  ctx.font = "bold 24px sans-serif";
  ctx.fillStyle = "#d9a94e";
  ctx.fillText("avaliabar.manus.space", cx, H - 45);

  return canvas;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 2); // Max 2 lines
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);
  const displayDate = date
    ? new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const generateCanvas = () => {
    return generateCardCanvas({
      establishmentName,
      categoryName,
      neighborhood,
      score,
      items,
      mode,
      date: displayDate,
    });
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const canvas = generateCanvas();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

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
            downloadBlob(blob);
          }
        }
      } else {
        // Desktop fallback: download
        downloadBlob(blob);
      }
      setIsGenerating(false);
    } catch (e) {
      console.error("Share error:", e);
      toast.error("Erro ao gerar imagem para compartilhamento");
      setIsGenerating(false);
    }
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `avalyarin-${establishmentName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Imagem salva! Compartilhe nos seus Stories.");
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = generateCanvas();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) downloadBlob(blob);
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

        {/* Card Preview (9:16 ratio) — visual preview using divs */}
        <div
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
