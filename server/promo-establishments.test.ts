/**
 * Testes do fluxo de códigos promocionais multi-estabelecimento:
 * - critic/specialist cria código vinculado a N estabelecimentos
 * - businesses são notificados
 * - business aceita ou coloca em espera
 * - critic/specialist acompanha status por estabelecimento
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do módulo de banco antes de importar o router
vi.mock("./db-promo", async (importOriginal) => {
  return {
    createPromoCode: vi.fn(),
    getMyPromoCodes: vi.fn(),
    deletePromoCode: vi.fn(),
    validatePromoCode: vi.fn(),
    usePromoCode: vi.fn(),
    getAdminPromoCodes: vi.fn(),
    approvePromoCode: vi.fn(),
    rejectPromoCode: vi.fn(),
    isCodeTaken: vi.fn().mockResolvedValue(false),
    getPromoCodeStats: vi.fn(),
    createPromoCodeWithEstablishments: vi.fn().mockResolvedValue(101),
    notifyBusinessesOfPromoRequest: vi.fn().mockResolvedValue([5]),
    getBusinessPromoCodeRequests: vi.fn().mockResolvedValue([
      {
        linkId: 1,
        linkStatus: "pending",
        establishmentId: 10,
        promoCodeId: 101,
        code: "YARIN10",
        type: "percentage",
        value: 10,
        creatorType: "critic",
        creatorName: "Crítico Teste",
        establishmentName: "Bar Teste",
      },
    ]),
    respondToPromoCodeRequest: vi.fn().mockResolvedValue({
      promoCodeId: 101,
      creatorId: 3,
      code: "YARIN10",
      establishmentName: "Bar Teste",
      action: "accepted",
    }),
    getMyPromoCodeRequests: vi.fn().mockResolvedValue([
      {
        promoCodeId: 101,
        code: "YARIN10",
        type: "percentage",
        value: 10,
        codeStatus: "pending_approval",
        linkId: 1,
        linkStatus: "pending",
        establishmentId: 10,
        establishmentName: "Bar Teste",
      },
    ]),
    getEstablishmentsForPromoSelection: vi.fn().mockResolvedValue([
      { id: 10, name: "Bar Teste", neighborhood: "Pinheiros", image: null, logo: null },
      { id: 11, name: "Café Teste", neighborhood: "Vila Madalena", image: null, logo: null },
    ]),
  };
});

import { appRouter } from "./routers";
import * as dbPromo from "./db-promo";

function createCallerWithUser(role: string, id = 3, name = "Usuário Teste") {
  return appRouter.createCaller({
    user: { id, openId: `test-${id}`, name, username: "teste", email: "t@t.com", role } as any,
    req: {} as any,
    res: {} as any,
  } as any);
}

describe("promo.createWithEstablishments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("critic pode criar código com múltiplos estabelecimentos", async () => {
    const caller = createCallerWithUser("critic");
    const result = await caller.promo.createWithEstablishments({
      code: "YARIN10",
      type: "percentage",
      value: 10,
      establishmentIds: [10, 11],
    });
    expect(result.id).toBe(101);
    expect(dbPromo.createPromoCodeWithEstablishments).toHaveBeenCalledWith(
      expect.objectContaining({ creatorType: "critic", establishmentIds: [10, 11] })
    );
    expect(dbPromo.notifyBusinessesOfPromoRequest).toHaveBeenCalled();
  });

  it("specialist pode criar código", async () => {
    const caller = createCallerWithUser("specialist");
    const result = await caller.promo.createWithEstablishments({
      code: "ESP20",
      type: "fixed_discount",
      value: 20,
      establishmentIds: [10],
    });
    expect(result.id).toBe(101);
    expect(dbPromo.createPromoCodeWithEstablishments).toHaveBeenCalledWith(
      expect.objectContaining({ creatorType: "specialist" })
    );
  });

  it("usuário comum não pode criar código", async () => {
    const caller = createCallerWithUser("user");
    await expect(
      caller.promo.createWithEstablishments({
        code: "HACK10",
        type: "percentage",
        value: 10,
        establishmentIds: [10],
      })
    ).rejects.toThrow();
  });

  it("rejeita código duplicado", async () => {
    vi.mocked(dbPromo.isCodeTaken).mockResolvedValueOnce(true);
    const caller = createCallerWithUser("critic");
    await expect(
      caller.promo.createWithEstablishments({
        code: "YARIN10",
        type: "percentage",
        value: 10,
        establishmentIds: [10],
      })
    ).rejects.toThrow(/já está em uso/);
  });

  it("exige ao menos 1 estabelecimento", async () => {
    const caller = createCallerWithUser("critic");
    await expect(
      caller.promo.createWithEstablishments({
        code: "SEMESTAB",
        type: "percentage",
        value: 10,
        establishmentIds: [],
      })
    ).rejects.toThrow();
  });
});

describe("promo.businessRequests / respondToRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("business lista os pedidos dos seus estabelecimentos", async () => {
    const caller = createCallerWithUser("business", 5);
    const result = await caller.promo.businessRequests();
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("YARIN10");
    expect(result[0].linkStatus).toBe("pending");
  });

  it("business pode aceitar um pedido", async () => {
    const caller = createCallerWithUser("business", 5);
    const result = await caller.promo.respondToRequest({ linkId: 1, action: "accepted" });
    expect(result.success).toBe(true);
    expect(result.action).toBe("accepted");
    expect(dbPromo.respondToPromoCodeRequest).toHaveBeenCalledWith({
      userId: 5,
      linkId: 1,
      action: "accepted",
    });
  });

  it("business pode colocar pedido em espera", async () => {
    vi.mocked(dbPromo.respondToPromoCodeRequest).mockResolvedValueOnce({
      promoCodeId: 101,
      creatorId: 3,
      code: "YARIN10",
      establishmentName: "Bar Teste",
      action: "on_hold",
    } as any);
    const caller = createCallerWithUser("business", 5);
    const result = await caller.promo.respondToRequest({ linkId: 1, action: "on_hold" });
    expect(result.success).toBe(true);
    expect(result.action).toBe("on_hold");
  });

  it("usuário comum não pode responder pedidos", async () => {
    const caller = createCallerWithUser("user");
    await expect(
      caller.promo.respondToRequest({ linkId: 1, action: "accepted" })
    ).rejects.toThrow();
  });

  it("retorna erro se o link não pertence ao business", async () => {
    vi.mocked(dbPromo.respondToPromoCodeRequest).mockResolvedValueOnce(null);
    const caller = createCallerWithUser("business", 99);
    await expect(
      caller.promo.respondToRequest({ linkId: 1, action: "accepted" })
    ).rejects.toThrow(/não gerencia/);
  });
});

describe("promo.myRequests", () => {
  it("critic vê seus pedidos com status por estabelecimento", async () => {
    const caller = createCallerWithUser("critic");
    const result = await caller.promo.myRequests();
    expect(result).toHaveLength(1);
    expect(result[0].establishmentName).toBe("Bar Teste");
    expect(result[0].linkStatus).toBe("pending");
  });
});

describe("promo.establishmentsForSelection", () => {
  it("critic pode listar estabelecimentos ativos", async () => {
    const caller = createCallerWithUser("critic");
    const result = await caller.promo.establishmentsForSelection();
    expect(result).toHaveLength(2);
  });

  it("usuário comum não pode listar", async () => {
    const caller = createCallerWithUser("user");
    await expect(caller.promo.establishmentsForSelection()).rejects.toThrow();
  });
});
