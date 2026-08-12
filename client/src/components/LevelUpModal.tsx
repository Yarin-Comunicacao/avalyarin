import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelName: string;
  levelIcon: string;
  previousLevel: number;
  newLevel: number;
  phrase: string;
}

export default function LevelUpModal({
  isOpen,
  onClose,
  levelName,
  levelIcon,
  previousLevel,
  newLevel,
  phrase,
}: LevelUpModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-foreground/70 backdrop-blur-md" />

          {/* Modal content */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.1 }}
            className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-card via-card to-card/95 border border-primary/40 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect at top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl -translate-y-1/2" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-background/50 hover:bg-background/80 transition-colors z-10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="relative pt-10 pb-8 px-6 flex flex-col items-center text-center">
              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.3 }}
                className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center mb-4"
              >
                <span className="text-4xl">{levelIcon}</span>
              </motion.div>

              {/* Level up badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-4"
              >
                <Trophy className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary tracking-wide uppercase">
                  Nível {previousLevel} → {newLevel}
                </span>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-display text-2xl tracking-wider text-primary text-glow-amber mb-1"
              >
                {levelName.toUpperCase()}
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="text-sm text-muted-foreground mb-4"
              >
                Nova insígnia desbloqueada!
              </motion.p>

              {/* AI-generated phrase */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border/50 mb-6"
              >
                <p className="text-sm text-foreground/90 italic leading-relaxed">
                  "{phrase}"
                </p>
              </motion.div>

              {/* CTA button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
                className="w-full"
              >
                <Button
                  onClick={onClose}
                  className="w-full font-display tracking-wider glow-amber"
                  size="lg"
                >
                  CONTINUAR
                </Button>
              </motion.div>
            </div>

            {/* Decorative particles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute top-6 left-6 w-2 h-2 rounded-full bg-primary/40"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute top-12 right-10 w-1.5 h-1.5 rounded-full bg-primary/30"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-16 left-8 w-1 h-1 rounded-full bg-primary/20"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
