import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Camera, CheckCircle2, ImagePlus, Loader2, MapPin, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { extractCoordinatesFromGoogleMapsUrl, extractNameFromGoogleMapsUrl } from "@/lib/googleMapsUrl";
import { createEmptyOpeningHours, formatOpeningHours, type DailyOpeningHours, WEEKDAYS } from "@shared/opening-hours";

const MAX_PHOTOS = 50;
const MAX_BRAND_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type SelectedPhoto = { file: File; preview: string };
type UploadedPhoto = { url: string; key?: string };
type BrandAssetType = "cover" | "logo";

function safePreviewUrl(preview: string): string {
  return preview.startsWith("blob:") ? encodeURI(preview) : "";
}

export default function SmartEstablishmentForm() {
  const [, navigate] = useLocation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialCategoryId = Number(params.get("categoryId") || 0);

  const [name, setName] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [openingHours, setOpeningHours] = useState<DailyOpeningHours[]>(createEmptyOpeningHours);
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategoryId ? String(initialCategoryId) : "");
  const [coverImage, setCoverImage] = useState<SelectedPhoto | null>(null);
  const [logo, setLogo] = useState<SelectedPhoto | null>(null);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingBrandAsset, setUploadingBrandAsset] = useState<BrandAssetType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = trpc.admin.categoriesWithCounts.useQuery();
  const createMutation = trpc.admin.createSmartEstablishment.useMutation();

  const addPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const accepted = incoming.slice(0, remaining).filter(file => file.type.startsWith("image/"));
    if (incoming.length > remaining) toast.warning(`Só é possível enviar ${MAX_PHOTOS} fotos por cardápio.`);
    if (accepted.length < incoming.length && incoming.some(file => !file.type.startsWith("image/"))) {
      toast.error("Use apenas arquivos de imagem.");
    }
    const next = accepted.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos(previous => [...previous, ...next]);
    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(previous => {
      const photo = previous[index];
      if (photo) URL.revokeObjectURL(photo.preview);
      return previous.filter((_, photoIndex) => photoIndex !== index);
    });
  };

  const selectBrandAsset = (event: React.ChangeEvent<HTMLInputElement>, assetType: BrandAssetType) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Use apenas arquivos de imagem.");
      return;
    }
    if (file.size > MAX_BRAND_FILE_SIZE_BYTES) {
      toast.error("A imagem principal e a logo podem ter no máximo 5 MB.");
      return;
    }

    const nextAsset = { file, preview: URL.createObjectURL(file) };
    const setAsset = assetType === "cover" ? setCoverImage : setLogo;
    setAsset(previous => {
      if (previous) URL.revokeObjectURL(previous.preview);
      return nextAsset;
    });
  };

  const removeBrandAsset = (assetType: BrandAssetType) => {
    const setAsset = assetType === "cover" ? setCoverImage : setLogo;
    setAsset(previous => {
      if (previous) URL.revokeObjectURL(previous.preview);
      return null;
    });
  };

  const enrichFromGoogleMapsUrl = () => {
    const mapName = extractNameFromGoogleMapsUrl(googleMapsUrl);
    const coordinates = extractCoordinatesFromGoogleMapsUrl(googleMapsUrl);
    if (!mapName && !coordinates) {
      toast.info("O link não expõe nome ou coordenadas. Você pode preencher os dados manualmente ou configurar uma fonte de enriquecimento.");
      return;
    }

    if (mapName) setName(current => current || mapName);
    if (coordinates) {
      setLat(current => current || coordinates.lat.toFixed(7));
      setLng(current => current || coordinates.lng.toFixed(7));
    }
    toast.success("Dados disponíveis no link foram preenchidos. Revise antes de salvar.");
  };

  const enrichFromInstagramUrl = () => {
    toast.info("A leitura automática do Instagram será ativada após a configuração da integração Meta.");
  };

  const updateOpeningHour = (day: number, changes: Partial<DailyOpeningHours>) => {
    setOpeningHours(current => current.map(row => row.day === day ? { ...row, ...changes } : row));
  };

  const toOptionalCoordinate = (value: string): number | undefined => {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const uploadPhoto = async (photo: SelectedPhoto, index: number): Promise<UploadedPhoto> => {
    setUploadingIndex(index);
    const response = await fetch("/api/upload-menu-image", {
      method: "POST",
      headers: { "Content-Type": photo.file.type || "image/jpeg", "X-File-Name": photo.file.name },
      body: photo.file,
      credentials: "include",
    });
    setUploadingIndex(null);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Falha no upload da foto ${index + 1}`);
    }
    return response.json();
  };

  const uploadBrandAsset = async (asset: SelectedPhoto, assetType: BrandAssetType): Promise<string> => {
    setUploadingBrandAsset(assetType);
    try {
      const response = await fetch(assetType === "cover" ? "/api/upload-cover" : "/api/upload-logo", {
        method: "POST",
        headers: { "Content-Type": asset.file.type || "image/jpeg", "X-File-Name": asset.file.name },
        body: asset.file,
        credentials: "include",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Falha no upload da ${assetType === "cover" ? "imagem principal" : "logo"}`);
      }
      const payload = await response.json();
      return payload.url;
    } finally {
      setUploadingBrandAsset(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !googleMapsUrl.trim() || !instagram.trim() || !categoryId || photos.length === 0) {
      toast.error("Preencha os campos obrigatórios e adicione pelo menos uma foto.");
      return;
    }

    setIsSubmitting(true);
    try {
      const image = coverImage ? await uploadBrandAsset(coverImage, "cover") : undefined;
      const logoUrl = logo ? await uploadBrandAsset(logo, "logo") : undefined;
      const uploaded: UploadedPhoto[] = [];
      for (let index = 0; index < photos.length; index++) {
        uploaded.push(await uploadPhoto(photos[index], index));
      }

      const result = await createMutation.mutateAsync({
        name: name.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        instagram: instagram.trim(),
        facebook: facebook.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
        addressNumber: addressNumber.trim() || undefined,
        complement: complement.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        region: region.trim() || undefined,
        city: city.trim() || undefined,
        lat: toOptionalCoordinate(lat),
        lng: toOptionalCoordinate(lng),
        openingHours,
        phone: phone.trim() || undefined,
        image,
        logo: logoUrl,
        categoryId: Number(categoryId),
        photos: uploaded,
      });

      toast.success(`Estabelecimento criado com ${result.categories} seções e ${result.items} itens.`);
      navigate(`/admin/estab/${result.establishmentId}`);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível criar o estabelecimento.");
    } finally {
      setUploadingIndex(null);
      setUploadingBrandAsset(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate("/admin/negocio")} className="p-2 rounded-lg hover:bg-secondary/50">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-display text-2xl tracking-wider text-foreground">NOVO ESTABELECIMENTO</h1>
          <p className="text-sm text-muted-foreground">Fotografe o cardápio e preserve as seções do papel.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4">
          <div>
            <h2 className="font-display text-lg tracking-wider">FONTES PARA ENRIQUECIMENTO</h2>
            <p className="text-xs text-muted-foreground mt-1">Cole os links primeiro. Cada fonte tem sua própria ação de enriquecimento.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Google Maps *
                <input type="url" value={googleMapsUrl} onChange={e => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" required />
              </label>
              <button type="button" onClick={enrichFromGoogleMapsUrl} disabled={!googleMapsUrl.trim() || isSubmitting} className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50">
                <Sparkles className="h-4 w-4" /> Enriquecer dados
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Instagram *
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@perfil ou URL" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" required />
              </label>
              <button type="button" onClick={enrichFromInstagramUrl} disabled={!instagram.trim() || isSubmitting} className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50">
                <Sparkles className="h-4 w-4" /> Enriquecer dados
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
          <div>
            <h2 className="font-display text-lg tracking-wider">DADOS DO ESTABELECIMENTO</h2>
            <p className="text-xs text-muted-foreground mt-1">Confira os dados preenchidos pelas fontes antes de criar o registro no TiDB.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm font-medium">Nome do estabelecimento *
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Espetto Carioca Jardins" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" required />
            </label>
            <label className="text-sm font-medium">Facebook
              <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="URL da página" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Site
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="sm:col-span-2 text-sm font-medium">Categoria do estabelecimento *
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" required disabled={categoriesLoading}>
                <option value="">Selecione uma categoria</option>
                {categories?.map((category: { id: number; name: string }) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-card p-5 space-y-5">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-lg tracking-wider">LOCALIZAÇÃO E FUNCIONAMENTO</h2>
              <p className="text-xs text-muted-foreground mt-1">Preencha ou revise os dados sugeridos antes de salvar o estabelecimento.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm font-medium">Endereço
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex.: Rua dos Pinheiros" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Número
              <input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="Ex.: 123" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Complemento
              <input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Ex.: Loja 4, Piso térreo" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Bairro
              <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Ex.: Pinheiros" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Região
              <input value={region} onChange={e => setRegion(e.target.value)} placeholder="Ex.: Zona Oeste" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Cidade
              <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex.: São Paulo" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Telefone/WhatsApp
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex.: (11) 99999-9999" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Latitude
              <input inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)} placeholder="Ex.: -23.5612463" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Longitude
              <input inputMode="decimal" value={lng} onChange={e => setLng(e.target.value)} placeholder="Ex.: -46.5697117" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" />
            </label>
          </div>
          <div className="space-y-3 border-t border-border/60 pt-5">
            <div>
              <h3 className="text-sm font-semibold">Horário de funcionamento</h3>
              <p className="text-xs text-muted-foreground mt-1">Informe a escala diária. O sistema agrupa automaticamente os dias com o mesmo horário para exibir no front.</p>
            </div>
            <div className="space-y-2">
              {openingHours.map(row => (
                <div key={row.day} className="grid grid-cols-[minmax(108px,1fr)_minmax(90px,1fr)_minmax(90px,1fr)] items-center gap-2 rounded-lg border border-border/60 p-2 sm:grid-cols-[minmax(150px,1fr)_120px_120px]">
                  <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={row.isOpen} onChange={event => updateOpeningHour(row.day, { isOpen: event.target.checked })} /> {WEEKDAYS[row.day]}</label>
                  <input type="time" value={row.opensAt} onChange={event => updateOpeningHour(row.day, { opensAt: event.target.value })} disabled={!row.isOpen} aria-label={`Abertura de ${WEEKDAYS[row.day]}`} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50" />
                  <input type="time" value={row.closesAt} onChange={event => updateOpeningHour(row.day, { closesAt: event.target.value })} disabled={!row.isOpen} aria-label={`Fechamento de ${WEEKDAYS[row.day]}`} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50" />
                </div>
              ))}
            </div>
            {formatOpeningHours(openingHours) && <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary"><strong>Como aparecerá no app:</strong> {formatOpeningHours(openingHours)}</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
          <div>
            <h2 className="font-display text-lg tracking-wider">IDENTIDADE VISUAL</h2>
            <p className="text-xs text-muted-foreground mt-1">Opcional. A foto de fundo e a logo são enviadas separadamente ao R2 e não entram na leitura do cardápio.</p>
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={event => selectBrandAsset(event, "cover")} className="hidden" />
          <input ref={logoInputRef} type="file" accept="image/*" onChange={event => selectBrandAsset(event, "logo")} className="hidden" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Foto de fundo</p>
              <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-dashed border-primary/40 bg-primary/5">
                {coverImage ? <>
                  <img src={safePreviewUrl(coverImage.preview)} alt="Prévia da foto de fundo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeBrandAsset("cover")} disabled={isSubmitting} className="absolute right-2 top-2 rounded-md bg-black/65 p-2 text-white hover:bg-red-600 disabled:opacity-50" aria-label="Remover foto de fundo"><Trash2 className="w-4 h-4" /></button>
                  {uploadingBrandAsset === "cover" && <div className="absolute inset-0 grid place-items-center bg-black/55"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}
                </> : <button type="button" onClick={() => coverInputRef.current?.click()} disabled={isSubmitting} className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center hover:bg-primary/10 disabled:opacity-50"><ImagePlus className="w-7 h-7 text-primary" /><span className="text-sm font-medium">Adicionar foto de fundo</span><span className="text-xs text-muted-foreground">Formato horizontal recomendado</span></button>}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Logo</p>
              <div className="relative aspect-square max-w-52 overflow-hidden rounded-xl border border-dashed border-primary/40 bg-primary/5">
                {logo ? <>
                  <img src={safePreviewUrl(logo.preview)} alt="Prévia da logo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeBrandAsset("logo")} disabled={isSubmitting} className="absolute right-2 top-2 rounded-md bg-black/65 p-2 text-white hover:bg-red-600 disabled:opacity-50" aria-label="Remover logo"><Trash2 className="w-4 h-4" /></button>
                  {uploadingBrandAsset === "logo" && <div className="absolute inset-0 grid place-items-center bg-black/55"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}
                </> : <button type="button" onClick={() => logoInputRef.current?.click()} disabled={isSubmitting} className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center hover:bg-primary/10 disabled:opacity-50"><ImagePlus className="w-7 h-7 text-primary" /><span className="text-sm font-medium">Adicionar logo</span><span className="text-xs text-muted-foreground">Formato quadrado recomendado</span></button>}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg tracking-wider">FOTOS DO CARDÁPIO *</h2>
              <p className="text-xs text-muted-foreground mt-1">Até {MAX_PHOTOS} fotos. As seções serão lidas na ordem e preservadas como aparecem no cardápio.</p>
            </div>
            <span className="text-sm font-numbers text-primary">{photos.length}/{MAX_PHOTOS}</span>
          </div>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={addPhotos} className="hidden" />
          <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" />
          <div className="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center">
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={photos.length >= MAX_PHOTOS || isSubmitting} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-primary/30 bg-background/60 px-3 py-4 hover:bg-primary/10 transition-colors disabled:opacity-50">
                <Camera className="w-7 h-7 text-primary" />
                <span className="font-medium text-sm">Abrir câmera</span>
                <span className="text-[11px] text-muted-foreground">Fotografar agora</span>
              </button>
              <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={photos.length >= MAX_PHOTOS || isSubmitting} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border border-primary/30 bg-background/60 px-3 py-4 hover:bg-primary/10 transition-colors disabled:opacity-50">
                <ImagePlus className="w-7 h-7 text-primary" />
                <span className="font-medium text-sm">Abrir galeria</span>
                <span className="text-[11px] text-muted-foreground">Selecionar fotos</span>
              </button>
            </div>
            <span className="block text-xs text-muted-foreground mt-3">Na galeria, você poderá selecionar várias páginas de uma vez.</span>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <div key={`${photo.file.name}-${index}`} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={photo.preview} alt={`Página ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 text-white text-xs">
                    <span>Página {index + 1}</span>
                    <button type="button" onClick={() => removePhoto(index)} disabled={isSubmitting} className="p-1 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  {uploadingIndex === index && <div className="absolute inset-0 grid place-items-center bg-black/50"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button type="button" onClick={() => navigate("/admin/negocio")} className="rounded-lg border border-border px-5 py-2.5">Cancelar</button>
          <button type="submit" disabled={isSubmitting || photos.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium disabled:opacity-50">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando {uploadingBrandAsset ? "identidade visual" : uploadingIndex != null ? `foto ${uploadingIndex + 1}/${photos.length}` : "cardápio"}...</> : <><CheckCircle2 className="w-4 h-4" /> Criar estabelecimento e cardápio</>}
          </button>
        </div>
      </form>
    </div>
  );
}
