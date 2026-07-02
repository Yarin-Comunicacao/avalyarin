// CategoryGroupPage — shows categories within a specific group
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Link, useParams, Redirect } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Utensils, PartyPopper, CakeSlice, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getCategoryCover } from "@/lib/categoryCoverImages";

// Group definitions matching the Home page
const categoryGroups = [
  {
    id: "gastronomia",
    title: "Gastronomia",
    subtitle: "Foco na comida como protagonista",
    icon: Utensils,
    image: "/manus-storage/group-gastronomia_6a589f64.jpg",
    categorySlugs: ["cozinha-brasileira", "cozinha-internacional", "autoral-contemporaneo", "hamburgueria", "pizzaria", "gastrobar", "lanches", "restaurante"],
  },
  {
    id: "bares-vida-noturna",
    title: "Bares & Vida Noturna",
    subtitle: "Drinks, socialização e entretenimento",
    icon: PartyPopper,
    image: "/manus-storage/group-bares-vida-noturna_ea06ba71.jpg",
    categorySlugs: ["bar-lanchonete", "boteco-tradicional", "boteco-moderno", "pub", "cervejaria", "coquetelaria", "bar-musical", "balada"],
  },
  {
    id: "cafe-doces",
    title: "Cafés & Doces",
    subtitle: "Experiências diurnas, café e confeitaria",
    icon: CakeSlice,
    image: "/manus-storage/group-cafe-doces_648b4dd3.jpg",
    categorySlugs: ["cafeteria", "padaria", "confeitaria"],
  },
  {
    id: "saudavel-natural",
    title: "Saudável & Natural",
    subtitle: "Alimentação saudável e natural",
    icon: Heart,
    image: "/manus-storage/group-saudavel-natural_543a7c03.jpg",
    categorySlugs: ["vegan", "acai", "saudavel", "vegetariano"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function CategoryGroupPage() {
  const { id } = useParams<{ id: string }>();
  const { data: categoriesData, isLoading } = trpc.categories.list.useQuery();

  const group = categoryGroups.find((g) => g.id === id);

  const groupCategories = useMemo(() => {
    if (!group || !categoriesData) return [];
    return group.categorySlugs
      .map((slug) => categoriesData.find((c) => c.slug === slug))
      .filter(Boolean) as typeof categoriesData;
  }, [group, categoriesData]);

  const totalEstablishments = useMemo(() => {
    return groupCategories.reduce((sum, c) => sum + (c.establishmentCount || 0), 0);
  }, [groupCategories]);

  if (!group) {
    return <Redirect to="/" />;
  }

  const GroupIcon = group.icon;

  return (
    <div className="min-h-screen">
      <Navbar  />

      {/* Hero with group image */}
      <section className="relative h-[40vh] min-h-[280px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={group.image}
            alt={group.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        </div>
        <div className="relative container pb-24 pt-28">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
              <GroupIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-4xl sm:text-5xl tracking-wider text-primary text-glow-amber leading-none">
                {group.title.toUpperCase()}
              </h2>
            </div>
          </div>
          <p className="text-lg text-foreground/80 max-w-xl leading-relaxed">
            {group.subtitle} — {totalEstablishments.toLocaleString("pt-BR")} estabelecimentos
          </p>
        </div>
      </section>

      {/* Categories grid */}
      <section className="py-10">
        <div className="container">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : groupCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma categoria encontrada neste grupo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupCategories.map((cat, i) => {
                const count = cat.establishmentCount || 0;
                return (
                  <motion.div
                    key={cat.slug}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    <Link href={`/categoria/${cat.slug}`}>
                      <div className="group relative rounded-xl overflow-hidden border border-primary/30 hover:border-primary/60 transition-all cursor-pointer hover:glow-amber h-48">
                        <img
                          src={getCategoryCover(cat.slug)}
                          alt={cat.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="relative h-full flex flex-col justify-end p-4">
                          <h4 className="font-display text-lg tracking-wider text-white group-hover:text-primary transition-colors">
                            {cat.name}
                          </h4>
                          <p className="text-xs text-white/70 mt-1 line-clamp-2">{cat.description}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                            <span>{count.toLocaleString("pt-BR")} {count === 1 ? "estabelecimento" : "estabelecimentos"}</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🧄</span>
            <span className="font-display text-sm tracking-wider text-primary">AVALYARIN</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Rede Social de Avaliações de São Paulo
          </p>
        </div>
      </footer>
    </div>
  );
}
