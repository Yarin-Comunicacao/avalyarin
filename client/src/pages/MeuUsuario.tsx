// Meu Usuário — Username management, Preferences (survey history), Últimas Visitas, Connected Accounts
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { toast } from "sonner";
import {
  UserCog, Check, X, AlertCircle, Loader2, MapPin, Link2,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";

export default function MeuUsuario() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Username state
  const [usernameInput, setUsernameInput] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get current profile
  const { data: profile, isLoading: profileLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Check username availability (debounced)
  const { data: availabilityData, isFetching: checkingAvailability } = trpc.profile.checkUsername.useQuery(
    { username: debouncedUsername },
    { enabled: debouncedUsername.length >= 3 && !/\s/.test(debouncedUsername) }
  );

  // Get suggestions when user types a name with spaces
  const { data: suggestions } = trpc.profile.suggestUsernames.useQuery(
    { name: usernameInput },
    { enabled: showSuggestions && usernameInput.includes(" ") }
  );

  // Save username mutation
  const saveUsername = trpc.profile.setUsername.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Nome de usuário salvo com sucesso!");
        setShowSuggestions(false);
      } else {
        toast.error(result.error || "Erro ao salvar nome de usuário");
      }
    },
    onError: () => {
      toast.error("Erro ao salvar nome de usuário");
    },
  });

  // Initialize username from profile
  useEffect(() => {
    if (profile?.username) {
      setUsernameInput(profile.username);
    }
  }, [profile?.username]);

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      const cleaned = usernameInput.toLowerCase().trim();
      if (cleaned.length >= 3 && !/\s/.test(cleaned)) {
        setDebouncedUsername(cleaned);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [usernameInput]);

  // Detect spaces and show suggestions
  useEffect(() => {
    if (usernameInput.includes(" ")) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [usernameInput]);

  const handleUsernameChange = (value: string) => {
    setUsernameInput(value);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setUsernameInput(suggestion);
    setShowSuggestions(false);
    setDebouncedUsername(suggestion);
  };

  const handleSaveUsername = () => {
    const cleaned = usernameInput.toLowerCase().trim();
    if (/\s/.test(cleaned)) {
      toast.error("Nome de usuário não pode conter espaços");
      return;
    }
    if (cleaned.length < 3) {
      toast.error("Nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }
    saveUsername.mutate({ username: cleaned });
  };

  // Get survey preferences from localStorage
  const preferences = useMemo(() => {
    const prefs: { phase: string; answers: Record<string, any> }[] = [];
    try {
      const phase1 = localStorage.getItem("avalyarin_survey_answers");
      if (phase1) prefs.push({ phase: "Pesquisa Inicial", answers: JSON.parse(phase1) });
      const phase2 = localStorage.getItem("avalyarin_survey_phase2_answers");
      if (phase2) prefs.push({ phase: "Pesquisa Explorador", answers: JSON.parse(phase2) });
      const phase3 = localStorage.getItem("avalyarin_survey_phase3_answers");
      if (phase3) prefs.push({ phase: "Pesquisa Conhecedor", answers: JSON.parse(phase3) });
    } catch { /* ignore */ }
    return prefs;
  }, []);

  // Get recent visits from localStorage
  const recentVisits = useMemo(() => {
    try {
      const raw = localStorage.getItem("avalyarin_reviews");
      if (!raw) return [];
      const reviews = JSON.parse(raw);
      if (!Array.isArray(reviews)) return [];
      return reviews.slice(-10).reverse();
    } catch {
      return [];
    }
  }, []);

  // Badge count for survey unlocking
  const badgeCount = useMemo(() => {
    try {
      const raw = localStorage.getItem("avalyarin_badges");
      if (!raw) return 0;
      const badges = JSON.parse(raw);
      return Array.isArray(badges) ? badges.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const nextSurveyAt = Math.ceil((badgeCount + 1) / 5) * 5;

  const isUsernameValid = usernameInput.length >= 3 && !/\s/.test(usernameInput);
  const isUsernameAvailable = availabilityData?.available === true;
  const isCurrentUsername = profile?.username === usernameInput;

  if (!user) {
    return (
      <div className="min-h-screen">
        <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <Navbar onMenuOpen={() => setMenuOpen(true)} />
        <div className="pt-28 container text-center">
          <p className="text-muted-foreground">Faça login para acessar seu perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="pt-28 pb-12 container max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <UserCog className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-wider text-primary">MEU USUÁRIO</h1>
            <p className="text-sm text-muted-foreground">Gerencie seu nome de usuário e preferências</p>
          </div>
        </div>

        {/* Username Section */}
        <section className="mb-8 p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-display text-lg tracking-wider text-foreground mb-4">NOME DE USUÁRIO</h2>
          
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="seunomeusuario"
                className="w-full pl-8 pr-10 py-3 rounded-lg bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
              {/* Status indicator */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingAvailability && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                {!checkingAvailability && isUsernameValid && !isCurrentUsername && isUsernameAvailable && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {!checkingAvailability && isUsernameValid && !isCurrentUsername && availabilityData && !isUsernameAvailable && (
                  <X className="w-4 h-4 text-red-500" />
                )}
                {usernameInput.includes(" ") && (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>

            {/* Space warning + suggestions */}
            {showSuggestions && usernameInput.includes(" ") && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400 mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Espaços não são permitidos. Sugestões:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions && suggestions.length > 0 ? (
                    suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSelectSuggestion(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                      >
                        @{s}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Carregando sugestões...</span>
                  )}
                </div>
              </div>
            )}

            {/* Availability message */}
            {!checkingAvailability && isUsernameValid && !isCurrentUsername && availabilityData && !isUsernameAvailable && (
              <p className="text-xs text-red-400">Este nome de usuário já está em uso. Escolha outro.</p>
            )}

            {/* Save button */}
            {isUsernameValid && !isCurrentUsername && isUsernameAvailable && (
              <button
                onClick={handleSaveUsername}
                disabled={saveUsername.isPending}
                className="w-full py-2.5 rounded-lg bg-primary/20 border border-primary/40 text-primary font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {saveUsername.isPending ? "Salvando..." : "Confirmar Nome de Usuário"}
              </button>
            )}

            <p className="text-[11px] text-muted-foreground/60">
              Apenas letras minúsculas, números, ponto (.) e underline (_). Sem espaços.
            </p>
          </div>
        </section>

        {/* Preferences Section — Only categories and priorities */}
        <section className="mb-8 p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-display text-lg tracking-wider text-foreground mb-4">PREFERÊNCIAS</h2>
          
          {preferences.length > 0 ? (
            <div className="space-y-4">
              {/* Categories */}
              {(() => {
                const cats = preferences.flatMap(p => {
                  const c = p.answers.categories;
                  return Array.isArray(c) ? c : [];
                });
                if (cats.length === 0) return null;
                return (
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                    <p className="text-xs text-primary font-medium mb-2">Categorias Favoritas</p>
                    <div className="flex flex-wrap gap-2">
                      {cats.map((cat: string) => (
                        <span key={cat} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                          {cat.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Priorities */}
              {(() => {
                const prios = preferences.flatMap(p => {
                  const pr = p.answers.priorities;
                  return Array.isArray(pr) ? pr : [];
                });
                if (prios.length === 0) return null;
                return (
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                    <p className="text-xs text-primary font-medium mb-2">Prioridades</p>
                    <div className="flex flex-wrap gap-2">
                      {prios.map((prio: string) => (
                        <span key={prio} className="text-xs px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-foreground">
                          {prio.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60">
              Nenhuma pesquisa respondida ainda. Complete avaliações para desbloquear novas pesquisas de preferências.
            </p>
          )}

          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              Próxima pesquisa de preferências desbloqueada em: <span className="text-primary font-medium">{nextSurveyAt} badges</span>
              {" "}(você tem {badgeCount})
            </p>
          </div>
        </section>

        {/* Últimas Visitas Section */}
        <section className="mb-8 p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-display text-lg tracking-wider text-foreground mb-4">ÚLTIMAS VISITAS</h2>
          
          {recentVisits.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentVisits.map((visit: any, idx: number) => (
                <Link key={idx} href={`/estabelecimento/${visit.establishmentSlug || visit.establishmentId}`}>
                  <div className="rounded-xl overflow-hidden border border-border/30 hover:border-primary/40 transition-colors group cursor-pointer">
                    <div className="aspect-square bg-secondary/50 flex items-center justify-center">
                      {visit.image ? (
                        <img src={visit.image} alt={visit.name} className="w-full h-full object-cover" />
                      ) : (
                        <MapPin className="w-6 h-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-foreground/80 truncate group-hover:text-primary transition-colors">
                        {visit.name || visit.establishmentName || "Local"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Nota: {visit.score || visit.overallScore || "—"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60">
              Nenhuma visita registrada ainda. Avalie um estabelecimento para ver aqui.
            </p>
          )}
        </section>

        {/* Connected Accounts Section */}
        <section className="p-5 rounded-xl bg-card border border-border/50">
          <h2 className="font-display text-lg tracking-wider text-foreground mb-4">CONTAS CONECTADAS</h2>
          
          <div className="space-y-3">
            {[
              { name: "Google", icon: "🔵", connected: !!user?.email, info: user?.email || "Não conectado" },
              { name: "Instagram", icon: "📷", connected: false, info: "Não conectado" },
              { name: "Facebook", icon: "🔷", connected: false, info: "Não conectado" },
            ].map((account) => (
              <div
                key={account.name}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30"
              >
                <span className="text-lg">{account.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{account.name}</p>
                  <p className="text-[11px] text-muted-foreground">{account.info}</p>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] ${
                  account.connected
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-secondary text-muted-foreground border border-border/30"
                }`}>
                  {account.connected ? "Conectado" : "Conectar"}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground/60 mt-4">
            Ao conectar suas contas, você concorda com nossos Termos de Uso e Política de Privacidade (LGPD).
          </p>
        </section>
      </div>
    </div>
  );
}
