import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ThemeSidebar from "./components/ThemeSidebar";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import EstablishmentPage from "./pages/EstablishmentPage";
import RatingPage from "./pages/RatingPage";
import OnboardingSurvey from "./pages/OnboardingSurvey";
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

function Router() {
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
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [surveyCompleted, setSurveyCompleted] = useState<boolean>(() => {
    return localStorage.getItem("avalyarin_survey_completed") === "true";
  });

  const handleSurveyComplete = (answers: any) => {
    localStorage.setItem("avalyarin_survey_completed", "true");
    localStorage.setItem("avalyarin_survey_answers", JSON.stringify(answers));
    setSurveyCompleted(true);
  };

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

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="escuro">
        <TooltipProvider>
          <Toaster />
          <ThemeSidebar />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
