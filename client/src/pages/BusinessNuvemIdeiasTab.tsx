/**
 * Business Nuvem de Ideias Tab — Word Cloud split by score range
 * Sub-tabs: Notas 7-10 (positivos) and Notas 1-6 (negativos)
 */
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useRef } from "react";
import {
  Cloud, ThumbsUp, ThumbsDown, Minus, RefreshCw, AlertTriangle,
  TrendingUp, TrendingDown, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  establishmentId: number | null;
}

interface WordItem {
  word: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
}

// Stop words to filter out from display
const STOP_WORDS_PT = new Set([
  "que", "para", "com", "uma", "por", "mais", "como", "mas", "foi", "ser",
  "tem", "seu", "sua", "dos", "das", "nos", "nas", "esse", "essa", "não",
]);

// Golden angle spiral for organic placement
function spiralLayout(items: WordItem[], width: number, height: number) {
  const centerX = width / 2;
  const centerY = height / 2;
  const goldenAngle = 137.508 * (Math.PI / 180);

  return items.map((item, i) => {
    const radius = 15 + Math.sqrt(i) * 24;
    const angle = i * goldenAngle;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    // Slight rotation for organic feel (-15 to +15 degrees)
    const rotation = ((i * 7) % 30) - 15;
    return { ...item, x, y, rotation };
  });
}

