/**
 * QR Scan Landing Page — /e/:slug
 * When a user scans the QR Code at an establishment, they land here.
 * Shows the establishment menu + a pop-up to enter a promo code.
 */
import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Tag, Gift, Percent, Check, X, QrCode } from "lucide-react";

export default function QRScanPage() {
  const [, params] = useRoute("/e/:slug");
  const slug = params?.slug || "";
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showPromoDialog, setShowPromoDialog] = useState(true);
  const [promoInput, setPromoInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    id: number;
    code: string;
    type: string;
    value: number | null;
    description: string | null;
    firstVisitOnly: boolean;
  } | null>(null);

  // Fetch establishment by slug
  const { data: estab, isLoading } = trpc.establishments.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  // Mark that user arrived via QR
  useEffect(() => {
    if (estab) {
      sessionStorage.setItem("avalyarin_qr_scan", JSON.stringify({
        establishmentId: estab.id,
        slug: estab.slug,
        timestamp: Date.now(),
      }));
    }
  }, [estab]);

  const handleValidateCode = async () => {
    if (!promoInput.trim() || !estab) return;
    setValidating(true);
    try {
      const result = await fetch(
        `/api/trpc/promo.validate?input=${encodeURIComponent(JSON.stringify({
          code: promoInput.trim(),
          establishmentId: estab.id,
          userId: user?.id,
        }))}`
      ).then(r => r.json());

      const data = result?.result?.data;
      if (data?.valid && data?.promo) {
        setAppliedPromo(data.promo);
        toast.success("Código válido!", { description: getPromoDescription(data.promo) });
        setShowPromoDialog(false);
      } else {
        toast.error("Código inválido", { description: "Este código não existe, expirou ou já foi utilizado." });
      }
    } catch {
      toast.error("Erro ao validar código");
    } finally {
      setValidating(false);
    }
  };

  const handleSkipCode = () => {
    setShowPromoDialog(false);
  };

  const handleGoToMenu = () => {
    if (estab) {
      navigate(`/estabelecimento/${estab.slug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!estab) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onMenuOpen={() => setMenuOpen(true)} />
        <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="container pt-28 text-center">
          <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Estabelecimento não encontrado</h1>
          <p className="text-muted-foreground">O QR Code pode estar desatualizado ou o estabelecimento foi removido.</p>
          <Button className="mt-6" onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuOpen={() => setMenuOpen(true)} />
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="container pt-28 pb-8">
        {/* Welcome header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl tracking-wider text-primary">
            {estab.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {estab.neighborhood} • {estab.address}
          </p>
        </div>

        {/* Applied promo banner */}
        {appliedPromo && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-green-400">Promoção ativa!</p>
                <p className="text-sm text-green-300/80">{getPromoDescription(appliedPromo)}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full font-display tracking-wider"
            onClick={handleGoToMenu}
          >
            VER CARDÁPIO
          </Button>
          {!appliedPromo && (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setShowPromoDialog(true)}
            >
              <Tag className="w-4 h-4 mr-2" />
              Inserir código promocional
            </Button>
          )}
        </div>
      </div>

      {/* Promo Code Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider text-center">
              Tem código promocional?
            </DialogTitle>
            <DialogDescription className="text-center">
              Se você recebeu um código de desconto de um influencer ou do próprio estabelecimento, insira abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: YARIN10"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleValidateCode()}
                className="font-mono text-lg tracking-wider uppercase"
                maxLength={20}
              />
              <Button
                onClick={handleValidateCode}
                disabled={!promoInput.trim() || validating}
              >
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleSkipCode}
            >
              Continuar sem código
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getPromoDescription(promo: { type: string; value: number | null; description: string | null }): string {
  if (promo.description) return promo.description;
  switch (promo.type) {
    case "percentage":
      return `${promo.value}% de desconto na conta`;
    case "buy_one_get_one":
      return "Pague 1, leve 2";
    case "free_item":
      return "Item grátis no pedido";
    case "fixed_discount":
      return `R$${promo.value} de desconto`;
    default:
      return "Promoção especial";
  }
}
