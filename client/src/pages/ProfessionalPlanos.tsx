/**
 * Planos Profissionais — /critic/planos e /specialist/planos
 * Página para usuários solicitarem virar Crítico ou Especialista.
 * Inclui: plano R$19,90/mês + formulário de solicitação.
 * Acessível via: Perfil > Editar Perfil > Planos
 */
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "@/components/ui/sonner";
import { Crown, Check, Loader2, ArrowLeft, Star, Zap, Send, Clock, CheckCircle2 } from "lucide-react";
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
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    message: "",
    experience: "",
    portfolio: "",
    specialties: "",
  });
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const isCritic = location.includes("/critic/");
  const roleLabel = isCritic ? "Crítico" : "Especialista";
  const backPath = isCritic ? "/painel-critico/perfil" : "/painel-especialista/perfil";
  const requestedRole = isCritic ? "critic" as const : "specialist" as const;

  const { data: myPlan, refetch: refetchPlan } = trpc.plans.myPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myRequests, refetch: refetchRequests } = trpc.roleRequests.myRequests.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitRequest = trpc.roleRequests.submit.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada!", {
        description: "Sua solicitação será analisada pela equipe. Você receberá uma notificação quando for revisada.",
      });
      setShowRequestForm(false);
      setFormData({ message: "", experience: "", portfolio: "", specialties: "" });
      refetchRequests();
    },
    onError: (err) => {
      toast.error("Erro ao enviar solicitação", { description: err.message });
    },
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

  // Check if user already has the role or has a pending request
  const userAlreadyHasRole = user?.role === requestedRole;
  const pendingRequest = myRequests?.find(
    (r) => r.requestedRole === requestedRole && r.status === "pending"
  );
  const approvedRequest = myRequests?.find(
    (r) => r.requestedRole === requestedRole && r.status === "approved"
  );
  // Rejected requests are ignored — the form reappears allowing the user to re-submit

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

  const handleSubmitRequest = () => {
    if (formData.message.length < 10) {
      toast.error("Mensagem muito curta", { description: "Descreva brevemente por que deseja este perfil (mín. 10 caracteres)." });
      return;
    }
    submitRequest.mutate({
      requestedRole,
      message: formData.message,
      experience: formData.experience || undefined,
      portfolio: formData.portfolio || undefined,
      specialties: formData.specialties || undefined,
    });
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

          {/* Request Status Banner */}
          {pendingRequest && (
            <div className="mb-6 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">Solicitação em análise</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sua solicitação para se tornar {roleLabel} está sendo analisada pela equipe.
                    Enviada em {new Date(pendingRequest.createdAt).toLocaleDateString("pt-BR")}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {approvedRequest && !userAlreadyHasRole && (
            <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-400">Solicitação aprovada!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Parabéns! Sua solicitação foi aprovada. Faça logout e login novamente para ativar seu novo perfil.
                  </p>
                </div>
              </div>
            </div>
          )}



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

          {/* Plans Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              const isPopular = "popular" in plan && plan.popular;
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

          {/* Request to become Critic/Specialist */}
          {!userAlreadyHasRole && !pendingRequest && (
            <div className="mt-10">
              <div className={`p-6 rounded-2xl border ${
                isCritic ? "border-blue-500/30 bg-blue-500/5" : "border-primary/30 bg-primary/5"
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <Send className={`w-5 h-5 ${isCritic ? "text-blue-500" : "text-primary"}`} />
                  <h3 className={`font-display text-lg tracking-wider ${isCritic ? "text-blue-400" : "text-primary"}`}>
                    QUERO SER {roleLabel.toUpperCase()}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {isCritic
                    ? "Envie sua solicitação para se tornar um Crítico Gastronômico no AvaLyarin. Sua candidatura será analisada pela equipe administrativa."
                    : "Envie sua solicitação para se tornar um Especialista Gastronômico no AvaLyarin. Sua candidatura será analisada pela equipe administrativa."}
                </p>

                {!showRequestForm ? (
                  <Button
                    onClick={() => setShowRequestForm(true)}
                    className={`font-display tracking-wider ${
                      isCritic ? "bg-blue-500 hover:bg-blue-600 text-white" : "glow-amber"
                    }`}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    SOLICITAR PERFIL DE {roleLabel.toUpperCase()}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Message - required */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Por que você deseja ser {roleLabel}? *
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={isCritic
                          ? "Descreva sua motivação para se tornar um crítico gastronômico..."
                          : "Descreva sua motivação para se tornar um especialista gastronômico..."}
                        className="w-full min-h-[100px] p-3 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        maxLength={1000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{formData.message.length}/1000 caracteres (mín. 10)</p>
                    </div>

                    {/* Experience */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Experiência profissional/gastronômica
                      </label>
                      <textarea
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder={isCritic
                          ? "Ex: 5 anos escrevendo sobre gastronomia, colunista no jornal X, blog de reviews..."
                          : "Ex: Formação em gastronomia pela escola X, 10 anos como chef, especialização em cozinha japonesa..."}
                        className="w-full min-h-[80px] p-3 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        maxLength={2000}
                      />
                    </div>

                    {/* Portfolio */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Portfólio / Redes sociais
                      </label>
                      <textarea
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                        placeholder="Links do seu Instagram, blog, canal YouTube, LinkedIn ou outros perfis relevantes..."
                        className="w-full min-h-[60px] p-3 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        maxLength={1000}
                      />
                    </div>

                    {/* Specialties - only for specialist */}
                    {!isCritic && (
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">
                          Áreas de especialidade
                        </label>
                        <textarea
                          value={formData.specialties}
                          onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                          placeholder="Ex: Cozinha japonesa, vinhos franceses, confeitaria artesanal, cerveja artesanal..."
                          className="w-full min-h-[60px] p-3 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          maxLength={1000}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowRequestForm(false)}
                        className="font-display tracking-wider"
                      >
                        CANCELAR
                      </Button>
                      <Button
                        onClick={handleSubmitRequest}
                        disabled={submitRequest.isPending || formData.message.length < 10}
                        className={`font-display tracking-wider ${
                          isCritic ? "bg-blue-500 hover:bg-blue-600 text-white" : "glow-amber"
                        }`}
                      >
                        {submitRequest.isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
                        ) : (
                          <><Send className="w-4 h-4 mr-2" /> ENVIAR SOLICITAÇÃO</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
