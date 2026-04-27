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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categoria/:id" component={CategoryPage} />
      <Route path="/estabelecimento/:id" component={EstablishmentPage} />
      <Route path="/avaliar/:establishmentId" component={RatingPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
