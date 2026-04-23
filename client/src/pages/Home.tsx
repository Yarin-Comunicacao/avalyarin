// Design: Neon Urbano — Home page with hero banner, category grid, and CTA
import Navbar from "@/components/Navbar";
import { categories } from "@/lib/data";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Beer, Coffee, UtensilsCrossed, ChefHat, Sparkles, Cake,
  Wine, CupSoda, Croissant, Music, Lock, ArrowRight, Star, ClipboardCheck, BarChart3
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Beer, Coffee, UtensilsCrossed, ChefHat, Sparkles, Cake,
  Wine, CupSoda, Croissant, Music,
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
              O sistema de avaliação mais completo para bares e restaurantes acessíveis de São Paulo.
              De R$50 a R$350 por refeição.
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
              { icon: Beer, title: "Escolha o Bar", desc: "Selecione a categoria e o estabelecimento que você visitou." },
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

      {/* Categories Grid */}
      <section className="py-16 border-t border-border/30">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h3 className="font-display text-3xl tracking-wider text-primary text-glow-amber">
                CATEGORIAS
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                11 tipos de estabelecimentos com critérios adaptados
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => {
              const Icon = iconMap[cat.icon] || Beer;
              return (
                <motion.div
                  key={cat.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  {cat.active ? (
                    <Link href={`/categoria/${cat.id}`}>
                      <div className="group relative p-5 rounded-xl bg-card border border-primary/30 hover:border-primary/60 transition-all cursor-pointer hover:glow-amber">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-all">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h4 className="font-display text-lg tracking-wider text-foreground group-hover:text-primary transition-colors">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                        <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                          <span>{cat.establishments.length} estabelecimentos</span>
                          <ArrowRight className="w-3 h-3" />
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
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Beer className="w-4 h-4 text-primary" />
            <span className="font-display text-sm tracking-wider text-primary">AVALIA BAR</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sistema de Avaliação Dinâmico para Bares e Restaurantes — Pinheiros & Vila Madalena, SP
          </p>
        </div>
      </footer>
    </div>
  );
}
