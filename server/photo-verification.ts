/**
 * Photo Verification Module
 * Uses LLM vision to verify that rating photos match the claimed items.
 * Runs asynchronously after photo upload — does NOT block the user.
 *
 * Capabilities:
 * 1. Verify if photo matches the claimed food/drink item
 * 2. Detect multiple items in a single photo (e.g., food + drink together)
 * 3. Flag suspicious/unrelated photos for admin review
 */

import { invokeLLM } from "./_core/llm";

export interface PhotoVerificationResult {
  photoId: number;
  verified: boolean;
  confidence: "high" | "medium" | "low";
  detectedItems: string[];
  matchesClaimedItem: boolean;
  multipleItemsDetected: boolean;
  suggestedItemMatches?: string[]; // Other menu items this photo could match
  reason: string;
}

/**
 * Verify a single photo against claimed item names.
 * Uses LLM vision to analyze the image.
 */
export async function verifyPhoto(
  photoUrl: string,
  claimedItemNames: string[],
  allMenuItemNames: string[]
): Promise<PhotoVerificationResult & { rawAnalysis: string }> {
  const prompt = `Você é um verificador de fotos para um app de avaliação de bares e restaurantes.

Analise esta foto e responda em JSON:

**Itens declarados pelo usuário:** ${claimedItemNames.join(", ")}
**Todos os itens do cardápio do estabelecimento:** ${allMenuItemNames.slice(0, 30).join(", ")}

Responda EXATAMENTE neste formato JSON:
{
  "isFood": true/false (a foto contém comida ou bebida?),
  "detectedItems": ["lista de itens visíveis na foto"],
  "matchesClaimedItem": true/false (a foto corresponde a pelo menos um dos itens declarados?),
  "multipleItemsDetected": true/false (há mais de um item de cardápio visível?),
  "suggestedItemMatches": ["itens do cardápio que parecem estar na foto"],
  "confidence": "high"/"medium"/"low",
  "reason": "explicação breve em português"
}

Regras:
- Se a foto mostra claramente o item declarado → matchesClaimedItem: true
- Se a foto mostra comida/bebida mas não o item específico → matchesClaimedItem: false, mas sugira quais itens parecem
- Se a foto não é de comida/bebida (selfie, paisagem, etc) → isFood: false
- Se há múltiplos itens visíveis (ex: prato + drink na mesma foto) → multipleItemsDetected: true e liste todos
- Seja tolerante: uma foto de "cerveja" pode ser qualquer copo/garrafa de cerveja`;

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: photoUrl, detail: "low" } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "photo_verification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              isFood: { type: "boolean" },
              detectedItems: { type: "array", items: { type: "string" } },
              matchesClaimedItem: { type: "boolean" },
              multipleItemsDetected: { type: "boolean" },
              suggestedItemMatches: { type: "array", items: { type: "string" } },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              reason: { type: "string" },
            },
            required: ["isFood", "detectedItems", "matchesClaimedItem", "multipleItemsDetected", "suggestedItemMatches", "confidence", "reason"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text);

    return {
      photoId: 0, // Will be set by caller
      verified: parsed.isFood && parsed.matchesClaimedItem,
      confidence: parsed.confidence,
      detectedItems: parsed.detectedItems || [],
      matchesClaimedItem: parsed.matchesClaimedItem,
      multipleItemsDetected: parsed.multipleItemsDetected,
      suggestedItemMatches: parsed.suggestedItemMatches,
      reason: parsed.reason,
      rawAnalysis: text,
    };
  } catch (error) {
    console.error("[PhotoVerification] LLM analysis failed:", error);
    return {
      photoId: 0,
      verified: false,
      confidence: "low",
      detectedItems: [],
      matchesClaimedItem: false,
      multipleItemsDetected: false,
      suggestedItemMatches: [],
      reason: "Erro na análise automática",
      rawAnalysis: "",
    };
  }
}

/**
 * Process all photos for a rating asynchronously.
 * Called after photo upload completes.
 */
export async function verifyRatingPhotos(
  ratingId: number,
  photos: Array<{ id: number; url: string; taggedItemIds: string[] }>,
  menuItems: Array<{ id: string; name: string }>
): Promise<PhotoVerificationResult[]> {
  const allMenuItemNames = menuItems.map(m => m.name);
  const results: PhotoVerificationResult[] = [];

  for (const photo of photos) {
    const claimedItems = photo.taggedItemIds
      .map(id => menuItems.find(m => m.id === id)?.name)
      .filter(Boolean) as string[];

    if (claimedItems.length === 0) continue;

    // Build full URL for the photo
    const photoUrl = photo.url.startsWith("http") ? photo.url : `${process.env.VITE_FRONTEND_FORGE_API_URL || ""}${photo.url}`;

    const result = await verifyPhoto(photoUrl, claimedItems, allMenuItemNames);
    result.photoId = photo.id;
    results.push(result);

    // Small delay between API calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}
