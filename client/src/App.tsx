import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";

import { ThemeProvider } from "./contexts/ThemeContext";
import { BackgroundProvider } from "./contexts/BackgroundContext";
import { OwnerViewProvider } from "./contexts/OwnerViewContext";
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
import SpecialistsFavoritos from "./pages/SpecialistsFavoritos";
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
import BusinessLocais from "./pages/BusinessLocais";
import BusinessInsights from "./pages/BusinessInsights";
import BusinessDivulgacoes from "./pages/BusinessDivulgacoes";
// Rankings
import MeuRanking from "./pages/MeuRanking";
// QR Scan
import QRScanPage from "./pages/QRScanPage";
// QR Scanner (camera-based, lazy loaded)
const QRScannerPage = lazy(() => import("./pages/QRScannerPage"));
// Especialista
import SpecialistApplicationPage from "./pages/SpecialistApplicationPage";
import SpecialistPanel from "./pages/SpecialistPanel";
import SpecialistProfilePage from "./pages/SpecialistProfilePage";
// Critic
import CriticPanel from "./pages/CriticPanel";
// Public Profile
import PublicProfilePage from "./pages/PublicProfilePage";
// Mensagens (DMs)
import MensagensPage from "./pages/MensagensPage";
// Nearby
import NearbyPage from "./pages/NearbyPage";
// Mapa
import MapaPage from "./pages/MapaPage";
// Destaques
import DestaquesPage from "./pages/DestaquesPage";
// Conta Hub
import ContaPage from "./pages/ContaPage";
import EditarPerfil from "./pages/EditarPerfil";
// Planos por role
import BusinessPlanos from "./pages/BusinessPlanos";
import ProfessionalPlanos from "./pages/ProfessionalPlanos";
// Owner & System
import OwnerPanel from "./pages/OwnerPanel";
import OwnerSurvey from "./pages/OwnerSurvey";
import SystemPanel from "./pages/SystemPanel";
import TestSuitePage from "./pages/TestSuitePage";
// Calendar & Events
import CalendarioGrupo from "./pages/CalendarioGrupo";
import EventoDetalhe from "./pages/EventoDetalhe";
// Profiles
import RoleBasedProfile from "./components/profiles";
import BottomNav from "./components/BottomNav";
// PWA
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import AgeGate from "./components/AgeGate";
import AuthChoice from "./components/AuthChoice";
import LoginPage from "./pages/LoginPage";
import HowItWorksDialog from "./components/HowItWorksDialog";

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
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={Home} />
      <Route path="/categoria/:id" component={CategoryPage} />
      <Route path="/grupo/:id/calendario" component={CalendarioGrupo} />
      <Route path="/evento/:id" component={EventoDetalhe} />
      <Route path="/grupo/:id" component={CategoryGroupPage} />
      <Route path="/todas-categorias" component={AllCategoriesPage} />
      <Route path="/estabelecimento/:id" component={EstablishmentPage} />
      <Route path="/avaliar/:establishmentId" component={RatingPage} />
      {/* Account */}
      <Route path="/conta" component={ContaPage} />
      <Route path="/conta/editar-perfil" component={EditarPerfil} />
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
      <Route path="/salvos/especialistas" component={SpecialistsFavoritos} />
      <Route path="/salvos/collab" component={ListasCollab} />
      {/* Insígnias */}
      <Route path="/insignias">{() => { window.location.replace("/minhas-avaliacoes/insignias"); return null; }}</Route>
      <Route path="/badges">{() => { window.location.replace("/minhas-avaliacoes/insignias"); return null; }}</Route>
      {/* Grupos */}
      <Route path="/grupos" component={GruposPage} />
      {/* Notificações */}
      <Route path="/notificacoes" component={NotificacoesPage} />
      <Route path="/notificacoes/:tab" component={NotificacoesPage} />
      {/* Search */}
      <Route path="/busca" component={SearchResults} />
      {/* Rankings (legacy redirect) */}
      <Route path="/meu-ranking">{() => { window.location.replace("/minhas-avaliacoes/ranking"); return null; }}</Route>
      {/* QR Scanner (camera) */}
      <Route path="/scan">{() => <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}><QRScannerPage /></Suspense>}</Route>
      {/* QR Code Scan Landing */}
      <Route path="/e/:slug" component={QRScanPage} />
      {/* Nearby */}
      <Route path="/perto-de-mim" component={NearbyPage} />
      {/* Mapa */}
      <Route path="/mapa" component={MapaPage} />
      {/* Destaques */}
      <Route path="/destaques" component={DestaquesPage} />
      {/* Admin & Business */}
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/estab/:id" component={AdminEstabDetail} />
      <Route path="/admin/usuarios" component={AdminPanel} />
      <Route path="/admin/analytics" component={AdminPanel} />
      <Route path="/admin/config" component={AdminPanel} />
      <Route path="/admin/equipe" component={AdminPanel} />
      <Route path="/admin/especialistas" component={AdminPanel} />
      <Route path="/admin/estabs" component={AdminPanel} />
      <Route path="/admin/negocio" component={AdminPanel} />
      <Route path="/admin/permissoes" component={AdminPanel} />
      <Route path="/painel-empresarial" component={BusinessPanel} />
      <Route path="/painel-empresarial/insights" component={BusinessPanel} />
      <Route path="/painel-empresarial/notificacoes" component={BusinessPanel} />
      <Route path="/painel-empresarial/calendario" component={BusinessPanel} />
      <Route path="/painel-empresarial/config" component={BusinessPanel} />
      <Route path="/business/locais" component={BusinessLocais} />
      <Route path="/business/locais/cardapio" component={BusinessLocais} />
      <Route path="/business/locais/chat" component={BusinessLocais} />
      <Route path="/business/locais/solicitacoes" component={BusinessLocais} />
      <Route path="/business/locais/plano" component={BusinessLocais} />
      <Route path="/business/insights" component={BusinessInsights} />
      <Route path="/business/insights/plano" component={BusinessInsights} />
      <Route path="/business/insights/dashboard" component={BusinessInsights} />
      <Route path="/business/insights/desempenho" component={BusinessInsights} />
      <Route path="/business/insights/plano-acao" component={BusinessInsights} />
      <Route path="/business/divulgacoes" component={BusinessDivulgacoes} />
      <Route path="/business/divulgacoes/destaques" component={BusinessDivulgacoes} />
      <Route path="/business/divulgacoes/codigos" component={BusinessDivulgacoes} />
      <Route path="/business/divulgacoes/parcerias" component={BusinessDivulgacoes} />
      <Route path="/business/divulgacoes/transmissao" component={BusinessDivulgacoes} />
      <Route path="/business/divulgacoes/eventos" component={BusinessDivulgacoes} />
      <Route path="/business/plano" component={BusinessPlanos} />
      <Route path="/especialista/solicitar" component={SpecialistApplicationPage} />
      <Route path="/painel-especialista" component={SpecialistPanel} />
      <Route path="/painel-especialista/calendario" component={SpecialistPanel} />
      <Route path="/painel-especialista/parcerias" component={SpecialistPanel} />
      <Route path="/painel-especialista/codigos" component={SpecialistPanel} />
      <Route path="/painel-especialista/perfil" component={SpecialistPanel} />
      <Route path="/specialist/planos" component={ProfessionalPlanos} />
      <Route path="/critic/planos" component={ProfessionalPlanos} />
      <Route path="/painel-critico" component={CriticPanel} />
      <Route path="/painel-critico/calendario" component={CriticPanel} />
      <Route path="/painel-critico/avaliacoes" component={CriticPanel} />
      <Route path="/painel-critico/codigos" component={CriticPanel} />
      <Route path="/painel-critico/perfil" component={CriticPanel} />
      <Route path="/especialista/:id" component={SpecialistProfilePage} />
      <Route path="/owner" component={OwnerPanel} />
      <Route path="/owner/crescimento" component={OwnerPanel} />
      <Route path="/owner/financeiro" component={OwnerPanel} />
      <Route path="/owner/roles" component={OwnerPanel} />
      <Route path="/owner/codigo" component={OwnerPanel} />
      <Route path="/owner/brandbook" component={OwnerPanel} />
      <Route path="/owner/survey" component={OwnerSurvey} />
      <Route path="/owner/sistema/testes" component={TestSuitePage} />
      <Route path="/owner/sistema" component={SystemPanel} />
      <Route path="/mensagens/:username" component={MensagensPage} />
      <Route path="/mensagens" component={MensagensPage} />
      <Route path="/perfil/:username" component={PublicProfilePage} />
      <Route path="/perfil">{() => <RoleBasedProfile />}</Route>
      <Route path="/suporte/estabs">{() => <RoleBasedProfile />}</Route>
      <Route path="/suporte/tickets">{() => <RoleBasedProfile />}</Route>
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

