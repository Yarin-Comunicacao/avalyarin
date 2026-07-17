// Design: Neon Urbano — Home page with new layout:
// 1. Minhas Preferidas (5 categories from survey)
// 2. Explore outros grupos (4 groups with images)
// 3. Veja todas as Categorias (GIF)

import Navbar from "@/components/Navbar";
import { NearbyEstablishments } from "@/components/NearbyEstablishments";
import { PostsCarousel } from "@/components/PostsCarousel";
import { SavedPostsCarousel } from "@/components/SavedPostsCarousel";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  Utensils, PartyPopper, CakeSlice
} from "lucide-react";
import { getCategoryCover } from "@/lib/categoryCoverImages";

// Group definitions with their category slugs and cover images
const categoryGroups = [
  {
    id: "gastronomia",
    title: "Gastronomia",
    subtitle: "Foco na comida como protagonista",
    icon: Utensils,
    image: "/manus-storage/group-gastronomia_6a589f64.jpg",
    categorySlugs: ["cozinha-brasileira", "cozinha-internacional", "autoral-contemporaneo", "hamburgueria", "pizzaria", "gastrobar", "lanches", "casa-de-carnes", "casual-dining", "veg-vegan", "acai", "natural", "vegetariano"],
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

];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function Home() {
  const { data: categoriesData, isLoading } = trpc.categories.list.useQuery();
  const { user } = useAuth();
  const { data: surveyData } = trpc.survey.get.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (window.location.hash === "#categorias") {
      setTimeout(() => {
        document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  const categories = categoriesData || [];

  // Get user's preferred categories from survey (up to 5)
  const preferredSlugs = useMemo(() => {
    if (!surveyData) return [];
    const sd = surveyData.surveyData as any;
    if (!sd?.categories) return [];
    return (sd.categories as string[]).slice(0, 5);
  }, [surveyData]);

  // Map preferred slugs to actual category objects
  const preferredCategories = useMemo(() => {
    if (!preferredSlugs.length || !categories.length) return [];
    return preferredSlugs
      .map((slug) => categories.find((c) => c.slug === slug || c.slug.startsWith(slug)))
      .filter(Boolean) as typeof categories;
  }, [preferredSlugs, categories]);

  // Group categories by their group definition
  const groupedCategories = useMemo(() => {
    return categoryGroups.map((group) => {
      const groupCats = group.categorySlugs
        .map((slug) => categories.find((c) => c.slug === slug))
        .filter(Boolean) as typeof categories;
      const totalEstablishments = groupCats.reduce((sum, c) => sum + (c.establishmentCount || 0), 0);
      return { ...group, categories: groupCats, totalEstablishments };
    });
  }, [categories]);

  return (
    <div className="min-h-screen">
      <Navbar  />

      {/* Hero Section — text only, background comes from body::before */}
      <section className="relative pt-20 pb-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-wider text-primary text-glow-amber leading-none mb-4">
              EXPERIMENTE E AVALIE
            </h2>
            <p className="text-lg sm:text-xl text-foreground/80 max-w-xl leading-relaxed">
              A rede social de avaliações de bares e restaurantes de São Paulo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Posts Carousel */}
      <PostsCarousel />

      {/* Saved Posts Carousel (logged-in users only) */}
      <SavedPostsCarousel />

      {/* Nearby Establishments */}
      <NearbyEstablishments />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: MINHAS PREFERIDAS (5 categories from survey)
          ═══════════════════════════════════════════════════════════ */}
      {preferredCategories.length > 0 && (
        <section className="py-16 border-t border-border/30">
          <div className="container">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="mb-8"
            >
              <h3 className="font-display text-3xl tracking-wider text-primary text-glow-amber">
                MINHAS PREFERIDAS
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Suas categorias favoritas selecionadas na pesquisa de preferência
              </p>
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {preferredCategories.map((cat, i) => (
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
                        <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                          <span>{(cat.establishmentCount || 0).toLocaleString("pt-BR")} {(cat.establishmentCount || 0) === 1 ? "estabelecimento" : "estabelecimentos"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: EXPLORE OUTROS GRUPOS (4 groups with images)
          ═══════════════════════════════════════════════════════════ */}
      <section id="categorias" className="py-16 border-t border-border/30">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-8"
          >
            <h3 className="font-display text-3xl tracking-wider text-primary text-glow-amber">
              EXPLORE OUTROS GRUPOS
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {categories.length} tipos de estabelecimentos organizados em {categoryGroups.length} grupos
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-56 rounded-xl bg-card/50 border border-border/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {groupedCategories.map((group, groupIndex) => (
                <motion.div
                  key={group.id}
                  custom={groupIndex}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <Link href={`/grupo/${group.id}`}>
                    <div
                      className="group relative rounded-xl overflow-hidden border border-primary/30 hover:border-primary/60 transition-all cursor-pointer hover:glow-amber h-56"
                    >
                      <img
                        src={group.image}
                        alt={group.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                      <div className="relative h-full flex flex-col justify-end p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                            <group.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-display text-2xl tracking-wider text-white group-hover:text-primary transition-colors">
                              {group.title}
                            </h4>
                          </div>
                        </div>
                        <p className="text-sm text-white/70 mb-2">{group.subtitle}</p>
                        <div className="flex items-center gap-1 text-xs text-primary font-medium">
                          <span>{group.totalEstablishments.toLocaleString("pt-BR")} estabelecimentos</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}


        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: VEJA TODAS AS CATEGORIAS (GIF)
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 border-t border-border/30">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-8"
          >
            <h3 className="font-display text-3xl tracking-wider text-primary text-glow-amber">
              VEJA TODAS AS CATEGORIAS
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Todas as {categories.length} categorias disponíveis para explorar
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Link href="/todas-categorias">
              <div
                className="group relative rounded-xl overflow-hidden border border-primary/30 hover:border-primary/60 transition-all cursor-pointer hover:glow-amber h-64 sm:h-80"
              >
                <img
                  src="/manus-storage/categories-all-gif_67a05430.gif"
                  alt="Todas as categorias"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-6">
                  <h4 className="font-display text-3xl tracking-wider text-white group-hover:text-primary transition-colors">
                    EXPLORAR TUDO
                  </h4>
                  <p className="text-sm text-white/70 mt-2">
                    De gastronomia a vida noturna, de cafés a alimentação saudável
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-sm text-primary font-medium">
                    <span>Ver todas as categorias</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 pb-24 border-t border-border/30">
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
