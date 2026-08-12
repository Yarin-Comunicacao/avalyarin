/**
 * Parse establishment hours string into structured data for calendar/time validation.
 * 
 * Supports formats like:
 * - "Seg-Sex 06h-23h | Sáb 08h-16h"
 * - "Ter-Qui 17h-23h30, Sex 17h-23h45, Sab 15h-23h45, Dom 15h-22h"
 * - "Terça a quinta-feira: 17:00 – 00:00, Sexta: 17:00 – 01:00, sábado: 12:00 – 01:00, Domingo e Segunda-feira: Fechado"
 * - "Segunda a quinta: 18h às 00h00, Sexta e sábado: 12h às 01h, Domingo: 12h às 00h"
 * - "Todos os dias - das 11h às 01h"
 * - "24 horas"
 * - "Seg-Sáb 12h-02h, Dom 12h-00h"
 */

// Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export interface DaySchedule {
  open: number; // minutes from midnight (e.g., 17*60 = 1020)
  close: number; // minutes from midnight (can be > 1440 if closes after midnight)
}

export interface ParsedHours {
  // Index 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // null means closed that day
  days: (DaySchedule | null)[];
  unparseable: boolean; // true if we couldn't parse the string
}

// Mapping of day abbreviations/names to day index (0=Sun, 1=Mon, ..., 6=Sat)
const DAY_MAP: Record<string, number> = {
  // Abbreviations
  "dom": 0, "seg": 1, "ter": 2, "qua": 3, "qui": 4, "sex": 5, "sab": 6, "sáb": 6,
  // Full names
  "domingo": 0, "segunda": 1, "terça": 2, "terca": 2, "quarta": 3,
  "quinta": 4, "sexta": 5, "sábado": 6, "sabado": 6,
  // With -feira
  "segunda-feira": 1, "terça-feira": 2, "terca-feira": 2, "quarta-feira": 3,
  "quinta-feira": 4, "sexta-feira": 5,
};

/**
 * Parse a time string like "17h", "17h30", "17:00", "01h", "00h00" into minutes from midnight
 */
function parseTime(timeStr: string): number | null {
  timeStr = timeStr.trim().toLowerCase().replace(/\s/g, "");
  
  // Format: 17h, 17h30, 08h
  let match = timeStr.match(/^(\d{1,2})h(\d{0,2})$/);
  if (match) {
    const h = parseInt(match[1]);
    const m = match[2] ? parseInt(match[2]) : 0;
    return h * 60 + m;
  }
  
  // Format: 17:00, 01:00, 23:30
  match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    return h * 60 + m;
  }
  
  // Format: 17h00
  match = timeStr.match(/^(\d{1,2})h(\d{2})$/);
  if (match) {
    const h = parseInt(match[1]);
    const m = parseInt(match[2]);
    return h * 60 + m;
  }

  return null;
}

/**
 * Resolve a day name/abbreviation to a day index
 */
