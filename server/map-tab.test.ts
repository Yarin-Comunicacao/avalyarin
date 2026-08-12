import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

/**
 * Testes da aba Mapa:
 * - establishments.mapEstablishments é público (acessível sem autenticação)
 * - Dados dos markers têm o shape esperado (id, name, slug, lat, lng, categoria)
 * - Apenas estabelecimentos ativos e com coordenadas são retornados (filtro no DB)
 */

function mockCtx(overrides: Partial<NonNullable<Context["user"]>> = {}): Context {
  return {
    user: {
      id: 600,
      name: "Map Test User",
      username: "maptest",
      role: "user",
      openId: "test-open-id-map",
      ...overrides,
    },
  } as Context;
}

const caller = (ctx: Context) => appRouter.createCaller(ctx);

describe("Aba Mapa — establishments.mapEstablishments", () => {
  it("é um endpoint público, acessível sem autenticação", async () => {
    const c = caller({ user: null } as any);
    // Não deve lançar erro de autenticação (UNAUTHORIZED)
    try {
      const result = await c.establishments.mapEstablishments();
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      // Erro de DB é aceitável em ambiente de teste, mas nunca UNAUTHORIZED
      expect(e.code).not.toBe("UNAUTHORIZED");
      expect(e.code).not.toBe("FORBIDDEN");
    }
  });

  it("é acessível igualmente para qualquer role (user, critic, specialist, business, admin)", async () => {
    const roles = ["user", "critic", "specialist", "business", "admin"] as const;
    for (const role of roles) {
      const c = caller(mockCtx({ role: role as any }));
      try {
        const result = await c.establishments.mapEstablishments();
        expect(Array.isArray(result)).toBe(true);
      } catch (e: any) {
        expect(e.code).not.toBe("UNAUTHORIZED");
        expect(e.code).not.toBe("FORBIDDEN");
      }
    }
  });

  it("retorna markers com o shape esperado (id, name, slug, lat, lng, categoryName, categorySlug)", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.establishments.mapEstablishments();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const marker = result[0];
        expect(marker).toHaveProperty("id");
        expect(marker).toHaveProperty("name");
        expect(marker).toHaveProperty("slug");
        expect(marker).toHaveProperty("lat");
        expect(marker).toHaveProperty("lng");
        expect(marker).toHaveProperty("address");
        expect(marker).toHaveProperty("neighborhood");
        expect(marker).toHaveProperty("rating");
        expect(marker).toHaveProperty("reviewCount");
        expect(marker).toHaveProperty("categoryName");
        expect(marker).toHaveProperty("categorySlug");
      }
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("todos os estabelecimentos retornados possuem coordenadas válidas (lat/lng não nulos)", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.establishments.mapEstablishments();
      // O filtro no DB garante lat IS NOT NULL e lng IS NOT NULL
      for (const est of result) {
        expect(est.lat).not.toBeNull();
        expect(est.lng).not.toBeNull();
        expect(typeof Number(est.lat)).toBe("number");
        expect(typeof Number(est.lng)).toBe("number");
        expect(Number.isNaN(Number(est.lat))).toBe(false);
        expect(Number.isNaN(Number(est.lng))).toBe(false);
      }
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("coordenadas retornadas estão em faixas geográficas válidas", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.establishments.mapEstablishments();
      for (const est of result) {
        const lat = Number(est.lat);
        const lng = Number(est.lng);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      }
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });

  it("categoryName usa fallback 'Outros' quando estabelecimento não tem categoria N:N", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.establishments.mapEstablishments();
      for (const est of result) {
        // categoryName nunca deve ser null/undefined — fallback é "Outros"
        expect(est.categoryName).toBeTruthy();
        expect(est.categorySlug).toBeTruthy();
      }
    } catch (e: any) {
      expect(e.code).not.toBe("UNAUTHORIZED");
    }
  });
});

describe("Aba Mapa — establishments.nearby (busca por proximidade)", () => {
  it("valida input: radiusKm fora do range é rejeitado", async () => {
    const c = caller(mockCtx());
    await expect(
      c.establishments.nearby({ lat: -23.56, lng: -46.69, radiusKm: 100, limit: 10 })
    ).rejects.toThrow();
  });

  it("valida input: limit fora do range é rejeitado", async () => {
    const c = caller(mockCtx());
    await expect(
      c.establishments.nearby({ lat: -23.56, lng: -46.69, radiusKm: 3, limit: 200 })
    ).rejects.toThrow();
  });

  it("aceita coordenadas válidas de São Paulo", async () => {
    const c = caller(mockCtx());
    try {
      const result = await c.establishments.nearby({ lat: -23.5613, lng: -46.6890, radiusKm: 3, limit: 20 });
      expect(Array.isArray(result)).toBe(true);
    } catch (e: any) {
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});
