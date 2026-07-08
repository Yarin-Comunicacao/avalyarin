/**
 * Planos — /conta/planos
 * Wizard de 4 etapas:
 * 1. Escolha entre Crítico ou Especialista
 * 2. Informações, benefícios e valores do role escolhido
 * 3. Formulário de solicitação
 * 4. Pagamento (só aparece após aprovação)
 */
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "@/components/ui/sonner";
import { Crown, ArrowRight, ArrowLeft, Check, Loader2, Send, Clock, CheckCircle2, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { FourPointStar } from "@/components/FourPointStar";

type RoleChoice = "critic" | "specialist" | null;

export default function Planos() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<RoleChoice>(null);
  const [formData, setFormData] = useState({
    message: "",
    experience: "",
    portfolio: "",
    specialties: "",
  });

  const { user, isAuthenticated } = useAuth();

  const { data: myRequests, refetch: refetchRequests } = trpc.roleRequests.myRequests.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myPlan, refetch: refetchPlan } = trpc.plans.myPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const submitRequest = trpc.roleRequests.submit.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada!", {
        description: "Sua solicitação será analisada pela equipe. Você receberá uma notificação quando for revisada.",
      });
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
        description: "Seu plano profissional foi ativado com sucesso.",
      });
      refetchPlan();
    },
    onError: (err) => {
      toast.error("Erro ao ativar plano", { description: err.message });
    },
  });

  // Determine request status for selected role
  const pendingRequest = selectedRole
    ? myRequests?.find((r) => r.requestedRole === selectedRole && r.status === "pending")
    : null;
  const approvedRequest = selectedRole
    ? myRequests?.find((r) => r.requestedRole === selectedRole && r.status === "approved")
    : null;

  // If user already has the role
  const userAlreadyHasRole = selectedRole ? user?.role === selectedRole : false;

  // Auto-advance to step 4 if approved
  const effectiveStep = approvedRequest || userAlreadyHasRole ? 4 : pendingRequest ? 3 : step;

  const handleRoleSelect = (role: RoleChoice) => {
    setSelectedRole(role);
    // Check if there's a pending request for this role
    const pending = myRequests?.find((r) => r.requestedRole === role && r.status === "pending");
    const approved = myRequests?.find((r) => r.requestedRole === role && r.status === "approved");
    if (approved || (role && user?.role === role)) {
      setStep(4);
    } else if (pending) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSubmitRequest = () => {
    if (!selectedRole) return;
    if (formData.message.length < 10) {
      toast.error("Mensagem muito curta", { description: "Descreva brevemente por que deseja este perfil (mín. 10 caracteres)." });
      return;
    }
    submitRequest.mutate({
      requestedRole: selectedRole,
      message: formData.message,
      experience: formData.experience || undefined,
      portfolio: formData.portfolio || undefined,
      specialties: formData.specialties || undefined,
    });
  };

  const handleActivatePlan = () => {
    upgradeMutation.mutate({ plan: "premium" });
  };

  const isCritic = selectedRole === "critic";
  const roleLabel = isCritic ? "Crítico" : "Especialista";
  const roleColor = isCritic ? "blue" : "amber";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24">
        <div className="container max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">PLANOS</h2>
              <p className="text-sm text-muted-foreground">Evolua seu perfil no Avalyarin</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  effectiveStep >= s
                    ? selectedRole === "critic"
                      ? "bg-blue-500 text-white"
                      : "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {effectiveStep > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 4 && (
                  <div className={`w-8 h-0.5 ${
                    effectiveStep > s
                      ? selectedRole === "critic" ? "bg-blue-500" : "bg-primary"
                      : "bg-border"
                  }`} />
                )}
              </div>
            ))}
            <span className="ml-3 text-xs text-muted-foreground">
              {effectiveStep === 1 && "Escolha"}
              {effectiveStep === 2 && "Informações"}
              {effectiveStep === 3 && (pendingRequest ? "Aguardando" : "Solicitação")}
              {effectiveStep === 4 && "Pagamento"}
            </span>
          </div>

          {/* ============ STEP 1: Escolha ============ */}
          {effectiveStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-display text-lg tracking-wider text-foreground mb-2">
                ESCOLHA SEU PERFIL PROFISSIONAL
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Selecione o tipo de perfil profissional que melhor se encaixa com sua experiência.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Crítico */}
                <button
                  onClick={() => handleRoleSelect("critic")}
                  className="group relative p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <FourPointStar variant="critic" size={24} />
                    </div>
                    <div>
                      <h4 className="font-display text-lg tracking-wider text-foreground group-hover:text-blue-400 transition-colors">CRÍTICO</h4>
                      <p className="text-xs text-muted-foreground">Estrela Safira</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Avalie com a perspectiva de um crítico gastronômico profissional.
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-sm text-blue-400 font-medium group-hover:gap-2 transition-all">
                    <span>Selecionar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Especialista */}
                <button
                  onClick={() => handleRoleSelect("specialist")}
                  className="group relative p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <FourPointStar variant="specialist" size={24} />
                    </div>
                    <div>
                      <h4 className="font-display text-lg tracking-wider text-foreground group-hover:text-amber-400 transition-colors">ESPECIALISTA</h4>
                      <p className="text-xs text-muted-foreground">Estrela Dourada</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Avalie com conhecimento técnico em gastronomia e culinária.
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-sm text-amber-400 font-medium group-hover:gap-2 transition-all">
                    <span>Selecionar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ============ STEP 2: Informações ============ */}
          {effectiveStep === 2 && selectedRole && (
            <div className="space-y-6">
              <button
                onClick={() => { setStep(1); setSelectedRole(null); }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar à escolha
              </button>

              <div className={`p-6 rounded-2xl border ${
                isCritic ? "border-blue-500/30 bg-blue-500/5" : "border-amber-500/30 bg-amber-500/5"
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <FourPointStar variant={isCritic ? "critic" : "specialist"} size={32} />
                  <div>
                    <h3 className={`font-display text-xl tracking-wider ${isCritic ? "text-blue-400" : "text-amber-400"}`}>
                      {roleLabel.toUpperCase()}
                    </h3>
                    <p className="text-xs text-muted-foreground">Perfil Profissional</p>
                  </div>
                </div>

                {/* Preço */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-numbers text-3xl font-bold text-foreground">R$ 19,90</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                {/* Benefícios */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-sm font-medium text-foreground">Benefícios inclusos:</h4>
                  <ul className="space-y-2.5">
                    {(isCritic ? [
                      "Estrela safira de 4 pontas nas suas avaliações",
                      "Avaliações ilimitadas por dia",
                      "Perfil público de Crítico Gastronômico",
                      "Destaque premium nas avaliações dos estabelecimentos",
                      "Parcerias com estabelecimentos parceiros",
                      "Códigos promocionais exclusivos",
                      "Convites para inaugurações",
                      "Suporte prioritário",
                    ] : [
                      "Estrela dourada de 4 pontas nas suas avaliações",
                      "Avaliações ilimitadas por dia",
                      "Perfil público de Especialista Gastronômico",
                      "Destaque premium nas avaliações dos estabelecimentos",
                      "Parcerias com estabelecimentos parceiros",
                      "Códigos promocionais exclusivos",
                      "Convites para inaugurações",
                      "Suporte prioritário",
                    ]).map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isCritic ? "text-blue-500" : "text-amber-500"}`} />
                        <span className="text-foreground/80">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Descrição do role */}
                <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isCritic
                      ? "O Crítico Gastronômico avalia estabelecimentos com um olhar profissional e criterioso. Suas avaliações recebem destaque especial com a estrela safira, indicando aos outros usuários que se trata de uma análise profissional."
                      : "O Especialista Gastronômico possui formação ou experiência técnica em gastronomia. Suas avaliações recebem destaque especial com a estrela dourada, indicando expertise técnica na análise dos pratos e drinks."}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setStep(3)}
                className={`w-full font-display tracking-wider ${
                  isCritic ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-black"
                }`}
              >
                SOLICITAR PERFIL DE {roleLabel.toUpperCase()}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* ============ STEP 3: Formulário / Aguardando ============ */}
          {effectiveStep === 3 && selectedRole && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar às informações
              </button>

              {/* Banner pendente */}
              {pendingRequest && (
                <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
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

              {/* Formulário (só mostra se não tem request pendente) */}
              {!pendingRequest && (
                <div className={`p-6 rounded-2xl border ${
                  isCritic ? "border-blue-500/30 bg-blue-500/5" : "border-amber-500/30 bg-amber-500/5"
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Send className={`w-5 h-5 ${isCritic ? "text-blue-500" : "text-amber-500"}`} />
                    <h3 className={`font-display text-lg tracking-wider ${isCritic ? "text-blue-400" : "text-amber-400"}`}>
                      FORMULÁRIO DE SOLICITAÇÃO
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Preencha as informações abaixo para que nossa equipe possa avaliar sua candidatura.
                  </p>

                  <div className="space-y-4">
                    {/* Motivação - obrigatório */}
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
                      <p className="text-xs text-muted-foreground mt-1">{formData.message.length}/1000 (mín. 10)</p>
                    </div>

                    {/* Experiência */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Experiência profissional/gastronômica
                      </label>
                      <textarea
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="Descreva sua experiência na área gastronômica (opcional)"
                        className="w-full min-h-[80px] p-3 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        maxLength={500}
                      />
                    </div>

                    {/* Portfólio */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Portfólio / Redes sociais
                      </label>
                      <input
                        type="text"
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                        placeholder="Link do Instagram, blog, site pessoal (opcional)"
                        className="w-full p-3 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    {/* Especialidades */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        {isCritic ? "Áreas de atuação como crítico" : "Especialidades gastronômicas"}
                      </label>
                      <input
                        type="text"
                        value={formData.specialties}
                        onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                        placeholder={isCritic
                          ? "Ex: Cozinha japonesa, vinhos, coquetelaria (opcional)"
                          : "Ex: Confeitaria, gastronomia molecular, sommelier (opcional)"}
                        className="w-full p-3 rounded-xl bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>

                    <Button
                      onClick={handleSubmitRequest}
                      disabled={submitRequest.isPending || formData.message.length < 10}
                      className={`w-full font-display tracking-wider mt-2 ${
                        isCritic ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-black"
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
          )}

          {/* ============ STEP 4: Pagamento (após aprovação) ============ */}
          {effectiveStep === 4 && selectedRole && (
            <div className="space-y-6">
              <button
                onClick={() => { setStep(1); setSelectedRole(null); }}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao início
              </button>

              {/* Banner aprovado */}
              {(approvedRequest || userAlreadyHasRole) && (
                <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-green-400">
                        {userAlreadyHasRole ? `Você é ${roleLabel}!` : "Solicitação aprovada!"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {userAlreadyHasRole
                          ? `Seu perfil de ${roleLabel} está ativo. Gerencie seu plano abaixo.`
                          : "Parabéns! Sua solicitação foi aprovada. Ative seu plano abaixo."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card de pagamento */}
              <div className={`p-6 rounded-2xl border ${
                isCritic ? "border-blue-500/30 bg-blue-500/5" : "border-amber-500/30 bg-amber-500/5"
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className={`w-5 h-5 ${isCritic ? "text-blue-500" : "text-amber-500"}`} />
                  <h3 className={`font-display text-lg tracking-wider ${isCritic ? "text-blue-400" : "text-amber-400"}`}>
                    ATIVAR PLANO {roleLabel.toUpperCase()}
                  </h3>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/30 mb-6">
                  <div className="flex items-center gap-3">
                    <FourPointStar variant={isCritic ? "critic" : "specialist"} size={28} />
                    <div>
                      <p className="font-display text-sm tracking-wider text-foreground">PLANO PROFISSIONAL</p>
                      <p className="text-xs text-muted-foreground">Avaliações ilimitadas + destaque</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-numbers text-xl font-bold text-foreground">R$ 19,90</p>
                    <p className="text-xs text-muted-foreground">/mês</p>
                  </div>
                </div>

                {myPlan?.plan === "premium" ? (
                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <p className="text-sm text-green-400 font-medium">Plano ativo</p>
                    </div>
                    {myPlan.subscription?.expiresAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Válido até {new Date(myPlan.subscription.expiresAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-background/50 border border-border/30 mb-4">
                      <p className="text-xs text-muted-foreground">
                        Nesta versão beta, o plano é ativado automaticamente sem cobrança real.
                        O sistema de pagamento será integrado em breve.
                      </p>
                    </div>
                    <Button
                      onClick={handleActivatePlan}
                      disabled={upgradeMutation.isPending}
                      className={`w-full font-display tracking-wider ${
                        isCritic ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-black"
                      }`}
                    >
                      {upgradeMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Ativando...</>
                      ) : (
                        <><Zap className="w-4 h-4 mr-2" /> ATIVAR PLANO — R$ 19,90/MÊS</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
