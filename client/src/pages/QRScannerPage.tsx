/**
 * QR Scanner Page — /scan
 * Uses the device camera to scan QR codes within the app.
 * On successful scan, navigates to the establishment page (/e/:slug).
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, ScanLine, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function QRScannerPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const hasNavigated = useRef(false);
  const mountedRef = useRef(true);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      try {
        scannerRef.current.clear();
      } catch {
        // ignore clear errors
      }
      scannerRef.current = null;
    }
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    if (hasNavigated.current) return;

    // Try to extract the slug from the URL
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
        description: "Este QR code não pertence a um estabelecimento do AvaLyarin.",
      });
    }
  }, [navigate, stopScanner]);

  const startScanner = useCallback(async () => {
    // Dynamically import html5-qrcode to ensure lazy loading
    const { Html5Qrcode } = await import("html5-qrcode");

    if (!mountedRef.current) return;

    // Make sure the container element exists
    const container = document.getElementById("qr-reader");
    if (!container) {
      setError("Erro interno: container não encontrado.");
      setStatus("error");
      return;
    }

    // Clean up any previous instance
    if (scannerRef.current) {
      await stopScanner();
    }

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        () => {} // ignore scan failures (no QR in frame)
      );

      if (mountedRef.current) {
        setStatus("scanning");
        setError(null);
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = err?.message || String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission") || msg.includes("denied")) {
        setError("Permissão de câmera negada. Ative nas configurações do navegador e tente novamente.");
      } else if (msg.includes("NotFoundError") || msg.includes("Requested device not found") || msg.includes("no camera")) {
        setError("Nenhuma câmera encontrada neste dispositivo.");
      } else if (msg.includes("NotReadableError") || msg.includes("Could not start")) {
        setError("A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.");
      } else {
        setError(`Não foi possível acessar a câmera: ${msg}`);
      }
      setStatus("error");
      scannerRef.current = null;
    }
  }, [handleScanSuccess, stopScanner]);

  useEffect(() => {
    mountedRef.current = true;
    // Small delay to ensure DOM is rendered before starting scanner
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const handleRetry = () => {
    setStatus("loading");
    setError(null);
    startScanner();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 p-4 bg-black/80 backdrop-blur-sm">
        <button
          onClick={() => { stopScanner(); window.history.back(); }}
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
        {/* Camera feed container — always in DOM, hidden via opacity when not scanning */}
        <div
          id="qr-reader"
          className="w-full max-w-sm aspect-square overflow-hidden"
          style={{
            opacity: status === "scanning" ? 1 : 0,
            position: status === "scanning" ? "relative" : "absolute",
            pointerEvents: status === "scanning" ? "auto" : "none",
          }}
        />

        {/* Scanning overlay */}
        {status === "scanning" && (
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

        {/* Error state */}
        {status === "error" && error && (
          <div className="text-center px-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <CameraOff className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="font-display text-xl text-white mb-2">Câmera indisponível</h2>
            <p className="text-white/60 text-sm mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRetry}
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
        {status === "loading" && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <p className="text-white/60 text-sm">Acessando câmera...</p>
            <p className="text-white/40 text-xs mt-2">Permita o acesso quando solicitado</p>
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
