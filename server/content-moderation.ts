/**
 * Content Moderation Module
 * Uses LLM vision + text analysis to auto-detect inappropriate content.
 * Runs asynchronously (fire-and-forget) — does NOT block the user.
 *
 * Checks:
 * 1. Photos: nudity, violence, gore, drugs, weapons, explicit content
 * 2. Text (comments/ratings): hate speech, harassment, threats, discrimination,
 *    personal attacks, profanity, spam, misinformation
 *
 * Categories match the 11 community guidelines in TermosPage.tsx:
 * sexual_content, hate_speech, violence, financial_scam, phishing,
 * false_identity, cloaking, account_integrity, misinformation,
 * restricted_goods, cybersecurity
 */

import { invokeLLM } from "./_core/llm";

// ============================================================
// TYPES
// ============================================================

export interface ModerationResult {
  approved: boolean;
  categories: string[]; // violated categories
  severity: "none" | "low" | "medium" | "high" | "critical";
  confidence: number; // 0.0-1.0
  reason: string; // explanation in Portuguese
}

// ============================================================
// PHOTO MODERATION
// ============================================================

/**
 * Analyze a photo for inappropriate content (nudity, violence, drugs, etc.)
 * This is DIFFERENT from photo-verification.ts which checks if photo matches the item.
 * This checks if the photo violates community guidelines.
 */
export async function moderatePhoto(photoUrl: string): Promise<ModerationResult> {
  const prompt = `Você é um moderador de conteúdo para um aplicativo de avaliação de bares e restaurantes.

Analise esta foto e verifique se ela viola alguma das seguintes categorias de conteúdo proibido:

1. **sexual_content** — Nudez, conteúdo sexualmente explícito ou sugestivo
2. **hate_speech** — Símbolos de ódio, mensagens discriminatórias visíveis
3. **violence** — Violência gráfica, gore, sangue, armas em uso
4. **restricted_goods** — Drogas ilícitas visíveis, armas de fogo, substâncias proibidas
5. **spam** — Imagem claramente não relacionada a comida/bebida/estabelecimento (propaganda, memes, screenshots aleatórios)

CONTEXTO: Este é um app de avaliação gastronômica. Fotos esperadas são de comida, bebida, ambientes de bares/restaurantes, pratos, drinks, cardápios.

Responda EXATAMENTE neste formato JSON:
{
  "approved": true/false,
  "violatedCategories": [],
  "severity": "none"/"low"/"medium"/"high"/"critical",
  "confidence": 0.0-1.0,
  "reason": "explicação breve em português"
}

Regras:
- Fotos de comida, bebida, ambiente do bar/restaurante → approved: true
- Fotos com bebidas alcoólicas são PERMITIDAS (é um app de bares)
- Fotos de pessoas em ambiente de bar/restaurante são PERMITIDAS
- Selfies em bares/restaurantes são PERMITIDAS
- Apenas marque como violação se houver conteúdo CLARAMENTE inapropriado
- Seja tolerante: na dúvida, aprove (severity "low" se suspeito mas não claro)`;

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
          name: "photo_moderation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              approved: { type: "boolean" },
              violatedCategories: { type: "array", items: { type: "string" } },
              severity: { type: "string", enum: ["none", "low", "medium", "high", "critical"] },
              confidence: { type: "number" },
              reason: { type: "string" },
            },
            required: ["approved", "violatedCategories", "severity", "confidence", "reason"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text);

    return {
      approved: parsed.approved,
      categories: parsed.violatedCategories || [],
      severity: parsed.severity || "none",
      confidence: parsed.confidence || 0,
      reason: parsed.reason || "",
    };
  } catch (error) {
    console.error("[ContentModeration] Photo analysis failed:", error);
    // On error, approve by default (don't block user)
    return {
      approved: true,
      categories: [],
      severity: "none",
      confidence: 0,
      reason: "Erro na análise automática — aprovado por padrão",
    };
  }
}

// ============================================================
// TEXT MODERATION
// ============================================================

