/**
 * Planos Profissionais — /critic/planos e /specialist/planos
 * Página para críticos e especialistas verem e assinarem o plano profissional (R$19,90/mês).
 * Acessível via: Perfil > Editar Perfil > Planos
 */
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "@/components/ui/sonner";
import { Crown, Check, Loader2, ArrowLeft, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProfessionalPlanos() {
  const [upgradeDialog, setUpgradeDialog] = useState<{ plan: string; name: string; price: number } | null>(null);
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const isCritic = location.includes("/critic/");
  const roleLabel = isCritic ? "Crítico" : "Especialista";
  const backPath = isCritic ? "/painel-critico/perfil" : "/painel-especialista/perfil";

  const { data: myPlan, refetch: refetchPlan } = trpc.plans.myPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const upgradeMutation = trpc.plans.upgrade.useMutation({
    onSuccess: () => {
      toast.success("Plano ativado!", {
        description: `Seu plano profissional foi atualizado com sucesso.`,
      });
      refetchPlan();
      setUpgradeDialog(null);
    },
    onError: (err) => {
      toast.error("Erro ao ativar plano", { description: err.message });
    },
  });

  const cancelMutation = trpc.plans.cancel.useMutation({
    onSuccess: () => {
      toast.success("Assinatura cancelada", {
        description: "Seu plano continuará ativo até o fim do período atual.",
      });
      refetchPlan();
    },
    onError: (err) => {
      toast.error("Erro ao cancelar", { description: err.message });
    },
  });

  const currentPlan = myPlan?.plan ?? "free";

  const handleSelectPlan = (planId: string, planName: string, price: number) => {
    if (planId === currentPlan) {
      toast("Você já está neste plano!");
      return;
    }
    if (planId === "free") {
      cancelMutation.mutate();
      return;
    }
    setUpgradeDialog({ plan: planId, name: planName, price });
  };

  const confirmUpgrade = () => {
    if (!upgradeDialog) return;
    upgradeMutation.mutate({ plan: upgradeDialog.plan as "premium" | "embaixador" });
  };

  const plans = [
    {
      id: "free",
      name: "Gratuito",
      price: 0,
      period: "",
      features: [
        "Perfil profissional básico",
        "Avaliações com destaque padrão",
        "Acesso ao painel de métricas",
      ],
    },
    {
      id: "premium",
      name: "Profissional",
      price: 19.9,
      period: "/mês",
      popular: true,
      features: [
        "Tudo do plano gratuito",
        "Avaliações ilimitadas",
        "Destaque premium nas avaliações",
        "Parcerias com estabelecimentos",
        "Códigos promocionais exclusivos",
        "Convites para inaugurações",
        "Suporte prioritário",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24">
        <div className="container max-w-2xl">
          {/* Back link */}
          <Link href={backPath}>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao perfil
            </span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              isCritic 
                ? "bg-blue-500/10 border-blue-500/30" 
                : "bg-primary/10 border-primary/30"
            }`}>
              <Crown className={`w-6 h-6 ${isCritic ? "text-blue-500" : "text-primary"}`} />
            </div>
            <div>
              <h2 className={`font-display text-2xl tracking-wider ${isCritic ? "text-blue-400" : "text-primary"}`}>
                PLANO {roleLabel.toUpperCase()}
              </h2>
              <p className="text-sm text-muted-foreground">Eleve sua atuação profissional</p>
            </div>
          </div>

          {/* Current plan indicator */}
          {isAuthenticated && myPlan && (
            <div className={`mb-8 p-4 rounded-xl border ${
              isCritic ? "bg-blue-500/5 border-blue-500/20" : "bg-primary/5 border-primary/20"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seu plano atual</p>
                  <p className={`font-display text-lg tracking-wider ${isCritic ? "text-blue-400" : "text-primary"}`}>
                    {currentPlan === "free" ? "GRATUITO" : "PROFISSIONAL"}
                  </p>
                </div>
              </div>
              {myPlan.subscription && (
                <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Válido até {myPlan.subscription.expiresAt ? new Date(myPlan.subscription.expiresAt).toLocaleDateString("pt-BR") : "—"}
                  </p>
                  {currentPlan !== "free" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? "Cancelando..." : "Cancelar assinatura"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isPopular = "popular" in plan && plan.popular;
              const accentColor = isCritic ? "blue-500" : "primary";
              return (
                <div
                  key={plan.id}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    isPopular
                      ? isCritic
                        ? "border-blue-500/40 bg-blue-500/5 shadow-lg shadow-blue-500/5"
                        : "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
                      : isCurrent
                      ? isCritic
                        ? "border-blue-500/60 bg-card ring-2 ring-blue-500/20"
                        : "border-primary/60 bg-card ring-2 ring-primary/20"
                      : "border-border/30 bg-card/50"
                  }`}
                >
                  {isPopular && !isCurrent && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-display tracking-wider ${
                      isCritic ? "bg-blue-500" : "bg-primary"
                    }`}>
                      RECOMENDADO
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-display tracking-wider">
                      ATUAL
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    isPopular || isCurrent
                      ? isCritic ? "bg-blue-500/20 text-blue-500" : "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {isPopular ? <Zap className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                  </div>

                  <h3 className="font-display text-lg tracking-wider text-foreground">{plan.name.toUpperCase()}</h3>
                  <div className="flex items-baseline gap-1 mt-1 mb-4">
                    <span className="font-numbers text-2xl font-bold text-foreground">
                      {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}
                    </span>
                    {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                          isCurrent || isPopular
                            ? isCritic ? "text-blue-500" : "text-primary"
                            : "text-muted-foreground"
                        }`} />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id, plan.name, plan.price)}
                    variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
                    className={`w-full font-display tracking-wider ${
                      isPopular && !isCurrent
                        ? isCritic ? "bg-blue-500 hover:bg-blue-600 text-white" : "glow-amber"
                        : ""
                    }`}
                    disabled={isCurrent || upgradeMutation.isPending}
                  >
                    {isCurrent ? "PLANO ATUAL" : plan.price === 0 ? "VOLTAR AO GRÁTIS" : "ESCOLHER PLANO"}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Info */}
          <div className="mt-8 p-4 rounded-xl bg-card/50 border border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Nesta versão beta, o upgrade é concedido automaticamente sem cobrança real.
              O sistema de pagamento será integrado em breve.
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade confirmation dialog */}
      <Dialog open={!!upgradeDialog} onOpenChange={() => setUpgradeDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">CONFIRMAR UPGRADE</DialogTitle>
            <DialogDescription>
              Você está prestes a ativar o plano <strong>{upgradeDialog?.name}</strong> por{" "}
              <strong>R$ {upgradeDialog?.price.toFixed(2).replace(".", ",")}/mês</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              O pagamento será processado e seu plano será ativado imediatamente.
              Você pode cancelar a qualquer momento.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmUpgrade}
              disabled={upgradeMutation.isPending}
              className="font-display tracking-wider"
            >
              {upgradeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Ativando...</>
              ) : (
                "ATIVAR PLANO"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
