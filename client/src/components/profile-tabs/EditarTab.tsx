import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader";
import { Check, X, Loader2 } from "lucide-react";

export default function EditarTab() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      utils.auth.me.invalidate();
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar"),
  });

  // Username availability check
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const { data: usernameCheck, isFetching: checkingUsername } = trpc.profile.checkUsername.useQuery(
    { username: debouncedUsername },
    { enabled: debouncedUsername.length >= 3 && debouncedUsername !== profile?.username && !/\s/.test(debouncedUsername) }
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleUsernameChange = (val: string) => {
    setUsername(val.toLowerCase().replace(/[^a-z0-9._]/g, ""));
  };

  const hasValidUsername = username.length >= 3 && !/\s/.test(username);
  const usernameAvailable = usernameCheck?.available !== false || username === profile?.username;

  const hasChanges = profile && (
    username !== (profile.username || "") ||
    email !== (profile.email || "") ||
    phone !== (profile.phone || "")
  );

  const canSave = hasChanges && hasValidUsername && usernameAvailable;

  const handleSave = () => {
    const data: { username?: string; email?: string; phone?: string } = {};
    if (username !== (profile?.username || "")) data.username = username;
    if (email !== (profile?.email || "")) data.email = email.trim();
    if (phone !== (profile?.phone || "")) data.phone = phone.trim();
    updateProfile.mutate(data);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  // Format birthdate for display
  const displayBirthdate = profile?.birthdate
    ? new Date(profile.birthdate + "T12:00:00").toLocaleDateString("pt-BR")
    : "Não informada";

  return (
    <div className="space-y-6">
      {/* Foto de Perfil */}
      <div className="flex flex-col items-center gap-3">
        <ProfilePhotoUploader size="lg" />
        <p className="text-xs text-muted-foreground">Toque para alterar a foto</p>
      </div>

      {/* Nome Completo — somente visualização */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
        <div className="w-full px-3 py-2.5 rounded-lg bg-card/50 border border-border/30 text-sm text-foreground/80">
          {profile?.name || "Não informado"}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Para alterar o nome, acesse Meus Dados</p>
      </div>

      {/* Data de Nascimento — somente visualização */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Data de Nascimento</label>
        <div className="w-full px-3 py-2.5 rounded-lg bg-card/50 border border-border/30 text-sm text-foreground/80">
          {displayBirthdate}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Para alterar, acesse Meus Dados</p>
      </div>

      {/* Username */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Username *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="meu_username"
            className="w-full pl-7 pr-8 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
          {checkingUsername && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
          {!checkingUsername && hasValidUsername && usernameAvailable && username !== profile?.username && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
          )}
          {!checkingUsername && hasValidUsername && !usernameAvailable && username !== profile?.username && (
            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
          )}
        </div>
        {!usernameAvailable && username !== profile?.username && (
          <p className="text-xs text-red-400 mt-1">Username já em uso</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Telefone */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Telefone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!canSave || updateProfile.isPending}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Salvar Alterações
      </button>
    </div>
  );
}
