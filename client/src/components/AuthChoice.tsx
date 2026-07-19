// AuthChoice — Login/Register screen with Google, Facebook, Email options
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

const DAY_IMAGE = "/storage/age-gate-day-L5iDZ7EiwgNVQfD5ihnqAL.webp";
const NIGHT_IMAGE = "/storage/age-gate-night-TGrHgM2B6Cr3AosUR4maEJ.webp";

interface AuthChoiceProps {
  onChoose: (type: "register" | "login") => void;
}

type AuthView = "main" | "email-login" | "email-register";

export default function AuthChoice({ onChoose }: AuthChoiceProps) {
  const [view, setView] = useState<AuthView>("main");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // ============================================================
  // GOOGLE LOGIN (via Google Identity Services)
  // ============================================================
  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    try {
      // Load Google Identity Services script if not loaded
      if (!(window as any).google?.accounts) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://accounts.google.com/gsi/client";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google SDK"));
          document.head.appendChild(script);
        });
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
      if (!clientId) {
        // Fallback: use redirect-based OAuth
        const origin = window.location.origin;
        window.location.href = `${origin}/api/auth/login?origin=${encodeURIComponent(origin)}`;
        return;
      }

      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: response.credential }),
              credentials: "include",
            });
            const data = await res.json();
            if (res.ok && data.success) {
              localStorage.setItem("avalyarin_auth_flow", "login");
              // DO NOT set avalyarin_survey_completed here — let App.tsx check if user needs onboarding
              onChoose("login");
              window.location.reload();
            } else {
              toast.error(data.error || "Erro no login com Google");
            }
          } catch {
            toast.error("Erro de conexão com o servidor");
          } finally {
            setLoading(false);
          }
        },
      });

      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: use redirect-based OAuth
          setLoading(false);
          const origin = window.location.origin;
          window.location.href = `${origin}/api/auth/login?origin=${encodeURIComponent(origin)}`;
        }
      });
    } catch (err) {
      console.error("[Auth] Google login error:", err);
      // Fallback: use redirect-based OAuth
      const origin = window.location.origin;
      window.location.href = `${origin}/api/auth/login?origin=${encodeURIComponent(origin)}`;
    }
  }, [onChoose]);

  // ============================================================
  // FACEBOOK LOGIN (redirect-based OAuth)
  // ============================================================
  const handleFacebookLogin = useCallback(() => {
    setLoading(true);
    const origin = window.location.origin;
    window.location.href = `${origin}/api/auth/facebook?origin=${encodeURIComponent(origin)}`;
  }, []);

  // ============================================================
  // EMAIL LOGIN
  // ============================================================
  const handleEmailLogin = useCallback(async () => {
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("avalyarin_auth_flow", "login");
        // DO NOT set avalyarin_survey_completed here — let App.tsx check if user needs onboarding
        onChoose("login");
        window.location.reload();
      } else {
        toast.error(data.error || "Email ou senha incorretos");
      }
    } catch {
      toast.error("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }, [email, password, onChoose]);

  // ============================================================
  // EMAIL REGISTER
  // ============================================================
  const handleEmailRegister = useCallback(async () => {
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("avalyarin_auth_flow", "register");
        onChoose("register");
        window.location.reload();
      } else if (data.code === "USER_ALREADY_EXISTS") {
        toast.error("Usuário já cadastrado! Redirecionando para login...", {
          description: data.loginMethod === "google" 
            ? "Use sua conta Google para entrar."
            : data.loginMethod === "facebook"
            ? "Use sua conta Facebook para entrar."
            : "Use seu email e senha para entrar.",
          duration: 4000,
        });
        setTimeout(() => setView("email-login"), 2000);
      } else {
        toast.error(data.error || "Erro no cadastro");
      }
    } catch {
      toast.error("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }, [email, password, name, onChoose]);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background images */}
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
              src="/storage/avalyarin-icon-green-Wax4Z5TjBNDkcesjXd93cC.webp"
              alt="AvaLyarin"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-display text-2xl tracking-wider text-primary text-glow-amber">
            AVALYARIN
          </span>
        </div>

        {/* Card */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl p-8 w-full shadow-2xl">
          <AnimatePresence mode="wait">
            {view === "main" && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="font-display text-2xl tracking-wider text-primary text-center mb-2">
                  EXPERIMENTE E AVALIE
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-8">
                  A rede social de avaliações de bares e restaurantes de São Paulo.
                </p>

                {/* Google Button */}
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-6 mb-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium text-sm"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continuar com Google
                </Button>

                {/* Facebook Button */}
                <Button
                  onClick={handleFacebookLogin}
                  disabled={loading}
                  className="w-full py-6 mb-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium text-sm"
                  size="lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Continuar com Facebook
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                {/* Email Login Button */}
                <Button
                  onClick={() => setView("email-login")}
                  variant="outline"
                  className="w-full py-6 mb-3 font-display tracking-wider text-sm border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                  size="lg"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  ENTRAR COM EMAIL
                </Button>

                {/* Register link */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Não tem conta?{" "}
                  <button
                    onClick={() => setView("email-register")}
                    className="text-primary hover:underline font-medium"
                  >
                    Cadastre-se
                  </button>
                </p>
              </motion.div>
            )}

            {view === "email-login" && (
              <motion.div
                key="email-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setView("main")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <h2 className="font-display text-xl tracking-wider text-primary text-center mb-6">
                  ENTRAR COM EMAIL
                </h2>

                <div className="space-y-4">
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="py-5"
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="py-5 pr-10"
                      onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={handleEmailLogin}
                    disabled={loading}
                    className="w-full py-6 font-display tracking-wider glow-amber"
                    size="lg"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "ENTRAR"}
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Não tem conta?{" "}
                  <button
                    onClick={() => setView("email-register")}
                    className="text-primary hover:underline font-medium"
                  >
                    Cadastre-se
                  </button>
                </p>
              </motion.div>
            )}

            {view === "email-register" && (
              <motion.div
                key="email-register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setView("main")}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <h2 className="font-display text-xl tracking-wider text-primary text-center mb-6">
                  CRIAR CONTA
                </h2>

                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="py-5"
                  />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="py-5"
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha (mínimo 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="py-5 pr-10"
                      onKeyDown={(e) => e.key === "Enter" && handleEmailRegister()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={handleEmailRegister}
                    disabled={loading}
                    className="w-full py-6 font-display tracking-wider glow-amber"
                    size="lg"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CADASTRAR"}
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Já tem conta?{" "}
                  <button
                    onClick={() => setView("email-login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Entrar
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legal text */}
        <p className="text-[11px] text-muted-foreground/50 text-center mt-6 max-w-xs leading-relaxed">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
}
