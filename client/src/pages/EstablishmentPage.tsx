// Design: Neon Urbano — Establishment detail page with menu
// Back arrow navigates to the parent category page
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Link, useParams, Redirect } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Instagram, ArrowRight, Loader2, Share2, MessageCircle, Building2, Copy, Navigation, Car, X } from "lucide-react";
import { GoogleRatingBadge } from "@/components/GoogleRatingBadge";
import { AvalyarinReviews } from "@/components/AvalyarinReviews";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

export default function EstablishmentPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const { id } = useParams<{ id: string }>();

  const { data: estData, isLoading } = trpc.establishments.getWithMenu.useQuery(
    { slug: id || "" },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!estData) {
    return <Redirect to="/" />;
  }

  const establishment = estData;
  const menu = establishment.menu || [];
  const backHref = establishment.category ? `/categoria/${establishment.category.slug}` : "/#categorias";

  // Categorize menu items (case-insensitive comparison)
  const cat = (m: { category?: string | null }) => (m.category || "").toLowerCase();
  const entradas = menu.filter((m) => cat(m) === "entrada" || cat(m) === "petisco" || cat(m) === "salgado");
  const pratos = menu.filter((m) => cat(m) === "prato" || cat(m) === "hamburguer" || cat(m) === "pizza" || cat(m) === "lanche" || cat(m) === "sanduiche" || cat(m) === "sushi" || cat(m) === "temaki" || cat(m) === "ramen" || cat(m) === "salada" || cat(m) === "sopa" || cat(m) === "focaccia");
  const sobremesas = menu.filter((m) => cat(m) === "sobremesa" || cat(m) === "doce" || cat(m) === "torta");
  const bebidas = menu.filter((m) => cat(m) === "bebida" || cat(m) === "cerveja" || cat(m) === "café");
  const chopps = menu.filter((m) => cat(m) === "chopp");
  const drinks = menu.filter((m) => cat(m) === "drink" || cat(m) === "vinho");
  const destilados = menu.filter((m) => cat(m) === "destilado");
  const paes = menu.filter((m) => cat(m) === "pão" || cat(m) === "padaria");

  // Determine establishment type based on category
  const catSlug = establishment.category?.slug || "";
  const isRestaurante = catSlug === "cozinha-brasileira" || catSlug === "cozinha-internacional" || catSlug === "autoral-contemporaneo";
  const isBarMusical = catSlug === "bar-musical";
  const isBalada = catSlug === "balada";
  const isConfeitaria = catSlug === "confeitaria";
  const isCafeteria = catSlug === "cafeteria" || catSlug === "padaria";
  const isBarType = isBarMusical || isBalada || catSlug === "pub" || catSlug === "coquetelaria" || catSlug === "boteco-moderno" || catSlug === "boteco-tradicional" || catSlug === "bar-balada" || catSlug === "bar-lanchonete";

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
    : paes.length > 0
    ? "paes"
    : "drinks";

  const MenuSection = ({ items, title }: { items: typeof entradas; title: string }) => (
    <div className="space-y-2">
      <h4 className="font-display text-xl tracking-wider text-primary mb-3">{title}</h4>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/20 transition-colors"
        >
          {(item.imageThumbUrl || item.imageUrl) && (
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
              <img
                src={(item.imageThumbUrl || item.imageUrl) as string}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-semibold text-foreground truncate">{item.name}</h5>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
            )}
          </div>
          <span className="font-numbers text-sm font-semibold text-primary whitespace-nowrap shrink-0">
            R$ {Number(item.price).toFixed(2).replace(".", ",")}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref={backHref} onMenuOpen={() => setMenuOpen(true)} />

      {/* Hero */}
      <section className="relative pt-16">
        {establishment.image ? (
          <div className="relative h-64 sm:h-80 overflow-hidden">
            <img
              src={establishment.image}
              alt={establishment.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        <div className="container -mt-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >

            <h2 className="font-display text-4xl sm:text-5xl tracking-wider text-primary text-glow-amber">
              {establishment.name.toUpperCase()}
            </h2>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              {establishment.address && (
                <button
                  onClick={() => setShowAddressSheet(true)}
                  className="flex items-center gap-1.5 text-left"
                >
                  <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
                  <span className="text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer">
                    {establishment.address}
                  </span>
                </button>
              )}
              {establishment.hours && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 shrink-0 text-primary/60" />
                  <span>{establishment.hours}</span>
                </div>
              )}
              {establishment.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 shrink-0 text-primary/60" />
                  <a
                    href={`tel:${establishment.phone.replace(/[^\d+]/g, '')}`}
                    className="text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    {establishment.phone}
                  </a>
                </div>
              )}
              {establishment.instagram && (
                <div className="flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 shrink-0 text-primary/60" />
                  <a
                    href={`https://www.instagram.com/${establishment.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    {establishment.instagram}
                  </a>
                </div>
              )}
            </div>

            {/* Share buttons */}
            <div className="flex gap-3 mt-5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Confira ${establishment.name} no AvaLyarin! ${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-all text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: establishment.name,
                      text: `Confira ${establishment.name} no AvaLyarin!`,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copiado!");
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA - inline removed, now fixed at bottom */}

      {/* Ratings Section: Google + Avalyarin side by side */}
      <section className="py-4">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Rating */}
            {(establishment.rating || establishment.reviewCount) && (
              <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/30">
                <h4 className="font-display text-sm tracking-wider text-muted-foreground mb-3">GOOGLE</h4>
                <GoogleRatingBadge
                  rating={establishment.rating ? Number(establishment.rating) : null}
                  reviewCount={establishment.reviewCount ? Number(establishment.reviewCount) : null}
                />
              </div>
            )}
            {/* Avalyarin Reviews */}
            <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20">
              <h4 className="font-display text-sm tracking-wider text-primary mb-3">AVALYARIN</h4>
              <AvalyarinReviews establishmentId={establishment.id} />
            </div>
          </div>
        </div>
      </section>

      {/* Claim Establishment */}
      <section className="pb-4">
        <div className="container">
          <Link href={`/painel-empresarial`}>
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Building2 className="w-3.5 h-3.5" />
              <span>É dono deste estabelecimento? Reivindique aqui</span>
            </button>
          </Link>
        </div>
      </section>

      {/* Menu */}
      {menu.length > 0 && (
        <section className="py-6 pb-28">
          <div className="container">
            <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20 p-4 sm:p-6 shadow-lg shadow-primary/5">
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
                {paes.length > 0 && <TabsTrigger value="paes" className="font-display tracking-wider text-xs">PÃES</TabsTrigger>}
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
              {paes.length > 0 && (
                <TabsContent value="paes">
                  <MenuSection items={paes} title="PÃES & PADARIA" />
                </TabsContent>
              )}
            </Tabs>
            </div>
          </div>
        </section>
      )}

      {/* Fixed CTA at bottom */}
      {menu.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-primary/20 p-3 sm:p-4">
          <div className="container">
            <Link href={`/avaliar/${establishment.slug}`}>
              <Button size="lg" className="w-full font-display text-lg tracking-wider glow-amber">
                AVALIAR ESTE ESTABELECIMENTO
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* No menu message */}
      {menu.length === 0 && (
        <section className="py-12">
          <div className="container text-center">
            <p className="text-muted-foreground">Cardápio ainda não disponível para este estabelecimento.</p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">AvaLyarin — Sistema de Avaliação Dinâmico</p>
        </div>
      </footer>

      {/* Address Bottom Sheet */}
      {showAddressSheet && establishment.address && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddressSheet(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[90] bg-card border-t border-border/50 rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300">
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />
            
            {/* Address display */}
            <div className="flex items-start gap-2 mb-5 p-3 rounded-lg bg-secondary/30 border border-border/30">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">{establishment.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{establishment.address}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {/* Copy */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(establishment.address!);
                  setShowAddressSheet(false);
                  import('sonner').then(({ toast }) => toast.success('Endereço copiado!'));
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Copy className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Copiar endereço</p>
                  <p className="text-[11px] text-muted-foreground">Copiar para a área de transferência</p>
                </div>
              </button>

              {/* Google Maps */}
              <button
                onClick={() => {
                  const query = encodeURIComponent(establishment.name + ' ' + establishment.address);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                  setShowAddressSheet(false);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Abrir no Google Maps</p>
                  <p className="text-[11px] text-muted-foreground">Ver rotas e navegação</p>
                </div>
              </button>

              {/* Uber */}
              <button
                onClick={() => {
                  const lat = establishment.lat;
                  const lng = establishment.lng;
                  let uberUrl: string;
                  if (lat && lng) {
                    uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(establishment.name)}`;
                  } else {
                    uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(establishment.address!)}&dropoff[nickname]=${encodeURIComponent(establishment.name)}`;
                  }
                  window.open(uberUrl, '_blank');
                  setShowAddressSheet(false);
                }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Car className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Pedir Uber</p>
                  <p className="text-[11px] text-muted-foreground">Abrir no app Uber</p>
                </div>
              </button>
            </div>

            {/* Close */}
            <button
              onClick={() => setShowAddressSheet(false)}
              className="w-full mt-4 py-2.5 rounded-xl border border-border/30 text-sm text-muted-foreground hover:bg-secondary/30 transition-colors"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
