/**
 * QR Scanner Page — /scan
 * Uses the device camera to scan QR codes within the app.
 * On successful scan, navigates to the establishment page (/e/:slug).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, ScanLine, ArrowLeft, Flashlight } from "lucide-react";
import { toast } from "sonner";

export default function QRScannerPage() {
  const [, navigate] = useLocation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasNavigated = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (hasNavigated.current) return;
    
    // Try to extract the slug from the URL
    // Expected formats: 
    //   https://avaliabar-xxx.manus.space/e/slug
    //   /e/slug
    //   or just the slug itself
    let slug: string | null = null;

    try {
      const url = new URL(decodedText);
      const pathMatch = url.pathname.match(/\/e\/([^/?#]+)/);
      if (pathMatch) {
        slug = pathMatch[1];
      }
    } catch {
      // Not a full URL, try path match
      const pathMatch = decodedText.match(/\/e\/([^/?#]+)/);
      if (pathMatch) {
        slug = pathMatch[1];
      } else if (/^[a-z0-9-]+$/.test(decodedText)) {
        // Might be just a slug
        slug = decodedText;
      }
    }

    if (slug) {
      hasNavigated.current = true;
      stopScanner();
      toast.success("QR Code lido!", { description: "Redirecionando..." });
      navigate(`/e/${slug}`);
    } else {
      toast.error("QR Code inválido", { 
        description: "Este QR code não pertence a um estabelecimento do AvaLyarin." 
      });
    }
  }, [navigate, stopScanner]);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scannerRef.current) return;

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        handleScanSuccess,
        () => {} // ignore scan failures (no QR in frame)
      );

      setIsScanning(true);
      setHasPermission(true);
      setError(null);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
        setHasPermission(false);
        setError("Permissão de câmera negada. Ative nas configurações do navegador.");
      } else if (msg.includes("NotFoundError") || msg.includes("no camera")) {
        setError("Nenhuma câmera encontrada neste dispositivo.");
      } else {
        setError("Não foi possível acessar a câmera. Tente novamente.");
      }
      scannerRef.current = null;
    }
  }, [handleScanSuccess]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={() => { stopScanner(); navigate("/"); }}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="font-display text-lg tracking-wider text-white">SCANNER</h1>
          <p className="text-xs text-white/60">Aponte para o QR Code do estabelecimento</p>
        </div>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Camera feed container */}
        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden"
          style={{ display: isScanning ? "block" : "none" }}
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 relative">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
              {/* Animated scan line */}
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-primary/80 animate-pulse" />
            </div>
          </div>
        )}

        {/* Permission denied / error state */}
        {!isScanning && error && (
          <div className="text-center px-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <CameraOff className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="font-display text-xl text-white mb-2">Câmera indisponível</h2>
            <p className="text-white/60 text-sm mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => { setError(null); startScanner(); }}
                className="font-display tracking-wider"
              >
                <Camera className="w-4 h-4 mr-2" />
                TENTAR NOVAMENTE
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="text-white border-white/20"
              >
                VOLTAR
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!isScanning && !error && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <p className="text-white/60 text-sm">Acessando câmera...</p>
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="p-6 bg-black/80 backdrop-blur-sm text-center">
        <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
          <ScanLine className="w-4 h-4" />
          <span>Posicione o QR Code dentro da área marcada</span>
        </div>
      </div>
    </div>
  );
}
