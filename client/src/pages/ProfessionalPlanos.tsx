/**
 * Planos Profissionais — /critic/planos e /specialist/planos
 * 
 * Para quem JÁ É critic/specialist: mostra apenas info do plano ativo (status, validade, benefícios).
 * Para quem NÃO É: redireciona para /conta/planos (wizard de 4 etapas).
 */
import Navbar from "@/components/Navbar";
import { Crown, Check, ArrowLeft, CreditCard, Zap, Shield, Star, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation, Redirect } from "wouter";
import { FourPointStar } from "@/components/FourPointStar";
import { toast } from "@/components/ui/sonner";

export default function ProfessionalPlanos() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();

  const isCritic = location.includes("/critic/");
  const roleLabel = isCritic ? "Crítico" : "Especialista";
  const backPath = isCritic ? "/painel-critico/perfil" : "/painel-especialista/perfil";
  const requestedRole = isCritic ? "critic" : "specialist";

  const { data: myPlan } = trpc.plans.myPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const cancelMutation = trpc.plans.cancel.useMutation({
    onSuccess: () => {
      toast.success("Assinatura cancelada", {
        description: "Seu plano continuará ativo até o fim do período atual.",
      });
    },
    onError: (err) => {
      toast.error("Erro ao cancelar", { description: err.message });
    },
  });

  // Se o user não tem o role, redireciona para o wizard em /conta/planos
  if (!loading && isAuthenticated && user?.role !== requestedRole) {
    return <Redirect to="/conta/planos" />;
  }

  const currentPlan = myPlan?.plan ?? "free";
  const isPremium = currentPlan === "premium";
  const expiresAt = myPlan?.subscription?.expiresAt;

  const benefits = isCritic
    ? [
        "Estrela safira de 4 pontas nas suas avaliações",
        "Avaliações ilimitadas por dia",
        "Perfil público de Crítico Gastronômico",
        "Destaque premium nas avaliações dos estabelecimentos",
        "Parcerias com estabelecimentos parceiros",
        "Códigos promocionais exclusivos",
        "Convites para inaugurações",
        "Suporte prioritário",
      ]
    : [
        "Estrela dourada de 4 pontas nas suas avaliações",
        "Avaliações ilimitadas por dia",
        "Perfil público de Especialista Gastronômico",
        "Destaque premium nas avaliações dos estabelecimentos",
        "Parcerias com estabelecimentos parceiros",
        "Códigos promocionais exclusivos",
        "Convites para inaugurações",
        "Suporte prioritário",
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

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              isCritic
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            }`}>
              <FourPointStar variant={isCritic ? "critic" : "specialist"} size={24} />
            </div>
            <div>
              <h2 className={`font-display text-2xl tracking-wider ${isCritic ? "text-blue-400" : "text-amber-400"}`}>
                MEU PLANO
              </h2>
              <p className="text-sm text-muted-foreground">Perfil de {roleLabel}</p>
            </div>
          </div>

          {/* Plan Status Card */}
          <div className={`p-6 rounded-2xl border ${
            isCritic ? "border-blue-500/30 bg-blue-500/5" : "border-amber-500/30 bg-amber-500/5"
          }`}>
            {/* Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPremium
                    ? isCritic ? "bg-blue-500/20" : "bg-amber-500/20"
                    : "bg-secondary"
                }`}>
                  {isPremium ? (
                    <Zap className={`w-5 h-5 ${isCritic ? "text-blue-500" : "text-amber-500"}`} />
                  ) : (
                    <Star className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-display text-lg tracking-wider text-foreground">
                    {isPremium ? "PROFISSIONAL" : "GRATUITO"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPremium ? "R$ 19,90/mês" : "Sem cobrança"}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-display tracking-wider ${
                isPremium
                  ? "bg-green-500/10 text-green-400 border border-green-500/30"
                  : "bg-secondary text-muted-foreground border border-border/30"
              }`}>
                {isPremium ? "ATIVO" : "BÁSICO"}
              </div>
            </div>

            {/* Validade */}
            {isPremium && expiresAt && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-background/50 border border-border/30 mb-6">
                <Calendar className={`w-4 h-4 ${isCritic ? "text-blue-500" : "text-amber-500"}`} />
                <p className="text-sm text-foreground">
                  Válido até <strong>{new Date(expiresAt).toLocaleDateString("pt-BR")}</strong>
                </p>
              </div>
            )}

            {!isPremium && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-6">
                <Clock className="w-4 h-4 text-yellow-500" />
                <p className="text-sm text-yellow-400">
                  Ative o plano Profissional para desbloquear todos os benefícios.
                </p>
              </div>
            )}

            {/* Benefícios */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Shield className={`w-4 h-4 ${isCritic ? "text-blue-500" : "text-amber-500"}`} />
                {isPremium ? "Seus benefícios ativos:" : "Benefícios do plano Profissional:"}
              </h4>
              <ul className="space-y-2.5">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isPremium
                        ? isCritic ? "text-blue-500" : "text-amber-500"
                        : "text-muted-foreground"
                    }`} />
                    <span className={isPremium ? "text-foreground/80" : "text-muted-foreground"}>
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            {!isPremium && (
              <div className="pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-3">
                  Nesta versão beta, o upgrade é concedido automaticamente sem cobrança real.
                </p>
                <Link href="/conta/planos">
                  <Button className={`w-full font-display tracking-wider ${
                    isCritic ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-black"
                  }`}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    ATIVAR PLANO PROFISSIONAL
                  </Button>
                </Link>
              </div>
            )}

            {isPremium && (
              <div className="pt-4 border-t border-border/30">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? "Cancelando..." : "Cancelar assinatura"}
                </Button>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="mt-6 p-4 rounded-xl bg-card/50 border border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Caso o pagamento não seja renovado, seu perfil de {roleLabel} será convertido para perfil de usuário comum após 35 dias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
