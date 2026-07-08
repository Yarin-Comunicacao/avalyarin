/**
 * FourPointStar — Estrela de 4 pontas para indicar avaliação profissional
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
 * SVG path para estrela de 4 pontas.
 * Pontas em N, S, E, W com corpo central arredondado.
 * Viewbox 0 0 24 24, centro em (12, 12).
 */
const FOUR_POINT_PATH = "M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z";

export function FourPointStar({ variant, size = 16, className, glow = true, title }: FourPointStarProps) {
  const colors = VARIANT_COLORS[variant];
  const defaultTitle = variant === "specialist" ? "Avaliado por Especialista" : "Avaliado por Crítico";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0", className)}
      aria-label={title || defaultTitle}
      role="img"
    >
      <title>{title || defaultTitle}</title>
      {glow && (
        <defs>
          <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <path
        d={FOUR_POINT_PATH}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth="0.5"
        filter={glow ? `url(#glow-${variant})` : undefined}
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
