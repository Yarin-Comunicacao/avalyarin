export const WEEKDAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export type DailyOpeningHours = {
  day: number;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  hasSecondPeriod: boolean;
  secondOpensAt: string;
  secondClosesAt: string;
};

export type HolidayOpeningHours = {
  configured: boolean;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
};

export type OpeningHoursSchedule = {
  weekly: DailyOpeningHours[];
  holiday: HolidayOpeningHours;
};

export function createEmptyOpeningHours(): DailyOpeningHours[] {
  return WEEKDAYS.map((_, day) => ({
    day,
    isOpen: false,
    opensAt: "",
    closesAt: "",
    hasSecondPeriod: false,
    secondOpensAt: "",
    secondClosesAt: "",
  }));
}

export function createEmptyOpeningSchedule(): OpeningHoursSchedule {
  return {
    weekly: createEmptyOpeningHours(),
    holiday: { configured: false, isOpen: false, opensAt: "", closesAt: "" },
  };
}

function normalizeTime(value: unknown): string {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function normalizeDailyRow(row: Partial<DailyOpeningHours>, day: number): DailyOpeningHours {
  const opensAt = normalizeTime(row.opensAt);
  const closesAt = normalizeTime(row.closesAt);
  const secondOpensAt = normalizeTime(row.secondOpensAt);
  const secondClosesAt = normalizeTime(row.secondClosesAt);
  const hasSecondPeriod = Boolean(row.hasSecondPeriod) && Boolean(secondOpensAt) && Boolean(secondClosesAt);
  return {
    day,
    isOpen: Boolean(row.isOpen) && Boolean(opensAt) && Boolean(closesAt),
    opensAt,
    closesAt,
    hasSecondPeriod,
    secondOpensAt: hasSecondPeriod ? secondOpensAt : "",
    secondClosesAt: hasSecondPeriod ? secondClosesAt : "",
  };
}

function normalizeHoliday(value: unknown): HolidayOpeningHours {
  const row = (value && typeof value === "object" ? value : {}) as Partial<HolidayOpeningHours>;
  const opensAt = normalizeTime(row.opensAt);
  const closesAt = normalizeTime(row.closesAt);
  return {
    configured: Boolean(row.configured),
    isOpen: Boolean(row.isOpen) && Boolean(opensAt) && Boolean(closesAt),
    opensAt,
    closesAt,
  };
}

export function normalizeOpeningHours(value: unknown): DailyOpeningHours[] {
  const rows = Array.isArray(value) ? value : [];
  const byDay = new Map<number, DailyOpeningHours>();
  for (const row of rows) {
    const day = Number((row as Partial<DailyOpeningHours>)?.day);
    if (!Number.isInteger(day) || day < 0 || day >= WEEKDAYS.length) continue;
    byDay.set(day, normalizeDailyRow(row as Partial<DailyOpeningHours>, day));
  }
  return WEEKDAYS.map((_, day) => byDay.get(day) || normalizeDailyRow({}, day));
}

export function normalizeOpeningSchedule(value: unknown): OpeningHoursSchedule {
  if (Array.isArray(value)) {
    return { weekly: normalizeOpeningHours(value), holiday: { configured: false, isOpen: false, opensAt: "", closesAt: "" } };
  }
  const source = (value && typeof value === "object" ? value : {}) as Partial<OpeningHoursSchedule>;
  return {
    weekly: normalizeOpeningHours(source.weekly),
    holiday: normalizeHoliday(source.holiday),
  };
}

function sameSchedule(left: DailyOpeningHours, right: DailyOpeningHours): boolean {
  return left.isOpen === right.isOpen && left.opensAt === right.opensAt && left.closesAt === right.closesAt
    && left.hasSecondPeriod === right.hasSecondPeriod
    && left.secondOpensAt === right.secondOpensAt && left.secondClosesAt === right.secondClosesAt;
}

function formatWeeklyOpeningHours(schedule: DailyOpeningHours[]): string {
  const groups: Array<{
    start: number;
    end: number;
    opensAt: string;
    closesAt: string;
    hasSecondPeriod: boolean;
    secondOpensAt: string;
    secondClosesAt: string;
  }> = [];
  for (let index = 0; index < schedule.length; index++) {
    const current = schedule[index];
    if (!current.isOpen) continue;
    const previous = groups.at(-1);
    const previousDay = previous?.end;
    const canExtend = previous && previousDay === index - 1 && sameSchedule(schedule[previousDay], current);
    if (canExtend) previous.end = index;
    else groups.push({
      start: index,
      end: index,
      opensAt: current.opensAt,
      closesAt: current.closesAt,
      hasSecondPeriod: current.hasSecondPeriod,
      secondOpensAt: current.secondOpensAt,
      secondClosesAt: current.secondClosesAt,
    });
  }
  return groups.map(group => {
    const days = group.start === group.end ? WEEKDAYS[group.start] : `${WEEKDAYS[group.start]} a ${WEEKDAYS[group.end]}`;
    const secondPeriod = group.hasSecondPeriod ? ` e das ${group.secondOpensAt} às ${group.secondClosesAt}` : "";
    return `${days}, das ${group.opensAt} às ${group.closesAt}${secondPeriod}`;
  }).join("; ");
}

/** Generates the human-readable value consumed by existing public pages. */
export function formatOpeningHours(value: unknown): string {
  const schedule = normalizeOpeningSchedule(value);
  const weekly = formatWeeklyOpeningHours(schedule.weekly);
  const holiday = schedule.holiday.configured
    ? schedule.holiday.isOpen
      ? `Feriados, das ${schedule.holiday.opensAt} às ${schedule.holiday.closesAt}`
      : "Feriados: fechado"
    : "";
  return [weekly, holiday].filter(Boolean).join("; ");
}
