import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Crown, Server, Database, TestTube, Activity, Shield,
  Clock, HardDrive, Cpu, MemoryStick, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, Users, Store, Star, Ticket
} from "lucide-react";
import { useState } from "react";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function SystemPanel() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"health" | "database" | "tests" | "audit">("health");

  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = trpc.systemPanel.health.useQuery();
  const { data: auditLog, isLoading: auditLoading } = trpc.systemPanel.auditLog.useQuery({ limit: 20 });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground">Apenas o Owner pode acessar esta página.</p>
          <Link href="/">
            <span className="text-primary hover:underline mt-4 inline-block">Voltar ao início</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "health" as const, label: "Servidor", icon: Server },
    { id: "database" as const, label: "Banco de Dados", icon: Database },
    { id: "tests" as const, label: "Testes", icon: TestTube },
    { id: "audit" as const, label: "Audit Log", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-900/20 to-background border-b border-blue-500/20 px-4 pt-6 pb-4">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                <Server className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h1 className="font-display text-2xl tracking-wider text-blue-400">SISTEMA</h1>
                <p className="text-xs text-muted-foreground">Monitoramento e saúde da infraestrutura</p>
              </div>
            </div>
            <button
              onClick={() => refetchHealth()}
              className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {health && (
        <div className={`px-4 py-2 ${health.database.status === "healthy" ? "bg-green-500/10" : "bg-red-500/10"}`}>
          <div className="container flex items-center gap-2">
            {health.database.status === "healthy" ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Todos os sistemas operacionais</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400 font-medium">Problemas detectados</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-400 text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 px-4">
        {/* Health Tab */}
        {activeTab === "health" && (
          <div className="space-y-6">
            {healthLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-lg" />)}
              </div>
            ) : health ? (
              <>
                {/* Server Status */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu className="w-5 h-5 text-blue-400" />
                    <h3 className="font-display text-lg text-foreground">Servidor</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-sm font-medium text-green-400">Online</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                      <p className="text-sm font-medium text-foreground">{formatUptime(health.server.uptime)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Node.js</p>
                      <p className="text-sm font-medium text-foreground">{health.server.nodeVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ambiente</p>
                      <p className="text-sm font-medium text-foreground">Production</p>
                    </div>
                  </div>
                </div>

                {/* Memory */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MemoryStick className="w-5 h-5 text-purple-400" />
                    <h3 className="font-display text-lg text-foreground">Memória</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Heap Usado</p>
                      <p className="text-sm font-medium text-foreground">{formatBytes(health.server.memoryUsage.heapUsed)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Heap Total</p>
                      <p className="text-sm font-medium text-foreground">{formatBytes(health.server.memoryUsage.heapTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">RSS</p>
                      <p className="text-sm font-medium text-foreground">{formatBytes(health.server.memoryUsage.rss)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">External</p>
                      <p className="text-sm font-medium text-foreground">{formatBytes(health.server.memoryUsage.external)}</p>
                    </div>
                  </div>
                </div>

                {/* Integrations */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <HardDrive className="w-5 h-5 text-green-400" />
                    <h3 className="font-display text-lg text-foreground">Integrações</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "OAuth (Manus)", status: "online" },
                      { name: "Storage (S3)", status: "online" },
                      { name: "Banco de Dados (TiDB)", status: health.database.status === "healthy" ? "online" : "error" },
                      { name: "Notificações", status: "online" },
                    ].map((integration) => (
                      <div key={integration.name} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{integration.name}</span>
                        <div className="flex items-center gap-1">
                          {integration.status === "online" ? (
                            <>
                              <div className="w-2 h-2 rounded-full bg-green-400" />
                              <span className="text-xs text-green-400">Online</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-red-400" />
                              <span className="text-xs text-red-400">Erro</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Database Tab */}
        {activeTab === "database" && (
          <div className="space-y-6">
            {healthLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-lg" />)}
              </div>
            ) : health ? (
              <>
                {/* DB Status */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-400" />
                      <h3 className="font-display text-lg text-foreground">Status do BD</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      {health.database.status === "healthy" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Status</p>
                      <p className={`text-sm font-medium ${health.database.status === "healthy" ? "text-green-400" : "text-red-400"}`}>
                        {health.database.status === "healthy" ? "Saudável" : "Com Problemas"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Latência</p>
                      <p className="text-sm font-medium text-foreground">{health.database.latency}ms</p>
                    </div>
                  </div>
                </div>

                {/* Table Sizes */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <h3 className="font-display text-lg text-foreground mb-4">Registros por Tabela</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Usuários", count: health.database.tables.users, icon: Users, color: "text-blue-400" },
                      { name: "Estabelecimentos", count: health.database.tables.establishments, icon: Store, color: "text-orange-400" },
                      { name: "Avaliações", count: health.database.tables.ratings, icon: Star, color: "text-amber-400" },
                      { name: "Tickets de Suporte", count: health.database.tables.supportTickets, icon: Ticket, color: "text-teal-400" },
                      { name: "Atribuições Suporte", count: health.database.tables.supportAssignments, icon: Shield, color: "text-purple-400" },
                    ].map((table) => {
                      const Icon = table.icon;
                      return (
                        <div key={table.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${table.color}`} />
                            <span className="text-sm text-foreground">{table.name}</span>
                          </div>
                          <span className="text-sm font-bold text-foreground">{table.count.toLocaleString("pt-BR")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === "tests" && (
          <div className="space-y-6">
            {healthLoading ? (
              <div className="animate-pulse h-32 bg-card rounded-lg" />
            ) : health ? (
              <>
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TestTube className="w-5 h-5 text-green-400" />
                    <h3 className="font-display text-lg text-foreground">Suite de Testes</h3>
                  </div>

                  {/* Big Number */}
                  <div className="text-center py-6">
                    <Link href="/owner/sistema/testes">
                      <p className="text-5xl font-bold text-green-400 cursor-pointer hover:text-green-300 underline-offset-4 hover:underline transition-colors">{health.tests.passing}</p>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">de {health.tests.total} testes passando</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Clique no número para ver todos os testes</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full transition-all"
                      style={{ width: `${(health.tests.passing / health.tests.total) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">{health.tests.passing} passando</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {health.tests.total - health.tests.passing > 0 ? (
                        <>
                          <XCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-red-400">{health.tests.total - health.tests.passing} falhando</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-xs text-green-400">Nenhuma falha</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Test Info */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <h3 className="font-display text-lg text-foreground mb-3">Informações</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Framework</span>
                      <span className="text-sm text-foreground">Vitest</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Última execução</span>
                      <span className="text-sm text-foreground">
                        {new Date(health.tests.lastRun).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cobertura</span>
                      <span className="text-sm text-foreground">20 arquivos de teste</span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <h2 className="font-display text-xl text-foreground">Atividade Recente</h2>
            {auditLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-card rounded-lg" />)}
              </div>
            ) : (
              <>
                {/* Recent User Changes */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h3 className="font-display text-lg text-foreground">Últimas Alterações de Usuários</h3>
                  </div>
                  <div className="space-y-3">
                    {auditLog?.recentUserChanges.slice(0, 10).map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.role === "admin" ? "bg-red-500/10 text-red-400" :
                            user.role === "owner" ? "bg-yellow-500/10 text-yellow-500" :
                            user.role === "support" ? "bg-teal-500/10 text-teal-400" :
                            user.role === "business" ? "bg-orange-500/10 text-orange-400" :
                            user.role === "influencer" ? "bg-yellow-400/10 text-yellow-400" :
                            "bg-gray-500/10 text-gray-400"
                          }`}>
                            {user.role}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString("pt-BR") : "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Tickets */}
                <div className="bg-card border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Ticket className="w-5 h-5 text-teal-400" />
                    <h3 className="font-display text-lg text-foreground">Tickets Recentes</h3>
                  </div>
                  {auditLog?.recentTickets && auditLog.recentTickets.length > 0 ? (
                    <div className="space-y-3">
                      {auditLog.recentTickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("pt-BR") : "-"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              ticket.priority === "high" ? "bg-red-500/10 text-red-400" :
                              ticket.priority === "medium" ? "bg-amber-500/10 text-amber-400" :
                              "bg-green-500/10 text-green-400"
                            }`}>
                              {ticket.priority === "high" ? "Alta" : ticket.priority === "medium" ? "Média" : "Baixa"}
                            </span>
                            <span className={`text-xs ${
                              ticket.status === "resolved" ? "text-green-400" :
                              ticket.status === "open" ? "text-amber-400" :
                              "text-muted-foreground"
                            }`}>
                              {ticket.status === "resolved" ? "Resolvido" : ticket.status === "open" ? "Aberto" : ticket.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum ticket registrado ainda</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
