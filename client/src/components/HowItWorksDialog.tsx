/**
 * HowItWorksDialog — Pop-up "Como Funciona" exibido uma vez ao finalizar o cadastro/onboarding.
 * Mostra os 3 passos do sistema de avaliação.
 */
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, ClipboardCheck, BarChart3 } from "lucide-react";

interface HowItWorksDialogProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Star,
    title: "Escolha uma das categorias",
    desc: "Selecione o estabelecimento cadastrado que você visitou.",
  },
  {
    icon: ClipboardCheck,
    title: "Avalie o que Consumiu",
    desc: "Escolha os itens do cardápio e avalie no modo Direto ou Analítico.",
  },
  {
    icon: BarChart3,
    title: "Veja a Nota",
    desc: "O sistema calcula automaticamente com pesos dinâmicos por categoria.",
  },
];

export default function HowItWorksDialog({ open, onClose }: HowItWorksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md bg-card border-border/50">
        <DialogTitle className="font-display text-2xl tracking-wider text-primary text-center">
          COMO FUNCIONA
        </DialogTitle>
        <DialogDescription className="text-center text-muted-foreground text-sm mb-2">
          3 passos simples para avaliar seu bar favorito
        </DialogDescription>

        <div className="space-y-4 mt-4">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div>
                <h4 className="font-display text-sm tracking-wider text-foreground mb-0.5">{step.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-6 font-display tracking-wider"
        >
          ENTENDI, VAMOS LÁ!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
