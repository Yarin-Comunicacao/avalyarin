import { useAuth } from "@/_core/hooks/useAuth";
import { PostsCarousel } from "@/components/PostsCarousel";
import { SavedPostsCarousel } from "@/components/SavedPostsCarousel";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { useState } from "react";
import { Megaphone } from "lucide-react";

export default function DestaquesPage() {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="container pt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-wider text-primary">DESTAQUES</h1>
            <p className="text-sm text-muted-foreground">Novidades e promoções dos estabelecimentos</p>
          </div>
        </div>

        {/* Posts Carousel - destaques de estabelecimentos */}
        <PostsCarousel />

        {/* Saved Posts - para usuários logados */}
        {isAuthenticated && (
          <div className="mt-8">
            <SavedPostsCarousel />
          </div>
        )}
      </div>
    </div>
  );
}
