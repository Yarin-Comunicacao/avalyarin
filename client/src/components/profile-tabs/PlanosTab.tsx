import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Clock, CheckCircle2, CreditCard, Zap, ArrowRight, ArrowLeft, Send, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FourPointStar } from "@/components/FourPointStar";
import { useOwnerView } from "@/contexts/OwnerViewContext";

// Crown icon inline since lucide doesn't always have it
function Crown(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}

export default function PlanosTab() {
  const { user, isAuthenticated } = useAuth();
  const { viewingAs } = useOwnerView();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<"critic" | "specialist" | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({ message: "", experience: "", portfolio: "", specialties: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{ valid: boolean; message?: string; discountType?: string; discountValue?: number; description?: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // ALL hooks MUST be called before any conditional returns (React rules of hooks)
  const actualRole = user?.role;
  // When owner/admin is viewing as another role, use that role for display
  const userRole = (actualRole === "owner" || actualRole === "admin") && viewingAs
    ? viewingAs
    : actualRole;

  const { data: myRequests, refetch: refetchRequests } = trpc.roleRequests.myRequests.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myPlan, refetch: refetchPlan } = trpc.plans.myPlan.useQuery(undefined, { enabled: isAuthenticated });
  const { data: planOptions } = trpc.plans.options.useQuery(undefined, { enabled: isAuthenticated });

  // Handle Stripe payment redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      toast.success('Pagamento confirmado!', { description: 'Seu plano foi ativado com sucesso.' });
      refetchPlan();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (payment === 'cancelled') {
      toast.info('Pagamento cancelado', { description: 'Você pode tentar novamente quando quiser.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const submitRequest = trpc.roleRequests.submit.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada!", { description: "Sua solicitação será analisada pela equipe." });
      setFormData({ message: "", experience: "", portfolio: "", specialties: "" });
      setFormErrors({});
      refetchRequests();
    },
    onError: (err) => toast.error("Erro ao enviar solicitação", { description: err.message }),
  });

  const checkoutMutation = trpc.plans.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.sessionId === "free") {
        toast.success("Plano gratuito ativado!");
        refetchPlan();
      } else if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    },
    onError: (err) => toast.error("Erro ao iniciar pagamento", { description: err.message }),
  });

  // Wrapper to maintain compatibility
  const upgradeMutation = {
    mutate: (params: any) => {
      const planId = typeof params.plan === 'number' ? params.plan : parseInt(params.plan);
      checkoutMutation.mutate({
        planId,
        successUrl: `${window.location.origin}/perfil?payment=success`,
        cancelUrl: `${window.location.origin}/perfil?payment=cancelled`,
        promoCode: params.promoCode,
      });
    },
    isPending: checkoutMutation.isPending,
  };

  const validatePromoMutation = trpc.plans.validatePromo.useQuery(
    { code: promoCode },
    { enabled: false }
  );

  // Validate promo code
  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Digite um código promocional");
      return;
    }
    setPromoLoading(true);
    try {
      const result = await validatePromoMutation.refetch();
      if (result.data) {
        setPromoResult(result.data as any);
        if (result.data.valid) {
          toast.success("Código aplicado!", { description: (result.data as any).description || "Desconto aplicado com sucesso." });
        } else {
          toast.error((result.data as any).message || "Código inválido");
        }
      }
    } catch {
      toast.error("Erro ao validar código");
      setPromoResult(null);
    } finally {
      setPromoLoading(false);
    }
  };

  // Validate form fields
  const validateFormFields = (fields: any[]): boolean => {
    const errors: Record<string, string> = {};
    let hasError = false;

    fields.forEach((field: any) => {
      if (field.required && (!formData[field.name] || !formData[field.name].trim())) {
        errors[field.name] = `${field.label} é obrigatório`;
        hasError = true;
      }
      // URL validation
      if (field.type === "url" && formData[field.name]?.trim()) {
        try {
          new URL(formData[field.name]);
        } catch {
          errors[field.name] = "URL inválida. Inclua http:// ou https://";
          hasError = true;
        }
      }
      // Email validation
      if (field.type === "email" && formData[field.name]?.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.name])) {
          errors[field.name] = "Email inválido";
          hasError = true;
        }
      }
      // Textarea min length
      if (field.type === "textarea" && field.required && formData[field.name]?.trim().length < 10) {
        errors[field.name] = `${field.label} deve ter pelo menos 10 caracteres`;
        hasError = true;
      }
    });

    setFormErrors(errors);
    return !hasError;
  };

  // Check for pending/approved requests
  const pendingRequest = myRequests?.find((r: any) => r.status === "pending");
  const approvedRequest = myRequests?.find((r: any) => r.status === "approved");

  // Helper: calculate discounted price
  const getDiscountedPrice = (originalPrice: number): number => {
    if (!promoResult?.valid) return originalPrice;
    if (promoResult.discountType === "percentage") {
      return originalPrice * (1 - (promoResult.discountValue || 0) / 100);
    }
    if (promoResult.discountType === "fixed_discount") {
      return Math.max(0, originalPrice - (promoResult.discountValue || 0));
    }
    return originalPrice;
  };

  // ===== BUSINESS ROLE: show only Business plans =====
  if (userRole === "business") {
    const businessPlans = (planOptions as any)?.business || [];
    return (
      <div className="py-4 space-y-5">
        <div className="flex items-center gap-3">
          <Crown className="w-10 h-10 text-primary" />
          <div>
            <h3 className="font-display text-lg text-foreground tracking-wider">PLANO BUSINESS</h3>
            <p className="text-xs text-muted-foreground">Para donos de estabelecimentos</p>
          </div>
        </div>

        {businessPlans.length > 0 ? (
          <div className="space-y-4">
            {businessPlans.map((plan: any) => (
              <div key={plan.id} className={`rounded-xl bg-card border ${myPlan?.plan === plan.id ? 'border-green-400/50' : 'border-primary/30'} p-5 space-y-4`}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <h4 className="font-display text-lg text-foreground tracking-wider">{plan.name.toUpperCase()}</h4>
                    {plan.price > 0 && (
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-display text-2xl text-primary">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
                        <span className="text-xs text-muted-foreground">{plan.period}</span>
                      </div>
                    )}
                    {plan.price === 0 && <p className="text-sm text-green-400 mt-1">Gratuito</p>}
                  </div>
                  {myPlan?.plan === plan.id && (
                    <span className="text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded-full">Ativo</span>
                  )}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {myPlan?.plan !== plan.id && plan.price > 0 && (
                  <div className="space-y-3">
                    {/* Promo Code Field */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                          placeholder="Código promocional"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleValidatePromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="px-4"
                      >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                    {promoResult && (
                      <p className={`text-xs ${promoResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {promoResult.valid
                          ? `✓ ${promoResult.description || 'Desconto aplicado!'} (${promoResult.discountType === 'percentage' ? `${promoResult.discountValue}% off` : `R$ ${promoResult.discountValue?.toFixed(2)} off`})`
                          : promoResult.message}
                      </p>
                    )}
                    {/* Price with discount */}
                    {promoResult?.valid && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground line-through">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
                        <span className="font-display text-xl text-green-400">R$ {getDiscountedPrice(plan.price).toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => upgradeMutation.mutate({ plan: plan.id, promoCode: promoResult?.valid ? promoCode : undefined } as any)}
                      disabled={upgradeMutation.isPending}
                      className="w-full bg-primary text-primary-foreground"
                    >
                      {upgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                      Assinar {plan.name}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
          </div>
        )}
      </div>
    );
  }

  // ===== PENDING REQUEST =====
  if (pendingRequest) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="font-display text-lg text-foreground tracking-wider mb-2">SOLICITAÇÃO EM ANÁLISE</h3>
        <p className="text-sm text-muted-foreground">Sua solicitação para {pendingRequest.requestedRole === "critic" ? "Crítico" : "Especialista"} está sendo analisada.</p>
      </div>
    );
  }

  // ===== APPROVED REQUEST (not yet activated) =====
  if (approvedRequest && !myPlan?.plan) {
    return (
      <div className="py-4 space-y-5">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="font-display text-lg text-foreground tracking-wider mb-2">APROVADO!</h3>
          <p className="text-sm text-muted-foreground mb-4">Sua solicitação foi aprovada. Ative seu plano abaixo.</p>
        </div>

        {/* Promo Code Field */}
        <div className="rounded-xl bg-card border border-border/50 p-4 space-y-3">
          <label className="text-xs text-muted-foreground block">Tem um código promocional?</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                placeholder="Código promocional"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidatePromo}
              disabled={promoLoading || !promoCode.trim()}
              className="px-4"
            >
              {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
            </Button>
          </div>
          {promoResult && (
            <p className={`text-xs ${promoResult.valid ? 'text-green-400' : 'text-red-400'}`}>
              {promoResult.valid
                ? `✓ ${promoResult.description || 'Desconto aplicado!'}`
                : promoResult.message}
            </p>
          )}
        </div>

        <Button
          onClick={() => upgradeMutation.mutate({ plan: approvedRequest.requestedRole === "critic" ? "premium" : "embaixador", promoCode: promoResult?.valid ? promoCode : undefined } as any)}
          disabled={upgradeMutation.isPending}
          className="w-full bg-primary text-primary-foreground"
        >
          {upgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          Ativar Plano
        </Button>
      </div>
    );
  }

  // ===== CRITIC/SPECIALIST ROLE: show benefits =====
  if (userRole === "critic" || userRole === "specialist") {
    const isCritic = userRole === "critic";
    const benefits = isCritic
      ? [
          "Avaliações com peso diferenciado no ranking",
          "Badge exclusivo de Crítico no perfil",
          "Acesso ao Painel do Crítico",
          "Grupos ilimitados",
          "Prioridade em eventos e parcerias",
          "Destaque nas avaliações dos estabelecimentos",
        ]
      : [
          "Badge exclusivo de Especialista no perfil",
          "Acesso ao Painel do Especialista",
          "Grupos ilimitados",
          "Scan de cardápios com IA",
          "Conteúdo exclusivo para seguidores",
          "Prioridade em eventos e parcerias",
        ];
    return (
      <div className="py-4 space-y-5">
        <div className="flex items-center gap-3">
          <FourPointStar variant={isCritic ? "critic" : "specialist"} className="w-10 h-10" />
          <div>
            <h3 className="font-display text-lg text-foreground tracking-wider">
              {isCritic ? "CRÍTICO" : "ESPECIALISTA"}
            </h3>
            <p className="text-xs text-muted-foreground">Plano ativo</p>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/50 p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">Seus benefícios:</h4>
          <ul className="space-y-2">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground/60 text-center">
          Membro desde a aprovação do seu perfil profissional.
        </p>
      </div>
    );
  }

  // ===== USER ROLE: show plan options =====
  if (userRole === "user") {
    const userPlans = (planOptions as any)?.user || [];
    if (userPlans.length > 0) {
      return (
        <div className="py-4 space-y-5">
          <div className="flex items-center gap-3">
            <Crown className="w-10 h-10 text-primary" />
            <div>
              <h3 className="font-display text-lg text-foreground tracking-wider">PLANOS</h3>
              <p className="text-xs text-muted-foreground">Escolha o plano ideal para você</p>
            </div>
          </div>
          <div className="space-y-4">
            {userPlans.map((plan: any) => (
              <div key={plan.id} className={`rounded-xl bg-card border ${myPlan?.plan === plan.id ? 'border-green-400/50' : plan.popular ? 'border-primary/50' : 'border-border/50'} p-5 space-y-4 relative`}>
                {plan.popular && (
                  <span className="absolute -top-2 right-4 text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">Popular</span>
                )}
                <div className="flex items-baseline justify-between">
                  <div>
                    <h4 className="font-display text-lg text-foreground tracking-wider">{plan.name.toUpperCase()}</h4>
                    {plan.price > 0 && (
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-display text-2xl text-primary">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
                        <span className="text-xs text-muted-foreground">{plan.period}</span>
                      </div>
                    )}
                    {plan.price === 0 && <p className="text-sm text-green-400 mt-1">Gratuito</p>}
                  </div>
                  {myPlan?.plan === plan.id && (
                    <span className="text-xs bg-green-400/10 text-green-400 px-2 py-1 rounded-full">Ativo</span>
                  )}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {myPlan?.plan !== plan.id && plan.price > 0 && (
                  <div className="space-y-3">
                    {/* Promo Code Field */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                          placeholder="Código promocional"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleValidatePromo}
                        disabled={promoLoading || !promoCode.trim()}
                        className="px-4"
                      >
                        {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                    {promoResult && (
                      <p className={`text-xs ${promoResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {promoResult.valid
                          ? `✓ ${promoResult.description || 'Desconto aplicado!'} (${promoResult.discountType === 'percentage' ? `${promoResult.discountValue}% off` : `R$ ${promoResult.discountValue?.toFixed(2)} off`})`
                          : promoResult.message}
                      </p>
                    )}
                    {promoResult?.valid && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-muted-foreground line-through">R$ {Number(plan.price).toFixed(2).replace('.', ',')}</span>
                        <span className="font-display text-xl text-green-400">R$ {getDiscountedPrice(plan.price).toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => upgradeMutation.mutate({ plan: plan.id, promoCode: promoResult?.valid ? promoCode : undefined } as any)}
                      disabled={upgradeMutation.isPending}
                      className="w-full bg-primary text-primary-foreground"
                    >
                      {upgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                      Assinar {plan.name}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  // ===== ACTIVE PAID PLAN =====
  if (myPlan?.plan && myPlan.plan !== "free") {
    return (
      <div className="text-center py-8">
        <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="font-display text-lg text-foreground tracking-wider mb-2">PLANO ATIVO</h3>
        <p className="text-sm text-muted-foreground">Você possui o plano <span className="text-primary font-medium capitalize">{myPlan.plan}</span>.</p>
      </div>
    );
  }

  // ===== DEFAULT: show role selection (critic/specialist) wizard =====
  // Get wizard steps from plan options if available
  const criticPlans = (planOptions as any)?.critic || [];
  const specialistPlans = (planOptions as any)?.specialist || [];
  const selectedPlan = selectedRole === "critic" ? criticPlans[0] : selectedRole === "specialist" ? specialistPlans[0] : null;
  const wizardSteps = selectedPlan?.wizardSteps || [];

  return (
    <div className="space-y-4">
      {step === 1 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">Escolha o tipo de plano profissional:</p>
          <div className="space-y-3">
            <button
              onClick={() => { setSelectedRole("critic"); setStep(2); setFormData({}); setFormErrors({}); setPromoCode(""); setPromoResult(null); }}
              className="w-full p-4 rounded-xl bg-card border border-border/50 hover:border-blue-400/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <FourPointStar variant="critic" className="w-8 h-8" />
                <div>
                  <p className="font-display text-base text-foreground tracking-wider group-hover:text-blue-400 transition-colors">CRÍTICO</p>
                  <p className="text-xs text-muted-foreground">Avaliações profissionais com peso diferenciado</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </button>
            <button
              onClick={() => { setSelectedRole("specialist"); setStep(2); setFormData({}); setFormErrors({}); setPromoCode(""); setPromoResult(null); }}
              className="w-full p-4 rounded-xl bg-card border border-border/50 hover:border-amber-400/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <FourPointStar variant="specialist" className="w-8 h-8" />
                <div>
                  <p className="font-display text-base text-foreground tracking-wider group-hover:text-amber-400 transition-colors">ESPECIALISTA</p>
                  <p className="text-xs text-muted-foreground">Especialista em categorias específicas</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </button>
          </div>
        </>
      )}

      {/* Dynamic wizard steps based on plan configuration */}
      {step >= 2 && selectedRole && (
        <div className="space-y-4">
          <button onClick={() => { if (step === 2) { setStep(1); setSelectedRole(null); } else { setStep(step - 1); } }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Voltar
          </button>

          {/* Step indicator */}
          {wizardSteps.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {wizardSteps.map((_: any, i: number) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < step - 1 ? (selectedRole === "critic" ? "bg-blue-500" : "bg-amber-500") : "bg-border"
                }`} />
              ))}
            </div>
          )}

          {/* Render current wizard step */}
          {wizardSteps.length > 0 && wizardSteps[step - 2] ? (
            (() => {
              const currentWizardStep = wizardSteps[step - 2];
              const isCritic = selectedRole === "critic";
              const accentColor = isCritic ? "blue" : "amber";

              return (
                <div className={`rounded-xl bg-card border border-${accentColor}-400/30 p-5 space-y-4`}>
                  <h3 className={`font-display text-lg text-${accentColor}-400 tracking-wider`}>
                    {currentWizardStep.title?.toUpperCase()}
                  </h3>

                  {currentWizardStep.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{currentWizardStep.description}</p>
                  )}

                  {/* Price display */}
                  {currentWizardStep.price && (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-2xl text-foreground">R$ {Number(currentWizardStep.price).toFixed(2).replace('.', ',')}</span>
                      {currentWizardStep.priceLabel && <span className="text-xs text-muted-foreground">{currentWizardStep.priceLabel}</span>}
                    </div>
                  )}

                  {/* Benefits list */}
                  {currentWizardStep.benefits && currentWizardStep.benefits.length > 0 && (
                    <ul className="space-y-2">
                      {currentWizardStep.benefits.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className={`w-4 h-4 text-${accentColor}-400 mt-0.5 flex-shrink-0`} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Form fields (type=form) */}
                  {currentWizardStep.type === "form" && currentWizardStep.formFields && (
                    <div className="space-y-3 pt-2">
                      {currentWizardStep.formFields.map((field: any) => (
                        <div key={field.name}>
                          <label className="text-xs text-muted-foreground mb-1 block">
                            {field.label} {field.required && <span className="text-red-400">*</span>}
                          </label>
                          {field.type === "textarea" ? (
                            <textarea
                              value={formData[field.name] || ""}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                                if (formErrors[field.name]) setFormErrors(prev => { const n = {...prev}; delete n[field.name]; return n; });
                              }}
                              placeholder={field.placeholder || ""}
                              rows={3}
                              className={`w-full px-3 py-2.5 rounded-lg bg-background border ${formErrors[field.name] ? 'border-red-400' : 'border-border/50'} text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none`}
                            />
                          ) : field.type === "select" ? (
                            <select
                              value={formData[field.name] || ""}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                                if (formErrors[field.name]) setFormErrors(prev => { const n = {...prev}; delete n[field.name]; return n; });
                              }}
                              className={`w-full px-3 py-2.5 rounded-lg bg-background border ${formErrors[field.name] ? 'border-red-400' : 'border-border/50'} text-sm text-foreground focus:outline-none focus:border-primary/50`}
                            >
                              <option value="">Selecione...</option>
                              {(field.options || []).map((opt: string) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type || "text"}
                              value={formData[field.name] || ""}
                              onChange={(e) => {
                                setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                                if (formErrors[field.name]) setFormErrors(prev => { const n = {...prev}; delete n[field.name]; return n; });
                              }}
                              placeholder={field.placeholder || ""}
                              className={`w-full px-3 py-2.5 rounded-lg bg-background border ${formErrors[field.name] ? 'border-red-400' : 'border-border/50'} text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50`}
                            />
                          )}
                          {formErrors[field.name] && (
                            <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                              <AlertCircle className="w-3 h-3" /> {formErrors[field.name]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payment step: promo code */}
                  {currentWizardStep.type === "payment" && (
                    <div className="space-y-3 pt-2 border-t border-border/30">
                      <label className="text-xs text-muted-foreground block">Tem um código promocional?</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            value={promoCode}
                            onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null); }}
                            placeholder="Código promocional"
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleValidatePromo}
                          disabled={promoLoading || !promoCode.trim()}
                          className="px-4"
                        >
                          {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
                        </Button>
                      </div>
                      {promoResult && (
                        <p className={`text-xs ${promoResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                          {promoResult.valid
                            ? `✓ ${promoResult.description || 'Desconto aplicado!'} (${promoResult.discountType === 'percentage' ? `${promoResult.discountValue}% off` : `R$ ${promoResult.discountValue?.toFixed(2)} off`})`
                            : promoResult.message}
                        </p>
                      )}
                      {promoResult?.valid && currentWizardStep.price && (
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm text-muted-foreground line-through">R$ {Number(currentWizardStep.price).toFixed(2).replace('.', ',')}</span>
                          <span className="font-display text-xl text-green-400">R$ {getDiscountedPrice(currentWizardStep.price).toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action button */}
                  <Button
                    onClick={() => {
                      // Form validation
                      if (currentWizardStep.type === "form" && currentWizardStep.formFields) {
                        if (!validateFormFields(currentWizardStep.formFields)) return;
                        // Submit the request
                        submitRequest.mutate({
                          requestedRole: selectedRole,
                          message: formData.message || formData[currentWizardStep.formFields[0]?.name] || "Solicitação via wizard",
                          experience: formData.experience || "",
                          portfolio: formData.portfolio || "",
                          specialties: formData.specialties || "",
                        });
                        return;
                      }
                      // Payment step
                      if (currentWizardStep.type === "payment") {
                        upgradeMutation.mutate({ plan: "premium", promoCode: promoResult?.valid ? promoCode : undefined } as any);
                        return;
                      }
                      // Next step
                      if (step - 1 < wizardSteps.length) {
                        setStep(step + 1);
                      }
                    }}
                    disabled={submitRequest.isPending || upgradeMutation.isPending}
                    className={`w-full font-display tracking-wider ${
                      isCritic ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-black"
                    }`}
                  >
                    {(submitRequest.isPending || upgradeMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {currentWizardStep.buttonText || (currentWizardStep.type === "form" ? "Enviar Solicitação" : currentWizardStep.type === "payment" ? "Ativar Plano" : "Próximo")}
                    {currentWizardStep.type !== "form" && currentWizardStep.type !== "payment" && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              );
            })()
          ) : (
            // Fallback: simple form if no wizard steps configured
            <div className="space-y-4">
              <h3 className="font-display text-lg text-foreground tracking-wider">
                {selectedRole === "critic" ? "CRÍTICO" : "ESPECIALISTA"}
              </h3>
              <p className="text-sm text-muted-foreground">Preencha o formulário de solicitação:</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mensagem / Motivação <span className="text-red-400">*</span></label>
                  <textarea
                    value={formData.message || ""}
                    onChange={(e) => { setFormData(prev => ({ ...prev, message: e.target.value })); if (formErrors.message) setFormErrors(prev => { const n = {...prev}; delete n.message; return n; }); }}
                    placeholder="Por que deseja ser um profissional?"
                    rows={3}
                    className={`w-full px-3 py-2.5 rounded-lg bg-card border ${formErrors.message ? 'border-red-400' : 'border-border/50'} text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none`}
                  />
                  {formErrors.message && (
                    <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Experiência</label>
                  <input
                    type="text"
                    value={formData.experience || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="Sua experiência na área"
                    className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Portfólio / Link</label>
                  <input
                    type="text"
                    value={formData.portfolio || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                    placeholder="Link para seu trabalho"
                    className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Especialidades</label>
                  <input
                    type="text"
                    value={formData.specialties || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                    placeholder="Ex: Cervejas artesanais, Coquetéis"
                    className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <Button
                onClick={() => {
                  if (!formData.message || formData.message.trim().length < 10) {
                    setFormErrors({ message: "Mensagem deve ter pelo menos 10 caracteres" });
                    return;
                  }
                  submitRequest.mutate({ requestedRole: selectedRole, message: formData.message, experience: formData.experience || "", portfolio: formData.portfolio || "", specialties: formData.specialties || "" });
                }}
                disabled={submitRequest.isPending}
                className="w-full bg-primary text-primary-foreground"
              >
                {submitRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar Solicitação
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
