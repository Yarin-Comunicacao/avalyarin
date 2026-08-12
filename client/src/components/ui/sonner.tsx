import { Toaster as Sonner, toast } from "sonner";
import "sonner/dist/styles.css";
import { useTheme } from "@/contexts/ThemeContext";

function Toaster() {
  const { } = useTheme();

  return (
    <Sonner
      theme="light"
      richColors
      position="bottom-center"
      duration={4000}
      containerAriaLabel="Notificações"
    />
  );
}

export { Toaster, toast };
