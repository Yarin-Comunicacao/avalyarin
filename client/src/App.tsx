import { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";

import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import EstablishmentPage from "./pages/EstablishmentPage";
import RatingPage from "./pages/RatingPage";
import OnboardingSurvey from "./pages/OnboardingSurvey";
import ExplorerSurvey from "./pages/ExplorerSurvey";
import ConnoisseurSurvey from "./pages/ConnoisseurSurvey";
// Account pages
import MeusDados from "./pages/MeusDados";
import Cadastro from "./pages/Cadastro";
import ContasConectadas from "./pages/ContasConectadas";
import Planos from "./pages/Planos";
// Reviews pages
import Avaliacoes from "./pages/Avaliacoes";
import LocaisVisitados from "./pages/LocaisVisitados";
import Galeria from "./pages/Galeria";
// Saved pages
import MeusLocais from "./pages/MeusLocais";
import InfluencersFavoritos from "./pages/InfluencersFavoritos";
import ListasCollab from "./pages/ListasCollab";
// Badges
import BadgesPage from "./pages/BadgesPage";
// Search
import SearchResults from "./pages/SearchResults";
// Admin & Business
import AdminPanel from "./pages/AdminPanel";
import BusinessPanel from "./pages/BusinessPanel";
// Rankings
import MeuRanking from "./pages/MeuRanking";
// PWA
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

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
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categoria/:id" component={CategoryPage} />
      <Route path="/estabelecimento/:id" component={EstablishmentPage} />
      <Route path="/avaliar/:establishmentId" component={RatingPage} />
      {/* Account */}
      <Route path="/conta/dados" component={MeusDados} />
      <Route path="/conta/cadastro" component={Cadastro} />
      <Route path="/conta/conectadas" component={ContasConectadas} />
      <Route path="/conta/planos" component={Planos} />
      {/* Reviews */}
      <Route path="/avaliacoes" component={Avaliacoes} />
      <Route path="/locais-visitados" component={LocaisVisitados} />
      <Route path="/galeria" component={Galeria} />
      {/* Saved */}
      <Route path="/salvos/locais" component={MeusLocais} />
      <Route path="/salvos/influencers" component={InfluencersFavoritos} />
      <Route path="/salvos/collab" component={ListasCollab} />
      {/* Badges */}
      <Route path="/badges" component={BadgesPage} />
      {/* Search */}
      <Route path="/busca" component={SearchResults} />
      {/* Rankings */}
      <Route path="/meu-ranking" component={MeuRanking} />
      {/* Admin & Business */}
      <Route path="/admin" component={AdminPanel} />
      <Route path="/painel-empresarial" component={BusinessPanel} />
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ============================================================
// APP
// ============================================================

function App() {
  // Phase 1 — Onboarding
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(() => {
    return localStorage.getItem("avalyarin_survey_completed") === "true";
  });

  // Phase 2 — Explorer (after 5 reviews)
  const [showPhase2, setShowPhase2] = useState<boolean>(() => isSurveyPhase2Due());

  // Phase 3 — Connoisseur (after 10 reviews)
  const [showPhase3, setShowPhase3] = useState<boolean>(() => isSurveyPhase3Due());

  const handleSurveyComplete = useCallback((answers: any) => {
    localStorage.setItem("avalyarin_survey_completed", "true");
    localStorage.setItem("avalyarin_survey_answers", JSON.stringify(answers));
    setSurveyCompleted(true);
  }, []);

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

  // Show onboarding survey if not completed yet
  if (!surveyCompleted) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <OnboardingSurvey onComplete={handleSurveyComplete} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Show Phase 2 survey if due
  if (showPhase2) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <ExplorerSurvey onComplete={handlePhase2Complete} />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Show Phase 3 survey if due
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
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
