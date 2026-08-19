// Design: AvaLyarin — Navbar with Y logo and back button
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <nav className="safe-area-header fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/95">
      <div className="container flex items-center h-16 gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isHome && (
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-amber overflow-hidden p-1">
              <img
                src="/logo-brand.png"
                alt="AvaLyarin Y logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-2xl leading-none tracking-wider text-primary text-glow-amber">
                AVALYARIN
              </h1>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
