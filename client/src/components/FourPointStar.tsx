/**
 * FourPointStar — Estrela de 4 pontas para indicar avaliação profissional
 * 
 * Design: estrela tipo "sparkle" com proporção 2:1 (eixo Y = dobro do eixo X)
 * Pontas N/S mais longas que E/W, criando formato vertical elegante.
 * 
 * Variantes:
 * - "specialist" → dourada (âmbar/gold) — indica que um Especialista avaliou o item
 * - "critic" → safira (azul) — indica que um Crítico Gastronômico avaliou o item
 * 
 * Uso: perfil do profissional e cards de itens do cardápio avaliados
 */
import { cn } from "@/lib/utils";

type StarVariant = "specialist" | "critic";

interface FourPointStarProps {
  variant: StarVariant;
  size?: number;
  className?: string;
  glow?: boolean;
  title?: string;
}

const VARIANT_COLORS: Record<StarVariant, { fill: string; stroke: string; glow: string }> = {
  specialist: {
    fill: "#F59E0B",      // amber-500
    stroke: "#D97706",    // amber-600
    glow: "rgba(245, 158, 11, 0.5)",
  },
  critic: {
    fill: "#3B82F6",      // blue-500 (safira)
    stroke: "#2563EB",    // blue-600
    glow: "rgba(59, 130, 246, 0.5)",
  },
};

/**
 * SVG path para estrela de 4 pontas com proporção 2:1.
 * Viewbox 0 0 12 24 (largura = metade da altura).
 * Centro em (6, 12).
 * Pontas N/S vão até 0 e 24 (eixo Y completo).
 * Pontas E/W vão até 0 e 12 (eixo X completo, metade da altura).
 * Cintura estreita no centro para efeito sparkle.
 */
const FOUR_POINT_STAR_PATH = [
  "M6 0",           // Ponta Norte (topo)
  "C6.5 4 6.8 6 7.2 10.5",       // Curva descendo para a direita
  "C9.5 11.2 10.5 11.5 12 12",   // Ponta Leste (direita)
  "C10.5 12.5 9.5 12.8 7.2 13.5", // Curva descendo para baixo
  "C6.8 18 6.5 20 6 24",          // Ponta Sul (baixo)
  "C5.5 20 5.2 18 4.8 13.5",     // Curva subindo para a esquerda
  "C2.5 12.8 1.5 12.5 0 12",     // Ponta Oeste (esquerda)
  "C1.5 11.5 2.5 11.2 4.8 10.5", // Curva subindo para o topo
  "C5.2 6 5.5 4 6 0",            // Fecha no topo
  "Z"
].join(" ");

export function FourPointStar({ variant, size = 16, className, glow = true, title }: FourPointStarProps) {
  const colors = VARIANT_COLORS[variant];
  const defaultTitle = variant === "specialist" ? "Avaliado por Especialista" : "Avaliado por Crítico";
  // Use unique IDs to avoid SVG filter conflicts when multiple stars are on the page
  const filterId = `star-glow-${variant}-${Math.random().toString(36).slice(2, 8)}`;

  // Proporção 2:1 — height = size, width = size/2
  const height = size;
  const width = size / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 12 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0", className)}
      aria-label={title || defaultTitle}
      role="img"
    >
      <title>{title || defaultTitle}</title>
      {glow && (
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <path
        d={FOUR_POINT_STAR_PATH}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.3"
        filter={glow ? `url(#${filterId})` : undefined}
      />
    </svg>
  );
}

/**
 * Componente composto que mostra ambas as estrelas (critic à esquerda, specialist à direita)
 * quando um item foi avaliado por ambos os tipos de profissional.
 */
interface ItemStarsProps {
  hasSpecialistRating: boolean;
  hasCriticRating: boolean;
  size?: number;
  className?: string;
}

export function ItemStars({ hasSpecialistRating, hasCriticRating, size = 14, className }: ItemStarsProps) {
  if (!hasSpecialistRating && !hasCriticRating) return null;

  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {hasCriticRating && <FourPointStar variant="critic" size={size} />}
      {hasSpecialistRating && <FourPointStar variant="specialist" size={size} />}
    </span>
  );
}

export default FourPointStar;
