// Design: AvaLyarin — Navbar with Y logo and hamburger menu trigger on left
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { MenuTrigger } from "./AppMenu";

interface NavbarProps {
  backHref?: string;
  onMenuOpen?: () => void;
}

export default function Navbar({ backHref, onMenuOpen }: NavbarProps) {
  const [location] = useLocation();
  const isHome = location === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          {/* Menu trigger - always visible on left */}
          {onMenuOpen && <MenuTrigger onClick={onMenuOpen} />}

          {!isHome && (
            <Link href={backHref || "/#categorias"}>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            </Link>
          )}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-amber transition-all group-hover:bg-primary/20 overflow-hidden p-1">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/avalyarin-icon-green-Wax4Z5TjBNDkcesjXd93cC.webp"
                alt="AvaLyarin Y logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-display text-2xl leading-none tracking-wider text-primary text-glow-amber">
                AVALYARIN
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
