// Category cover images - mapped by category slug
export const categoryCoverImages: Record<string, string> = {
  "autoral-contemporaneo": "/storage/autoral-contemporaneo_61136cb1.jpg",
  "balada": "/storage/balada-category-cover-new_ed3d8dab.jpg",
  "bar-lanchonete": "/storage/bar-lanchonete_561c6ede.jpg",
  "bar-musical": "/storage/bar-musical_b029535e.jpg",
  "boteco-moderno": "/storage/boteco-moderno_b14e3862.jpg",
  "boteco-tradicional": "/storage/boteco-tradicional-new_1bda4b2e.png",
  "cafeteria": "/storage/cafeteria_22b87b10.jpg",
  "cervejaria": "/storage/cervejaria_63a913e9.jpg",
  "confeitaria": "/storage/confeitaria_0e72f9c5.jpg",
  "coquetelaria": "/storage/coquetelaria-new_f91b0ec6.png",
  "cozinha-brasileira": "/storage/cozinha-brasileira_edf2edac.jpg",
  "cozinha-internacional": "/storage/cozinha-internacional_d3e1b05a.jpg",
  "hamburgueria": "/storage/hamburgueria_0fce64e3.jpg",
  "padaria": "/storage/padaria_67545168.jpg",
  "pizzaria": "/storage/pizzaria_5e6621ea.jpg",
  "pub": "/storage/pub_f0bce0fc.jpg",
  "saudavel": "/storage/saudavel_ba483a9b.jpg",
  "vegan": "/storage/vegan-category-cover_fb4d5451.jpg",
  "acai": "/storage/acai-category-cover_ebef39c1.jpg",
  "gastrobar": "/storage/gastrobar-cover_c7665b3a.jpg",
  "lanches": "/storage/lanches-cover_10d9f2ce.jpg",
  "vegetariano": "/storage/vegetariano-cover_f478b92d.jpg",
  "restaurante": "/storage/restaurante-cover_8d42fb8d.jpg",
};

export function getCategoryCover(slug: string): string {
  return categoryCoverImages[slug] || "/storage/pub_f0bce0fc.jpg";
}
