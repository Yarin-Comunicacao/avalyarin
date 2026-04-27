import { Toaster as Sonner, toast } from "sonner";
import "sonner/dist/styles.css";
import { useTheme } from "@/contexts/ThemeContext";

function Toaster() {
  const { theme } = useTheme();
  const isDark = theme === "escuro" || theme === "azul-cinza";

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      richColors
      position="bottom-center"
      duration={4000}
      containerAriaLabel="Notificações"
    />
  );
}

export { Toaster, toast };
