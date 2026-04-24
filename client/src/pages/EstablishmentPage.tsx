// Design: Neon Urbano — Establishment page with menu and rating CTA
// Back arrow navigates to the parent category page
import Navbar from "@/components/Navbar";
import { categories } from "@/lib/data";
import { Link, useParams, Redirect } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Instagram, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EstablishmentPage() {
  const { id } = useParams<{ id: string }>();

  const establishment = categories
    .flatMap((c) => c.establishments)
    .find((e) => e.id === id);

  if (!establishment) {
    return <Redirect to="/" />;
  }

  // Find the parent category for back navigation
  const parentCategory = categories.find((c) =>
    c.establishments.some((e) => e.id === id)
  );
  const backHref = parentCategory ? `/categoria/${parentCategory.id}` : "/#categorias";

  const entradas = establishment.menu.filter((m) => m.category === "entrada");
  const pratos = establishment.menu.filter((m) => m.category === "prato");
  const bebidas = establishment.menu.filter((m) => m.category === "bebida");
  const chopps = establishment.menu.filter((m) => m.category === "chopp");
  const drinks = establishment.menu.filter((m) => m.category === "drink");

  const MenuSection = ({ items, title }: { items: typeof entradas; title: string }) => (
    <div className="space-y-2">
      <h4 className="font-display text-xl tracking-wider text-primary mb-3">{title}</h4>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start justify-between p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/20 transition-colors"
        >
          <div className="flex-1 mr-4">
            <h5 className="text-sm font-semibold text-foreground">{item.name}</h5>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
          </div>
          <span className="font-numbers text-sm font-semibold text-primary whitespace-nowrap">
            R$ {item.price.toFixed(2).replace(".", ",")}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar backHref={backHref} />

      {/* Hero */}
      <section className="relative pt-16">
        <div className="relative h-64 sm:h-80 overflow-hidden">
          <img
            src={establishment.image}
            alt={establishment.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="container -mt-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border/50">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="font-numbers text-base font-semibold text-primary">{establishment.rating}</span>
              </div>
              <span className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-border/50">
                {establishment.reviewCount.toLocaleString("pt-BR")} avaliações
              </span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl tracking-wider text-primary text-glow-amber">
              {establishment.name.toUpperCase()}
            </h2>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
                <span>{establishment.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 shrink-0 text-primary/60" />
                <span>{establishment.hours}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                <span>{establishment.phone}</span>
              </div>
              {establishment.instagram && (
                <div className="flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 shrink-0 text-primary/60" />
                  <span>{establishment.instagram}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-6">
        <div className="container">
          <Link href={`/avaliar/${establishment.id}`}>
            <Button size="lg" className="w-full sm:w-auto font-display text-lg tracking-wider glow-amber">
              AVALIAR ESTE ESTABELECIMENTO
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Menu */}
      <section className="py-6 pb-16">
        <div className="container">
          <h3 className="font-display text-2xl tracking-wider text-primary text-glow-amber mb-6">CARDÁPIO</h3>

          <Tabs defaultValue="entradas" className="w-full">
            <TabsList className="bg-secondary border border-border/50 mb-6 flex-wrap h-auto gap-1 p-1">
              {entradas.length > 0 && <TabsTrigger value="entradas" className="font-display tracking-wider text-xs">PORÇÕES</TabsTrigger>}
              {pratos.length > 0 && <TabsTrigger value="pratos" className="font-display tracking-wider text-xs">BURGERS</TabsTrigger>}
              {chopps.length > 0 && <TabsTrigger value="chopps" className="font-display tracking-wider text-xs">CHOPP</TabsTrigger>}
              {bebidas.length > 0 && <TabsTrigger value="bebidas" className="font-display tracking-wider text-xs">CERVEJAS</TabsTrigger>}
              {drinks.length > 0 && <TabsTrigger value="drinks" className="font-display tracking-wider text-xs">DRINKS</TabsTrigger>}
            </TabsList>
            {entradas.length > 0 && (
              <TabsContent value="entradas">
                <MenuSection items={entradas} title="FINGER FOOD & PORÇÕES" />
              </TabsContent>
            )}
            {pratos.length > 0 && (
              <TabsContent value="pratos">
                <MenuSection items={pratos} title="BURGERS & SANDWICHES" />
              </TabsContent>
            )}
            {chopps.length > 0 && (
              <TabsContent value="chopps">
                <MenuSection items={chopps} title="CHOPP" />
              </TabsContent>
            )}
            {bebidas.length > 0 && (
              <TabsContent value="bebidas">
                <MenuSection items={bebidas} title="CERVEJAS & LONG NECKS" />
              </TabsContent>
            )}
            {drinks.length > 0 && (
              <TabsContent value="drinks">
                <MenuSection items={drinks} title="DRINKS & COQUETÉIS" />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">Avalia Bar — Sistema de Avaliação Dinâmico</p>
        </div>
      </footer>
    </div>
  );
}
