// Design: AvaLyarin — Planos page with real backend integration
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { toast } from "@/components/ui/sonner";
import { Crown, Check, Star, Zap, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Planos() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [upgradeDialog, setUpgradeDialog] = useState<{ plan: string; name: string; price: number } | null>(null);
  const { user, isAuthenticated } = useAuth();

  const { data: planOptions } = trpc.plans.options.useQuery();
  const { data: myPlan, refetch: refetchPlan } = trpc.plans.myPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const upgradeMutation = trpc.plans.upgrade.useMutation({
    onSuccess: (data) => {
      toast.success("Plano ativado!", {
        description: `Seu plano foi atualizado com sucesso. Válido até ${new Date(data.expiresAt!).toLocaleDateString("pt-BR")}.`,
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

  const planIcons: Record<string, React.ReactNode> = {
    free: <Star className="w-6 h-6" />,
    premium: <Zap className="w-6 h-6" />,
    embaixador: <Shield className="w-6 h-6" />,
  };

  const handleSelectPlan = (planId: string, planName: string, price: number) => {
    if (planId === currentPlan) {
      toast("Você já está neste plano!");
      return;
    }
    if (planId === "free") {
      // Downgrade
      cancelMutation.mutate();
      return;
    }
    // Show upgrade dialog
    setUpgradeDialog({ plan: planId, name: planName, price });
  };

  const confirmUpgrade = () => {
    if (!upgradeDialog) return;
    upgradeMutation.mutate({ plan: upgradeDialog.plan as "premium" | "embaixador" });
  };

  const userPlans = planOptions?.user ?? [
    { id: "free", name: "Explorador", price: 0, period: "", features: ["3 avaliações por dia", "Até 3 grupos", "Perfil básico"] },
    { id: "premium", name: "Conhecedor", price: 9.9, period: "/mês", popular: true, features: ["5 avaliações por dia", "Grupos ilimitados", "Selo Conhecedor"] },
    { id: "embaixador", name: "Embaixador", price: 19.9, period: "/mês", features: ["Avaliações ilimitadas", "Descontos em parceiros", "Eventos exclusivos"] },
  ];

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-28 pb-24">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">PLANOS</h2>
              <p className="text-sm text-muted-foreground">Escolha o plano ideal para você</p>
            </div>
          </div>

          {/* Current plan indicator */}
          {isAuthenticated && myPlan && (
            <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seu plano atual</p>
                  <p className="font-display text-lg tracking-wider text-primary">
                    {currentPlan === "free" ? "EXPLORADOR" : currentPlan === "premium" ? "CONHECEDOR" : "EMBAIXADOR"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Avaliações hoje</p>
                  <p className="font-numbers text-lg font-bold text-foreground">
                    {myPlan.ratingsToday !== null ? `${myPlan.ratingsToday} restantes` : "Ilimitadas"}
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

          <div className="grid gap-4 md:grid-cols-3">
            {userPlans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isPopular = "popular" in plan && plan.popular;
              return (
                <div
                  key={plan.id}
                  className={`relative p-5 rounded-2xl border transition-all ${
                    isPopular
                      ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
                      : isCurrent
                      ? "border-primary/60 bg-card ring-2 ring-primary/20"
                      : "border-border/30 bg-card/50"
                  }`}
                >
                  {isPopular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-display tracking-wider">
                      POPULAR
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-green-600 text-white text-[10px] font-display tracking-wider">
                      ATUAL
                    </div>
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                    isCurrent ? "bg-primary/20 text-primary" : isPopular ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {planIcons[plan.id] || <Star className="w-6 h-6" />}
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
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isCurrent || isPopular ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectPlan(plan.id, plan.name, plan.price)}
                    variant={isCurrent ? "outline" : isPopular ? "default" : "outline"}
                    className={`w-full font-display tracking-wider ${isPopular && !isCurrent ? "glow-amber" : ""}`}
                    disabled={isCurrent || upgradeMutation.isPending}
                  >
                    {isCurrent ? "PLANO ATUAL" : plan.price === 0 ? "VOLTAR AO GRÁTIS" : "ESCOLHER PLANO"}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Business plans section */}
          {planOptions?.business && (
            <div className="mt-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl tracking-wider text-primary">PLANOS EMPRESARIAIS</h2>
                  <p className="text-sm text-muted-foreground">Para estabelecimentos parceiros</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {planOptions.business.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-5 rounded-2xl border transition-all ${
                      plan.id === "premium"
                        ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
                        : "border-border/30 bg-card/50"
                    }`}
                  >
                    <h3 className="font-display text-lg tracking-wider text-foreground">{plan.name.toUpperCase()}</h3>
                    <div className="flex items-baseline gap-1 mt-1 mb-4">
                      <span className="font-numbers text-2xl font-bold text-foreground">
                        {plan.price === 0 ? "Grátis" : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}
                      </span>
                      {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.id === "premium" ? "text-primary" : "text-muted-foreground"}`} />
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                Nesta versão beta, o upgrade é concedido automaticamente sem cobrança real.
                O sistema de pagamento será integrado em breve.
              </p>
            </div>
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
