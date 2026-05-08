// Roulette-style birthdate picker with 3 drum-roll columns (day, month, year)
// Scroll up = smaller numbers, scroll down = larger numbers
// Enforces minimum age (default 18 years) silently — no error messages
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const ITEM_HEIGHT = 44; // px per item in the roulette
const VISIBLE_ITEMS = 5; // number of visible items in viewport

interface BirthdateRouletteProps {
  value?: string; // ISO date string (YYYY-MM-DD) or empty
  onChange: (date: string) => void;
  minAge?: number; // default 18
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

function calculateAge(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age--;
  }
  return age;
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
        // Search forward (downward in list) for the first non-blank item
        let found = false;
        for (let i = finalIndex + 1; i < items.length; i++) {
          if (!items[i]?.blank) {
            finalIndex = i;
            found = true;
            break;
          }
        }
        // Fallback: search backward
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
    // Don't allow clicking blank items
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
                >
                  {/* Invisible blank space */}
                </div>
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

export default function BirthdateRoulette({ value, onChange, minAge = 18 }: BirthdateRouletteProps) {
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

  // Generate year items (descending — most recent first for easier scrolling)
  // Add 2 invisible blank items BEFORE the minimum year (which is the first/most recent)
  const yearItems = useMemo(() => {
    const items: { label: string; value: number; blank?: boolean }[] = [];
    // 2 blank items at the top (these appear before the most recent valid year when scrolling down)
    items.push({ label: "", value: maxYear + 2, blank: true });
    items.push({ label: "", value: maxYear + 1, blank: true });
    // Valid years from most recent to oldest
    for (let y = maxYear; y >= minYear; y--) {
      items.push({ label: String(y), value: y });
    }
    return items;
  }, [maxYear, minYear]);

  // Month items — 2 blank items at the top before Janeiro
  const monthItems = useMemo(() => {
    const items: { label: string; value: number; blank?: boolean }[] = [];
    items.push({ label: "", value: 0, blank: true });
    items.push({ label: "", value: 0, blank: true });
    MONTHS.forEach((name, idx) => {
      items.push({ label: name, value: idx + 1 });
    });
    return items;
  }, []);

  // Day items (depends on selected month and year) — 2 blank items at the top before 01
  const dayItems = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const items: { label: string; value: number; blank?: boolean }[] = [];
    items.push({ label: "", value: 0, blank: true });
    items.push({ label: "", value: 0, blank: true });
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

  // Validate and emit date — silently clamp to max allowed date
  useEffect(() => {
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);

    if (selectedDate <= maxDate) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
      onChange(dateStr);
    }
    // If date is beyond maxDate, simply don't emit — the roulette will snap back
  }, [selectedDay, selectedMonth, selectedYear, maxDate, onChange]);

  // Find indices (offset by 2 for the blank items in all columns)
  const yearIndex = yearItems.findIndex(y => y.value === selectedYear);
  const monthIndex = monthItems.findIndex(m => m.value === selectedMonth);
  const dayIndex = dayItems.findIndex(d => d.value === selectedDay);

  // Calculate age from selected date
  const age = calculateAge(selectedDay, selectedMonth, selectedYear);
  const isValidDate = new Date(selectedYear, selectedMonth - 1, selectedDay) <= maxDate;

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <DrumColumn
          items={dayItems}
          selectedIndex={dayIndex >= 0 ? dayIndex : 2}
          onSelect={(idx) => {
            const item = dayItems[idx];
            if (item && !item.blank) {
              setSelectedDay(item.value);
            }
          }}
          label="Dia"
        />
        <DrumColumn
          items={monthItems}
          selectedIndex={monthIndex >= 0 ? monthIndex : 2}
          onSelect={(idx) => {
            const item = monthItems[idx];
            if (item && !item.blank) {
              setSelectedMonth(item.value);
            }
          }}
          label="Mês"
        />
        <DrumColumn
          items={yearItems}
          selectedIndex={yearIndex >= 0 ? yearIndex : 2}
          onSelect={(idx) => {
            const item = yearItems[idx];
            if (item && !item.blank) {
              setSelectedYear(item.value);
            }
          }}
          label="Ano"
        />
      </div>

      {/* Selected date display with calculated age and validation icon */}
      <div className="mt-4 text-center">
        <motion.div
          key={`${selectedDay}-${selectedMonth}-${selectedYear}`}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          <p className="text-sm font-medium text-foreground/80">
            {String(selectedDay).padStart(2, "0")} de {MONTHS[selectedMonth - 1]} de {selectedYear}
            {isValidDate && age >= minAge && (
              <span className="text-muted-foreground ml-2">({age} anos)</span>
            )}
          </p>
          <AnimatePresence>
            {isValidDate && age >= minAge && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