function WordCloudVisual({ words, type }: { words: WordItem[]; type: "high" | "low" }) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const containerWidth = 360;
  const containerHeight = 300;

  const maxCount = Math.max(...words.map(w => w.count), 1);

  const layoutItems = useMemo(() => {
    return spiralLayout(words, containerWidth, containerHeight);
  }, [words]);

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Cloud className="w-12 h-12 text-muted-foreground mb-3 opacity-40" />
        <p className="text-sm text-muted-foreground">
          Nenhuma palavra-chave extraída ainda.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          São necessárias mais avaliações com comentários nesta faixa de nota.
        </p>
      </div>
    );
  }

  const primaryColor = type === "high" ? "emerald" : "red";

  return (
    <div className="space-y-4">
      {/* Cloud Visualization */}
      <div
        className={`relative w-full h-[300px] rounded-xl border overflow-hidden ${
          type === "high"
            ? "bg-gradient-to-br from-emerald-950/20 via-background to-emerald-950/10 border-emerald-500/20"
            : "bg-gradient-to-br from-red-950/20 via-background to-red-950/10 border-red-500/20"
        }`}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/3 left-1/3 w-28 h-28 rounded-full blur-3xl ${
            type === "high" ? "bg-emerald-500/8" : "bg-red-500/8"
          }`} />
          <div className={`absolute bottom-1/3 right-1/3 w-20 h-20 rounded-full blur-3xl ${
            type === "high" ? "bg-emerald-500/5" : "bg-red-500/5"
          }`} />
        </div>

        {/* Words */}
        {layoutItems.map((item, i) => {
          const isHovered = hoveredWord === item.word;
          const normalizedCount = item.count / maxCount;
          const fontSize = 0.7 + normalizedCount * 1.4; // 0.7rem to 2.1rem
          const opacity = 0.5 + normalizedCount * 0.5; // 0.5 to 1.0

          const colorClass = type === "high"
            ? normalizedCount > 0.6 ? "text-emerald-300" : normalizedCount > 0.3 ? "text-emerald-400" : "text-emerald-500/80"
            : normalizedCount > 0.6 ? "text-red-300" : normalizedCount > 0.3 ? "text-red-400" : "text-red-500/80";

          return (
            <span
              key={`${item.word}-${i}`}
              className={`absolute select-none cursor-pointer font-medium transition-all duration-200 ${colorClass} ${
                isHovered ? "scale-125 z-10 drop-shadow-lg brightness-125" : "hover:scale-110"
              } ${hoveredWord && !isHovered ? "opacity-20" : ""}`}
              style={{
                left: `${(item.x / containerWidth) * 100}%`,
                top: `${(item.y / containerHeight) * 100}%`,
                fontSize: `${fontSize}rem`,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                lineHeight: 1.2,
                opacity: hoveredWord && !isHovered ? 0.2 : opacity,
              }}
              onMouseEnter={() => setHoveredWord(item.word)}
              onMouseLeave={() => setHoveredWord(null)}
              onTouchStart={() => setHoveredWord(item.word)}
              onTouchEnd={() => setTimeout(() => setHoveredWord(null), 2000)}
            >
              {item.word}
            </span>
          );
        })}

        {/* Hover tooltip */}
        {hoveredWord && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-popover border border-border shadow-lg z-20">
            {(() => {
              const w = words.find(w => w.word === hoveredWord);
              if (!w) return null;
              return (
                <div className="flex items-center gap-2">
                  {type === "high" ? (
                    <ThumbsUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ThumbsDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className="text-xs font-medium text-foreground">{w.word}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {w.count}x mencionado
                  </span>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Top Words Bar Chart */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Top {Math.min(8, words.length)} mais mencionados
        </h5>
        <div className="space-y-1.5">
          {words.slice(0, 8).map((w, i) => {
            const barWidth = (w.count / maxCount) * 100;
            const barColor = type === "high" ? "bg-emerald-500/40" : "bg-red-500/40";
            const textColor = type === "high" ? "text-emerald-400" : "text-red-400";
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`text-xs font-medium w-32 truncate ${textColor}`}>
                  {w.word}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right">
                  {w.count}x
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BusinessNuvemIdeiasTab({ establishmentId }: Props) {
  const [activeRange, setActiveRange] = useState<"high" | "low">("high");

  const { data, isLoading, error, refetch, isFetching } = trpc.analytics.wordCloud.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, staleTime: 2 * 60 * 60 * 1000 }
  );

  if (!establishmentId) {
    return (
      <div className="text-center py-12">
        <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Selecione um estabelecimento para ver a nuvem de ideias.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Cloud className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
        <h3 className="font-display text-xl text-foreground mb-2">GERANDO NUVEM...</h3>
        <p className="text-muted-foreground text-sm">Processando comentários e feedbacks.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive text-sm">Erro ao carregar: {error.message}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data || (data.highTotal === 0 && data.lowTotal === 0)) {
    return (
      <div className="text-center py-12">
        <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">DADOS INSUFICIENTES</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          São necessárias avaliações com comentários para gerar a nuvem de ideias.
          Incentive seus clientes a deixarem feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl tracking-wider text-foreground flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            NUVEM DE IDEIAS
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Palavras mais mencionadas nos feedbacks dos últimos 90 dias
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Sub-tabs: Notas 7-10 vs 1-6 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveRange("high")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            activeRange === "high"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
              : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <div className="text-left">
            <div className="text-sm font-medium">Notas 7–10</div>
            <div className="text-[10px] opacity-70">{data.highTotal} feedbacks</div>
          </div>
        </button>
        <button
          onClick={() => setActiveRange("low")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            activeRange === "low"
              ? "bg-red-500/10 border-red-500/40 text-red-400"
              : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <div className="text-left">
            <div className="text-sm font-medium">Notas 1–6</div>
            <div className="text-[10px] opacity-70">{data.lowTotal} feedbacks</div>
          </div>
        </button>
      </div>

      {/* Description */}
      <div className={`p-3 rounded-lg border ${
        activeRange === "high"
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-red-500/5 border-red-500/20"
      }`}>
        <div className="flex items-start gap-2">
          <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${
            activeRange === "high" ? "text-emerald-400" : "text-red-400"
          }`} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeRange === "high"
              ? "Palavras mais frequentes nos comentários de quem deu notas altas (7 a 10). Representam o que seus clientes mais valorizam e elogiam."
              : "Palavras mais frequentes nos comentários de quem deu notas baixas (1 a 6). Representam os principais pontos de insatisfação e oportunidades de melhoria."
            }
          </p>
        </div>
      </div>

      {/* Word Cloud */}
      <WordCloudVisual
        words={activeRange === "high" ? data.high : data.low}
        type={activeRange}
      />
    </div>
  );
}
