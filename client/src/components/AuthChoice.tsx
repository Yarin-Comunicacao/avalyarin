// AuthChoice — Intermediate screen after AgeGate
// Two options: "Cadastre-se" (new user → login → onboarding) and "Já Tenho Cadastro" (existing user → login → home)
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn } from "lucide-react";
import { getLoginUrl } from "@/const";

const DAY_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/age-gate-day-L5iDZ7EiwgNVQfD5ihnqAL.webp";
const NIGHT_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/age-gate-night-TGrHgM2B6Cr3AosUR4maEJ.webp";

interface AuthChoiceProps {
  onChoose: (type: "register" | "login") => void;
}

export default function AuthChoice({ onChoose }: AuthChoiceProps) {
  const handleRegister = () => {
    // Mark as new user so after OAuth callback we show onboarding
    localStorage.setItem("avalyarin_auth_flow", "register");
    onChoose("register");
    try { window.location.replace(getLoginUrl()); } catch { const a = document.createElement("a"); a.href = getLoginUrl(); a.rel = "noopener"; document.body.appendChild(a); a.click(); }
  };

  const handleLogin = () => {
    // Mark as existing user so after OAuth callback we skip onboarding
    localStorage.setItem("avalyarin_auth_flow", "login");
    // Mark survey as completed so existing users skip onboarding
    localStorage.setItem("avalyarin_survey_completed", "true");
    onChoose("login");
    try { window.location.replace(getLoginUrl()); } catch { const a = document.createElement("a"); a.href = getLoginUrl(); a.rel = "noopener"; document.body.appendChild(a); a.click(); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background images — same as AgeGate for visual continuity */}
      <div className="absolute inset-0 flex pointer-events-none">
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
          <h2 className="font-display text-2xl tracking-wider text-primary text-center mb-2">
            EXPERIMENTE E AVALIE
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            A rede social de avaliações de bares e restaurantes de São Paulo.
          </p>

          {/* Register button */}
          <Button
            onClick={handleRegister}
            className="w-full font-display tracking-wider text-base py-6 glow-amber mb-4"
            size="lg"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            CADASTRE-SE
          </Button>

          {/* Login button */}
          <Button
            onClick={handleLogin}
            variant="outline"
            className="w-full font-display tracking-wider text-base py-6 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            JÁ TENHO CADASTRO
          </Button>
        </div>

        {/* Legal text */}
        <p className="text-[11px] text-muted-foreground/50 text-center mt-6 max-w-xs leading-relaxed">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
}
