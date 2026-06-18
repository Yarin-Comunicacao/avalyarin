import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BadgeCheck, Star, Newspaper, BookOpen, FileText, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function CriticProfile() {
  const { user } = useAuth();
  const { data: profile } = trpc.critic.myProfile.useQuery(undefined, { enabled: !!user });
  const { data: ratings } = trpc.critic.myRatings.useQuery({ limit: 5 }, { enabled: !!user });

  const totalRatings = ratings?.length ?? 0;

  return (
    <div className="pb-20">
      {/* Profile Info Section */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar with purple border */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 flex items-center justify-center overflow-hidden border-[3px] border-purple-500 shadow-lg shadow-purple-500/20">
              {user?.name ? (
                <span className="text-2xl font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            {/* Newspaper badge */}
            <div className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-purple-400 drop-shadow-md" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-semibold text-lg text-foreground truncate">
                {profile?.displayName || user?.name || "Crítico"}
              </h2>
              <BadgeCheck className="w-4.5 h-4.5 text-purple-500 flex-shrink-0" />
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                CRÍTICO
              </span>
            </div>

            {profile?.publication && (
              <p className="text-sm text-purple-400 font-medium mt-0.5 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {profile.publication}
              </p>
            )}

            {/* Metrics */}
            <div className="flex items-center gap-3 mt-2">
              <div className="text-center">
                <span className="text-base font-bold text-foreground">{totalRatings}</span>
                <p className="text-[10px] text-muted-foreground">avaliações</p>
              </div>
              {profile?.specialty && (
                <>
                  <div className="w-px h-7 bg-border" />
                  <div className="text-center">
                    <span className="text-xs font-medium text-foreground">{profile.specialty}</span>
                    <p className="text-[10px] text-muted-foreground">especialidade</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        <Link href="/painel-critico">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center cursor-pointer hover:bg-purple-500/20 transition-colors">
            <FileText className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <span className="text-xs font-medium text-purple-400">Painel Crítico</span>
          </div>
        </Link>
        <Link href="/#categorias">
          <div className="p-3 rounded-xl bg-card border border-border/50 text-center cursor-pointer hover:border-purple-500/30 transition-colors">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <span className="text-xs font-medium text-foreground">Avaliar</span>
          </div>
        </Link>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <div className="px-4 mt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Publication Link */}
      {profile?.publicationUrl && (
        <div className="px-4 mt-3">
          <a
            href={profile.publicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver publicação
          </a>
        </div>
      )}
    </div>
  );
}
