// Design: Neon Urbano — Establishment detail page with menu
// Back arrow navigates to the parent category page
import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Link, useParams, Redirect } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Instagram, ArrowRight, Loader2, Share2, MessageCircle, Building2, Copy, Navigation, Car, X, Bookmark, Send, CheckCircle, Newspaper, UtensilsCrossed, Ticket, CalendarDays, DollarSign, Pencil, Upload, Image as ImageIcon, ScanLine, Leaf, Sprout, WheatOff } from "lucide-react";
import ShareToGroup from "@/components/ShareToGroup";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { GoogleRatingBadge } from "@/components/GoogleRatingBadge";
import { AvalyarinReviews } from "@/components/AvalyarinReviews";
import { FourPointStar, ItemStars } from "@/components/FourPointStar";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";

function SaveBookmarkButton({ establishmentId }: { establishmentId: number }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: isSaved, isLoading: checkingStatus } = trpc.posts.isSaved.useQuery(
    { establishmentId },
    { enabled: isAuthenticated }
  );

  const toggleMutation = trpc.posts.toggleSave.useMutation({
    onSuccess: () => {
      utils.posts.isSaved.invalidate({ establishmentId });
      utils.posts.savedIds.invalidate();
    },
  });

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={() => toggleMutation.mutate({ establishmentId })}
      disabled={toggleMutation.isPending || checkingStatus}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
        isSaved
          ? "bg-primary/20 border-primary/50 text-primary"
          : "bg-secondary/50 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary"
      }`}
    >
      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-primary" : ""}`} />
      {isSaved ? "Salvo" : "Salvar"}
    </button>
  );
}

