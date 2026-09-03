import { describe, expect, it } from "vitest";
import { getMenuProvider, normalizeMenuUrl, splitMenuUrls } from "./digital-menu-scraper";

describe("digital menu links", () => {
  it("normaliza links públicos colados com espaços, aspas e www", () => {
    expect(normalizeMenuUrl('  "www.canva.com/design/menu"  ')).toBe("https://www.canva.com/design/menu");
    expect(normalizeMenuUrl("ftp://example.com/menu")).toBeNull();
  });

  it("aceita múltiplos links separados por linha, vírgula ou ponto e vírgula", () => {
    expect(splitMenuUrls("https://drive.google.com/menu\nhttps://canva.com/menu; https://drive.google.com/menu")).toEqual([
      "https://drive.google.com/menu",
      "https://canva.com/menu",
    ]);
  });

  it("identifica Get In e mantém outros provedores como fontes externas", () => {
    expect(getMenuProvider("https://menu.getin.app/pt-br/unit/menus/a")).toBe("getin");
    expect(getMenuProvider("https://pedidon.com.br/menu")).toBe("external");
  });
});
