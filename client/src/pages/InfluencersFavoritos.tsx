// Design: AvaLyarin — Influencers Favoritos page
// List of favorite influencers with their visits and orders
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";
import { Heart, MapPin, Calendar, ChevronRight, ChevronDown } from "lucide-react";

interface InfluencerVisit {
  place: string;
  placeId: string;
  date: string;
  ordered: string[];
}

interface Influencer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: string;
  visits: InfluencerVisit[];
}

const mockInfluencers: Influencer[] = [
  {
    id: "1",
    name: "Maria Gastro",
    username: "@mariagastro",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    followers: "45.2k",
    visits: [
      { place: "Cervejaria Nacional", placeId: "cervejaria-nacional", date: "20/04/2026", ordered: ["IPA Artesanal", "Tábua de Frios", "Burger Smash"] },
      { place: "Frigobar Speakeasy", placeId: "frigobar-speakeasy", date: "15/04/2026", ordered: ["Old Fashioned", "Negroni", "Carpaccio"] },
    ],
  },
  {
    id: "2",
    name: "Pedro Drinks",
    username: "@pedrodrinks",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    followers: "32.8k",
    visits: [
      { place: "The Blue Pub", placeId: "the-blue-pub", date: "22/04/2026", ordered: ["Guinness Draught", "Fish & Chips"] },
      { place: "Le Jazz Brasserie", placeId: "le-jazz-brasserie", date: "10/04/2026", ordered: ["Martini Dry", "Bruschetta Trio"] },
    ],
  },
  {
    id: "3",
    name: "Ana Foodie SP",
    username: "@anafoodiesp",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    followers: "78.5k",
    visits: [
      { place: "Melts Gastrobar", placeId: "melts-gastrobar", date: "18/04/2026", ordered: ["Smash Duplo", "Batata Trufada", "Milkshake Nutella"] },
    ],
  },
];

export default function InfluencersFavoritos() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      <Navbar  />
      <div className="pt-28 pb-24">
        <div className="container max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">INFLUENCERS FAVORITOS</h2>
              <p className="text-sm text-muted-foreground">{mockInfluencers.length} influenciadores seguidos</p>
            </div>
          </div>

          <div className="space-y-3">
            {mockInfluencers.map((inf) => (
              <div key={inf.id} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                {/* Influencer Header */}
                <button
                  onClick={() => setExpandedId(prev => prev === inf.id ? null : inf.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-primary/30">
                    <img src={inf.avatar} alt={inf.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-foreground text-sm">{inf.name}</p>
                    <p className="text-xs text-primary">{inf.username}</p>
                    <p className="text-[10px] text-muted-foreground">{inf.followers} seguidores</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{inf.visits.length} visitas</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedId === inf.id ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Visits */}
                {expandedId === inf.id && (
                  <div className="border-t border-border/30 px-4 py-3 space-y-3">
                    {inf.visits.map((visit, i) => (
                      <Link key={i} href={`/estabelecimento/${visit.placeId}`}>
                        <div className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-primary" /> {visit.place}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {visit.date}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {visit.ordered.map((item, j) => (
                              <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {item}
                              </span>
                            ))}
                          </div>
                          <div className="flex justify-end mt-2">
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
