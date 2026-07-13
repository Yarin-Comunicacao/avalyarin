/**
 * FourPointStar — Estrela de 4 pontas para indicar avaliação profissional
 * 
 * Design: estrela tipo "sparkle" com 4 pontas finas e pronunciadas (N, S, E, W)
 * e cintura estreita entre elas — similar ao símbolo ✦
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
 * SVG path para estrela de 4 pontas tipo "sparkle".
 * Pontas finas e longas em N, S, E, W com cintura estreita entre elas.
 * Viewbox 0 0 24 24, centro em (12, 12).
 * 
 * Cada ponta vai até a borda (0 ou 24), e o corpo central tem apenas ~3px de largura,
 * criando o efeito de brilho/sparkle com 4 raios finos.
 */
const FOUR_POINT_STAR_PATH = [
  "M12 0",        // Ponta Norte (topo)
  "C12.8 4.5 13 5.5 13.5 10.5",  // Curva descendo para a direita
  "C18.5 11 19.5 11.2 24 12",    // Ponta Leste (direita)
  "C19.5 12.8 18.5 13 13.5 13.5", // Curva descendo para baixo
  "C13 18.5 12.8 19.5 12 24",    // Ponta Sul (baixo)
  "C11.2 19.5 11 18.5 10.5 13.5", // Curva subindo para a esquerda
  "C5.5 13 4.5 12.8 0 12",       // Ponta Oeste (esquerda)
  "C4.5 11.2 5.5 11 10.5 10.5",  // Curva subindo para o topo
  "C11 5.5 11.2 4.5 12 0",       // Fecha no topo
  "Z"
].join(" ");

export function FourPointStar({ variant, size = 16, className, glow = true, title }: FourPointStarProps) {
  const colors = VARIANT_COLORS[variant];
  const defaultTitle = variant === "specialist" ? "Avaliado por Especialista" : "Avaliado por Crítico";
  // Use unique IDs to avoid SVG filter conflicts when multiple stars are on the page
  const filterId = `star-glow-${variant}-${Math.random().toString(36).slice(2, 8)}`;

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