export default function EstablishmentPage() {
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showOwnerEdit, setShowOwnerEdit] = useState(false);
  const [activeSection, setActiveSection] = useState<"cardapio" | "avaliacoes" | "eventos">("cardapio");
  const [filterItem, setFilterItem] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { id } = useParams<{ id: string }>();

  const { data: estData, isLoading } = trpc.establishments.getWithMenu.useQuery(
    { slug: id || "" },
    { enabled: !!id }
  );

  // Fetch professional stars (which menu items were rated by specialist/critic)
  const { data: professionalStars } = trpc.establishments.professionalStars.useQuery(
    { establishmentId: estData?.id || 0 },
    { enabled: !!estData?.id }
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

  // Categorize menu items (case-insensitive, supports singular/plural and compound names)
  const cat = (m: { category?: string | null }) => (m.category || "").toLowerCase();
  const matchCat = (m: typeof menu[0], ...keywords: string[]) => {
    const c = cat(m);
    return keywords.some(k => c === k || c === k + "s" || c.includes(k));
  };
  const entradas = menu.filter((m) => matchCat(m, "entrada", "petisco", "salgado"));
  const pratos = menu.filter((m) => matchCat(m, "prato", "hamburguer", "hamb\u00farguer", "pizza", "lanche", "sanduiche", "sandu\u00edche", "sushi", "temaki", "ramen", "salada", "sopa", "focaccia", "grelhado", "risoto", "vegetariano", "pratos principais", "pratos internacionais"));
  const sobremesas = menu.filter((m) => matchCat(m, "sobremesa", "doce", "torta"));
  const bebidas = menu.filter((m) => matchCat(m, "bebida", "cerveja", "caf\u00e9", "n\u00e3o alco\u00f3lico", "n\u00e3o alcoolico"));
  const chopps = menu.filter((m) => matchCat(m, "chopp", "chope"));
  const drinks = menu.filter((m) => matchCat(m, "drink", "vinho", "caipirinha", "gin t\u00f4nica", "coquetel"));
  const destilados = menu.filter((m) => matchCat(m, "destilado", "mead"));
  const paes = menu.filter((m) => matchCat(m, "p\u00e3o", "padaria"));

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
          onClick={() => { setFilterItem(item.name); setActiveSection("avaliacoes"); }}
          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/20 transition-colors cursor-pointer"
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
            <div className="flex items-center gap-1.5">
              <h5 className="text-sm font-semibold text-foreground truncate">{item.name}</h5>
              {professionalStars && (() => {
                const star = professionalStars.find(s => s.menuItemId === item.id);
                if (!star) return null;
                return <ItemStars hasSpecialistRating={star.hasSpecialist} hasCriticRating={star.hasCritic} size={12} />;
              })()}
            </div>
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
      <Navbar  />

      {/* Hero */}
      <section className="relative pt-28">
        {/* Owner Edit Button */}
        {user?.role === 'owner' && (
          <button
            onClick={() => setShowOwnerEdit(true)}
            className="absolute top-32 right-4 z-20 p-2.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all hover:scale-105"
            title="Editar estabelecimento"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
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

            {/* Layout: Logo 1:1 + Info */}
            <div className="flex gap-4 items-start">
              {/* Logo 1:1 */}
              {establishment.logo && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-primary/20 shrink-0 bg-secondary/30">
                  <img src={establishment.logo} alt={`Logo ${establishment.name}`} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Nome + Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-display text-3xl sm:text-5xl tracking-wider text-primary text-glow-amber leading-tight">
                    {establishment.name.toUpperCase()}
                  </h2>
                  <EstablishmentBadges establishmentId={establishment.id} />
                </div>
                {/* Selo Crítico */}
                <CriticSealBadge establishmentId={establishment.id} />
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
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
                      {user?.phoneVerified ? (
                        <a
                          href={`tel:${establishment.phone.replace(/[^\d+]/g, '')}`}
                          className="text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          {establishment.phone}
                        </a>
                      ) : (
                        <span
                          onClick={() => toast("Verifique seu celular", { description: "Você precisa verificar seu número de celular para acessar o telefone do estabelecimento." })}
                          className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        >
                          {establishment.phone.replace(/\d/g, '•')}
                        </span>
                      )}
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
              </div>
            </div>

            {/* Share & Save buttons */}
            <div className="flex gap-3 mt-5 flex-wrap">
              {user?.phoneVerified ? (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Confira ${establishment.name} no AvaLyarin! ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20 transition-all text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              ) : (
                <button
                  onClick={() => toast("Verifique seu celular", { description: "Você precisa verificar seu número de celular para compartilhar via WhatsApp." })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366]/50 cursor-not-allowed text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
              )}
              <ShareToGroup
                type="share_establishment"
                referenceId={establishment.id}
                referenceSlug={`estabelecimento/${establishment.slug}`}
                label="Compartilhar"
                trigger={
                  <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all text-sm font-medium">
                    <Share2 className="w-4 h-4" />
                    Compartilhar
                  </span>
                }
              />
              <SaveBookmarkButton establishmentId={establishment.id} />
              <Link href={`/e/${establishment.slug}`}>
                <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all text-sm font-medium">
                  <ScanLine className="w-4 h-4" />
                  Scan
                </span>
              </Link>
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
            {!!(establishment.rating || establishment.reviewCount) && (
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
          <button
            onClick={() => setShowClaimForm(true)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>É dono deste estabelecimento? Reivindique aqui</span>
          </button>
        </div>
      </section>

      {/* Claim Form Modal */}
      {showClaimForm && (
        <ClaimFormModal
          establishmentId={estData?.id || 0}
          establishmentName={estData?.name || ""}
          onClose={() => setShowClaimForm(false)}
        />
      )}

      {/* Owner Edit Modal */}
      {showOwnerEdit && user?.role === 'owner' && (
        <OwnerEditModal
          establishment={establishment}
          onClose={() => setShowOwnerEdit(false)}
        />
      )}

      {/* Main Content Tabs: Cardápio / Avaliações / Eventos */}
      {(menu.length > 0 || true) && (
        <section className="py-6 pb-28">
          <div className="container">
            {/* Section Toggle */}
            <div className="flex gap-2 mb-4">
              {menu.length > 0 && (
                <button
                  onClick={() => { setActiveSection("cardapio"); setFilterItem(null); }}
                  className={`px-4 py-2 rounded-lg font-display text-sm tracking-wider transition-all ${
                    activeSection === "cardapio"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  CARDÁPIO
                </button>
              )}
              <button
                onClick={() => setActiveSection("avaliacoes")}
                className={`px-4 py-2 rounded-lg font-display text-sm tracking-wider transition-all ${
                  activeSection === "avaliacoes"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                AVALIAÇÕES
              </button>
              <button
                onClick={() => setActiveSection("eventos")}
                className={`px-4 py-2 rounded-lg font-display text-sm tracking-wider transition-all ${
                  activeSection === "eventos"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                EVENTOS
              </button>
            </div>

            {/* Avaliações Section */}
            {activeSection === "avaliacoes" && (
              <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20 p-4 sm:p-6 shadow-lg shadow-primary/5">
                <ReviewsSection
                  establishmentId={establishment.id}
                  filterItem={filterItem}
                  onClearFilter={() => setFilterItem(null)}
                />
              </div>
            )}

            {/* Eventos Section */}
            {activeSection === "eventos" && (
              <EventosSection establishmentId={establishment.id} />
            )}

            {/* Cardápio Section */}
            {activeSection === "cardapio" && menu.length > 0 && (
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
            )}
          </div>
        </section>
      )}

      {/* Fixed CTA at bottom — hidden for business accounts */}
      {(() => {
        const effRole = (window as any).__ownerViewingAs || user?.role || "user";
        return effRole !== "business";
      })() && (
        <div className={`fixed left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-primary/20 p-3 sm:p-4 ${!isAuthenticated ? 'bottom-0' : user?.role === 'owner' ? 'bottom-[8.5rem]' : 'bottom-16'}`}>
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



      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">Avalyarin — Rede Social de Avaliações de São Paulo</p>
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


// Claim Form Modal — questionário inline para reivindicação de estabelecimento
function ClaimFormModal({ establishmentId, establishmentName, onClose }: {
  establishmentId: number;
  establishmentName: string;
  onClose: () => void;
}) {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    businessName: "",
    contactPhone: "",
    contactEmail: "",
    proofDescription: "",
  });

  const submitMutation = trpc.business.submitClaim.useMutation({
    onSuccess: () => setStep("success"),
    onError: (err) => toast.error(err.message || "Erro ao enviar solicitação"),
  });

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md bg-card border border-border/50 rounded-t-2xl sm:rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg tracking-wider text-primary">REIVINDICAR ESTABELECIMENTO</h3>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Para reivindicar este estabelecimento, você precisa estar logado.
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors w-full justify-center"
          >
            Entrar para continuar
          </a>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full sm:max-w-md bg-card border border-border/50 rounded-t-2xl sm:rounded-2xl p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="font-display text-xl tracking-wider text-foreground mb-2">SOLICITAÇÃO ENVIADA!</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Sua reivindicação para <span className="text-foreground font-medium">{establishmentName}</span> foi enviada com sucesso. Aguarde a análise do administrador.
          </p>
          <Button onClick={onClose} className="w-full">Fechar</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!formData.businessName || !formData.contactPhone || !formData.contactEmail || !formData.proofDescription) {
      toast.error("Preencha todos os campos");
      return;
    }
    submitMutation.mutate({
      establishmentId,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-card border border-border/50 rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg tracking-wider text-primary">REIVINDICAR ESTABELECIMENTO</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Preencha os dados abaixo para comprovar que você é o responsável por <span className="text-foreground font-medium">{establishmentName}</span>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Nome da Empresa / Razão Social</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="Ex: Bar do João LTDA"
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-1">Telefone de Contato</label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-1">Email de Contato</label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="contato@empresa.com"
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-1">Como podemos verificar que você é o responsável?</label>
            <textarea
              value={formData.proofDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, proofDescription: e.target.value }))}
              placeholder="Ex: Sou o proprietário registrado no CNPJ, posso enviar contrato social, tenho acesso ao Instagram oficial..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex-1 font-display tracking-wider"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
          </Button>
          <Button variant="outline" onClick={onClose} className="font-display tracking-wider">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// ESTABLISHMENT BADGES — Selos Visuais (Vegetariano, Vegano, Sem Glúten)
// ============================================================
const BADGE_CONFIG = {
  vegetariano: { icon: Leaf, label: "Vegetariano", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
  vegano: { icon: Sprout, label: "Vegano", color: "text-emerald-600", bg: "bg-emerald-600/10", border: "border-emerald-600/30" },
  sem_gluten: { icon: WheatOff, label: "Sem Glúten", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

function EstablishmentBadges({ establishmentId }: { establishmentId: number }) {
  const { data: badges, isLoading } = trpc.establishments.getBadges.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  if (isLoading || !badges || badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {badges.map((badge) => {
        const config = BADGE_CONFIG[badge.badgeType as keyof typeof BADGE_CONFIG];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <div
            key={badge.id}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} border ${config.border}`}
            title={config.label}
          >
            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// CRITIC SEAL BADGE — Selo Crítico Gastronômico
// ============================================================
function CriticSealBadge({ establishmentId }: { establishmentId: number }) {
  const { data, isLoading } = trpc.critic.establishmentSeal.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );

  if (isLoading || !data?.hasSeal) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      {data.critics.map((critic: any, idx: number) => (
        <div
          key={idx}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30"
        >
          <Newspaper className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium text-purple-400">
            Selo Crítico — {critic.criticName || "Crítico Verificado"}
          </span>
        </div>
      ))}
    </div>
  );
}


// ============================================================
// REVIEWS SECTION — Sub-aba de Avaliações com cards
// ============================================================
import { Star as StarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function ReviewsSection({ establishmentId, filterItem, onClearFilter }: {
  establishmentId: number;
  filterItem: string | null;
  onClearFilter: () => void;
}) {
  const { data: reviews, isLoading } = trpc.ratings.byEstablishment.useQuery(
    { establishmentId, limit: 50, offset: 0, filterItemName: filterItem || undefined },
    { enabled: !!establishmentId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
          AVALIAÇÕES
        </h3>
        {filterItem && (
          <button
            onClick={onClearFilter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary hover:bg-primary/20 transition-colors"
          >
            <X className="w-3 h-3" />
            Filtro: {filterItem}
          </button>
        )}
      </div>

      {(!reviews || reviews.length === 0) ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-secondary/50 border border-border/30 flex items-center justify-center mx-auto mb-4">
            <StarIcon className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">
            {filterItem
              ? `Nenhuma avaliação encontrada para "${filterItem}"`
              : "Nenhuma avaliação ainda. Seja o primeiro a avaliar!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: any) => {
            const isCritic = review.userRole === "critic";
            const isSpecialist = review.userRole === "specialist";
            const visitDateStr = review.visitDate
              ? format(new Date(review.visitDate), "dd/MM/yyyy", { locale: ptBR })
              : review.createdAt
              ? format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })
              : "";
            const itemNames = review.items?.map((i: any) => i.itemName).join(", ") || "";

            return (
              <div
                key={review.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCritic
                    ? "bg-[#0a1628]/80 border-blue-500/30 shadow-md shadow-blue-500/5"
                    : "bg-secondary/50 border-border/30"
                }`}
              >
                {/* Header: user + score */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isCritic && (
                      <FourPointStar variant="critic" size={16} glow />
                    )}
                    {isSpecialist && (
                      <FourPointStar variant="specialist" size={16} glow />
                    )}
                    {review.username ? (
                      <Link href={`/perfil/${review.username}`}>
                        <span className="text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer">
                          @{review.username}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-foreground">
                        {review.userName || "Anônimo"}
                      </span>
                    )}
                    {isCritic && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium">
                        CRÍTICO
                      </span>
                    )}
                    {isSpecialist && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 font-medium">
                        ESPECIALISTA
                      </span>
                    )}
                  </div>
                  {review.overallScore && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      isCritic ? "bg-blue-500/10 border border-blue-500/30" : isSpecialist ? "bg-amber-500/10 border border-amber-500/30" : "bg-primary/10 border border-primary/30"
                    }`}>
                      {(isCritic || isSpecialist) ? (
                        <FourPointStar variant={isCritic ? "critic" : "specialist"} size={14} glow={false} />
                      ) : null}
                      <span className={`font-numbers text-sm font-bold ${isCritic ? "text-blue-400" : isSpecialist ? "text-amber-500" : "text-primary"}`}>
                        {Number(review.overallScore).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Date */}
                {visitDateStr && (
                  <p className="text-[11px] text-muted-foreground mb-2">{visitDateStr}</p>
                )}

                {/* Share button */}
                <div className="mt-2">
                  <ShareToGroup
                    type="share_rating"
                    referenceId={review.id}
                    referenceSlug={`estabelecimento/${review.establishmentSlug || ''}`}
                  />
                </div>

                {/* Items consumed */}
                {review.items && review.items.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {review.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-background/50 border border-border/20"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ""}
                            {item.itemName}
                          </p>
                          {item.comment && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 italic">
                              "{item.comment}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {(isCritic || isSpecialist) && (
                            <ItemStars
                              hasSpecialistRating={isSpecialist}
                              hasCriticRating={isCritic}
                              size={12}
                            />
                          )}
                          {item.price && (
                            <span className="text-[10px] text-muted-foreground">
                              R$ {Number(item.price).toFixed(2).replace(".", ",")}
                            </span>
                          )}
                          {item.score && (
                            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${
                              isCritic ? "bg-blue-500/10" : isSpecialist ? "bg-amber-500/10" : "bg-primary/10"
                            }`}>
                              <span className={`font-numbers text-[11px] font-semibold ${
                                isCritic ? "text-blue-400" : isSpecialist ? "text-amber-500" : "text-primary"
                              }`}>
                                {Number(item.score).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ============================================================
// Eventos Section — aba pública de eventos do estabelecimento
// ============================================================
const EVENT_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  esporte: { label: "Esporte", icon: "⚽" },
  show: { label: "Show", icon: "🎤" },
  festa: { label: "Festa", icon: "🎉" },
  gastronomia: { label: "Gastronomia", icon: "🍽️" },
  cultural: { label: "Cultural", icon: "🎭" },
  stand_up: { label: "Stand-Up", icon: "😂" },
  quiz: { label: "Quiz / Trivia", icon: "🧠" },
  degustacao: { label: "Degustação", icon: "🍷" },
  workshop: { label: "Workshop", icon: "🔧" },
  karaoke: { label: "Karaokê", icon: "🎵" },
  dj: { label: "DJ Set", icon: "🎧" },
  sertanejo: { label: "Sertanejo", icon: "🤠" },
  pagode: { label: "Pagode", icon: "🥁" },
  forro: { label: "Forró", icon: "💃" },
  samba: { label: "Samba", icon: "🎶" },
  outro: { label: "Outro", icon: "📌" },
};

function EventosSection({ establishmentId }: { establishmentId: number }) {
  const { data: events, isLoading } = trpc.establishments.activeEvents.useQuery(
    { establishmentId },
    { enabled: !!establishmentId }
  );
  const [filterType, setFilterType] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20 p-6 shadow-lg shadow-primary/5 text-center">
        <Ticket className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <h4 className="font-display text-lg tracking-wider text-foreground/70 mb-1">NENHUM EVENTO</h4>
        <p className="text-sm text-muted-foreground">Este estabelecimento não possui eventos ativos no momento.</p>
      </div>
    );
  }

  // Get unique event types for filter
  const availableTypes = Array.from(new Set(events.map((e: any) => e.eventType)));
  const filteredEvents = filterType ? events.filter((e: any) => e.eventType === filterType) : events;

  return (
    <div className="space-y-4">
      {/* Filter by type */}
      {availableTypes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !filterType
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {availableTypes.map((type: string) => {
            const info = EVENT_TYPE_LABELS[type];
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {info?.icon} {info?.label || type}
              </button>
            );
          })}
        </div>
      )}

      {/* Event Cards */}
      {filteredEvents.map((event: any) => {
        const startDt = new Date(event.startDate);
        const endDt = new Date(event.endDate);
        const now = Date.now();
        const isHappening = event.startDate <= now && event.endDate >= now;
        const typeInfo = EVENT_TYPE_LABELS[event.eventType];

        return (
          <div key={event.id} className="rounded-xl bg-card/80 backdrop-blur-sm border border-primary/20 overflow-hidden shadow-lg shadow-primary/5">
            {/* Cover Image */}
            {event.coverImageUrl && (
              <div className="relative">
                <img src={event.coverImageUrl} alt={event.title} className="w-full h-48 sm:h-56 object-cover" />
                {isHappening && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                    AO VIVO
                  </div>
                )}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs font-medium text-foreground">
                  {typeInfo?.icon} {typeInfo?.label}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4 sm:p-5">
              <h4 className="font-display text-xl tracking-wider text-foreground mb-2">{event.title}</h4>
              
              {/* Date & Time */}
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">
                    {startDt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                  </span>
                  {" · "}
                  {startDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {" — "}
                  {endDt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {startDt.toDateString() !== endDt.toDateString() && (
                    <span> ({endDt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })})</span>
                  )}
                </div>
              </div>

              {/* Location (if custom) */}
              {event.locationType === "custom" && event.customAddress && (
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {event.customAddress}{event.customAddressNumber ? `, ${event.customAddressNumber}` : ""} — {event.customNeighborhood}
                  </span>
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{event.description}</p>

              {/* Entry info */}
              <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                {event.entryType === "free" ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-medium text-green-400">Entrada Gratuita</span>
                  </div>
                ) : event.paidType === "single" ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">R$ {event.singlePrice?.toFixed(2)}</span>
                    </div>
                    {event.hasDoorPrice && event.doorPrice && (
                      <span className="text-[10px] text-muted-foreground">Na porta: R$ {event.doorPrice.toFixed(2)}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const now = Date.now();
                      const sortedBatches = [...(event.batches || [])].sort((a: any, b: any) => a.batchNumber - b.batchNumber);
                      // Find active batch: first batch whose expiresAt is in the future, or last batch if all expired
                      const activeBatchIndex = sortedBatches.findIndex((b: any) => !b.expiresAt || b.expiresAt > now);
                      const activeIdx = activeBatchIndex >= 0 ? activeBatchIndex : sortedBatches.length - 1;
                      return sortedBatches.map((batch: any, idx: number) => (
                        <div key={batch.id} className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
                          idx === activeIdx
                            ? "bg-primary/20 border-primary/40 ring-1 ring-primary/30"
                            : idx < activeIdx
                              ? "bg-secondary/50 border-border/30 opacity-50 line-through"
                              : "bg-primary/5 border-primary/10"
                        }`}>
                          <span className={`text-[10px] font-medium ${idx === activeIdx ? "text-primary" : "text-muted-foreground"}`}>
                            {batch.batchName}: R$ {batch.price.toFixed(2)}
                            {idx === activeIdx && " ← atual"}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Ticket URL button */}
              {event.ticketUrl && (
                <div className="pt-3 border-t border-border/30">
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Ticket className="w-4 h-4" />
                    Comprar Ingresso
                  </a>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// Owner Edit Modal — full edit form for owner role
function OwnerEditModal({ establishment, onClose }: {
  establishment: any;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: establishment.name || '',
    address: establishment.address || '',
    addressNumber: (establishment as any).addressNumber || '',
    complement: (establishment as any).complement || '',
    neighborhood: establishment.neighborhood || '',
    phone: establishment.phone || '',
    instagram: establishment.instagram || '',
    hours: establishment.hours || '',
    description: (establishment as any).description || '',
    categoryId: establishment.categoryId || establishment.category?.id || undefined as number | undefined,
    logo: establishment.logo || '',
    image: establishment.image || '',
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: categories } = trpc.categories.list.useQuery();

  const updateMutation = trpc.ownerUpdateEstablishment.useMutation({
    onSuccess: () => {
      toast.success('Estabelecimento atualizado!');
      utils.establishments.getWithMenu.invalidate();
      onClose();
    },
    onError: (err) => {
      toast.error('Erro: ' + err.message);
    },
  });

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx. 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Apenas imagens"); return; }
    setUploadingLogo(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch("/api/upload-logo", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: buffer,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setForm(f => ({ ...f, logo: url }));
      toast.success("Logo enviado!");
    } catch { toast.error("Erro ao enviar logo"); }
    finally { setUploadingLogo(false); }
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx. 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Apenas imagens"); return; }
    setUploadingCover(true);
    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch("/api/upload-cover", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: buffer,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setForm(f => ({ ...f, image: url }));
      toast.success("Foto de capa enviada!");
    } catch { toast.error("Erro ao enviar capa"); }
    finally { setUploadingCover(false); }
  };

  const handleSave = () => {
    setSaving(true);
    updateMutation.mutate({
      establishmentId: establishment.id,
      name: form.name || undefined,
      address: form.address || undefined,
      addressNumber: form.addressNumber || undefined,
      complement: form.complement || undefined,
      neighborhood: form.neighborhood || undefined,
      phone: form.phone || undefined,
      instagram: form.instagram || undefined,
      hours: form.hours || undefined,
      description: form.description || undefined,
      categoryId: form.categoryId || undefined,
      logo: form.logo || undefined,
      image: form.image || undefined,
    }, { onSettled: () => setSaving(false) });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border/50 rounded-t-2xl sm:rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-lg tracking-wider text-primary">EDITAR ESTABELECIMENTO</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          {/* Cover Image */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Foto de Capa</label>
            <div className="relative h-32 rounded-lg overflow-hidden border border-border/50 bg-secondary/30">
              {form.image ? (
                <img src={form.image} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute bottom-2 right-2 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-all"
              >
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </button>
            </div>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadCover} />
          </div>

          {/* Logo */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Logo (1:1)</label>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border/50 bg-secondary/30 shrink-0">
                {form.logo ? (
                  <img src={form.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                </button>
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="text-xs text-primary hover:underline"
              >
                {uploadingLogo ? "Enviando..." : "Alterar logo"}
              </button>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} />
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
            <select
              value={form.categoryId || ''}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">Selecione...</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Endereço</label>
            <input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Rua, Avenida, Alameda..."
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Número</label>
              <input
                value={form.addressNumber}
                onChange={e => setForm(f => ({ ...f, addressNumber: e.target.value }))}
                placeholder="123 ou s/n"
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Complemento</label>
              <input
                value={form.complement}
                onChange={e => setForm(f => ({ ...f, complement: e.target.value }))}
                placeholder="Sala 1, Bloco A..."
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Neighborhood */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Bairro</label>
            <input
              value={form.neighborhood}
              onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Hours */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Horário de Funcionamento</label>
            <input
              value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
              placeholder="Seg-Sex 11h-23h, Sáb-Dom 11h-01h"
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefone</label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Instagram</label>
            <input
              value={form.instagram}
              onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
              placeholder="@seubar"
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              maxLength={500}
              placeholder="Breve descrição do estabelecimento..."
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
            <span className="text-xs text-muted-foreground">{form.description.length}/500</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