/**
 * Analyze text content (comments, rating text) for violations.
 * Checks for hate speech, harassment, threats, spam, etc.
 */
export async function moderateText(text: string, context?: string): Promise<ModerationResult> {
  // Skip very short texts
  if (!text || text.trim().length < 5) {
    return { approved: true, categories: [], severity: "none", confidence: 1, reason: "Texto muito curto para análise" };
  }

  const prompt = `Você é um moderador de conteúdo para um aplicativo de avaliação de bares e restaurantes em São Paulo.

Analise o seguinte texto e verifique se viola alguma das categorias de conteúdo proibido:

1. **sexual_content** — Conteúdo sexualmente explícito ou assédio sexual
2. **hate_speech** — Discurso de ódio, discriminação por raça/gênero/orientação/religião/origem
3. **violence** — Ameaças de violência, incitação à violência
4. **financial_scam** — Golpes financeiros, ofertas fraudulentas
5. **phishing** — Links suspeitos, tentativa de obter dados pessoais
6. **false_identity** — Fingir ser outra pessoa ou estabelecimento
7. **misinformation** — Informações comprovadamente falsas sobre saúde/segurança alimentar
8. **spam** — Propaganda não solicitada, repetição excessiva, conteúdo irrelevante
9. **other** — Outros tipos de conteúdo tóxico (bullying, assédio moral)

${context ? `CONTEXTO: ${context}` : "CONTEXTO: Comentário em avaliação de bar/restaurante."}

TEXTO A ANALISAR:
"${text}"

Responda EXATAMENTE neste formato JSON:
{
  "approved": true/false,
  "violatedCategories": [],
  "severity": "none"/"low"/"medium"/"high"/"critical",
  "confidence": 0.0-1.0,
  "reason": "explicação breve em português"
}

Regras:
- Críticas negativas a comida/serviço são PERMITIDAS (é o propósito do app)
- Palavrões leves em contexto de frustração são PERMITIDOS (severity "low" no máximo)
- Reclamações sobre preço, demora, atendimento são PERMITIDAS
- Apenas marque como violação se houver conteúdo CLARAMENTE ofensivo/tóxico
- Ataques pessoais a funcionários específicos com nome → severity "medium"
- Discurso de ódio, ameaças, discriminação → severity "high" ou "critical"
- Na dúvida, aprove`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "text_moderation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              approved: { type: "boolean" },
              violatedCategories: { type: "array", items: { type: "string" } },
              severity: { type: "string", enum: ["none", "low", "medium", "high", "critical"] },
              confidence: { type: "number" },
              reason: { type: "string" },
            },
            required: ["approved", "violatedCategories", "severity", "confidence", "reason"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices?.[0]?.message?.content;
    const responseText = typeof content === "string" ? content : "";
    const parsed = JSON.parse(responseText);

    return {
      approved: parsed.approved,
      categories: parsed.violatedCategories || [],
      severity: parsed.severity || "none",
      confidence: parsed.confidence || 0,
      reason: parsed.reason || "",
    };
  } catch (error) {
    console.error("[ContentModeration] Text analysis failed:", error);
    return {
      approved: true,
      categories: [],
      severity: "none",
      confidence: 0,
      reason: "Erro na análise automática — aprovado por padrão",
    };
  }
}

// ============================================================
// BATCH MODERATION HELPER
// ============================================================

/**
 * Moderate multiple text items (e.g., all comments in a rating).
 * Returns results for each item.
 */
export async function moderateTexts(
  items: Array<{ id: number; text: string; context?: string }>
): Promise<Array<{ id: number; result: ModerationResult }>> {
  const results: Array<{ id: number; result: ModerationResult }> = [];

  for (const item of items) {
    if (!item.text || item.text.trim().length < 5) {
      results.push({ id: item.id, result: { approved: true, categories: [], severity: "none", confidence: 1, reason: "Texto muito curto" } });
      continue;
    }
    const result = await moderateText(item.text, item.context);
    results.push({ id: item.id, result });
    // Small delay between API calls
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return results;
}
