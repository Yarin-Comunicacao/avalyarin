import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) return;

    // Check if dismissed recently (don't show for 7 days)
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay (let user explore first)
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS, show instructions after delay
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  const handleIOSInstructions = () => {
    setShowIOSInstructions(true);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Bottom banner prompt */}
      {!showIOSInstructions && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-500">
          <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-4 shadow-2xl shadow-primary/10">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-sm font-semibold text-foreground tracking-wide">
                  INSTALAR AVALYARIN
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Adicione à sua tela inicial para acesso rápido, como um app nativo!
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              {isIOS ? (
                <button
                  onClick={handleIOSInstructions}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 px-4 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Como instalar
                </button>
              ) : (
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 px-4 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Instalar App
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-foreground tracking-wide">
                INSTALAR NO iPHONE
              </h3>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                  1
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Toque no ícone de compartilhar
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O ícone de quadrado com seta para cima (⬆️) na barra inferior do Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                  2
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Role para baixo e toque em "Adicionar à Tela de Início"
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pode ser necessário rolar a lista de opções
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-primary">
                  3
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Toque em "Adicionar"
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O app aparecerá na sua tela inicial como um ícone
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
