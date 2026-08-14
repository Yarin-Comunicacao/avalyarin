// Category cover images - mapped by category slug
export const categoryCoverImages: Record<string, string> = {
  "autoral-contemporaneo": "/storage/category-optimized/autoral-contemporaneo.webp",
  "balada": "/storage/category-optimized/balada.webp",
  "bar-lanchonete": "/storage/category-optimized/bar-lanchonete.webp",
  "bar-musical": "/storage/category-optimized/bar-musical.webp",
  "boteco-moderno": "/storage/category-optimized/boteco-moderno.webp",
  "boteco-tradicional": "/storage/category-optimized/boteco-tradicional.webp",
  "cafeteria": "/storage/category-optimized/cafeteria.webp",
  "cervejaria": "/storage/category-optimized/cervejaria.webp",
  "confeitaria": "/storage/category-optimized/confeitaria.webp",
  "coquetelaria": "/storage/category-optimized/coquetelaria.webp",
  "cozinha-brasileira": "/storage/category-optimized/cozinha-brasileira.webp",
  "cozinha-internacional": "/storage/category-optimized/cozinha-internacional.webp",
  "hamburgueria": "/storage/category-optimized/hamburgueria.webp",
  "padaria": "/storage/category-optimized/padaria.webp",
  "pizzaria": "/storage/category-optimized/pizzaria.webp",
  "pub": "/storage/category-optimized/pub.webp",
  "saudavel": "/storage/category-optimized/saudavel.webp",
  "vegan": "/storage/category-optimized/vegan.webp",
  "acai": "/storage/category-optimized/acai.webp",
  "gastrobar": "/storage/category-optimized/gastrobar.webp",
  "lanches": "/storage/category-optimized/lanches.webp",
  "vegetariano": "/storage/category-optimized/vegetariano.webp",
  "restaurante": "/storage/category-optimized/restaurante.webp",
};

export function getCategoryCover(slug: string): string {
  return categoryCoverImages[slug] || "/storage/category-optimized/pub.webp";
}
