// Design: Neon Urbano — Navbar with amber glow branding
import { Link, useLocation } from "wouter";
import { Beer, ArrowLeft } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          {!isHome && (
            <Link href="/">
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors mr-1">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-amber transition-all group-hover:bg-primary/20">
              <Beer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl leading-none tracking-wider text-primary text-glow-amber">
                AVALIA BAR
              </h1>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-full bg-secondary border border-border/50">
            Beta
          </span>
        </div>
      </div>
    </nav>
  );
}
