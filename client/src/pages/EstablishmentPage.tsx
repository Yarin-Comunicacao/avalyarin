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

  const entradas = establishment.menu.filter((m) => m.category === "entrada" || m.category === "petisco");
  const pratos = establishment.menu.filter((m) => m.category === "prato" || m.category === "hamburguer" || m.category === "pizza");
  const sobremesas = establishment.menu.filter((m) => m.category === "sobremesa");
  const bebidas = establishment.menu.filter((m) => m.category === "bebida" || m.category === "cerveja");
  const chopps = establishment.menu.filter((m) => m.category === "chopp");
  const drinks = establishment.menu.filter((m) => m.category === "drink");
  const destilados = establishment.menu.filter((m) => m.category === "destilado");

  // Determine establishment type based on parent category
  const catId = parentCategory?.id || "";
  const isRestaurante = catId === "restaurante-tradicional" || catId === "autoral";
  const isBarMusical = catId === "bar-musical";
  const isBalada = catId === "balada";
  const isConfeitaria = catId === "confeitaria";
  const isCafeteria = catId === "cafeteria" || catId === "padaria";
  const isBarType = isBarMusical || isBalada || catId === "pub" || catId === "coquetelaria" || catId === "boteco-moderno" || catId === "boteco-tradicional" || catId === "bar-balada" || catId === "bar-lanchonete";

  // Dynamic labels based on establishment type
  const labels = {
    entradas: {
      tab: isRestaurante ? "ENTRADAS" : isConfeitaria || isCafeteria ? "SALGADOS" : "PETISCOS",
      title: isRestaurante ? "ENTRADAS" : isConfeitaria || isCafeteria ? "SALGADOS" : "PETISCOS & PORÇÕES",
    },
    pratos: {
      tab: "PRATOS",
      title: isRestaurante ? "PRATOS PRINCIPAIS" : isConfeitaria ? "PRATOS & SANDUÍCHES" : isCafeteria ? "PRATOS & SANDUÍCHES" : "PRATOS & SANDUÍCHES",
    },
    sobremesas: {
      tab: "DOCES",
      title: "DOCES & SOBREMESAS",
    },
    bebidas: {
      tab: isRestaurante ? "BEBIDAS" : isConfeitaria || isCafeteria ? "CAFÉS" : "CERVEJAS",
      title: isRestaurante ? "BEBIDAS" : isConfeitaria || isCafeteria ? "CAFÉS & BEBIDAS" : "CERVEJAS & LONG NECKS",
    },
    chopps: {
      tab: "CHOPP",
      title: "CHOPP",
    },
    drinks: {
      tab: isRestaurante ? "VINHOS" : "DRINKS",
      title: isRestaurante ? "VINHOS & DRINKS" : "DRINKS & COQUETÉIS",
    },
  };

  // Determine default tab (first non-empty section)
  const defaultTab = entradas.length > 0
    ? "entradas"
    : pratos.length > 0
    ? "pratos"
    : sobremesas.length > 0
    ? "sobremesas"
    : bebidas.length > 0
    ? "bebidas"
    : chopps.length > 0
    ? "chopps"
    : destilados.length > 0
    ? "destilados"
    : "drinks";

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
              {establishment.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                  <span>{establishment.phone}</span>
                </div>
              )}
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

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="bg-secondary border border-border/50 mb-6 flex-wrap h-auto gap-1 p-1">
              {entradas.length > 0 && <TabsTrigger value="entradas" className="font-display tracking-wider text-xs">{labels.entradas.tab}</TabsTrigger>}
              {pratos.length > 0 && <TabsTrigger value="pratos" className="font-display tracking-wider text-xs">{labels.pratos.tab}</TabsTrigger>}
              {sobremesas.length > 0 && <TabsTrigger value="sobremesas" className="font-display tracking-wider text-xs">{labels.sobremesas.tab}</TabsTrigger>}
              {chopps.length > 0 && <TabsTrigger value="chopps" className="font-display tracking-wider text-xs">{labels.chopps.tab}</TabsTrigger>}
              {bebidas.length > 0 && <TabsTrigger value="bebidas" className="font-display tracking-wider text-xs">{labels.bebidas.tab}</TabsTrigger>}
              {destilados.length > 0 && <TabsTrigger value="destilados" className="font-display tracking-wider text-xs">DESTILADOS</TabsTrigger>}
              {drinks.length > 0 && <TabsTrigger value="drinks" className="font-display tracking-wider text-xs">{labels.drinks.tab}</TabsTrigger>}
            </TabsList>
            {entradas.length > 0 && (
              <TabsContent value="entradas">
                <MenuSection items={entradas} title={labels.entradas.title} />
              </TabsContent>
            )}
            {pratos.length > 0 && (
              <TabsContent value="pratos">
                <MenuSection items={pratos} title={labels.pratos.title} />
              </TabsContent>
            )}
            {sobremesas.length > 0 && (
              <TabsContent value="sobremesas">
                <MenuSection items={sobremesas} title={labels.sobremesas.title} />
              </TabsContent>
            )}
            {chopps.length > 0 && (
              <TabsContent value="chopps">
                <MenuSection items={chopps} title={labels.chopps.title} />
              </TabsContent>
            )}
            {bebidas.length > 0 && (
              <TabsContent value="bebidas">
                <MenuSection items={bebidas} title={labels.bebidas.title} />
              </TabsContent>
            )}
            {destilados.length > 0 && (
              <TabsContent value="destilados">
                <MenuSection items={destilados} title="DESTILADOS" />
              </TabsContent>
            )}
            {drinks.length > 0 && (
              <TabsContent value="drinks">
                <MenuSection items={drinks} title={labels.drinks.title} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">AvaLyarin — Sistema de Avaliação Dinâmico</p>
        </div>
      </footer>
    </div>
  );
}
