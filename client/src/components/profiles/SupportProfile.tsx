import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Headphones, Store, Ticket, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type TabId = "estabs" | "tickets" | "resolvidos";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "estabs", label: "Meus Estabs", icon: Store },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "resolvidos", label: "Resolvidos", icon: CheckCircle2 },
];

const PRIORITY_COLORS = {
  low: "text-green-500 bg-green-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  high: "text-red-500 bg-red-500/10",
  urgent: "text-red-700 bg-red-700/10",
};

export default function SupportProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("estabs");

  const { data: stats } = trpc.support.myStats.useQuery(undefined, { enabled: !!user });
  const { data: assignments } = trpc.support.myAssignments.useQuery(undefined, { enabled: !!user });
  const { data: tickets } = trpc.support.myTickets.useQuery(undefined, { enabled: !!user });

  return (
    <div className="pb-20">
      {/* Profile Info */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar with teal border */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center overflow-hidden border-[3px] border-teal-500">
              {user?.name ? (
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <Headphones className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center border-2 border-background">
              <Headphones className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-lg text-foreground truncate">
                {user?.name || "Suporte"}
              </h2>
              <span className="px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-500 text-[10px] font-bold">
                SUPORTE
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">Time de Atendimento Avalyarin</p>
            <p className="text-xs text-muted-foreground mt-1">
              Carteira: <strong className="text-foreground">{stats?.totalEstabs ?? 0}</strong> estabelecimentos
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20 text-center">
            <Store className="w-5 h-5 mx-auto text-teal-500 mb-1" />
            <span className="text-lg font-bold text-foreground">{stats?.totalEstabs ?? 0}</span>
            <p className="text-[10px] text-muted-foreground">vinculados</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
            <Clock className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <span className="text-lg font-bold text-foreground">{stats?.openTickets ?? 0}</span>
            <p className="text-[10px] text-muted-foreground">abertos</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <span className="text-lg font-bold text-foreground">{stats?.resolvedToday ?? 0}</span>
            <p className="text-[10px] text-muted-foreground">hoje</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-border/50">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-colors",
                  isActive ? "border-teal-500 text-teal-500" : "border-transparent text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4">
        {activeTab === "estabs" && <EstabsList assignments={assignments ?? []} />}
        {activeTab === "tickets" && <TicketsList tickets={(tickets ?? []).filter((t: any) => t.status !== "resolved")} />}
        {activeTab === "resolvidos" && <TicketsList tickets={(tickets ?? []).filter((t: any) => t.status === "resolved")} />}
      </div>
    </div>
  );
}

function EstabsList({ assignments }: { assignments: any[] }) {
  if (assignments.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Nenhum estabelecimento vinculado</div>;
  }
  return (
    <div className="space-y-2">
      {assignments.map((a: any) => (
        <div key={a.id} className="p-3 rounded-lg bg-card border border-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-teal-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{a.estabName}</p>
            <p className="text-xs text-muted-foreground">{a.estabNeighborhood}</p>
          </div>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-medium",
            a.estabStatus === "active" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {a.estabStatus === "active" ? "Ativo" : "Inativo"}
          </span>
        </div>
      ))}
    </div>
  );
}

function TicketsList({ tickets }: { tickets: any[] }) {
  if (tickets.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Nenhum ticket</div>;
  }
  return (
    <div className="space-y-2">
      {tickets.map((t: any) => (
        <div key={t.id} className="p-3 rounded-lg bg-card border border-border/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.estabName}</p>
            </div>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0",
              PRIORITY_COLORS[t.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium
            )}>
              {t.priority === "low" ? "BAIXA" : t.priority === "medium" ? "MÉDIA" : t.priority === "high" ? "ALTA" : "URGENTE"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
            <span className="font-mono">{t.code}</span>
            <span>•</span>
            <span>{new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
