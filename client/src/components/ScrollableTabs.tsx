import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  labelFull: string;
  icon: React.ElementType;
  badge?: number;
}

interface ScrollableTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export function ScrollableTabs({ tabs, activeTab, onTabChange }: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkOverflow, { passive: true });
    window.addEventListener("resize", checkOverflow);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [checkOverflow]);

  // Re-check after tabs render
  useEffect(() => {
    const timer = setTimeout(checkOverflow, 100);
    return () => clearTimeout(timer);
  }, [tabs, checkOverflow]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 150;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="border-b border-border/30 relative">
      {/* Left arrow */}
      {showLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1 bg-gradient-to-r from-background via-background/90 to-transparent"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Right arrow */}
      {showRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1 bg-gradient-to-l from-background via-background/90 to-transparent"
          aria-label="Rolar para direita"
        >
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>
      )}

      {/* Scrollable tabs */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide px-6"
      >
        <div className="flex gap-0 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.labelFull}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
