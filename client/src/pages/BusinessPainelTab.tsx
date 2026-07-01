import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Activity, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Heart, RefreshCw, BarChart3, Smile, ArrowRight
} from "lucide-react";

export default function BusinessPainelTab() {
  const { data: establishments, isLoading: loadingEstabs } = trpc.business.myEstablishments.useQuery();
  const [selectedEstId, setSelectedEstId] = useState<number | null>(null);

  const estId = selectedEstId || (establishments && establishments.length > 0 ? establishments[0].id : null);

  const { data: healthData, isLoading: loadingHealth } = trpc.analytics.healthScore.useQuery(
    { establishmentId: estId! },
    { enabled: !!estId }
  );

  if (loadingEstabs) return <div className="text-muted-foreground animate-pulse">Carregando...</div>;

  if (!establishments || establishments.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-display text-xl text-foreground mb-2">SEM DADOS</h3>
        <p className="text-muted-foreground text-sm">Vincule um estabelecimento para ver o diagnóstico.</p>
      </div>
    );
  }

  const colorMap = {
    red: "text-red-500",
    orange: "text-orange-500",
    yellow: "text-yellow-500",
    green: "text-green-500",
    emerald: "text-emerald-500",
  };

  const bgColorMap = {
    red: "bg-red-500/10 border-red-500/30",
    orange: "bg-orange-500/10 border-orange-500/30",
    yellow: "bg-yellow-500/10 border-yellow-500/30",
    green: "bg-green-500/10 border-green-500/30",
    emerald: "bg-emerald-500/10 border-emerald-500/30",
  };

  const alertTypeStyles = {
    urgent: "bg-red-500/10 border-red-500/30 text-red-400",
    warning: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    positive: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  };

  return (
    <div className="space-y-6">
      {/* Establishment selector */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider text-foreground">DIAGNÓSTICO</h2>
        {establishments.length > 1 && (
          <select
            value={estId || ""}
            onChange={(e) => setSelectedEstId(Number(e.target.value))}
            className="text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground"
          >
            {establishments.map((est: any) => (
              <option key={est.id} value={est.id}>{est.name}</option>
            ))}
          </select>
        )}
      </div>

      {loadingHealth ? (
        <div className="space-y-4">
          <div className="h-40 bg-card/50 rounded-xl animate-pulse" />
          <div className="h-24 bg-card/50 rounded-xl animate-pulse" />
          <div className="h-24 bg-card/50 rounded-xl animate-pulse" />
        </div>
      ) : healthData ? (
        <>
          {/* Health Score Card */}
          <div className={`relative p-6 rounded-xl border ${bgColorMap[healthData.color]}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Health Score</p>
                <div className="flex items-baseline gap-3">
                  <span className={`font-numbers text-5xl font-bold ${colorMap[healthData.color]}`}>
                    {healthData.score}
                  </span>
                  <span className="text-lg text-muted-foreground">/100</span>
                </div>
                <p className={`text-sm font-medium mt-1 ${colorMap[healthData.color]}`}>
                  {healthData.label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {healthData.trendDirection === "up" && <TrendingUp className="w-5 h-5 text-emerald-500" />}
                {healthData.trendDirection === "down" && <TrendingDown className="w-5 h-5 text-red-500" />}
                {healthData.trendDirection === "stable" && <Minus className="w-5 h-5 text-muted-foreground" />}
                <span className={`text-sm font-medium ${
                  healthData.trendDelta > 0 ? "text-emerald-500" : healthData.trendDelta < 0 ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {healthData.trendDelta > 0 ? "+" : ""}{healthData.trendDelta}%
                </span>
              </div>
            </div>

            {/* Sparkline (simple bar chart) */}
            {healthData.sparkline.length > 0 && (
              <div className="flex items-end gap-0.5 h-12 mt-4">
                {healthData.sparkline.slice(-14).map((point, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${colorMap[healthData.color].replace("text-", "bg-")} opacity-60`}
                    style={{ height: `${(point.score / 10) * 100}%` }}
                    title={`${point.date}: ${point.score}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Components breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Nota Média</span>
              </div>
              <p className="font-numbers text-2xl font-bold text-foreground">{healthData.components.avgScore.value}</p>
              <p className="text-xs text-muted-foreground">peso 40%</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Taxa Retorno</span>
              </div>
              <p className="font-numbers text-2xl font-bold text-foreground">{healthData.components.returnRate.value}%</p>
              <p className="text-xs text-muted-foreground">peso 20%</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Tendência</span>
              </div>
              <p className="font-numbers text-2xl font-bold text-foreground">
                {healthData.components.trend.value > 0 ? "+" : ""}{healthData.components.trend.value}%
              </p>
              <p className="text-xs text-muted-foreground">peso 20%</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Smile className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Sentimento</span>
              </div>
              <p className="font-numbers text-2xl font-bold text-foreground">{healthData.components.sentiment.value}%</p>
              <p className="text-xs text-muted-foreground">peso 20%</p>
            </div>
          </div>

          {/* Alerts */}
          {healthData.alerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-display text-lg tracking-wider text-foreground">ALERTAS</h3>
              {healthData.alerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-xl border ${alertTypeStyles[alert.type]}`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                    {(alert.linkedInsight || alert.linkedAction) && (
                      <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum dado disponível ainda.</p>
        </div>
      )}
    </div>
  );
}
