import { describe, expect, it } from "vitest";
import { createEmptyOpeningHours, formatOpeningHours, normalizeOpeningHours } from "./opening-hours";

describe("opening hours", () => {
  it("agrupa dias consecutivos com o mesmo período", () => {
    const schedule = createEmptyOpeningHours().map(row => row.day <= 2
      ? { ...row, isOpen: true, opensAt: "08:00", closesAt: "18:00" }
      : row);

    expect(formatOpeningHours(schedule)).toBe("Segunda a Quarta, das 08:00 às 18:00");
  });

  it("mantém períodos diferentes em grupos separados", () => {
    const schedule = createEmptyOpeningHours().map(row => {
      if (row.day <= 2) return { ...row, isOpen: true, opensAt: "08:00", closesAt: "18:00" };
      if (row.day === 3) return { ...row, isOpen: true, opensAt: "10:00", closesAt: "16:00" };
      return row;
    });

    expect(formatOpeningHours(schedule)).toBe("Segunda a Quarta, das 08:00 às 18:00; Quinta, das 10:00 às 16:00");
  });

  it("descarta horas inválidas ao normalizar o valor persistido", () => {
    const schedule = normalizeOpeningHours([{ day: 0, isOpen: true, opensAt: "28:00", closesAt: "18:00" }]);
    expect(schedule[0]).toEqual({ day: 0, isOpen: false, opensAt: "", closesAt: "18:00" });
  });
});
