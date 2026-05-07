// Roulette-style birthdate picker with 3 drum-roll columns (day, month, year)
// Scroll up = smaller numbers, scroll down = larger numbers
// Enforces minimum age of 16 years
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const ITEM_HEIGHT = 44; // px per item in the roulette
const VISIBLE_ITEMS = 5; // number of visible items in viewport

interface BirthdateRouletteProps {
  value?: string; // ISO date string (YYYY-MM-DD) or empty
  onChange: (date: string) => void;
  minAge?: number; // default 16
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(month: number, year: number): number {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return daysPerMonth[month - 1] || 31;
}

function getMaxBirthdate(minAge: number): Date {
  const today = new Date();
  return new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
}

// Individual drum/roulette column
interface DrumColumnProps {
  items: { label: string; value: number }[];
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

      // Snap to nearest item
      containerRef.current.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });

      isScrollingRef.current = false;
      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
    }, 80);
  }, [items.length, selectedIndex, onSelect]);

  // Handle touch/click on specific item
  const handleItemClick = (index: number) => {
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

export default function BirthdateRoulette({ value, onChange, minAge = 16 }: BirthdateRouletteProps) {
  const maxDate = useMemo(() => getMaxBirthdate(minAge), [minAge]);
  const minYear = 1930;
  const maxYear = maxDate.getFullYear();

  // Parse initial value or default to max allowed date
  const initialDate = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split("-").map(Number);
      if (y && m && d) return { day: d, month: m, year: y };
    }
    return { day: maxDate.getDate(), month: maxDate.getMonth() + 1, year: maxYear };
  }, [value, maxDate, maxYear]);

  const [selectedDay, setSelectedDay] = useState(initialDate.day);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [error, setError] = useState<string | null>(null);

  // Generate year items (descending — most recent first for easier scrolling)
  const yearItems = useMemo(() => {
    const items: { label: string; value: number }[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      items.push({ label: String(y), value: y });
    }
    return items;
  }, [maxYear]);

  // Month items
  const monthItems = useMemo(() => {
    return MONTHS.map((name, idx) => ({ label: name, value: idx + 1 }));
  }, []);

  // Day items (depends on selected month and year)
  const dayItems = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const items: { label: string; value: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      items.push({ label: String(d).padStart(2, "0"), value: d });
    }
    return items;
  }, [selectedMonth, selectedYear]);

  // Clamp day if month/year changes
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  // Validate and emit date
  useEffect(() => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);

    if (selectedDate > maxDate) {
      setError(`Você precisa ter pelo menos ${minAge} anos para se cadastrar.`);
    } else {
      setError(null);
      onChange(dateStr);
    }
  }, [selectedDay, selectedMonth, selectedYear, maxDate, minAge, onChange]);

  // Find indices
  const yearIndex = yearItems.findIndex(y => y.value === selectedYear);
  const monthIndex = selectedMonth - 1;
  const dayIndex = selectedDay - 1;

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <DrumColumn
          items={dayItems}
          selectedIndex={dayIndex >= 0 ? dayIndex : 0}
          onSelect={(idx) => setSelectedDay(dayItems[idx]?.value || 1)}
          label="Dia"
        />
        <DrumColumn
          items={monthItems}
          selectedIndex={monthIndex >= 0 ? monthIndex : 0}
          onSelect={(idx) => setSelectedMonth(monthItems[idx]?.value || 1)}
          label="Mês"
        />
        <DrumColumn
          items={yearItems}
          selectedIndex={yearIndex >= 0 ? yearIndex : 0}
          onSelect={(idx) => setSelectedYear(yearItems[idx]?.value || maxYear)}
          label="Ano"
        />
      </div>

      {/* Selected date display */}
      <div className="mt-4 text-center">
        <motion.p
          key={`${selectedDay}-${selectedMonth}-${selectedYear}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-medium ${error ? "text-red-400" : "text-foreground/80"}`}
        >
          {error ? (
            error
          ) : (
            <>
              {String(selectedDay).padStart(2, "0")} de {MONTHS[selectedMonth - 1]} de {selectedYear}
            </>
          )}
        </motion.p>
      </div>
    </div>
  );
}
