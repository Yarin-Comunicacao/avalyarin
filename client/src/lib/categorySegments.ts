import { CakeSlice, ChefHat, PartyPopper } from "lucide-react";

export type SegmentCategory = {
  slug: string;
  segment?: string[] | string | null;
};

export type CategoryWithSegment = SegmentCategory & {
  name: string;
  description?: string | null;
  establishmentCount?: number | null;
};

export const CATEGORY_SEGMENTS = [
  {
    id: "gastronomia",
    title: "Gastronomia",
    subtitle: "Foco na comida como protagonista",
    icon: ChefHat,
    image: "/storage/category-optimized/group-gastronomia.webp",
  },
  {
    id: "bares-vida-noturna",
    title: "Bares & Vida Noturna",
    subtitle: "Drinks, socialização e entretenimento",
    icon: PartyPopper,
    image: "/storage/category-optimized/group-bares-vida-noturna.webp",
  },
  {
    id: "cafe-doces",
    title: "Cafés & Doces",
    subtitle: "Experiências diurnas, café e confeitaria",
    icon: CakeSlice,
    image: "/storage/category-optimized/group-cafe-doces.webp",
  },
] as const;

function parseSegmentValue(value: SegmentCategory["segment"]): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [value];
  } catch {
    return [value];
  }
}

export function categoryBelongsToSegment(category: SegmentCategory, segmentTitle: string): boolean {
  return parseSegmentValue(category.segment).some((value) => value.trim().toLocaleLowerCase("pt-BR") === segmentTitle.trim().toLocaleLowerCase("pt-BR"));
}

export function getCategorySlugsForSegment(categories: SegmentCategory[], segmentTitle: string): string[] {
  return categories.filter((category) => categoryBelongsToSegment(category, segmentTitle)).map((category) => category.slug);
}
