// ContaPage — Hub de conta do usuário (substitui o menu lateral para user/especialista/business/support)
// Agrupa: Editar Perfil, Meus Dados, Planos, Tema, Fundo, Notificações, Salvos, Insígnias, Logout
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import {
  User, Mail, Crown, Palette, Image, Bell, Bookmark, Trophy,
  LogOut, ChevronRight, Edit, Star, MapPin, Heart, Loader2, Check, X, ExternalLink,
  UserPlus, LogIn
} from "lucide-react";
import { getConnectYarinUrl } from "@shared/const";
import { getLoginUrl } from "@/const";
import { useTheme, THEME_OPTIONS, ThemeName } from "@/contexts/ThemeContext";
import { useBackground, BACKGROUND_OPTIONS } from "@/contexts/BackgroundContext";

export default function ContaPage() {
  const { user, logout, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { background, setBackground } = useBackground();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);


  // Profile data
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const { data: myPlanData } = trpc.plans.myPlan.useQuery(undefined, { enabled: !!user });
  const planBadge = myPlanData?.plan === "embaixador" ? "Embaixador" : myPlanData?.plan === "premium" ? "Premium" : "Free";

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden pb-24">
        {/* Background images */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="w-1/2 h-full relative">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/age-gate-day-L5iDZ7EiwgNVQfD5ihnqAL.webp"
              alt="Restaurante durante o dia"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/60 to-background" />
            <div className="absolute inset-0 bg-background/30" />
          </div>
          <div className="w-1/2 h-full relative">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/age-gate-night-TGrHgM2B6Cr3AosUR4maEJ.webp"
              alt="Bar ao entardecer"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/60 to-background" />
            <div className="absolute inset-0 bg-background/30" />
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center px-6 py-10 max-w-md w-full">
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
              MINHA CONTA
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Entre ou crie sua conta para fazer parte da rede social de avaliações de São Paulo.
            </p>

            {/* Register button */}
            <button
              onClick={() => {
                localStorage.setItem("avalyarin_auth_flow", "register");
                window.location.href = getLoginUrl();
              }}
              className="w-full flex items-center justify-center gap-2 font-display tracking-wider text-base py-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow-amber mb-4"
            >
              <UserPlus className="w-5 h-5" />
              CADASTRE-SE
            </button>

            {/* Login button */}
            <button
              onClick={() => {
                localStorage.setItem("avalyarin_auth_flow", "login");
                localStorage.setItem("avalyarin_survey_completed", "true");
                window.location.href = getLoginUrl();
              }}
              className="w-full flex items-center justify-center gap-2 font-display tracking-wider text-base py-4 rounded-lg border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              ENTRE
            </button>
          </div>

          {/* Legal text */}
          <p className="text-[11px] text-muted-foreground/50 text-center mt-6 max-w-xs leading-relaxed">
            Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="pt-28 container max-w-md">
        {/* User Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-xl text-foreground tracking-wider">
              {profile?.name || user.name || "Sem nome"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile?.username ? `@${profile.username}` : "Sem username"}
            </p>
            {profile?.username && (
              <a
                href={getConnectYarinUrl(profile.username)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary/80 hover:text-primary transition-colors mt-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                Connect Yarin
              </a>
            )}
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Link href="/conta/editar-perfil">
            <button className="p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
              <Edit className="w-4 h-4 text-primary" />
            </button>
          </Link>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          {/* Meus Dados */}
          <Link href="/conta/dados">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-card/80 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-4.5 h-4.5 text-blue-400" />
              </div>
              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">Meus Dados</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>

          {/* Planos */}
          <Link href="/conta/planos">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-card/80 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Crown className="w-4.5 h-4.5 text-yellow-400" />
              </div>
              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">Planos</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {planBadge}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>

          {/* Tema Visual */}
          <div
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-card/80 transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Palette className="w-4.5 h-4.5 text-purple-400" />
            </div>
            <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">Tema Visual</span>
            <span className="text-xs text-muted-foreground capitalize">{theme}</span>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showThemePicker ? "rotate-90" : ""}`} />
          </div>
          {showThemePicker && (
            <div className="ml-12 mb-2 space-y-1">
              {THEME_OPTIONS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); setShowThemePicker(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    theme === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: t.preview }} />
                  <span>{t.label}</span>
                  {theme === t.id && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          )}

          {/* Imagem de Fundo */}
          <div
            onClick={() => setShowBgPicker(!showBgPicker)}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-card/80 transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Image className="w-4.5 h-4.5 text-green-400" />
            </div>
            <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">Imagem de Fundo</span>
            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${showBgPicker ? "rotate-90" : ""}`} />
          </div>
          {showBgPicker && (
            <div className="ml-12 mb-2 space-y-1">
              {BACKGROUND_OPTIONS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => { setBackground(bg.id); setShowBgPicker(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    background === bg.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  }`}
                >
                  <span>{bg.label}</span>
                  {background === bg.id && <Check className="w-3 h-3 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/30 my-3" />

          {/* Notificações */}
          <Link href="/notificacoes/badges">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-card/80 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-red-400" />
              </div>
              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">Notificações</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>


          {/* Lista de Salvos */}
          <Link href="/salvos/locais">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-card/80 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <Bookmark className="w-4.5 h-4.5 text-pink-400" />
              </div>
              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">Lista de Salvos</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>

          {/* Insígnias */}
          <Link href="/minhas-avaliacoes/insignias">
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-card/80 transition-colors cursor-pointer group">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <span className="flex-1 text-sm text-foreground group-hover:text-primary transition-colors">Minhas Insígnias</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>

          {/* Divider */}
          <div className="border-t border-border/30 my-3" />

          {/* Logout */}
          <button
            onClick={async () => { await logout(); toast.success("Desconectado com sucesso!"); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-destructive/10 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4.5 h-4.5 text-destructive" />
            </div>
            <span className="flex-1 text-left text-sm text-foreground group-hover:text-destructive transition-colors">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}

