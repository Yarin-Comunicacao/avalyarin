// Category cover images - mapped by category slug
export const categoryCoverImages: Record<string, string> = {
  "autoral-contemporaneo": "/manus-storage/autoral-contemporaneo_61136cb1.jpg",
  "balada": "/manus-storage/balada_a2df5fbd.jpg",
  "bar-lanchonete": "/manus-storage/bar-lanchonete_561c6ede.jpg",
  "bar-musical": "/manus-storage/bar-musical_b029535e.jpg",
  "boteco-moderno": "/manus-storage/boteco-moderno_b14e3862.jpg",
  "boteco-tradicional": "/manus-storage/boteco-tradicional-new_1bda4b2e.png",
  "cafeteria": "/manus-storage/cafeteria_22b87b10.jpg",
  "cervejaria": "/manus-storage/cervejaria_63a913e9.jpg",
  "confeitaria": "/manus-storage/confeitaria_0e72f9c5.jpg",
  "coquetelaria": "/manus-storage/coquetelaria-new_f91b0ec6.png",
  "cozinha-brasileira": "/manus-storage/cozinha-brasileira_edf2edac.jpg",
  "cozinha-internacional": "/manus-storage/cozinha-internacional_d3e1b05a.jpg",
  "hamburgueria": "/manus-storage/hamburgueria_0fce64e3.jpg",
  "padaria": "/manus-storage/padaria_67545168.jpg",
  "pizzaria": "/manus-storage/pizzaria_5e6621ea.jpg",
  "pub": "/manus-storage/pub_f0bce0fc.jpg",
  "saudavel": "/manus-storage/saudavel_ba483a9b.jpg",
};

export function getCategoryCover(slug: string): string {
  return categoryCoverImages[slug] || "/manus-storage/pub_f0bce0fc.jpg";
}