// ============================================================
// APP — Gate wrapper (no hooks from wouter here)
// ============================================================

function App() {
  // Age Gate
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(() => {
    return localStorage.getItem("avalyarin_age_confirmed") === "true";
  });

  // Auth Choice — shown after age gate, before onboarding/home
  const [authChoiceMade, setAuthChoiceMade] = useState<boolean>(() => {
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

  // "Como Funciona" pop-up — shown once after onboarding completes
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // GTM injection — loads GTM script dynamically from DB config
  const { data: gtmData } = trpc.integrations.getGtmId.useQuery(undefined, {
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (!gtmData?.gtmId) return;
    const gtmId = gtmData.gtmId.trim();
    if (!gtmId || !/^GTM-[A-Z0-9]+$/i.test(gtmId)) return;
    if (document.getElementById("gtm-script")) return;
    const script = document.createElement("script");
    script.id = "gtm-script";
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`;
    document.head.appendChild(script);
    const noscript = document.createElement("noscript");
    noscript.id = "gtm-noscript";
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.insertBefore(noscript, document.body.firstChild);
  }, [gtmData?.gtmId]);

  const saveSurveyMutation = trpc.survey.save.useMutation();
  const submitClaimMutation = trpc.business.submitClaim.useMutation();
  const handleSurveyComplete = useCallback((answers: any) => {
    localStorage.setItem("avalyarin_survey_completed", "true");
    localStorage.setItem("avalyarin_survey_answers", JSON.stringify(answers));
    setSurveyCompleted(true);
    setShowHowItWorks(true);
    try {
      saveSurveyMutation.mutate(answers);
    } catch { /* silent */ }
    if (answers.selectedEstablishmentId) {
      try {
        submitClaimMutation.mutate({
          establishmentId: Number(answers.selectedEstablishmentId),
          businessName: "Solicitação via Onboarding",
          contactPhone: "-",
          contactEmail: "-",
          proofDescription: "Solicitação automática criada durante o cadastro (survey onboarding). Usuário se identificou como dono/gerente deste estabelecimento.",
        });
      } catch { /* silent */ }
    }
  }, [saveSurveyMutation, submitClaimMutation]);

  const handlePhase2Complete = useCallback((answers: Record<string, string | string[] | number>) => {
    localStorage.setItem("avalyarin_survey_phase2_completed", "true");
    localStorage.setItem("avalyarin_survey_phase2_answers", JSON.stringify(answers));
    setShowPhase2(false);
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

  // 2) Show auth choice — skip for public routes (detected inside AppContent)
  if (!authChoiceMade) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <AppGateWithRouteCheck
            gate="authChoice"
            onPass={() => {}}
            renderGate={() => (
              <AuthChoice onChoose={(type) => {
                setAuthChoiceMade(true);
                if (type === "login") {
                  setSurveyCompleted(true);
                }
              }} />
            )}
            renderContent={() => (
              <AppContent
                showHowItWorks={showHowItWorks}
                setShowHowItWorks={setShowHowItWorks}
              />
            )}
          />
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // 3) Show onboarding survey if not completed
  if (!surveyCompleted) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="escuro">
          <AppGateWithRouteCheck
            gate="survey"
            onPass={() => {}}
            renderGate={() => (
              <OnboardingSurvey onComplete={handleSurveyComplete} />
            )}
            renderContent={() => (
              <AppContent
                showHowItWorks={showHowItWorks}
                setShowHowItWorks={setShowHowItWorks}
              />
            )}
          />
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
        <AppContent
          showHowItWorks={showHowItWorks}
          setShowHowItWorks={setShowHowItWorks}
        />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// ============================================================
// AppGateWithRouteCheck — uses useLocation safely (always called)
// Renders gate content OR main content based on public route detection
// ============================================================
function AppGateWithRouteCheck({
  gate,
  onPass,
  renderGate,
  renderContent,
}: {
  gate: string;
  onPass: () => void;
  renderGate: () => React.ReactNode;
  renderContent: () => React.ReactNode;
}) {
  const [currentPath] = useLocation();
  const isPublicRoute = currentPath.startsWith("/e/") || currentPath.startsWith("/estabelecimento/") || currentPath.startsWith("/avaliar/");

  if (isPublicRoute) {
    return <>{renderContent()}</>;
  }

  return <>{renderGate()}</>;
}

// ============================================================
// AppContent — the main app shell with routing (uses useLocation safely)
// ============================================================
function AppContent({
  showHowItWorks,
  setShowHowItWorks,
}: {
  showHowItWorks: boolean;
  setShowHowItWorks: (v: boolean) => void;
}) {
  return (
    <OwnerViewProvider>
      <BackgroundProvider>
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <HowItWorksDialog open={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
          <Router />
          <BottomNav />
        </TooltipProvider>
      </BackgroundProvider>
    </OwnerViewProvider>
  );
}

export default App;
