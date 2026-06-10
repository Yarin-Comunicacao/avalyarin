import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";

import { ThemeProvider } from "./contexts/ThemeContext";
import { BackgroundProvider } from "./contexts/BackgroundContext";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import CategoryGroupPage from "./pages/CategoryGroupPage";
import AllCategoriesPage from "./pages/AllCategoriesPage";
import EstablishmentPage from "./pages/EstablishmentPage";
import RatingPage from "./pages/RatingPage";
import OnboardingSurvey from "./pages/OnboardingSurvey";
import ExplorerSurvey from "./pages/ExplorerSurvey";
import ConnoisseurSurvey from "./pages/ConnoisseurSurvey";
// Account pages
import MeusDados from "./pages/MeusDados";
import Cadastro from "./pages/Cadastro";
import ContasConectadas from "./pages/ContasConectadas";
import MeuUsuario from "./pages/MeuUsuario";
import Planos from "./pages/Planos";
// Reviews pages (unified)
import MinhasAvaliacoes from "./pages/MinhasAvaliacoes";
// Saved pages
import MeusLocais from "./pages/MeusLocais";
import InfluencersFavoritos from "./pages/InfluencersFavoritos";
import ListasCollab from "./pages/ListasCollab";
// Badges
import BadgesPage from "./pages/BadgesPage";
// Notificações
import NotificacoesPage from "./pages/NotificacoesPage";
// Grupos
import GruposPage from "./pages/GruposPage";
// Search
import SearchResults from "./pages/SearchResults";
// Admin & Business
import AdminPanel from "./pages/AdminPanel";
import AdminEstabDetail from "./pages/AdminEstabDetail";
import BusinessPanel from "./pages/BusinessPanel";
// Rankings
import MeuRanking from "./pages/MeuRanking";
// QR Scan
import QRScanPage from "./pages/QRScanPage";
// Influencer
import InfluencerApplicationPage from "./pages/InfluencerApplicationPage";
// Nearby
import NearbyPage from "./pages/NearbyPage";
// PWA
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import AgeGate from "./components/AgeGate";
import AuthChoice from "./components/AuthChoice";

// ============================================================
// SURVEY LIFECYCLE HELPERS
// ============================================================

function getReviewCount(): number {
  try {
    const raw = localStorage.getItem("avalyarin_reviews");
    if (!raw) return 0;
    const reviews = JSON.parse(raw);
    return Array.isArray(reviews) ? reviews.length : 0;
  } catch {
    return 0;
  }
}

function isSurveyPhase2Due(): boolean {
  const count = getReviewCount();
  const completed = localStorage.getItem("avalyarin_survey_phase2_completed") === "true";
  const skipped = localStorage.getItem("avalyarin_survey_phase2_skipped") === "true";
  // Show if 5+ reviews, not completed, and not skipped in this session
  return count >= 5 && !completed && !skipped;
}

function isSurveyPhase3Due(): boolean {
  const count = getReviewCount();
  const completed = localStorage.getItem("avalyarin_survey_phase3_completed") === "true";
  const skipped = localStorage.getItem("avalyarin_survey_phase3_skipped") === "true";
  return count >= 10 && !completed && !skipped;
}

// ============================================================
// ROUTER
// ============================================================
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
    <ScrollToTop />
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categoria/:id" component={CategoryPage} />
      <Route path="/grupo/:id" component={CategoryGroupPage} />
      <Route path="/todas-categorias" component={AllCategoriesPage} />
      <Route path="/estabelecimento/:id" component={EstablishmentPage} />
      <Route path="/avaliar/:establishmentId" component={RatingPage} />
      {/* Account */}
      <Route path="/conta/dados" component={MeusDados} />
      <Route path="/conta/cadastro" component={Cadastro} />
      <Route path="/conta/conectadas" component={ContasConectadas} />
      <Route path="/conta/usuario" component={MeuUsuario} />
      <Route path="/conta/planos" component={Planos} />
      {/* Reviews (unified page with tabs) */}
      <Route path="/minhas-avaliacoes" component={MinhasAvaliacoes} />
      <Route path="/minhas-avaliacoes/:tab" component={MinhasAvaliacoes} />
      {/* Legacy redirects */}
      <Route path="/avaliacoes" component={MinhasAvaliacoes} />
      <Route path="/locais-visitados">{() => { window.location.replace("/minhas-avaliacoes/locais"); return null; }}</Route>
      <Route path="/galeria">{() => { window.location.replace("/minhas-avaliacoes/galeria"); return null; }}</Route>
      {/* Saved */}
      <Route path="/salvos/locais" component={MeusLocais} />
      <Route path="/salvos/influencers" component={InfluencersFavoritos} />
      <Route path="/salvos/collab" component={ListasCollab} />
      {/* Insígnias */}
      <Route path="/insignias" component={BadgesPage} />
      <Route path="/badges" component={BadgesPage} /> {/* Redirect compat */}
      {/* Grupos */}
      <Route path="/grupos" component={GruposPage} />
      {/* Notificações */}
      <Route path="/notificacoes" component={NotificacoesPage} />
      <Route path="/notificacoes/:tab" component={NotificacoesPage} />
      {/* Search */}
      <Route path="/busca" component={SearchResults} />
      {/* Rankings (legacy redirect) */}
      <Route path="/meu-ranking">{() => { window.location.replace("/minhas-avaliacoes/ranking"); return null; }}</Route>
      {/* QR Code Scan Landing */}
      <Route path="/e/:slug" component={QRScanPage} />
      {/* Nearby */}
      <Route path="/perto-de-mim" component={NearbyPage} />
      {/* Admin & Business */}
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/estab/:id" component={AdminEstabDetail} />
      <Route path="/painel-empresarial" component={BusinessPanel} />
      <Route path="/influencer/solicitar" component={InfluencerApplicationPage} />
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

