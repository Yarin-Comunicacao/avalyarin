/**
 * LoginPage — Tela de login com Facebook, Google e Email
 * Será ativada quando o Manus OAuth for removido.
 * Por enquanto, coexiste com o login Manus.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // EMAIL LOGIN/REGISTER
  // ============================================================
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? { email, password, name } : { email, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro no login");
        return;
      }
      toast.success(mode === "register" ? "Conta criada!" : "Login realizado!");
      navigate("/");
      window.location.reload();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FACEBOOK LOGIN
  // ============================================================
  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      // Facebook SDK must be loaded in index.html
      const FB = (window as any).FB;
      if (!FB) {
        toast.error("Facebook SDK não carregado");
        setLoading(false);
        return;
      }
      FB.login(async (response: any) => {
        if (response.authResponse) {
          const { accessToken } = response.authResponse;
          const res = await fetch("/api/auth/facebook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ accessToken }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Login com Facebook realizado!");
            navigate("/");
            window.location.reload();
          } else {
            toast.error(data.error || "Erro no login com Facebook");
          }
        } else {
          toast.error("Login com Facebook cancelado");
        }
        setLoading(false);
      }, { scope: "email,public_profile" });
    } catch {
      toast.error("Erro ao conectar com Facebook");
      setLoading(false);
    }
  };

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const google = (window as any).google;
      if (!google?.accounts?.id) {
        toast.error("Google SDK não carregado");
        setLoading(false);
        return;
      }
      // Google One Tap or popup
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          toast.error("Login com Google não disponível no momento");
          setLoading(false);
        }
      });
    } catch {
      toast.error("Erro ao conectar com Google");
      setLoading(false);
    }
  };

  // Google callback (called from global scope)
  if (typeof window !== "undefined") {
    (window as any).handleGoogleCredentialResponse = async (response: any) => {
      const { credential: idToken } = response;
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Login com Google realizado!");
        navigate("/");
        window.location.reload();
      } else {
        toast.error(data.error || "Erro no login com Google");
      }
      setLoading(false);
    };
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <span className="text-3xl">🧄</span>
          <h1 className="font-display text-3xl tracking-wider text-primary mt-2">AVALYARIN</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 gap-3 text-sm font-medium"
            onClick={handleFacebookLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Entrar com Facebook
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 gap-3 text-sm font-medium"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground">ou continue com email</span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === "register" && (
            <Input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                {mode === "login" ? "Entrar" : "Criar Conta"}
              </>
            )}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>Não tem conta? <button onClick={() => setMode("register")} className="text-primary hover:underline">Criar conta</button></>
          ) : (
            <>Já tem conta? <button onClick={() => setMode("login")} className="text-primary hover:underline">Entrar</button></>
          )}
        </p>
      </div>
    </div>
  );
}
