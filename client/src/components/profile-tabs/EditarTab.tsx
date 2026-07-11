import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader";
import { Check, X, Loader2 } from "lucide-react";

export default function EditarTab() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setBirthdate(profile.birthdate || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
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

  const nameParts = name.trim().split(/\s+/);
  const hasValidName = nameParts.length >= 2 && nameParts[0].length >= 2;
  const hasValidUsername = username.length >= 3 && !/\s/.test(username);
  const usernameAvailable = usernameCheck?.available !== false || username === profile?.username;

  const hasChanges = profile && (
    name !== (profile.name || "") ||
    username !== (profile.username || "") ||
    birthdate !== (profile.birthdate || "") ||
    email !== (profile.email || "") ||
    phone !== (profile.phone || "")
  );

  const canSave = hasChanges && hasValidName && hasValidUsername && usernameAvailable;

  const handleSave = () => {
    const data: { name?: string; username?: string; birthdate?: string; email?: string; phone?: string } = {};
    if (name !== (profile?.name || "")) data.name = name.trim();
    if (username !== (profile?.username || "")) data.username = username;
    if (birthdate !== (profile?.birthdate || "")) data.birthdate = birthdate;
    if (email !== (profile?.email || "")) data.email = email.trim();
    if (phone !== (profile?.phone || "")) data.phone = phone.trim();
    updateProfile.mutate(data);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Foto de Perfil */}
      <div className="flex flex-col items-center gap-3">
        <ProfilePhotoUploader size="lg" />
        <p className="text-xs text-muted-foreground">Toque para alterar a foto</p>
      </div>

      {/* Nome Completo */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Nome e Sobrenome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: João Silva"
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
        {name && !hasValidName && (
          <p className="text-xs text-red-400 mt-1">Informe nome e sobrenome (mínimo 2 palavras)</p>
        )}
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

      {/* Data de Nascimento */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Data de Nascimento</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
        />
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
