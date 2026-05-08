// Age Gate — First screen that requires user to confirm they are 18+
// Shows two AI-generated images (day restaurant / night bar) flanking a centered checkbox
import { useState } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const DAY_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/age-gate-day-L5iDZ7EiwgNVQfD5ihnqAL.webp";
const NIGHT_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/age-gate-night-TGrHgM2B6Cr3AosUR4maEJ.webp";

interface AgeGateProps {
  onConfirm: () => void;
}

export default function AgeGate({ onConfirm }: AgeGateProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background images — left and right */}
      <div className="absolute inset-0 flex pointer-events-none">
        {/* Left image — daytime restaurant */}
        <div className="w-1/2 h-full relative">
          <img
            src={DAY_IMAGE}
            alt="Restaurante durante o dia"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/60 to-background" />
          <div className="absolute inset-0 bg-background/30" />
        </div>
        {/* Right image — evening bar */}
        <div className="w-1/2 h-full relative">
          <img
            src={NIGHT_IMAGE}
            alt="Bar ao entardecer"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/60 to-background" />
          <div className="absolute inset-0 bg-background/30" />
        </div>
      </div>

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center px-6 py-10 max-w-md w-full"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden p-0.5">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/avalyarin-icon-green-Wax4Z5TjBNDkcesjXd93cC.webp"
              alt="AvaLyarin"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display text-2xl tracking-wider text-primary text-glow-amber">AVALYARIN</span>
        </div>

        {/* Card */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-8 w-full shadow-2xl">
          <h2 className="font-display text-xl tracking-wider text-foreground text-center mb-2">
            VERIFICAÇÃO DE IDADE
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Este aplicativo contém conteúdo relacionado a bebidas alcoólicas.
          </p>

          {/* Checkbox */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Checkbox
              id="age-confirm"
              checked={checked}
              onCheckedChange={(val) => setChecked(val === true)}
              className="w-6 h-6 border-2 border-primary/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor="age-confirm"
              className="text-base font-medium text-foreground cursor-pointer select-none"
            >
              Tenho mais de 18 anos
            </label>
          </div>

          {/* Enter button */}
          <Button
            onClick={onConfirm}
            disabled={!checked}
            className="w-full font-display tracking-wider text-base py-6 glow-amber"
            size="lg"
          >
            ENTRAR <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>

        {/* Legal text */}
        <p className="text-[11px] text-muted-foreground/50 text-center mt-6 max-w-xs leading-relaxed">
          Ao continuar, você confirma que possui idade legal para consumo de bebidas alcoólicas conforme a legislação brasileira.
        </p>
      </motion.div>
    </div>
  );
}
