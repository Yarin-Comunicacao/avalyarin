// Design: Neon Urbano — Category page listing establishments
import Navbar from "@/components/Navbar";
import { categories } from "@/lib/data";
import { Link, useParams, Redirect } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Clock, Star, ArrowRight } from "lucide-react";

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const category = categories.find((c) => c.id === id);

  if (!category || !category.active) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Category Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/pub-category-JGbH3yHAo8aiApZkjuXD4r.webp"
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background" />
        </div>
        <div className="relative container pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-medium text-primary uppercase tracking-widest">Categoria</span>
            <h2 className="font-display text-5xl sm:text-6xl tracking-wider text-primary text-glow-amber mt-2">
              {category.name.toUpperCase()}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-md">{category.description}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-foreground/70 bg-secondary px-3 py-1 rounded-full border border-border/50">
                {category.establishments.length} estabelecimentos
              </span>
              <span className="text-xs text-foreground/70 bg-secondary px-3 py-1 rounded-full border border-border/50">
                Pinheiros & Vila Madalena
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Establishments List */}
      <section className="py-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {category.establishments.map((est, i) => (
              <motion.div
                key={est.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <Link href={`/estabelecimento/${est.id}`}>
                  <div className="group rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all cursor-pointer hover:glow-amber">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={est.image}
                        alt={est.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border/50">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-numbers text-sm font-semibold text-primary">{est.rating}</span>
                        <span className="text-xs text-muted-foreground">({est.reviewCount.toLocaleString("pt-BR")})</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-2xl tracking-wider text-foreground group-hover:text-primary transition-colors">
                        {est.name.toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>{est.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{est.hours}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-4 text-sm text-primary font-medium group-hover:gap-2.5 transition-all">
                        <span>Ver cardápio e avaliar</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30 mt-8">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            Avalia Bar — Sistema de Avaliação Dinâmico
          </p>
        </div>
      </footer>
    </div>
  );
}
