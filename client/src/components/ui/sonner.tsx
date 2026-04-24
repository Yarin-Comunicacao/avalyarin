import { Toaster as Sonner, toast } from "sonner";
import "sonner/dist/styles.css";

function Toaster() {
  return (
    <Sonner
      theme="dark"
      richColors
      position="bottom-center"
      duration={4000}
      containerAriaLabel="Notificações"
      toastOptions={{
        style: {
          background: "hsl(var(--popover))",
          color: "hsl(var(--popover-foreground))",
          border: "1px solid hsl(var(--border))",
          zIndex: 99999,
        },
      }}
    />
  );
}

export { Toaster, toast };
