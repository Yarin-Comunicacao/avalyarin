// Design: AvaLyarin — Planos page (User) — apenas opções de upgrade para Critic/Specialist
import Navbar from "@/components/Navbar";
import { Crown, ArrowRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { FourPointStar } from "@/components/FourPointStar";

export default function Planos() {
  const { user, isAuthenticated } = useAuth();

  const { data: myPlan } = trpc.plans.myPlan.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const currentPlan = myPlan?.plan ?? "free";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">PLANOS</h2>
              <p className="text-sm text-muted-foreground">Evolua seu perfil no Avalyarin</p>
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
            </div>
          )}

          {/* Descrição */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Quer contribuir de forma profissional? Solicite seu perfil de <strong className="text-foreground">Crítico</strong> ou <strong className="text-foreground">Especialista</strong> e tenha acesso a ferramentas exclusivas de avaliação.
            </p>
          </div>

          {/* Cards de opção */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Quero ser Crítico */}
            <Link href="/critic/planos">
              <div className="group relative p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <FourPointStar variant="critic" size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg tracking-wider text-foreground group-hover:text-blue-400 transition-colors">CRÍTICO</h3>
                    <p className="text-xs text-muted-foreground">R$ 19,90/mês</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Avalie com a perspectiva de um crítico gastronômico. Suas avaliações ganham destaque com a estrela safira de 4 pontas.
                </p>
                <ul className="space-y-1.5 mb-4">
                  <li className="text-xs text-foreground/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    Estrela safira exclusiva nas avaliações
                  </li>
                  <li className="text-xs text-foreground/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    Avaliações ilimitadas
                  </li>
                  <li className="text-xs text-foreground/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-400" />
                    Perfil público de crítico
                  </li>
                </ul>
                <div className="flex items-center gap-1 text-sm text-blue-400 font-medium group-hover:gap-2 transition-all">
                  <span>Quero ser Crítico</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Quero ser Especialista */}
            <Link href="/specialist/planos">
              <div className="group relative p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <FourPointStar variant="specialist" size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-lg tracking-wider text-foreground group-hover:text-amber-400 transition-colors">ESPECIALISTA</h3>
                    <p className="text-xs text-muted-foreground">R$ 19,90/mês</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Avalie com conhecimento técnico em gastronomia. Suas avaliações ganham destaque com a estrela dourada de 4 pontas.
                </p>
                <ul className="space-y-1.5 mb-4">
                  <li className="text-xs text-foreground/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    Estrela dourada exclusiva nas avaliações
                  </li>
                  <li className="text-xs text-foreground/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    Avaliações ilimitadas
                  </li>
                  <li className="text-xs text-foreground/70 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    Perfil público de especialista
                  </li>
                </ul>
                <div className="flex items-center gap-1 text-sm text-amber-400 font-medium group-hover:gap-2 transition-all">
                  <span>Quero ser Especialista</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>

          {/* Nota informativa */}
          <div className="mt-8 p-4 rounded-xl bg-card border border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              Após solicitar, nossa equipe analisará seu perfil e credenciais. 
              Você receberá uma resposta em até 48 horas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
