/**
 * BusinessPromoRequests — gerenciamento de pedidos de código promocional
 * recebidos de critics e specialists, dentro de /business/divulgacoes/codigos.
 *
 * 3 sub-abas:
 * - Pedido de código (pending) — cards safira (critic) ou âmbar (specialist)
 * - Códigos vigentes (accepted)
 * - Em espera (on_hold)
 *
 * Ações: Aceitar → vai para "Códigos vigentes" (criador é notificado);
 *        Em Espera → vai para "Em espera" (criador NÃO é notificado).
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Tag, Inbox, CheckCircle2, PauseCircle, Newspaper, Star } from "lucide-react";
import { FourPointStar } from "@/components/FourPointStar";

type SubTab = "pedidos" | "vigentes" | "espera";

const TYPE_LABEL: Record<string, string> = {
  percentage: "% Desconto",
  buy_one_get_one: "Pague 1 Leve 2",
  free_item: "Item Grátis",
  fixed_discount: "R$ Desconto",
};

function RequestCard({
  request,
  showActions,
  onAccept,
  onHold,
  isResponding,
}: {
  request: any;
  showActions: boolean;
  onAccept?: () => void;
  onHold?: () => void;
  isResponding?: boolean;
}) {
  const isCritic = request.creatorType === "critic";
  // Safira para critic, âmbar para specialist
  const cardColors = isCritic
    ? "border-blue-500/40 bg-blue-500/5"
    : "border-amber-500/40 bg-amber-500/5";
  const accentText = isCritic ? "text-blue-400" : "text-amber-400";
  const roleLabel = isCritic ? "Crítico" : "Especialista";

  return (
    <div className={`p-4 rounded-xl border ${cardColors}`}>
      {/* Criador */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FourPointStar variant={isCritic ? "critic" : "specialist"} size={16} />
          <span className={`text-xs font-medium ${accentText}`}>{roleLabel}</span>
          <span className="text-sm text-foreground">{request.creatorName}</span>
          {request.creatorUsername && (
            <span className="text-xs text-muted-foreground">@{request.creatorUsername}</span>
          )}
        </div>
      </div>

      {/* Código */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-mono text-lg font-bold tracking-wider ${accentText}`}>{request.code}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {TYPE_LABEL[request.type] || request.type}
            {request.value ? ` • ${request.type === "percentage" ? `${request.value}%` : `R$${request.value}`}` : ""}
            {request.maxUses ? ` • Limite: ${request.maxUses} usos` : ""}
          </p>
        </div>
        {request.expiresAt && (
          <p className="text-[11px] text-muted-foreground shrink-0">
            Válido até {new Date(request.expiresAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      {request.description && (
        <p className="text-xs text-muted-foreground/80 mt-1">{request.description}</p>
      )}

      <p className="text-[11px] text-muted-foreground mt-2">
        Estabelecimento: <span className="text-foreground/80">{request.establishmentName}</span>
      </p>

      {/* Ações */}
      {showActions && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={onAccept}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Aceitar
          </button>
          <button
            onClick={onHold}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-card border border-border hover:bg-secondary text-foreground rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <PauseCircle className="w-4 h-4" />
            Em Espera
          </button>
        </div>
      )}
    </div>
  );
}

export function BusinessPromoRequests() {
  const [subTab, setSubTab] = useState<SubTab>("pedidos");
  const utils = trpc.useUtils();

  const { data: requests, isLoading } = trpc.promo.businessRequests.useQuery();

  const respondMutation = trpc.promo.respondToRequest.useMutation({
    onSuccess: (data) => {
      if (data.action === "accepted") {
        toast.success(`Código ${data.code} aceito! O criador foi notificado.`);
      } else {
        toast.success(`Código ${data.code} colocado em espera.`);
      }
      utils.promo.businessRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const pending = (requests || []).filter((r: any) => r.linkStatus === "pending");
  const accepted = (requests || []).filter((r: any) => r.linkStatus === "accepted");
  const onHold = (requests || []).filter((r: any) => r.linkStatus === "on_hold");

  const subTabs: { id: SubTab; label: string; count: number; icon: React.ElementType }[] = [
    { id: "pedidos", label: "Pedido de código", count: pending.length, icon: Inbox },
    { id: "vigentes", label: "Códigos vigentes", count: accepted.length, icon: CheckCircle2 },
    { id: "espera", label: "Em espera", count: onHold.length, icon: PauseCircle },
  ];

  const currentList = subTab === "pedidos" ? pending : subTab === "vigentes" ? accepted : onHold;

  const emptyMessages: Record<SubTab, string> = {
    pedidos: "Nenhum pedido de código pendente.",
    vigentes: "Nenhum código vigente no momento.",
    espera: "Nenhum código em espera.",
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg text-foreground">Pedidos de Códigos</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Códigos promocionais solicitados por críticos e especialistas para seus estabelecimentos.
        </p>
      </div>

      {/* Sub-abas */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border/30">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-all ${
                subTab === tab.id
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  subTab === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-10">
          <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{emptyMessages[subTab]}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((request: any) => (
            <RequestCard
              key={request.linkId}
              request={request}
              showActions={subTab === "pedidos" || subTab === "espera"}
              isResponding={respondMutation.isPending}
              onAccept={() => respondMutation.mutate({ linkId: request.linkId, action: "accepted" })}
              onHold={subTab === "pedidos" ? () => respondMutation.mutate({ linkId: request.linkId, action: "on_hold" }) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
