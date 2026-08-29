import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Não foi possível ler a planilha selecionada."));
    reader.readAsDataURL(file);
  });
}

export default function BulkEstablishmentImport() {
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: Array<{ id: number; name: string; status: string }>; skipped: number; warnings: string[] } | null>(null);
  const templateQuery = trpc.admin.establishmentSpreadsheetTemplate.useQuery(undefined, { enabled: false });
  const bulkMutation = trpc.admin.createEstablishmentsBulk.useMutation();

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (!/\.(xlsx|xls|csv)$/i.test(selected.name)) {
      toast.error("Use uma planilha XLSX, XLS ou CSV.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast.error("A planilha pode ter no máximo 10 MB.");
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const downloadTemplate = async () => {
    try {
      const response = await templateQuery.refetch();
      if (!response.data) throw new Error("Não foi possível gerar o modelo.");
      const bytes = Uint8Array.from(atob(response.data.base64), character => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: response.data.mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = response.data.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível baixar o modelo.");
    }
  };

  const submit = async () => {
    if (!file) {
      toast.error("Selecione uma planilha antes de importar.");
      return;
    }
    try {
      const response = await bulkMutation.mutateAsync({ spreadsheetBase64: await readFileAsBase64(file), spreadsheetFileName: file.name });
      setResult(response);
      toast.success(`${response.created.length} estabelecimento(s) criado(s).`);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível importar os estabelecimentos.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => navigate("/admin/negocio")} className="rounded-lg p-2 hover:bg-secondary/50"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></button>
        <div><h1 className="font-display text-2xl tracking-wider">LOCAL EM MASSA</h1><p className="text-sm text-muted-foreground">Cadastre vários estabelecimentos usando uma planilha estruturada.</p></div>
      </div>
      <section className="space-y-5 rounded-2xl border border-primary/30 bg-card p-5">
        <div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 h-6 w-6 text-primary" /><div><h2 className="font-display text-lg tracking-wider">PLANILHA DE ESTABELECIMENTOS</h2><p className="mt-1 text-xs text-muted-foreground">Use uma linha por estabelecimento. O sistema valida os campos obrigatórios, categoria e nomes duplicados.</p></div></div>
        <button type="button" onClick={downloadTemplate} disabled={templateQuery.isFetching || bulkMutation.isPending} className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"><Download className="h-4 w-4" />{templateQuery.isFetching ? "Gerando modelo..." : "Baixar modelo de planilha"}</button>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={selectFile} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={bulkMutation.isPending} className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 text-center hover:bg-primary/10 disabled:opacity-50"><Upload className="h-8 w-8 text-primary" /><span className="font-medium">Selecionar planilha preenchida</span><span className="text-xs text-muted-foreground">XLSX, XLS ou CSV — máximo de 10 MB</span></button>
        {file && <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm"><span className="font-medium">Arquivo selecionado:</span> {file.name}</div>}
        <button type="button" onClick={submit} disabled={!file || bulkMutation.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50">{bulkMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando estabelecimentos...</> : <><CheckCircle2 className="h-4 w-4" /> Importar locais em massa</>}</button>
      </section>
      {result && <section className="mt-5 space-y-3 rounded-2xl border border-border/60 bg-card p-5"><h2 className="font-display text-lg tracking-wider">RESULTADO DA IMPORTAÇÃO</h2><p className="text-sm text-muted-foreground">Criados: <strong className="text-foreground">{result.created.length}</strong> · Ignorados: <strong className="text-foreground">{result.skipped}</strong></p>{result.created.length > 0 && <div className="space-y-1 text-sm">{result.created.map(item => <div key={item.id} className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="h-4 w-4" /> {item.name} <span className="text-xs text-muted-foreground">({item.status})</span></div>)}</div>}{result.warnings.length > 0 && <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200"><p className="mb-2 font-semibold">Avisos</p>{result.warnings.map((warning, index) => <p key={`${warning}-${index}`}>{warning}</p>)}</div>}<button type="button" onClick={() => navigate("/admin/negocio")} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary/50">Voltar para estabelecimentos</button></section>}
    </div>
  );
}
