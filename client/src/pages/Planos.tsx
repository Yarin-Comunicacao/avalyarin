// Design: AvaLyarin — Planos page
// Platform subscription plans
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { toast } from "@/components/ui/sonner";
import { Crown, Check, Star, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Explorador",
    price: "Grátis",
    period: "",
    icon: <Star className="w-6 h-6" />,
    features: [
      "Avaliar até 5 locais/mês",
      "Ver avaliações da comunidade",
      "Salvar locais favoritos",
      "Perfil básico com @padrão",
    ],
    current: true,
  },
  {
    id: "premium",
    name: "Conhecedor",
    price: "R$ 14,90",
    period: "/mês",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "Avaliações ilimitadas",
      "Personalizar @username",
      "Listas Collab com amigos",
      "Selo Conhecedor no perfil",
      "Acesso antecipado a novos locais",
      "Filtros avançados de busca",
    ],
    popular: true,
  },
  {
    id: "embaixador",
    name: "Embaixador",
    price: "R$ 29,90",
    period: "/mês",
    icon: <Shield className="w-6 h-6" />,
    features: [
      "Tudo do Conhecedor",
      "Selo Embaixador verificado",
      "Convites para inaugurações",
      "Destaque nas avaliações",
      "Relatórios de impacto",
      "Suporte prioritário",
      "Acesso a eventos exclusivos",
    ],
  },
];

export default function Planos() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.current) {
      toast("Você já está neste plano!");
      return;
    }
    toast("Funcionalidade em breve", {
      description: `O plano ${plan.name} estará disponível em breve. Fique ligado!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref="/" onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-20 pb-16">
        <div className="container max-w-3xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">PLANOS</h2>
              <p className="text-sm text-muted-foreground">Escolha o plano ideal para você</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-5 rounded-2xl border transition-all ${
                  plan.popular
                    ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
                    : plan.current
                    ? "border-border/50 bg-card"
                    : "border-border/30 bg-card/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-display tracking-wider">
                    POPULAR
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  plan.popular ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {plan.icon}
                </div>

                <h3 className="font-display text-lg tracking-wider text-foreground">{plan.name.toUpperCase()}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-4">
                  <span className="font-numbers text-2xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  variant={plan.current ? "outline" : plan.popular ? "default" : "outline"}
                  className={`w-full font-display tracking-wider ${plan.popular ? "glow-amber" : ""}`}
                >
                  {plan.current ? "PLANO ATUAL" : "ESCOLHER PLANO"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
