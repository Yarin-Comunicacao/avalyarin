// Design: AvaLyarin — Navbar with Y logo, search bar, and hamburger menu trigger on left
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container flex items-center justify-between h-16 gap-3">
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
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/avalyarin-icon-green-Wax4Z5TjBNDkcesjXd93cC.webp"
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

        {/* Search Bar - centered */}
        <div className="flex-1 max-w-md hidden sm:block">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
        </div>
      </div>

      {/* Mobile search bar - below main nav */}
      <div className="sm:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </nav>
  );
}
