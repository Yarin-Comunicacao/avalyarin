// ProfilePhotoUploader — allows user to change profile photo (gallery or camera)
import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Camera, ImageIcon, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProfilePhotoUploaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ProfilePhotoUploader({ size = "md", className = "" }: ProfilePhotoUploaderProps) {
  const { user, refresh } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.profile.uploadProfilePhoto.useMutation({
    onSuccess: () => {
      toast.success("Foto de perfil atualizada!");
      refresh();
      setShowDialog(false);
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar foto.");
    },
  });

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp|heic)$/)) {
      toast.error("Formato não suportado. Use JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo: 5MB.");
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await uploadMutation.mutateAsync({
        base64,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "image/heic",
      });
    } catch {
      // error handled by mutation
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      {/* Avatar button — click to open upload dialog */}
      <button
        onClick={() => setShowDialog(true)}
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-all group ${className}`}
      >
        {user?.profilePhotoUrl ? (
          <img
            src={user.profilePhotoUrl}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <span className="font-display text-primary text-lg">{initials}</span>
          </div>
        )}
        {/* Camera overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </button>

      {/* Upload Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">ALTERAR FOTO DE PERFIL</DialogTitle>
          </DialogHeader>

          {uploading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Enviando foto...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-4">
              {/* Preview current photo */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/30">
                  {user?.profilePhotoUrl ? (
                    <img
                      src={user.profilePhotoUrl}
                      alt="Foto atual"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="font-display text-primary text-2xl">{initials}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery button */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={handleGalleryClick}
              >
                <ImageIcon className="w-5 h-5 text-primary" />
                <span>Escolher da Galeria</span>
              </Button>

              {/* Camera button */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12"
                onClick={handleCameraClick}
              >
                <Camera className="w-5 h-5 text-primary" />
                <span>Tirar Foto</span>
              </Button>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = "";
                }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
