// AllCategoriesPage — shows all categories organized by group
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
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
    categorySlugs: ["cozinha-brasileira", "cozinha-internacional", "autoral-contemporaneo", "hamburgueria", "pizzaria", "gastrobar", "lanches", "casa-de-carnes", "casual-dining"],
  },
  {
    id: "bares-vida-noturna",
    title: "Bares & Vida Noturna",
    subtitle: "Drinks, socialização e entretenimento",
    icon: PartyPopper,
    categorySlugs: ["bar-lanchonete", "boteco-tradicional", "boteco-moderno", "pub", "cervejaria", "coquetelaria", "bar-musical", "balada"],
  },
  {
    id: "cafe-doces",
    title: "Cafés & Doces",
    subtitle: "Experiências diurnas, café e confeitaria",
    icon: CakeSlice,
    categorySlugs: ["cafeteria", "padaria", "confeitaria"],
  },
  {
    id: "saudavel-natural",
    title: "Saudável & Natural",
    subtitle: "Alimentação saudável e natural",
    icon: Heart,
    categorySlugs: ["vegan", "acai", "saudavel", "vegetariano"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function AllCategoriesPage() {
  const { data: categoriesData, isLoading } = trpc.categories.list.useQuery();

  const groupedCategories = useMemo(() => {
    if (!categoriesData) return [];
    return categoryGroups.map((group) => {
      const groupCats = group.categorySlugs
        .map((slug) => categoriesData.find((c) => c.slug === slug))
        .filter(Boolean) as typeof categoriesData;
      const totalEstablishments = groupCats.reduce((sum, c) => sum + (c.establishmentCount || 0), 0);
      return { ...group, categories: groupCats, totalEstablishments };
    });
  }, [categoriesData]);

  return (
    <div className="min-h-screen">
      <Navbar  />

      {/* Header */}
      <section className="pt-28 pb-24">
        <div className="container">
          <h2 className="font-display text-4xl sm:text-5xl tracking-wider text-primary text-glow-amber leading-none mb-3">
            TODAS AS CATEGORIAS
          </h2>
          <p className="text-lg text-foreground/80 max-w-xl leading-relaxed">
            {categoriesData?.length || 0} categorias em {categoryGroups.length} grupos para explorar
          </p>
        </div>
      </section>

      {/* All groups with their categories */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        groupedCategories.map((group) => {
          const GroupIcon = group.icon;
          return (
            <section key={group.id} className="py-8 border-t border-border/30">
              <div className="container">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <GroupIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-foreground">
                      {group.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {group.subtitle} — {group.totalEstablishments.toLocaleString("pt-BR")} estabelecimentos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {group.categories.map((cat, i) => {
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
              </div>
            </section>
          );
        })
      )}

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