function resolveDay(dayStr: string): number | null {
  const normalized = dayStr.trim().toLowerCase()
    .replace(/á/g, "a").replace(/ã/g, "a").replace(/â/g, "a")
    .replace(/é/g, "e").replace(/ê/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o").replace(/ô/g, "o")
    .replace(/ú/g, "u");
  
  // Try direct match first
  for (const [key, val] of Object.entries(DAY_MAP)) {
    const normalizedKey = key.replace(/á/g, "a").replace(/ã/g, "a").replace(/â/g, "a")
      .replace(/é/g, "e").replace(/ê/g, "e")
      .replace(/í/g, "i")
      .replace(/ó/g, "o").replace(/ô/g, "o")
      .replace(/ú/g, "u");
    if (normalized === normalizedKey || normalized.startsWith(normalizedKey)) {
      return val;
    }
  }
  return null;
}

/**
 * Expand a day range like "Seg-Sex" or "Terça a Sábado" into array of day indices
 */
function expandDayRange(rangeStr: string): number[] {
  rangeStr = rangeStr.trim();
  
  // Check for "X a Y" or "X-Y" pattern
  const rangeMatch = rangeStr.match(/^(.+?)(?:\s*[-–]\s*|\s+a\s+)(.+)$/i);
  if (rangeMatch) {
    const startDay = resolveDay(rangeMatch[1]);
    const endDay = resolveDay(rangeMatch[2]);
    if (startDay !== null && endDay !== null) {
      const days: number[] = [];
      let current = startDay;
      while (true) {
        days.push(current);
        if (current === endDay) break;
        current = (current + 1) % 7;
        if (days.length > 7) break; // safety
      }
      return days;
    }
  }
  
  // Check for "X e Y" pattern (individual days)
  if (rangeStr.toLowerCase().includes(" e ")) {
    const parts = rangeStr.split(/\s+e\s+/i);
    const days: number[] = [];
    for (const part of parts) {
      const d = resolveDay(part.trim());
      if (d !== null) days.push(d);
    }
    if (days.length > 0) return days;
  }
  
  // Single day
  const single = resolveDay(rangeStr);
  if (single !== null) return [single];
  
  return [];
}

/**
 * Parse the full hours string into structured data
 */
export function parseEstablishmentHours(hoursStr: string | null | undefined): ParsedHours {
  const result: ParsedHours = {
    days: [null, null, null, null, null, null, null], // Sun-Sat
    unparseable: false,
  };
  
  if (!hoursStr || hoursStr.trim() === "" || hoursStr === "Não encontrado") {
    result.unparseable = true;
    return result;
  }
  
  const cleaned = hoursStr.replace(/[{}"\\]/g, "").trim();
  
  // Special case: "24 horas" or "Todos os dias"
  if (cleaned.toLowerCase().includes("24 horas")) {
    for (let i = 0; i < 7; i++) {
      result.days[i] = { open: 0, close: 1440 };
    }
    return result;
  }
  
  // Special case: "Todos os dias - das Xh às Yh"
  const todosMatch = cleaned.match(/todos\s+os\s+dias.*?(\d{1,2}[h:]?\d{0,2})\s*(?:às|[-–])\s*(\d{1,2}[h:]?\d{0,2})/i);
  if (todosMatch) {
    const openTime = parseTime(todosMatch[1]);
    const closeTime = parseTime(todosMatch[2]);
    if (openTime !== null && closeTime !== null) {
      const adjustedClose = closeTime <= openTime ? closeTime + 1440 : closeTime;
      for (let i = 0; i < 7; i++) {
        result.days[i] = { open: openTime, close: adjustedClose };
      }
      return result;
    }
  }
  
  // Split by common delimiters: | , ;
  const segments = cleaned.split(/[|;]|,\s*(?=[A-ZÀ-Ú])/i).map(s => s.trim()).filter(Boolean);
  
  let parsedAny = false;
  
  for (const segment of segments) {
    // Check for "Fechado" / "fechado"
    if (segment.toLowerCase().includes("fechado")) {
      // Extract which days are closed
      const dayPart = segment.split(/[:–-]/)[0].trim();
      const closedDays = expandDayRange(dayPart);
      for (const d of closedDays) {
        result.days[d] = null;
      }
      parsedAny = true;
      continue;
    }
    
    // Try to extract: [days] [time_open]-[time_close] or [days]: [time_open] – [time_close]
    // Pattern: "Seg-Sex 06h-23h" or "Terça a quinta-feira: 17:00 – 00:00"
    const timePattern = /(\d{1,2}[h:]?\d{0,2})\s*(?:[-–]|às|a)\s*(\d{1,2}[h:]?\d{0,2})/;
    const timeMatch = segment.match(timePattern);
    
    if (timeMatch) {
      const openTime = parseTime(timeMatch[1]);
      const closeTime = parseTime(timeMatch[2]);
      
      if (openTime !== null && closeTime !== null) {
        // Get the day part (everything before the time)
        const dayPart = segment.substring(0, timeMatch.index).replace(/[:–\-]\s*$/, "").trim();
        
        let days: number[];
        if (!dayPart || dayPart.toLowerCase() === "todos os dias") {
          days = [0, 1, 2, 3, 4, 5, 6];
        } else {
          days = expandDayRange(dayPart);
        }
        
        if (days.length > 0) {
          const adjustedClose = closeTime <= openTime ? closeTime + 1440 : closeTime;
          for (const d of days) {
            result.days[d] = { open: openTime, close: adjustedClose };
          }
          parsedAny = true;
        }
      }
    }
    
    // Handle split hours like "11h30-15h e 18h-00h30" (two shifts)
    const multiShiftMatch = segment.match(/(\d{1,2}[h:]?\d{0,2})\s*[-–]\s*(\d{1,2}[h:]?\d{0,2})\s+e\s+(\d{1,2}[h:]?\d{0,2})\s*[-–]\s*(\d{1,2}[h:]?\d{0,2})/);
    if (multiShiftMatch && !parsedAny) {
      const open1 = parseTime(multiShiftMatch[1]);
      const close2 = parseTime(multiShiftMatch[4]);
      if (open1 !== null && close2 !== null) {
        const dayPart = segment.substring(0, multiShiftMatch.index).replace(/[:–\-]\s*$/, "").trim();
        const days = dayPart ? expandDayRange(dayPart) : [0, 1, 2, 3, 4, 5, 6];
        const adjustedClose = close2 <= open1 ? close2 + 1440 : close2;
        for (const d of days) {
          result.days[d] = { open: open1, close: adjustedClose };
        }
        parsedAny = true;
      }
    }
  }
  
  if (!parsedAny) {
    result.unparseable = true;
  }
  
  return result;
}

/**
 * Check if a specific day of week is open
 * @param dayOfWeek 0=Sunday, 1=Monday, ..., 6=Saturday
 */
export function isDayOpen(parsed: ParsedHours, dayOfWeek: number): boolean {
  if (parsed.unparseable) return true; // If we can't parse, allow all days
  return parsed.days[dayOfWeek] !== null;
}

/**
 * Get the valid time range for a specific day
 * Returns { openHour, openMinute, closeHour, closeMinute } or null if closed
 */
export function getTimeRange(parsed: ParsedHours, dayOfWeek: number): { openHour: number; openMinute: number; closeHour: number; closeMinute: number } | null {
  if (parsed.unparseable) return null; // No restriction
  const schedule = parsed.days[dayOfWeek];
  if (!schedule) return null; // Closed
  
  const openHour = Math.floor(schedule.open / 60);
  const openMinute = schedule.open % 60;
  
  // If close > 1440, it means it closes after midnight
  const closeMinutes = schedule.close > 1440 ? schedule.close - 1440 : schedule.close;
  const closeHour = Math.floor(closeMinutes / 60);
  const closeMinuteVal = closeMinutes % 60;
  
  return {
    openHour,
    openMinute,
    closeHour: schedule.close > 1440 ? closeHour + 24 : closeHour, // 25 means 1am next day
    closeMinute: closeMinuteVal,
  };
}

/**
 * Check if a specific time is valid for a given day
 * @param hour 0-23
 * @param minute 0-59
 * @param dayOfWeek 0=Sunday, ..., 6=Saturday
 */
export function isTimeValid(parsed: ParsedHours, dayOfWeek: number, hour: number, minute: number): boolean {
  if (parsed.unparseable) return true; // If we can't parse, allow all times
  const schedule = parsed.days[dayOfWeek];
  if (!schedule) return false; // Day is closed
  
  const timeInMinutes = hour * 60 + minute;
  
  // If closes after midnight (close > 1440)
  if (schedule.close > 1440) {
    // Valid if: time >= open OR time < (close - 1440)
    const closeNextDay = schedule.close - 1440;
    return timeInMinutes >= schedule.open || timeInMinutes < closeNextDay;
  }
  
  // Normal case: open and close same day
  return timeInMinutes >= schedule.open && timeInMinutes <= schedule.close;
}
