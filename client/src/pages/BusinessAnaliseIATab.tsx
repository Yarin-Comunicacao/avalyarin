/**
 * Business Análise IA Tab — Displays LLM-processed insights from user feedback
 * Shows: patterns, item sentiments, word cloud, summary
 */
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import {
  Brain, TrendingUp, TrendingDown, MessageSquare, AlertTriangle,
  CheckCircle, Minus, Sparkles, RefreshCw, Lock, ThumbsUp, ThumbsDown,
  Zap, Target, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  establishmentId: number | null;
}

const SENTIMENT_CONFIG = {
  positive: { icon: ThumbsUp, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Positivo" },
  negative: { icon: ThumbsDown, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Negativo" },
  neutral: { icon: Minus, color: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", label: "Neutro" },
  mixed: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Misto" },
};

const URGENCY_CONFIG = {
  high: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Alta" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Média" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Baixa" },
};

export default function BusinessAnaliseIATab({ establishmentId }: Props) {
  const [activeSection, setActiveSection] = useState<"patterns" | "sentiments" | "wordcloud">("patterns");

  const { data, isLoading, error, refetch, isFetching } = trpc.analytics.llmInsights.useQuery(
    { establishmentId: establishmentId! },
    { enabled: !!establishmentId, staleTime: 2 * 60 * 60 * 1000 }
  );

  if (!establishmentId) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Selecione um estabelecimento para ver a análise.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
        <h3 className="font-display text-xl text-foreground mb-2">ANALISANDO FEEDBACKS...</h3>
        <p className="text-muted-foreground text-sm">A IA está processando os comentários e avaliações.</p>
        <p className="text-muted-foreground text-xs mt-2">Isso pode levar alguns segundos.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive text-sm">Erro ao carregar análise: {error.message}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data || data.totalFeedbacksAnalyzed < 3) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">DADOS INSUFICIENTES</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          São necessárias pelo menos 3 avaliações com comentários para a IA extrair padrões.
          Incentive seus clientes a deixarem feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl tracking-wider text-foreground flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            ANÁLISE IA
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {data.totalFeedbacksAnalyzed} feedbacks analisados • Atualizado {new Date(data.generatedAt).toLocaleString("pt-BR")}
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

      {/* Summary Card */}
      <div className="p-4 rounded-xl bg-card border border-primary/30">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-foreground mb-1">Resumo Executivo</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </div>

      {/* Top Positive / Negative */}
      {(data.topPositive.length > 0 || data.topNegative.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topPositive.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Pontos Fortes
              </h4>
              <ul className="space-y-2">
                {data.topPositive.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.topNegative.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Pontos a Melhorar
              </h4>
              <ul className="space-y-2">
                {data.topNegative.map((item: string, i: number) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "patterns" as const, label: "Padrões", icon: Target },
          { id: "sentiments" as const, label: "Sentimento por Item", icon: BarChart3 },
          { id: "wordcloud" as const, label: "Palavras-chave", icon: MessageSquare },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeSection === tab.id
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-card border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Patterns Section */}
      {activeSection === "patterns" && (
        <div className="space-y-3">
          {data.patterns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum padrão identificado ainda. Mais avaliações são necessárias.
            </p>
          ) : (
            data.patterns.map((pattern: any, i: number) => {
              const urgency = URGENCY_CONFIG[pattern.urgency as keyof typeof URGENCY_CONFIG] || URGENCY_CONFIG.low;
              const sentiment = SENTIMENT_CONFIG[pattern.sentiment as keyof typeof SENTIMENT_CONFIG] || SENTIMENT_CONFIG.neutral;
              const SentimentIcon = sentiment.icon;

              return (
                <div key={i} className="p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <SentimentIcon className={`w-4 h-4 ${sentiment.color}`} />
                        <h4 className="text-sm font-medium text-foreground">{pattern.theme}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${urgency.bg} ${urgency.border} ${urgency.color}`}>
                          {urgency.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{pattern.description}</p>
                      {pattern.relatedItems.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {pattern.relatedItems.map((item: string, j: number) => (
                            <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{pattern.frequency}x mencionado</span>
                      </div>
                    </div>
                  </div>
                  {pattern.suggestedAction && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="flex items-start gap-2">
                        <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-foreground/80">{pattern.suggestedAction}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sentiments Section */}
      {activeSection === "sentiments" && (
        <div className="space-y-3">
          {data.itemSentiments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum item com análise de sentimento disponível.
            </p>
          ) : (
            data.itemSentiments.map((item: any, i: number) => {
              const sentiment = SENTIMENT_CONFIG[item.overallSentiment as keyof typeof SENTIMENT_CONFIG] || SENTIMENT_CONFIG.neutral;
              const SentimentIcon = sentiment.icon;
              const scorePercent = ((item.sentimentScore + 1) / 2) * 100; // -1..1 → 0..100

              return (
                <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SentimentIcon className={`w-4 h-4 ${sentiment.color}`} />
                      <h4 className="text-sm font-medium text-foreground">{item.itemName}</h4>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sentiment.bg} ${sentiment.border} ${sentiment.color}`}>
                      {sentiment.label}
                    </span>
                  </div>

                  {/* Sentiment bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.sentimentScore >= 0.3 ? "bg-emerald-500" :
                        item.sentimentScore <= -0.3 ? "bg-red-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>

                  {/* Themes */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.positiveThemes.map((t: string, j: number) => (
                      <span key={`p-${j}`} className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        +{t}
                      </span>
                    ))}
                    {item.negativeThemes.map((t: string, j: number) => (
                      <span key={`n-${j}`} className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        −{t}
                      </span>
                    ))}
                  </div>

                  {/* Sample quotes */}
                  {item.sampleQuotes.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {item.sampleQuotes.slice(0, 2).map((q: string, j: number) => (
                        <p key={j} className="text-[11px] text-muted-foreground italic pl-3 border-l-2 border-border/50">
                          "{q}"
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Improvement suggestion */}
                  {item.improvementSuggestion && (
                    <div className="mt-2 pt-2 border-t border-border/30 flex items-start gap-2">
                      <Zap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      <p className="text-[11px] text-foreground/70">{item.improvementSuggestion}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Word Cloud Section */}
      {activeSection === "wordcloud" && (
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <h4 className="text-sm font-medium text-foreground mb-4">Palavras mais mencionadas</h4>
          {data.wordCloud.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma palavra-chave extraída ainda.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {data.wordCloud.map((word: any, i: number) => {
                const maxCount = Math.max(...data.wordCloud.map((w: any) => w.count));
                const scale = 0.7 + (word.count / maxCount) * 0.8; // 0.7 to 1.5
                const colorClass = word.sentiment === "positive" ? "text-emerald-400" :
                                   word.sentiment === "negative" ? "text-red-400" : "text-zinc-400";
                return (
                  <span
                    key={i}
                    className={`${colorClass} font-medium transition-all hover:opacity-80 cursor-default`}
                    style={{ fontSize: `${scale}rem` }}
                    title={`${word.word}: ${word.count}x (${word.sentiment})`}
                  >
                    {word.word}
                  </span>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/30">
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">● Positivo</span>
            <span className="text-[10px] text-red-400 flex items-center gap-1">● Negativo</span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">● Neutro</span>
          </div>
        </div>
      )}
    </div>
  );
}
