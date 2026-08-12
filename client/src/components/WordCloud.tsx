/**
 * WordCloud — Nuvem de Ideias visual interativa
 * Layout circular/orgânico com palavras posicionadas em espiral
 * Tamanho proporcional à frequência, cores por sentimento
 */
import { useState, useMemo, useRef } from "react";
import { Cloud, ThumbsUp, ThumbsDown, Minus } from "lucide-react";

interface WordItem {
  word: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
}

interface Props {
  words: WordItem[];
  title?: string;
}

// Golden angle spiral for organic placement
function spiralLayout(items: WordItem[], width: number, height: number) {
  const centerX = width / 2;
  const centerY = height / 2;
  const goldenAngle = 137.508 * (Math.PI / 180);
  const maxCount = Math.max(...items.map(w => w.count), 1);

  return items.map((item, i) => {
    // Spiral positioning
    const radius = 20 + Math.sqrt(i) * 28;
    const angle = i * goldenAngle;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // Size based on frequency (min 0.75rem, max 2.2rem)
    const normalizedCount = item.count / maxCount;
    const fontSize = 0.75 + normalizedCount * 1.45;

    // Slight rotation for organic feel
    const rotation = (Math.random() - 0.5) * 20;

    return { ...item, x, y, fontSize, rotation };
  });
}

export default function WordCloud({ words, title = "Nuvem de Ideias" }: Props) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredWords = useMemo(() => {
    if (filter === "all") return words;
    return words.filter(w => w.sentiment === filter);
  }, [words, filter]);

  const layoutItems = useMemo(() => {
    return spiralLayout(filteredWords, 360, 320);
  }, [filteredWords]);

  const maxCount = Math.max(...words.map(w => w.count), 1);

  const sentimentCounts = useMemo(() => ({
    positive: words.filter(w => w.sentiment === "positive").length,
    negative: words.filter(w => w.sentiment === "negative").length,
    neutral: words.filter(w => w.sentiment === "neutral").length,
  }), [words]);

  if (words.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
        <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">
          Nenhuma palavra-chave extraída ainda. Mais avaliações com comentários são necessárias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Cloud className="w-4 h-4 text-primary" />
          {title}
        </h4>
        <span className="text-[10px] text-muted-foreground">
          {words.length} termos • {words.reduce((s, w) => s + w.count, 0)} menções
        </span>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "all" as const, label: "Todos", count: words.length, color: "text-foreground" },
          { id: "positive" as const, label: "Positivos", count: sentimentCounts.positive, color: "text-emerald-400" },
          { id: "negative" as const, label: "Negativos", count: sentimentCounts.negative, color: "text-red-400" },
          { id: "neutral" as const, label: "Neutros", count: sentimentCounts.neutral, color: "text-zinc-400" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
              filter === f.id
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-card border-border/50 text-muted-foreground hover:border-border"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Cloud Visualization */}
      <div
        ref={containerRef}
        className="relative w-full h-[320px] rounded-xl bg-gradient-to-br from-card via-background to-card border border-border/50 overflow-hidden"
      >
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        {/* Words */}
        {layoutItems.map((item, i) => {
          const isHovered = hoveredWord === item.word;
          const colorClass = item.sentiment === "positive" ? "text-emerald-400" :
                             item.sentiment === "negative" ? "text-red-400" : "text-zinc-400";
          const glowClass = item.sentiment === "positive" ? "shadow-emerald-500/20" :
                            item.sentiment === "negative" ? "shadow-red-500/20" : "shadow-zinc-500/10";

          return (
            <span
              key={`${item.word}-${i}`}
              className={`absolute select-none cursor-pointer font-medium transition-all duration-200 ${colorClass} ${
                isHovered ? `scale-125 z-10 drop-shadow-lg ${glowClass}` : "hover:scale-110"
              } ${hoveredWord && !isHovered ? "opacity-30" : "opacity-90"}`}
              style={{
                left: `${(item.x / 360) * 100}%`,
                top: `${(item.y / 320) * 100}%`,
                fontSize: `${item.fontSize}rem`,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                lineHeight: 1.2,
              }}
              onMouseEnter={() => setHoveredWord(item.word)}
              onMouseLeave={() => setHoveredWord(null)}
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
              const SIcon = w.sentiment === "positive" ? ThumbsUp : w.sentiment === "negative" ? ThumbsDown : Minus;
              const sColor = w.sentiment === "positive" ? "text-emerald-400" : w.sentiment === "negative" ? "text-red-400" : "text-zinc-400";
              return (
                <div className="flex items-center gap-2">
                  <SIcon className={`w-3 h-3 ${sColor}`} />
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

      {/* Legend + Stats */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> Positivo
          </span>
          <span className="text-[10px] text-red-400 flex items-center gap-1">
            <ThumbsDown className="w-3 h-3" /> Negativo
          </span>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Minus className="w-3 h-3" /> Neutro
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          Tamanho = frequência
        </span>
      </div>

      {/* Top Words List (compact) */}
      <div className="grid grid-cols-2 gap-2">
        {words.slice(0, 6).map((w, i) => {
          const barWidth = (w.count / maxCount) * 100;
          const barColor = w.sentiment === "positive" ? "bg-emerald-500/30" :
                           w.sentiment === "negative" ? "bg-red-500/30" : "bg-zinc-500/30";
          const textColor = w.sentiment === "positive" ? "text-emerald-400" :
                            w.sentiment === "negative" ? "text-red-400" : "text-zinc-400";
          return (
            <div key={i} className="p-2 rounded-lg bg-card/50 border border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${textColor}`}>{w.word}</span>
                <span className="text-[10px] text-muted-foreground">{w.count}x</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
