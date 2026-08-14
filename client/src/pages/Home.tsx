// Design: Neon Urbano — Home page with two tabs: Descobertas and Busca

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
  ArrowRight, Search, Tag, X,
  Utensils, PartyPopper, CakeSlice, Star, MapPin
} from "lucide-react";
import { getCategoryCover } from "@/lib/categoryCoverImages";

// Group definitions with their category slugs and cover images
const categoryGroups = [
  {
    id: "gastronomia",
    title: "Gastronomia",
    subtitle: "Foco na comida como protagonista",
    icon: Utensils,
    image: "/storage/category-optimized/group-gastronomia.webp",
    categorySlugs: ["cozinha-brasileira", "cozinha-internacional", "autoral-contemporaneo", "hamburgueria", "pizzaria", "gastrobar", "lanches", "casa-de-carnes", "casual-dining", "veg-vegan", "acai", "natural", "vegetariano"],
  },
  {
    id: "bares-vida-noturna",
    title: "Bares & Vida Noturna",
    subtitle: "Drinks, socialização e entretenimento",
    icon: PartyPopper,
    image: "/storage/category-optimized/group-bares-vida-noturna.webp",
    categorySlugs: ["bar-lanchonete", "boteco-tradicional", "boteco-moderno", "pub", "cervejaria", "coquetelaria", "bar-musical", "balada"],
  },
  {
    id: "cafe-doces",
    title: "Cafés & Doces",
    subtitle: "Experiências diurnas, café e confeitaria",
    icon: CakeSlice,
    image: "/storage/category-optimized/group-cafe-doces.webp",
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

type HomeTab = "descobertas" | "busca";
type SearchMode = "search" | "tags";

export default function Home() {
  // Restore state from sessionStorage on mount
  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    const saved = sessionStorage.getItem('home_activeTab');
    return (saved === 'busca' ? 'busca' : 'descobertas') as HomeTab;
  });
  const [searchMode, setSearchMode] = useState<SearchMode>(() => {
    const saved = sessionStorage.getItem('home_searchMode');
    return (saved === 'tags' ? 'tags' : 'search') as SearchMode;
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    return sessionStorage.getItem('home_searchQuery') || '';
  });
  const [tagQuery, setTagQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('home_activeTags');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const { data: categoriesData, isLoading } = trpc.categories.list.useQuery();
  const { user } = useAuth();
  const { data: surveyData } = trpc.survey.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Smart search (existing)
  const { data: searchResults, isFetching: isSearching } = trpc.establishments.smartSearch.useQuery(
    { query: searchQuery },
    { enabled: searchMode === "search" && searchQuery.length >= 3 }
  );

  // Tags search - multi-tag with AND logic
  const { data: tagResults, isFetching: isSearchingTags } = trpc.establishments.searchByTags.useQuery(
    { tags: activeTags },
    { enabled: searchMode === "tags" && activeTags.length > 0 }
  );

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('home_activeTab', activeTab);
  }, [activeTab]);
  useEffect(() => {
    sessionStorage.setItem('home_searchMode', searchMode);
  }, [searchMode]);
  useEffect(() => {
    sessionStorage.setItem('home_searchQuery', searchQuery);
  }, [searchQuery]);
  useEffect(() => {
    sessionStorage.setItem('home_activeTags', JSON.stringify(activeTags));
  }, [activeTags]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed.length >= 1 && !activeTags.includes(trimmed)) {
      setActiveTags(prev => [...prev, trimmed]);
    }
    setTagQuery("");
  };

  const removeTag = (tag: string) => {
    setActiveTags(prev => prev.filter(t => t !== tag));
  };

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
    <div className="min-h-screen pt-16">
      <Navbar />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border/30">
        <div className="container flex">
          <button
            onClick={() => setActiveTab("descobertas")}
            className={`flex-1 py-3 text-center font-display text-sm tracking-wider transition-all ${
              activeTab === "descobertas"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            DESCOBERTAS
          </button>
          <button
            onClick={() => setActiveTab("busca")}
            className={`flex-1 py-3 text-center font-display text-sm tracking-wider transition-all ${
              activeTab === "busca"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            BUSCA
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB: DESCOBERTAS (current home content)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "descobertas" && (
        <>
          {/* Hero Section */}
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

          {/* SECTION 1: MINHAS PREFERIDAS */}
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
                            <h4 className="font-display text-lg tracking-wider text-foreground group-hover:text-primary transition-colors">
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

          {/* SECTION 2: EXPLORE OUTROS SEGMENTOS */}
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
                  EXPLORE OUTROS SEGMENTOS
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {categories.length} tipos de estabelecimentos organizados em {categoryGroups.length} segmentos
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
                      <Link href={`/segmento/${group.id}`}>
                        <div className="group relative rounded-xl overflow-hidden border border-primary/30 hover:border-primary/60 transition-all cursor-pointer hover:glow-amber h-56">
                          <img
                            src={group.image}
                            alt={group.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                          <div className="relative h-full flex flex-col justify-end p-6">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                                <group.icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-display text-2xl tracking-wider text-foreground group-hover:text-primary transition-colors">
                                  {group.title}
                                </h4>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{group.subtitle}</p>
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

          {/* SECTION 3: VEJA TODAS AS CATEGORIAS (GIF) */}
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
                  <div className="group relative rounded-xl overflow-hidden border border-primary/30 hover:border-primary/60 transition-all cursor-pointer hover:glow-amber h-64 sm:h-80">
                    <img
                      src="/storage/categories-all-gif_67a05430.gif"
                      alt="Todas as categorias"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="relative h-full flex flex-col justify-end p-6">
                      <h4 className="font-display text-3xl tracking-wider text-foreground group-hover:text-primary transition-colors">
                        EXPLORAR TUDO
                      </h4>
                      <p className="text-sm text-muted-foreground mt-2">
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
                <img src="/storage/logo-oficial-transparente-v4_bbd5c26e.png" alt="Avalyarin" className="w-5 h-5 object-contain" />
                <span className="font-display text-sm tracking-wider text-primary">AVALYARIN</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rede Social de Avaliações — Bares e Restaurantes de São Paulo
              </p>
            </div>
          </footer>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: BUSCA
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "busca" && (
        <div className="pt-6 pb-24">
          <div className="container">
          {/* Radio buttons for search mode */}
          <div className="flex items-center gap-6 mb-6">
            <label
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setSearchMode("search")}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                searchMode === "search" ? "border-primary" : "border-muted-foreground/50"
              }`}>
                {searchMode === "search" && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className={`text-sm font-medium ${searchMode === "search" ? "text-primary" : "text-muted-foreground"}`}>
                Buscar local
              </span>
            </label>

            <label
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setSearchMode("tags")}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                searchMode === "tags" ? "border-primary" : "border-muted-foreground/50"
              }`}>
                {searchMode === "tags" && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className={`text-sm font-medium ${searchMode === "tags" ? "text-primary" : "text-muted-foreground"}`}>
                Tags
              </span>
            </label>
          </div>

          {/* Search input - Barra de Busca */}
          {searchMode === "search" && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar estabelecimentos, pratos, drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border/50 focus:border-primary/50 focus:outline-none text-foreground placeholder:text-muted-foreground/60 transition-all"
                  autoFocus
                />
              </div>
              {searchQuery.length > 0 && searchQuery.length < 3 && (
                <p className="text-xs text-muted-foreground mt-2">Digite pelo menos 3 letras para buscar</p>
              )}
            </div>
          )}

          {/* Search input - Tags */}
          {searchMode === "tags" && (
            <div className="mb-6">
              {/* Active tag chips */}
              {activeTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {activeTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Tag input */}
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={activeTags.length > 0 ? 'Adicionar outra tag...' : 'Digite uma tag e pressione Enter: "cerveja", "vinho", "ao vivo"...'}
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagQuery.trim().length >= 1) {
                      e.preventDefault();
                      addTag(tagQuery);
                    }
                  }}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-card border border-border/50 focus:border-primary/50 focus:outline-none text-foreground placeholder:text-muted-foreground/60 transition-all"
                  autoFocus
                />
                {/* Add tag button */}
                {tagQuery.trim().length >= 1 && (
                  <button
                    onClick={() => addTag(tagQuery)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                    title="Adicionar tag"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {activeTags.length === 0
                  ? 'Pressione Enter ou clique no ícone para adicionar uma tag'
                  : `${activeTags.length} tag${activeTags.length > 1 ? 's' : ''} ativa${activeTags.length > 1 ? 's' : ''} — resultados mostram locais com TODAS as tags`}
              </p>
            </div>
          )}

          {/* Search Results - Barra de Busca */}
          {searchMode === "search" && searchQuery.length >= 3 && (
            <div className="space-y-4">
              {isSearching && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!isSearching && searchResults && (
                <>
                  {/* Establishments */}
                  {searchResults.establishments && searchResults.establishments.length > 0 && (
                    <div>
                      <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3">ESTABELECIMENTOS</h4>
                      <div className="space-y-2">
                        {searchResults.establishments.map((est: any) => (
                          <Link key={est.id} href={`/estabelecimento/${est.slug}`}>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                              {est.image ? (
                                <img src={est.image} alt={est.name} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <MapPin className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium text-foreground truncate">{est.name}</h5>
                                <p className="text-xs text-muted-foreground truncate">{est.categoryName || est.neighborhood || ""}</p>
                              </div>
                              {est.rating && (
                                <div className="flex items-center gap-1 text-xs text-primary">
                                  <Star className="w-3 h-3 fill-primary" />
                                  <span>{Number(est.rating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  {searchResults.menuItems && searchResults.menuItems.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3">PRATOS & DRINKS</h4>
                      <div className="space-y-2">
                        {searchResults.menuItems.map((item: any) => (
                          <Link key={item.id} href={`/estabelecimento/${item.establishmentSlug}`}>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Utensils className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium text-foreground truncate">{item.name}</h5>
                                <p className="text-xs text-muted-foreground truncate">{item.establishmentName}</p>
                              </div>
                              {item.price && (
                                <span className="text-xs text-primary font-medium">
                                  R$ {Number(item.price).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No results */}
                  {(!searchResults.establishments || searchResults.establishments.length === 0) &&
                   (!searchResults.menuItems || searchResults.menuItems.length === 0) && (
                    <div className="text-center py-12">
                      <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhum resultado encontrado para "{searchQuery}"</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tags Results */}
          {searchMode === "tags" && activeTags.length > 0 && (
            <div className="space-y-4">
              {isSearchingTags && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!isSearchingTags && tagResults && tagResults.length > 0 && (
                <div>
                  <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
                    ESTABELECIMENTOS COM {activeTags.length > 1 ? 'TODAS AS TAGS' : 'TAG'}: {activeTags.map(t => `"${t.toUpperCase()}"`).join(' + ')}
                  </h4>
                  <div className="space-y-2">
                    {tagResults.map((est: any) => (
                      <Link key={est.id} href={`/estabelecimento/${est.slug}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer">
                          {est.image ? (
                            <img src={est.image} alt={est.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-foreground truncate">{est.name}</h5>
                            <p className="text-xs text-muted-foreground truncate">{est.categoryName || est.neighborhood || ""}</p>
                            {est.tags && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(est.tags as string[]).slice(0, 4).map((tag: string) => (
                                  <span
                                    key={tag}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                      activeTags.some(at => tag.toLowerCase().includes(at))
                                        ? "bg-primary/20 text-primary border border-primary/30"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {est.rating && (
                            <div className="flex items-center gap-1 text-xs text-primary">
                              <Star className="w-3 h-3 fill-primary" />
                              <span>{Number(est.rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!isSearchingTags && tagResults && tagResults.length === 0 && (
                <div className="text-center py-12">
                  <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum estabelecimento encontrado com {activeTags.length > 1 ? 'todas essas tags' : `a tag "${activeTags[0]}"`}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Tente remover uma tag ou usar termos mais genéricos</p>
                </div>
              )}
            </div>
          )}

          {/* Empty state - Barra de Busca */}
          {searchMode === "search" && searchQuery.length === 0 && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Pesquise por nome de estabelecimento, prato ou drink
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                A partir de 3 letras as sugestões aparecem automaticamente
              </p>
            </div>
          )}

          {/* Empty state - Tags */}
          {searchMode === "tags" && tagQuery.length === 0 && (
            <div className="text-center py-16">
              <Tag className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Busque por tags específicas dos estabelecimentos
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Exemplos: cerveja artesanal, mesa na calçada, ao vivo, petiscos, happy hour
              </p>
            </div>
          )}
          </div>

          {/* Nearby Establishments */}
          <NearbyEstablishments />
        </div>
      )}
    </div>
  );
}
