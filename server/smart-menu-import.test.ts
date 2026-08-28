import { describe, expect, it } from "vitest";
import { getInsertedImportId } from "./smart-menu-intake";

describe("smart menu import persistence", () => {
  it("converte o insertId retornado pelo banco em um ID válido", () => {
    expect(getInsertedImportId({ insertId: 42 })).toBe(42);
    expect(getInsertedImportId({ insertId: "43" })).toBe(43);
  });

  it("falha de forma explícita quando a inserção não retorna ID", () => {
    expect(() => getInsertedImportId({})).toThrow("ID da importação");
    expect(() => getInsertedImportId({ insertId: 0 })).toThrow("ID da importação");
  });
});