// ============================================================
// APP
// ============================================================

function App() {
  // Age Gate
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(() => {
    return localStorage.getItem("avalyarin_age_confirmed") === "true";
  });

  // Auth Choice — shown after age gate, before onboarding/home
  const [authChoiceMade, setAuthChoiceMade] = useState<boolean>(() => {
    // If user already completed survey OR chose "login" flow, skip this screen
    const flow = localStorage.getItem("avalyarin_auth_flow");
    const surveyDone = localStorage.getItem("avalyarin_survey_completed") === "true";
    return flow !== null || surveyDone;
  });

  // Phase 1 — Onboarding
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(() => {
    return localStorage.getItem("avalyarin_survey_completed") === "true";
  });

  // Phase 2 — Explorer (after 5 reviews)
  const [showPhase2, setShowPhase2] = useState<boolean>(() => isSurveyPhase2Due());

  // Phase 3 — Connoisseur (after 10 reviews)
  const [showPhase3, setShowPhase3] = useState<boolean>(() => isSurveyPhase3Due());

  const saveSurveyMutation = trpc.survey.save.useMutation();
  const handleSurveyComplete = useCallback((answers: any) => {
    localStorage.setItem("avalyarin_survey_completed", "true");
    localStorage.setItem("avalyarin_survey_answers", JSON.stringify(answers));
    setSurveyCompleted(true);
    // Also persist to DB if user is authenticated
    try {
      saveSurveyMutation.mutate(answers);
    } catch { /* silent - localStorage is primary for now */ }
  }, [saveSurveyMutation]);

  const handlePhase2Complete = useCallback((answers: Record<string, string | string[] | number>) => {
    localStorage.setItem("avalyarin_survey_phase2_completed", "true");
    localStorage.setItem("avalyarin_survey_phase2_answers", JSON.stringify(answers));
    setShowPhase2(false);
    // Check if phase 3 is now due
    if (isSurveyPhase3Due()) {
      // Don't show immediately, let user use the app first
    }
  }, []);

  const handlePhase3Complete = useCallback((answers: Record<string, string | string[] | number>) => {
    localStorage.setItem("avalyarin_survey_phase3_completed", "true");
    localStorage.setItem("avalyarin_survey_phase3_answers", JSON.stringify(answers));
    setShowPhase3(false);
  }, []);

  // 1) Show age gate first
  if (!ageConfirmed) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <AgeGate onConfirm={() => {
            localStorage.setItem("avalyarin_age_confirmed", "true");
            setAgeConfirmed(true);
          }} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // 2) Show auth choice (Cadastre-se / Já Tenho Cadastro)
  if (!authChoiceMade) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <AuthChoice onChoose={(type) => {
            setAuthChoiceMade(true);
            // "login" flow marks survey as completed so user goes straight to home
            // "register" flow keeps survey pending so user sees onboarding after OAuth
            if (type === "login") {
              setSurveyCompleted(true);
            }
          }} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // 3) Show onboarding survey if not completed yet (new users from "Cadastre-se")
  if (!surveyCompleted) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <OnboardingSurvey onComplete={handleSurveyComplete} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // 4) Show Phase 2 survey if due
  if (showPhase2) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <ExplorerSurvey onComplete={handlePhase2Complete} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // 5) Show Phase 3 survey if due
  if (showPhase3) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <ConnoisseurSurvey onComplete={handlePhase3Complete} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="escuro">
        <BackgroundProvider>
          <TooltipProvider>
            <Toaster />
            <PWAInstallPrompt />
            <Router />
          </TooltipProvider>
        </BackgroundProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
