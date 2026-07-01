/**
 * Dashboard Tab — 4 gráficos (2 pizza + 2 barra) + linha temporal com outliers
 * Dropdown: 7, 14, 21, 30, 60, 180, 365 dias
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users, ShoppingBag, MapPin, Clock, AlertTriangle, TrendingUp, TrendingDown, Loader2
} from "lucide-react";

const PERIODS = [
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
  { value: "21", label: "21 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "180", label: "180 dias" },
  { value: "365", label: "365 dias" },
];

const CHART_COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"
];

interface BusinessDashboardTabProps {
  establishmentId?: number | null;
}

export default function BusinessDashboardTab({ establishmentId }: BusinessDashboardTabProps) {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");

  // Use shared establishmentId from parent, fallback to fetching own
  const { data: estabs } = trpc.business.myEstablishments.useQuery(undefined, {
    enabled: !!user && !establishmentId,
  });
  const estabId = establishmentId || estabs?.[0]?.id;

  const { data: dashboard, isLoading } = trpc.analytics.dashboardData.useQuery(
    { establishmentId: estabId!, periodDays: Number(period) },
    { enabled: !!estabId }
  );

  if (!estabId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum estabelecimento vinculado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-3">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : dashboard ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label="Avaliações"
              value={String(dashboard.summary.totalRatings)}
              icon={<ShoppingBag className="w-4 h-4" />}
            />
            <SummaryCard
              label="Nota Média"
              value={dashboard.summary.avgScore.toFixed(1)}
              icon={<TrendingUp className="w-4 h-4" />}
              highlight
            />
            <SummaryCard
              label="Visitantes"
              value={String(dashboard.summary.uniqueVisitors)}
              icon={<Users className="w-4 h-4" />}
            />
            <SummaryCard
              label="Ticket Médio"
              value={dashboard.summary.avgTicket ? `R$${dashboard.summary.avgTicket}` : "—"}
              icon={<ShoppingBag className="w-4 h-4" />}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pie: Idade do Público */}
            <ChartCard title="Idade do Público" icon={<Users className="w-4 h-4 text-primary" />}>
              {dashboard.agePie.length > 0 ? (
                <PieChart data={dashboard.agePie} />
              ) : (
                <EmptyChart message="Sem dados de idade" />
              )}
            </ChartCard>

            {/* Bar: Itens Mais Vendidos */}
            <ChartCard title="Itens Mais Avaliados" icon={<ShoppingBag className="w-4 h-4 text-primary" />}>
              {dashboard.topItemsBar.length > 0 ? (
                <BarChart data={dashboard.topItemsBar.slice(0, 7)} labelKey="name" valueKey="count" />
              ) : (
                <EmptyChart message="Sem dados de itens" />
              )}
            </ChartCard>

            {/* Pie: Regiões */}
            <ChartCard title="De Onde Vêm" icon={<MapPin className="w-4 h-4 text-primary" />}>
              {dashboard.regionsPie.length > 0 ? (
                <PieChart data={dashboard.regionsPie} />
              ) : (
                <EmptyChart message="Sem dados de região" />
              )}
            </ChartCard>

            {/* Bar: Horários de Pico */}
            <ChartCard title="Horários de Movimento" icon={<Clock className="w-4 h-4 text-primary" />}>
              {dashboard.peakHoursBar.length > 0 ? (
                <BarChart data={dashboard.peakHoursBar} labelKey="hour" valueKey="count" />
              ) : (
                <EmptyChart message="Sem dados de horário" />
              )}
            </ChartCard>
          </div>

          {/* Timeline with Outliers */}
          <ChartCard
            title="Linha Temporal — Nota Diária"
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
            full
          >
            {dashboard.timeline.points.length > 0 ? (
              <TimelineChart
                points={dashboard.timeline.points}
                outliers={dashboard.timeline.outliers}
                mean={dashboard.timeline.mean}
                periodDays={Number(period)}
              />
            ) : (
              <EmptyChart message="Sem dados no período" />
            )}
          </ChartCard>

          {/* Outliers Alert */}
          {dashboard.timeline.outliers.length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                Outliers Detectados ({dashboard.timeline.outliers.length})
              </h3>
              {dashboard.timeline.outliers.map((outlier, i) => (
                <div key={i} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-400">
                      {new Date(outlier.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-sm font-bold text-red-400">{outlier.score}</span>
                      <span className="text-xs text-muted-foreground">
                        (média: {outlier.avgScore})
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {outlier.possibleCauses.map((cause, j) => (
                      <p key={j} className="text-xs text-muted-foreground">
                        • {cause}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, icon, children, full }: { title: string; icon: React.ReactNode; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`p-4 rounded-xl bg-card border border-border/50 ${full ? "col-span-full" : ""}`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

// ─── Pie Chart (CSS-based) ──────────────────────────────────────────────────

function PieChart({ data }: { data: Array<{ label: string; value: number; percentage: number }> }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  let cumulativePercent = 0;

  // Build conic gradient
  const segments = data.map((item, i) => {
    const start = cumulativePercent;
    cumulativePercent += (item.value / total) * 100;
    return `${CHART_COLORS[i % CHART_COLORS.length]} ${start}% ${cumulativePercent}%`;
  });

  const gradient = `conic-gradient(${segments.join(", ")})`;

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-28 h-28 rounded-full shrink-0"
        style={{ background: gradient }}
      />
      <div className="space-y-1.5 overflow-hidden">
        {data.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-xs text-foreground truncate">{item.label}</span>
            <span className="text-xs text-muted-foreground ml-auto shrink-0">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar Chart (CSS-based) ──────────────────────────────────────────────────

function BarChart({ data, labelKey, valueKey }: { data: any[]; labelKey: string; valueKey: string }) {
  const maxValue = Math.max(...data.map(d => Number(d[valueKey])));

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const value = Number(item[valueKey]);
        const width = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 truncate shrink-0">
              {item[labelKey]}
            </span>
            <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{
                  width: `${width}%`,
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  opacity: 0.8,
                }}
              />
            </div>
            <span className="text-xs font-medium text-foreground w-8 text-right shrink-0">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Timeline Chart (SVG-based) ─────────────────────────────────────────────

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/**
 * Gera labels do eixo X com base no período:
 * - 7d: dd/mm para cada dia (7 labels)
 * - 14d: dd/mm para cada dia (14 labels)
 * - 21d: dd/mm pulando para ter ~15 labels
 * - 30d: dd/mm pulando a cada 2 dias (~15 labels)
 * - 60d: dd/mm pulando a cada 4 dias (~15 labels)
 * - 180d: dd/mm com intervalos de ~12 dias (~15 labels)
 * - 365d: meses (Jan, Fev, Mar...)
 */
function getXAxisLabels(points: Array<{ date: string }>, periodDays: number): Array<{ index: number; label: string }> {
  if (points.length === 0) return [];

  if (periodDays === 365) {
    // Mostrar meses
    const monthsSeen = new Map<string, number>();
    points.forEach((p, i) => {
      const d = new Date(p.date + "T12:00:00");
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthsSeen.has(key)) {
        monthsSeen.set(key, i);
      }
    });
    return Array.from(monthsSeen.entries()).map(([key, idx]) => {
      const month = parseInt(key.split("-")[1]);
      return { index: idx, label: MONTHS_PT[month] };
    });
  }

  // Para períodos <= 180 dias, calcular o step para ter no máximo 15 labels
  const maxLabels = 15;
  let step: number;

  if (periodDays <= 14) {
    step = 1; // Mostrar todos os dias
  } else if (periodDays === 21) {
    // Pular alguns para ter ~15
    step = Math.ceil(points.length / maxLabels);
  } else if (periodDays === 30) {
    // Pular a cada 2 dias
    step = 2;
  } else if (periodDays === 60) {
    // Pular a cada 4 dias
    step = 4;
  } else {
    // 180 dias: intervalos de ~12 dias
    step = Math.ceil(points.length / maxLabels);
  }

  const labels: Array<{ index: number; label: string }> = [];
  for (let i = 0; i < points.length; i += step) {
    const d = new Date(points[i].date + "T12:00:00");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    labels.push({ index: i, label: `${dd}/${mm}` });
  }

  // Garantir que não ultrapasse 15 labels
  if (labels.length > maxLabels) {
    const filtered: Array<{ index: number; label: string }> = [];
    const newStep = Math.ceil(labels.length / maxLabels);
    for (let i = 0; i < labels.length; i += newStep) {
      filtered.push(labels[i]);
    }
    return filtered;
  }

  return labels;
}

function TimelineChart({
  points,
  outliers,
  mean,
  periodDays,
}: {
  points: Array<{ date: string; score: number; count: number }>;
  outliers: Array<{ date: string; score: number; possibleCauses: string[] }>;
  mean: number;
  periodDays: number;
}) {
  // Chart dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const marginLeft = 36;
  const marginRight = 12;
  const marginTop = 12;
  const marginBottom = 36;
  const chartWidth = svgWidth - marginLeft - marginRight;
  const chartHeight = svgHeight - marginTop - marginBottom;

  // Y axis: fixed 0-10 scale, grid lines at 2, 4, 6, 8, 10
  const yMin = 0;
  const yMax = 10;
  const yTicks = [2, 4, 6, 8, 10];

  const getX = (i: number) => marginLeft + (i / (points.length - 1 || 1)) * chartWidth;
  const getY = (score: number) => marginTop + chartHeight - ((score - yMin) / (yMax - yMin)) * chartHeight;

  // Build path
  const pathD = points.map((p, i) => {
    const clampedScore = Math.max(yMin, Math.min(yMax, p.score));
    return `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(clampedScore)}`;
  }).join(" ");

  // Mean line Y
  const meanY = getY(Math.max(yMin, Math.min(yMax, mean)));

  // Outlier dates set
  const outlierDates = new Set(outliers.map(o => o.date));

  // X axis labels
  const xLabels = getXAxisLabels(points, periodDays);

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48" preserveAspectRatio="xMidYMid meet">
        {/* Y axis grid lines and labels */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={marginLeft}
                y1={y}
                x2={svgWidth - marginRight}
                y2={y}
                stroke="#374151"
                strokeWidth="0.5"
                strokeDasharray="4 3"
              />
              <text
                x={marginLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-gray-500"
                fontSize="10"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* X axis line */}
        <line
          x1={marginLeft}
          y1={marginTop + chartHeight}
          x2={svgWidth - marginRight}
          y2={marginTop + chartHeight}
          stroke="#374151"
          strokeWidth="0.5"
        />

        {/* Y axis line */}
        <line
          x1={marginLeft}
          y1={marginTop}
          x2={marginLeft}
          y2={marginTop + chartHeight}
          stroke="#374151"
          strokeWidth="0.5"
        />

        {/* X axis labels */}
        {xLabels.map(({ index, label }) => {
          const x = getX(index);
          return (
            <text
              key={`x-${index}`}
              x={x}
              y={marginTop + chartHeight + 16}
              textAnchor="middle"
              className="fill-gray-500"
              fontSize="9"
            >
              {label}
            </text>
          );
        })}

        {/* Mean line */}
        <line
          x1={marginLeft}
          y1={meanY}
          x2={svgWidth - marginRight}
          y2={meanY}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="6 4"
        />

        {/* Line path */}
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => {
          const isOutlier = outlierDates.has(p.date);
          const clampedScore = Math.max(yMin, Math.min(yMax, p.score));
          return (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(clampedScore)}
              r={isOutlier ? 5 : 3}
              fill={isOutlier ? "#ef4444" : "#f59e0b"}
              stroke={isOutlier ? "#fca5a5" : "#fbbf24"}
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-amber-500 rounded" />
          <span>Nota diária</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-gray-500 rounded border-dashed" />
          <span>Média ({mean.toFixed(1)})</span>
        </div>
        {outliers.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Outlier</span>
          </div>
        )}
      </div>
    </div>
  );
}
