import React from "react";
import {
  Beer, Coffee, UtensilsCrossed, ChefHat, Cake,
  Wine, CupSoda, Croissant, Music, Leaf, Globe, Pizza,
  Martini, Drumstick, Sandwich, IceCream, Salad, Disc3,
  GlassWater, Wheat
} from "lucide-react";

/**
 * Mapeamento de ícones por slug de categoria.
 * Cada categoria tem um ícone único do Lucide React.
 */
const categoryIconMap: Record<string, React.ElementType> = {
  // GASTRONOMIA
  "cozinha-brasileira": Drumstick,       // Frango/carne — cozinha brasileira
  "cozinha-internacional": Globe,         // Globo — internacional
  "autoral-contemporaneo": ChefHat,       // Chapéu de chef — autoral
  "hamburgueria": Sandwich,               // Sanduíche — hambúrguer
  "pizzaria": Pizza,                      // Pizza

  // BARES & VIDA NOTURNA
  "bar-lanchonete": CupSoda,              // Copo com canudo — bar & lanchonete
  "boteco-tradicional": Beer,             // Cerveja — boteco tradicional
  "boteco-moderno": GlassWater,           // Copo moderno — boteco moderno
  "pub": Wine,                            // Wine glass — pub (estilo britânico)
  "cervejaria": Wheat,                    // Trigo/lúpulo — cervejaria artesanal
  "coquetelaria": Martini,                // Martini — coquetelaria
  "bar-musical": Music,                   // Nota musical — bar musical
  "balada": Disc3,                        // Disco/DJ — balada

  // CAFÉ & DOCES
  "cafeteria": Coffee,                    // Xícara de café
  "padaria": Croissant,                   // Croissant — padaria
  "confeitaria": Cake,                    // Bolo — confeitaria

  // SAUDÁVEL & BEM-ESTAR
  "vegan": Leaf,                          // Folha — vegan
  "acai": IceCream,                       // Sorvete/açaí bowl
  "saudavel": Salad,                      // Salada — saudável
};

// Cores de destaque por grupo
const categoryColorMap: Record<string, string> = {
  // GASTRONOMIA — tom quente (laranja/amber)
  "cozinha-brasileira": "text-amber-500",
  "cozinha-internacional": "text-amber-500",
  "autoral-contemporaneo": "text-amber-500",
  "hamburgueria": "text-amber-500",
  "pizzaria": "text-amber-500",

  // BARES & VIDA NOTURNA — tom roxo/violeta
  "bar-lanchonete": "text-violet-400",
  "boteco-tradicional": "text-violet-400",
  "boteco-moderno": "text-violet-400",
  "pub": "text-violet-400",
  "cervejaria": "text-violet-400",
  "coquetelaria": "text-violet-400",
  "bar-musical": "text-violet-400",
  "balada": "text-violet-400",

  // CAFÉ & DOCES — tom marrom/caramelo
  "cafeteria": "text-orange-400",
  "padaria": "text-orange-400",
  "confeitaria": "text-orange-400",

  // SAUDÁVEL & BEM-ESTAR — tom verde
  "vegan": "text-emerald-400",
  "acai": "text-emerald-400",
  "saudavel": "text-emerald-400",
};

/**
 * Retorna o componente de ícone para uma categoria
 */
export function getCategoryIcon(categorySlug: string): React.ElementType {
  return categoryIconMap[categorySlug] || UtensilsCrossed;
}

/**
 * Retorna a classe de cor para uma categoria
 */
export function getCategoryColor(categorySlug: string): string {
  return categoryColorMap[categorySlug] || "text-primary";
}

/**
 * Componente que renderiza o ícone da categoria com cor
 */
export function CategoryIcon({
  slug,
  size = 16,
  className = "",
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const Icon = getCategoryIcon(slug);
  const color = getCategoryColor(slug);
  return <Icon className={`${color} ${className}`} size={size} />;
}
