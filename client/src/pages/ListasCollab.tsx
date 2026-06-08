// Design: AvaLyarin — Listas Collab page
// Collaborative lists of places with friends
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { toast } from "@/components/ui/sonner";
import { Users, Plus, MapPin, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface CollabList {
  id: string;
  name: string;
  members: { name: string; avatar: string }[];
  places: { id: string; name: string; neighborhood: string }[];
  color: string;
}

const mockLists: CollabList[] = [
  {
    id: "1",
    name: "Happy Hour da Firma",
    members: [
      { name: "Você", avatar: "" },
      { name: "João", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop" },
      { name: "Ana", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop" },
    ],
    places: [
      { id: "the-blue-pub", name: "The Blue Pub", neighborhood: "Consolação" },
      { id: "cervejaria-nacional", name: "Cervejaria Nacional", neighborhood: "Pinheiros" },
    ],
    color: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  },
  {
    id: "2",
    name: "Date Night",
    members: [
      { name: "Você", avatar: "" },
      { name: "Mari", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop" },
    ],
    places: [
      { id: "frigobar-speakeasy", name: "Frigobar Speakeasy", neighborhood: "Vila Madalena" },
      { id: "le-jazz-brasserie", name: "Le Jazz Brasserie", neighborhood: "Jardins" },
    ],
    color: "bg-pink-500/10 border-pink-500/30 text-pink-400",
  },
];

export default function ListasCollab() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNewList = () => {
    toast("Funcionalidade em breve", {
      description: "Em breve você poderá criar listas colaborativas com seus amigos!",
    });
  };

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref="/" onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-28 pb-16">
        <div className="container max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-wider text-primary">LISTAS COLLAB</h2>
                <p className="text-sm text-muted-foreground">{mockLists.length} listas criadas</p>
              </div>
            </div>
            <Button onClick={handleNewList} size="sm" className="font-display tracking-wider glow-amber">
              <Plus className="w-4 h-4 mr-1" /> NOVA
            </Button>
          </div>

          <div className="space-y-4">
            {mockLists.map((list) => (
              <div key={list.id} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                {/* List Header */}
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg tracking-wider text-foreground">{list.name.toUpperCase()}</h3>
                    <span className="text-[10px] text-muted-foreground">{list.places.length} locais</span>
                  </div>
                  {/* Members */}
                  <div className="flex items-center gap-1">
                    {list.members.map((member, i) => (
                      <div key={i} className="w-7 h-7 rounded-full overflow-hidden border-2 border-background -ml-1 first:ml-0">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-2">
                      {list.members.map(m => m.name).join(", ")}
                    </span>
                  </div>
                </div>

                {/* Places */}
                <div className="divide-y divide-border/20">
                  {list.places.map((place) => (
                    <Link key={place.id} href={`/estabelecimento/${place.id}`}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{place.name}</p>
                          <p className="text-[10px] text-muted-foreground">{place.neighborhood}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
