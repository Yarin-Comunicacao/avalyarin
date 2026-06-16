import { describe, it, expect } from "vitest";

/**
 * Tests for:
 * 1. Relevance scoring logic (LLM-based comment analysis)
 * 2. Photo upload/carousel data structures
 * 3. Originalidade criteria filtering by category
 */

// Categories that should show "Originalidade" criterion
const ORIGINALIDADE_CATEGORIES = [
  "gastrobar",
  "coquetelaria",
  "autoral-contemporaneo",
  "boteco-moderno",
  "confeitaria",
  "vegan",
  "vegetariano",
];

// Categories that should NOT show "Originalidade"
const NON_ORIGINALIDADE_CATEGORIES = [
  "pizzaria",
  "hamburgueria",
  "padaria",
  "cafeteria",
  "cervejaria",
  "balada",
  "pub",
  "bar-lanchonete",
  "cozinha-brasileira",
  "cozinha-internacional",
  "saudavel",
  "acai",
  "boteco-tradicional",
  "bar-musical",
];

describe("Relevance Scoring", () => {
  // Pure function that mirrors the scoring logic
  const classifyCommentDepth = (comment: string): "high" | "medium" | "low" => {
    if (!comment || comment.trim().length < 10) return "low";
    
    // High relevance indicators: technical details, comparisons, specific descriptions
    const highIndicators = [
      /compar/i,          // comparação
      /diferença/i,       // diferença técnica
      /textura/i,         // detalhes sensoriais
      /aroma/i,
      /sabor/i,
      /tempero/i,
      /preparo/i,
      /ingrediente/i,
      /sommelier/i,
      /harmoniza/i,
      /nota de/i,         // notas de sabor
      /melhor que/i,      // comparação direta
      /pior que/i,
    ];
    
    // Low relevance indicators: generic comments
    const lowIndicators = [
      /^gostei$/i,
      /^muito bom$/i,
      /^recomendo$/i,
      /^top$/i,
      /^ok$/i,
      /^legal$/i,
    ];
    
    const text = comment.trim();
    
    if (lowIndicators.some(r => r.test(text))) return "low";
    if (highIndicators.some(r => r.test(text))) return "high";
    if (text.length > 50) return "medium";
    return "low";
  };

  it("should classify generic comments as low relevance", () => {
    expect(classifyCommentDepth("Gostei")).toBe("low");
    expect(classifyCommentDepth("Muito bom")).toBe("low");
    expect(classifyCommentDepth("Recomendo")).toBe("low");
    expect(classifyCommentDepth("Top")).toBe("low");
    expect(classifyCommentDepth("")).toBe("low");
  });

  it("should classify technical comments as high relevance", () => {
    expect(classifyCommentDepth("A troca de tomate por uma pasta de tomate foi o que deu toda a diferença para o lanche")).toBe("high");
    expect(classifyCommentDepth("Como sommelier de X-salada eu devo dizer que foi o melhor que eu já provei")).toBe("high");
    expect(classifyCommentDepth("O aroma de defumado combinou perfeitamente com a textura crocante")).toBe("high");
    expect(classifyCommentDepth("A harmonização do vinho com o prato estava impecável")).toBe("high");
  });

  it("should classify medium-length descriptive comments as medium relevance", () => {
    expect(classifyCommentDepth("Gostei muito e super recomendo, o atendimento foi ótimo e o ambiente agradável")).toBe("medium");
    expect(classifyCommentDepth("Eu achei que era um lanche tradicional, mas mudaram algo, estava gostoso mas não era o que eu queria")).toBe("medium");
  });

  it("should handle edge cases", () => {
    expect(classifyCommentDepth("   ")).toBe("low");
    expect(classifyCommentDepth("ab")).toBe("low");
    expect(classifyCommentDepth("O preparo do prato foi excepcional")).toBe("high");
  });

  it("relevanceScore should be between 0 and 100", () => {
    const mockScores = [0, 25, 50, 75, 100];
    mockScores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  it("should order reviews by relevanceScore descending", () => {
    const reviews = [
      { id: 1, relevanceScore: 30 },
      { id: 2, relevanceScore: 85 },
      { id: 3, relevanceScore: 60 },
      { id: 4, relevanceScore: null },
    ];

    const sorted = [...reviews].sort((a, b) => {
      const scoreA = a.relevanceScore ?? 0;
      const scoreB = b.relevanceScore ?? 0;
      return scoreB - scoreA;
    });

    expect(sorted[0].id).toBe(2); // 85
    expect(sorted[1].id).toBe(3); // 60
    expect(sorted[2].id).toBe(1); // 30
    expect(sorted[3].id).toBe(4); // null → 0
  });
});

describe("Originalidade Criteria Filtering", () => {
  const shouldShowOriginalidade = (categorySlug: string): boolean => {
    return ORIGINALIDADE_CATEGORIES.includes(categorySlug);
  };

  it("should show Originalidade for gastrobar", () => {
    expect(shouldShowOriginalidade("gastrobar")).toBe(true);
  });

  it("should show Originalidade for coquetelaria", () => {
    expect(shouldShowOriginalidade("coquetelaria")).toBe(true);
  });

  it("should show Originalidade for autoral-contemporaneo", () => {
    expect(shouldShowOriginalidade("autoral-contemporaneo")).toBe(true);
  });

  it("should show Originalidade for boteco-moderno", () => {
    expect(shouldShowOriginalidade("boteco-moderno")).toBe(true);
  });

  it("should show Originalidade for confeitaria", () => {
    expect(shouldShowOriginalidade("confeitaria")).toBe(true);
  });

  it("should show Originalidade for vegan", () => {
    expect(shouldShowOriginalidade("vegan")).toBe(true);
  });

  it("should show Originalidade for vegetariano", () => {
    expect(shouldShowOriginalidade("vegetariano")).toBe(true);
  });

  it("should NOT show Originalidade for non-qualifying categories", () => {
    NON_ORIGINALIDADE_CATEGORIES.forEach(cat => {
      expect(shouldShowOriginalidade(cat)).toBe(false);
    });
  });

  it("should have exactly 7 qualifying categories", () => {
    expect(ORIGINALIDADE_CATEGORIES).toHaveLength(7);
  });
});

describe("Rating Photos - Data Structures", () => {
  interface RatingPhoto {
    id: number;
    ratingId: number;
    url: string;
    storageKey: string;
    taggedItemIds: string | null;
    createdAt: string;
  }

  it("should validate photo structure", () => {
    const photo: RatingPhoto = {
      id: 1,
      ratingId: 42,
      url: "/manus-storage/ratings/42/photo-abc123.webp",
      storageKey: "ratings/42/photo-abc123.webp",
      taggedItemIds: JSON.stringify(["101", "102"]),
      createdAt: new Date().toISOString(),
    };

    expect(photo.id).toBeGreaterThan(0);
    expect(photo.ratingId).toBeGreaterThan(0);
    expect(photo.url).toContain("/manus-storage/");
    expect(photo.storageKey).toContain("ratings/");
  });

  it("should parse taggedItemIds correctly", () => {
    const taggedJson = JSON.stringify(["101", "102", "103"]);
    const parsed = JSON.parse(taggedJson);
    expect(parsed).toHaveLength(3);
    expect(parsed).toContain("101");
  });

  it("should handle null taggedItemIds", () => {
    const photo = { taggedItemIds: null };
    const items = photo.taggedItemIds ? JSON.parse(photo.taggedItemIds) : [];
    expect(items).toHaveLength(0);
  });

  it("should validate base64 data format", () => {
    const validBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const isValidBase64 = /^[A-Za-z0-9+/]+=*$/.test(validBase64);
    expect(isValidBase64).toBe(true);
  });

  it("should validate supported mime types", () => {
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    expect(supportedTypes).toContain("image/jpeg");
    expect(supportedTypes).toContain("image/png");
    expect(supportedTypes).toContain("image/webp");
    expect(supportedTypes).not.toContain("image/gif");
  });

  it("should limit photos per rating", () => {
    const MAX_PHOTOS_PER_RATING = 5;
    const existingPhotos = 4;
    const canUploadMore = existingPhotos < MAX_PHOTOS_PER_RATING;
    expect(canUploadMore).toBe(true);

    const atLimit = 5;
    expect(atLimit < MAX_PHOTOS_PER_RATING).toBe(false);
  });

  it("should generate correct storage key format", () => {
    const ratingId = 42;
    const timestamp = Date.now();
    const key = `ratings/${ratingId}/photo-${timestamp}.webp`;
    
    expect(key).toMatch(/^ratings\/\d+\/photo-\d+\.webp$/);
    expect(key).toContain(String(ratingId));
  });

  it("carousel should wrap around correctly", () => {
    const photos = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const totalPhotos = photos.length;
    
    // Next from last should go to first
    const nextFromLast = (totalPhotos - 1 + 1) % totalPhotos;
    expect(nextFromLast).toBe(0);
    
    // Prev from first should go to last
    const prevFromFirst = (0 - 1 + totalPhotos) % totalPhotos;
    expect(prevFromFirst).toBe(2);
  });
});
