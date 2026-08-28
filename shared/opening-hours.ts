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
};

export function createEmptyOpeningHours(): DailyOpeningHours[] {
  return WEEKDAYS.map((_, day) => ({ day, isOpen: false, opensAt: "", closesAt: "" }));
}

function normalizeTime(value: unknown): string {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeOpeningHours(value: unknown): DailyOpeningHours[] {
  const rows = Array.isArray(value) ? value : [];
  const byDay = new Map<number, DailyOpeningHours>();

  for (const row of rows) {
    const day = Number((row as Partial<DailyOpeningHours>)?.day);
    if (!Number.isInteger(day) || day < 0 || day >= WEEKDAYS.length) continue;
    const opensAt = normalizeTime((row as Partial<DailyOpeningHours>)?.opensAt);
    const closesAt = normalizeTime((row as Partial<DailyOpeningHours>)?.closesAt);
    const isOpen = Boolean((row as Partial<DailyOpeningHours>)?.isOpen) && Boolean(opensAt) && Boolean(closesAt);
    byDay.set(day, { day, isOpen, opensAt, closesAt });
  }

  return WEEKDAYS.map((_, day) => byDay.get(day) || { day, isOpen: false, opensAt: "", closesAt: "" });
}

function sameSchedule(left: DailyOpeningHours, right: DailyOpeningHours): boolean {
  return left.isOpen === right.isOpen && left.opensAt === right.opensAt && left.closesAt === right.closesAt;
}

/** Generates the human-readable value consumed by existing public pages. */
export function formatOpeningHours(value: unknown): string {
  const schedule = normalizeOpeningHours(value);
  const groups: Array<{ start: number; end: number; opensAt: string; closesAt: string }> = [];

  for (let index = 0; index < schedule.length; index++) {
    const current = schedule[index];
    if (!current.isOpen) continue;
    const previous = groups.at(-1);
    const previousDay = previous?.end;
    const canExtend = previous && previousDay === index - 1 && sameSchedule(schedule[previousDay], current);
    if (canExtend) {
      previous.end = index;
    } else {
      groups.push({ start: index, end: index, opensAt: current.opensAt, closesAt: current.closesAt });
    }
  }

  return groups.map(group => {
    const days = group.start === group.end
      ? WEEKDAYS[group.start]
      : `${WEEKDAYS[group.start]} a ${WEEKDAYS[group.end]}`;
    return `${days}, das ${group.opensAt} às ${group.closesAt}`;
  }).join("; ");
}
