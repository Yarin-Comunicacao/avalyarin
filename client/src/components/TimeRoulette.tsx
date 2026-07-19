// Roulette-style time picker with 2 drum-roll columns (hours 0-23, minutes 0-55 step 5)
// Same visual style as BirthdateRoulette
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Clock } from "lucide-react";

const ITEM_HEIGHT = 44; // px per item in the roulette
const VISIBLE_ITEMS = 5; // number of visible items in viewport

interface TimeRouletteProps {
  value?: { hours: number; minutes: number };
  onChange: (time: { hours: number; minutes: number }) => void;
  minHour?: number; // Minimum allowed hour (establishment opens)
  maxHour?: number; // Maximum allowed hour (establishment closes)
  closesAfterMidnight?: boolean; // If true, hours wrap around midnight
}

// Individual drum/roulette column
interface DrumColumnProps {
  items: { label: string; value: number; blank?: boolean }[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  label: string;
}

function DrumColumn({ items, selectedIndex, onSelect, label }: DrumColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Scroll to selected index on mount and when selectedIndex changes
  useEffect(() => {
    if (containerRef.current && !isScrollingRef.current) {
      const targetScroll = selectedIndex * ITEM_HEIGHT;
      containerRef.current.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

      // Don't allow selecting blank items — snap to nearest non-blank
      let finalIndex = clampedIndex;
      if (items[finalIndex]?.blank) {
        let found = false;
        for (let i = finalIndex + 1; i < items.length; i++) {
          if (!items[i]?.blank) {
            finalIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          for (let i = finalIndex - 1; i >= 0; i--) {
            if (!items[i]?.blank) {
              finalIndex = i;
              break;
            }
          }
        }
      }

      // Snap to nearest item
      containerRef.current.scrollTo({
        top: finalIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });

      isScrollingRef.current = false;
      if (finalIndex !== selectedIndex) {
        onSelect(finalIndex);
      }
    }, 80);
  }, [items, selectedIndex, onSelect]);

  // Handle touch/click on specific item
  const handleItemClick = (index: number) => {
    if (items[index]?.blank) return;
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: "smooth",
      });
    }
    onSelect(index);
  };

  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1 font-medium">
        {label}
      </span>
      <div className="relative w-full">
        {/* Selection highlight */}
        <div
          className="absolute left-0 right-0 pointer-events-none z-10 border-y border-primary/40 bg-primary/5 rounded-md"
          style={{
            top: paddingItems * ITEM_HEIGHT,
            height: ITEM_HEIGHT,
          }}
        />
        {/* Gradient overlays */}
        <div
          className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
          style={{
            height: paddingItems * ITEM_HEIGHT,
            background: "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{
            height: paddingItems * ITEM_HEIGHT,
            background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
          }}
        />
        {/* Scrollable container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-y-auto scrollbar-hide"
          style={{
            height: VISIBLE_ITEMS * ITEM_HEIGHT,
            scrollSnapType: "y mandatory",
          }}
        >
          {/* Top padding */}
          <div style={{ height: paddingItems * ITEM_HEIGHT }} />
          {items.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            if (item.blank) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="flex items-center justify-center select-none"
                  style={{
                    height: ITEM_HEIGHT,
                    scrollSnapAlign: "start",
                  }}
                />
              );
            }
            return (
              <div
                key={`${item.value}-${idx}`}
                onClick={() => handleItemClick(idx)}
                className={`flex items-center justify-center cursor-pointer transition-all duration-150 select-none ${
                  isSelected
                    ? "text-primary font-bold text-lg"
                    : "text-muted-foreground/50 text-sm"
                }`}
                style={{
                  height: ITEM_HEIGHT,
                  scrollSnapAlign: "start",
                }}
              >
                {item.label}
              </div>
            );
          })}
          {/* Bottom padding */}
          <div style={{ height: paddingItems * ITEM_HEIGHT }} />
        </div>
      </div>
    </div>
  );
}

export default function TimeRoulette({ value, onChange, minHour, maxHour, closesAfterMidnight }: TimeRouletteProps) {
  // Default to current hour rounded to nearest 5 minutes
  const now = new Date();
  const defaultHour = value?.hours ?? now.getHours();
  const defaultMinute = value?.minutes ?? Math.round(now.getMinutes() / 5) * 5;

  const [selectedHour, setSelectedHour] = useState(defaultHour);
  const [selectedMinute, setSelectedMinute] = useState(defaultMinute >= 60 ? 55 : defaultMinute);

  // Generate hour items (0-23) with 2 blank items at the top
  // Filter based on minHour/maxHour if provided
  const hourItems = useMemo(() => {
    const items: { label: string; value: number; blank?: boolean }[] = [];
    items.push({ label: "", value: -2, blank: true });
    items.push({ label: "", value: -1, blank: true });
    for (let h = 0; h <= 23; h++) {
      let allowed = true;
      if (minHour !== undefined && maxHour !== undefined) {
        if (closesAfterMidnight) {
          // e.g., opens at 17, closes at 2 → valid: 17-23 and 0-2
          allowed = h >= minHour || h <= maxHour;
        } else {
          // Normal: opens at 11, closes at 23 → valid: 11-23
          allowed = h >= minHour && h <= maxHour;
        }
      } else if (minHour !== undefined) {
        allowed = h >= minHour;
      } else if (maxHour !== undefined) {
        allowed = h <= maxHour;
      }
      if (allowed) {
        items.push({ label: String(h).padStart(2, "0"), value: h });
      }
    }
    // If no valid hours (shouldn't happen), show all
    if (items.length <= 2) {
      for (let h = 0; h <= 23; h++) {
        items.push({ label: String(h).padStart(2, "0"), value: h });
      }
    }
    return items;
  }, [minHour, maxHour, closesAfterMidnight]);

  // Generate minute items (0-55, step 5) with 2 blank items at the top
  const minuteItems = useMemo(() => {
    const items: { label: string; value: number; blank?: boolean }[] = [];
    items.push({ label: "", value: -2, blank: true });
    items.push({ label: "", value: -1, blank: true });
    for (let m = 0; m <= 55; m += 5) {
      items.push({ label: String(m).padStart(2, "0"), value: m });
    }
    return items;
  }, []);

  // Emit changes
  useEffect(() => {
    onChange({ hours: selectedHour, minutes: selectedMinute });
  }, [selectedHour, selectedMinute, onChange]);

  // Find indices (offset by 2 for the blank items)
  const hourIndex = hourItems.findIndex(h => h.value === selectedHour);
  const minuteIndex = minuteItems.findIndex(m => m.value === selectedMinute);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground/80">Horário da visita</span>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-[200px] mx-auto">
        <DrumColumn
          items={hourItems}
          selectedIndex={hourIndex >= 0 ? hourIndex : 2}
          onSelect={(idx) => {
            const item = hourItems[idx];
            if (item && !item.blank) {
              setSelectedHour(item.value);
            }
          }}
          label="Hora"
        />
        <DrumColumn
          items={minuteItems}
          selectedIndex={minuteIndex >= 0 ? minuteIndex : 2}
          onSelect={(idx) => {
            const item = minuteItems[idx];
            if (item && !item.blank) {
              setSelectedMinute(item.value);
            }
          }}
          label="Minuto"
        />
      </div>

      {/* Selected time display */}
      <div className="mt-3 text-center">
        <p className="text-sm font-numbers font-medium text-primary">
          {String(selectedHour).padStart(2, "0")}:{String(selectedMinute).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
