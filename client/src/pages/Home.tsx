// Design: Neon Urbano — Home page with hero banner, grouped categories, and CTA
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { NearbyEstablishments } from "@/components/NearbyEstablishments";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Coffee, UtensilsCrossed, ChefHat, Sparkles, Cake,
  Wine, CupSoda, Croissant, Music, Lock, ArrowRight, Star, ClipboardCheck, BarChart3, Beer, Leaf, Globe, Pizza,
  Utensils, PartyPopper, CakeSlice, Heart
} from "lucide-react";
import { getCategoryCover } from "@/lib/categoryCoverImages";

const iconMap: Record<string, React.ElementType> = {
  Beer, Coffee, UtensilsCrossed, ChefHat, Sparkles, Cake,
  Wine, CupSoda, Croissant, Music, Leaf, Globe, Pizza,
};

// Group definitions with their category slugs
const categoryGroups = [
  {
    id: "gastronomia",
    title: "GASTRONOMIA",
    subtitle: "Foco na comida como protagonista",
    icon: Utensils,
    categorySlugs: ["cozinha-brasileira", "cozinha-internacional", "autoral-contemporaneo", "hamburgueria", "pizzaria"],
  },
  {
    id: "bares-vida-noturna",
    title: "BARES & VIDA NOTURNA",
    subtitle: "Drinks, socialização e entretenimento",
    icon: PartyPopper,
    categorySlugs: ["bar-lanchonete", "boteco-tradicional", "boteco-moderno", "pub", "cervejaria", "coquetelaria", "bar-musical", "balada"],
  },
  {
    id: "cafe-doces",
    title: "CAFÉ & DOCES",
    subtitle: "Experiências diurnas, café e confeitaria",
    icon: CakeSlice,
    categorySlugs: ["cafeteria", "padaria", "confeitaria"],
  },
  {
    id: "saudavel",
    title: "SAUDÁVEL & BEM-ESTAR",
    subtitle: "Alimentação saudável e natural",
    icon: Heart,
    categorySlugs: ["saudavel"],
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: categoriesData, isLoading } = trpc.categories.list.useQuery();

  useEffect(() => {
    if (window.location.hash === "#categorias") {
      setTimeout(() => {
        document.getElementById("categorias")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  const categories = categoriesData || [];

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
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/hero-banner-hp32XLQHa5feiofZ4netjk.webp"
            alt="Bares de São Paulo à noite"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        </div>
        <div className="relative container pb-12 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h2 className="font-display text-5xl sm:text-7xl lg:text-8xl tracking-wider text-primary text-glow-amber leading-none mb-4">
              AVALIE SEU BAR
            </h2>
            <p className="text-lg sm:text-xl text-foreground/80 max-w-xl leading-relaxed">
              O sistema de avaliação mais completo para bares e restaurantes de São Paulo.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-border/30">
        <div className="container">
          <h3 className="font-display text-3xl tracking-wider text-primary text-glow-amber mb-10">
            COMO FUNCIONA
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Star, title: "Escolha uma das categorias", desc: "Selecione o estabelecimento cadastrado que você visitou." },
              { icon: ClipboardCheck, title: "Avalie o que Consumiu", desc: "Escolha os itens do cardápio e avalie no modo Direto ou Analítico." },
              { icon: BarChart3, title: "Veja a Nota", desc: "O sistema calcula automaticamente com pesos dinâmicos por categoria." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:glow-amber transition-all">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-numbers text-5xl font-bold text-primary/10 absolute top-4 right-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="font-display text-xl tracking-wider text-foreground mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Establishments */}
      <NearbyEstablishments />

      {/* Grouped Categories */}
      <section id="categorias" className="py-16 border-t border-border/30">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="mb-12"
          >
            <h3 className="font-display text-3xl tracking-wider text-primary text-glow-amber">
              CATEGORIAS
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {categories.length} tipos de estabelecimentos organizados em {categoryGroups.length} grupos
            </p>
          </motion.div>

          {isLoading ? (
            <div className="space-y-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-8 w-48 bg-card/50 rounded animate-pulse" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="p-5 rounded-xl bg-card/50 border border-border/30 animate-pulse h-40" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-14">
              {groupedCategories.map((group, groupIndex) => (
                <motion.div
                  key={group.id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeIn}
                >
                  {/* Group Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <group.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-display text-xl tracking-wider text-foreground">
                        {group.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {group.subtitle} — {group.totalEstablishments.toLocaleString("pt-BR")} estabelecimentos
                      </p>
                    </div>
                  </div>

                  {/* Group Categories Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {group.categories.map((cat, i) => {
                      const Icon = iconMap[cat.icon || "Coffee"] || Coffee;
                      const count = cat.establishmentCount || 0;
                      return (
                        <motion.div
                          key={cat.slug}
                          custom={i + groupIndex * 3}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true }}
                          variants={fadeUp}
                        >
                          {cat.active ? (
                            <Link href={`/categoria/${cat.slug}`}>
                              <div className="group relative rounded-xl overflow-hidden border border-primary/30 hover:border-primary/60 transition-all cursor-pointer hover:glow-amber h-48">
                                <img
                                  src={getCategoryCover(cat.slug)}
                                  alt={cat.name}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                <div className="relative h-full flex flex-col justify-end p-4">
                                  <h4 className="font-display text-lg tracking-wider text-white group-hover:text-primary transition-colors">
                                    {cat.name}
                                  </h4>
                                  <p className="text-xs text-white/70 mt-1">{cat.description}</p>
                                  <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                                    <span>{count.toLocaleString("pt-BR")} {count === 1 ? "estabelecimento" : "estabelecimentos"}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div
                              onClick={() => toast("Em breve!", { description: `A categoria ${cat.name} estará disponível em breve.` })}
                              className="relative p-5 rounded-xl bg-card/50 border border-border/30 cursor-pointer opacity-60 hover:opacity-80 transition-all"
                            >
                              <div className="absolute top-3 right-3">
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>
                              <div className="w-10 h-10 rounded-lg bg-secondary border border-border/30 flex items-center justify-center mb-3">
                                <Icon className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <h4 className="font-display text-lg tracking-wider text-muted-foreground">
                                {cat.name}
                              </h4>
                              <p className="text-xs text-muted-foreground/60 mt-1">{cat.description}</p>
                              <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground/50 font-medium">
                                <span>Em breve</span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
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
            Sistema de Avaliação Dinâmico para Bares e Restaurantes — Pinheiros & Vila Madalena, SP
          </p>
        </div>
      </footer>
    </div>
  );
}
