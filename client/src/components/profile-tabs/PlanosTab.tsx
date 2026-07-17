import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Clock, CheckCircle2, CreditCard, Zap, ArrowRight, ArrowLeft, Send } from "lucide-react";
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
  const [formData, setFormData] = useState({ message: "", experience: "", portfolio: "", specialties: "" });

  // ALL hooks MUST be called before any conditional returns (React rules of hooks)
  const actualRole = user?.role;
  // When owner/admin is viewing as another role, use that role for display
  const userRole = (actualRole === "owner" || actualRole === "admin") && viewingAs
    ? viewingAs
    : actualRole;

  const { data: myRequests, refetch: refetchRequests } = trpc.roleRequests.myRequests.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myPlan, refetch: refetchPlan } = trpc.plans.myPlan.useQuery(undefined, { enabled: isAuthenticated });
  const { data: planOptions } = trpc.plans.options.useQuery(undefined, { enabled: isAuthenticated });

  const submitRequest = trpc.roleRequests.submit.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada!", { description: "Sua solicitação será analisada pela equipe." });
      setFormData({ message: "", experience: "", portfolio: "", specialties: "" });
      refetchRequests();
    },
    onError: (err) => toast.error("Erro ao enviar solicitação", { description: err.message }),
  });

  const upgradeMutation = trpc.plans.upgrade.useMutation({
    onSuccess: () => {
      toast.success("Plano ativado!");
      refetchPlan();
    },
    onError: (err) => toast.error("Erro ao ativar plano", { description: err.message }),
  });

  // Check for pending/approved requests
  const pendingRequest = myRequests?.find((r: any) => r.status === "pending");
  const approvedRequest = myRequests?.find((r: any) => r.status === "approved");

  // ===== BUSINESS ROLE: show only Business plans =====
  if (userRole === "business") {
    // Filtrar plano Free — todos já começam nele, não precisa exibir
    const businessPlans = ((planOptions as any)?.business || []).filter((p: any) => p.price > 0);
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
                  <Button
                    onClick={() => upgradeMutation.mutate({ plan: plan.id } as any)}
                    disabled={upgradeMutation.isPending}
                    className="w-full bg-primary text-primary-foreground"
                  >
                    {upgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Assinar {plan.name}
                  </Button>
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
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="font-display text-lg text-foreground tracking-wider mb-2">APROVADO!</h3>
        <p className="text-sm text-muted-foreground mb-4">Sua solicitação foi aprovada. Ative seu plano abaixo.</p>
        <Button
          onClick={() => upgradeMutation.mutate({ plan: approvedRequest.requestedRole === "critic" ? "premium" : "embaixador" })}
          disabled={upgradeMutation.isPending}
          className="bg-primary text-primary-foreground"
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
    // Filtrar plano Free — todos já começam nele, não precisa exibir
    const userPlans = ((planOptions as any)?.user || []).filter((p: any) => p.price > 0);
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
                  <Button
                    onClick={() => upgradeMutation.mutate({ plan: plan.id } as any)}
                    disabled={upgradeMutation.isPending}
                    className="w-full bg-primary text-primary-foreground"
                  >
                    {upgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    Assinar {plan.name}
                  </Button>
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

  // ===== DEFAULT: show role selection (critic/specialist) =====
  return (
    <div className="space-y-4">
      {step === 1 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">Escolha o tipo de plano profissional:</p>
          <div className="space-y-3">
            <button
              onClick={() => { setSelectedRole("critic"); setStep(2); }}
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
              onClick={() => { setSelectedRole("specialist"); setStep(2); }}
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

      {step === 2 && selectedRole && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Voltar
          </button>
          <h3 className="font-display text-lg text-foreground tracking-wider">
            {selectedRole === "critic" ? "CRÍTICO" : "ESPECIALISTA"}
          </h3>
          <p className="text-sm text-muted-foreground">Preencha o formulário de solicitação:</p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mensagem / Motivação *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Por que deseja ser um profissional?"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Experiência</label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Sua experiência na área"
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Portfólio / Link</label>
              <input
                type="text"
                value={formData.portfolio}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                placeholder="Link para seu trabalho"
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Especialidades</label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                placeholder="Ex: Cervejas artesanais, Coquetéis"
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <Button
            onClick={() => submitRequest.mutate({ requestedRole: selectedRole, message: formData.message, experience: formData.experience, portfolio: formData.portfolio, specialties: formData.specialties })}
            disabled={!formData.message || submitRequest.isPending}
            className="w-full bg-primary text-primary-foreground"
          >
            {submitRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar Solicitação
          </Button>
        </div>
      )}
    </div>
  );
}
