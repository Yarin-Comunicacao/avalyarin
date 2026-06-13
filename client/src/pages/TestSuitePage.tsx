import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Crown, ArrowLeft, Search, Filter, CheckCircle2, TestTube, Clock, FileCode
} from "lucide-react";
import { useState, useMemo } from "react";
import testSuite from "@/data/test-suite.json";

interface TestItem {
  id: number;
  file: string;
  module: string;
  group: string;
  name: string;
  functionality: string;
  status: string;
  duration: number;
}

const tests: TestItem[] = testSuite as TestItem[];

export default function TestSuitePage() {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<string>("all");

  // Extract unique modules and files
  const modules = useMemo(() => {
    const set = new Set(tests.map(t => t.module));
    return Array.from(set).sort();
  }, []);

  const files = useMemo(() => {
    const set = new Set(tests.map(t => t.file));
    return Array.from(set).sort();
  }, []);

  // Filter tests
  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      const matchesSearch = searchQuery === "" ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.functionality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.group.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = selectedModule === "all" || t.module === selectedModule;
      const matchesFile = selectedFile === "all" || t.file === selectedFile;
      return matchesSearch && matchesModule && matchesFile;
    });
  }, [searchQuery, selectedModule, selectedFile]);

  // Stats
  const totalDuration = useMemo(() => {
    return tests.reduce((sum, t) => sum + t.duration, 0);
  }, []);

  const moduleStats = useMemo(() => {
    const map: Record<string, number> = {};
    tests.forEach(t => {
      map[t.module] = (map[t.module] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground">Apenas o Owner pode acessar esta página.</p>
          <Link href="/">
            <span className="text-primary hover:underline mt-4 inline-block">Voltar ao início</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-900/30 to-background border-b border-border/30">
        <div className="container px-4 pt-6 pb-4">
          <Link href="/owner/sistema">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Sistema
            </span>
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <TestTube className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wider text-foreground">SUITE DE TESTES</h1>
              <p className="text-sm text-muted-foreground">
                {tests.length} testes • {(totalDuration / 1000).toFixed(1)}s tempo total
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{tests.length}</p>
            <p className="text-xs text-muted-foreground">Total Testes</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">{modules.length}</p>
            <p className="text-xs text-muted-foreground">Módulos</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">{files.length}</p>
            <p className="text-xs text-muted-foreground">Arquivos</p>
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{(totalDuration / 1000).toFixed(1)}s</p>
            <p className="text-xs text-muted-foreground">Duração Total</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, funcionalidade ou grupo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-green-500/50"
            />
          </div>

          {/* Filter Row */}
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Filtros:</span>
            </div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="text-xs bg-card border border-border/50 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-green-500/50"
            >
              <option value="all">Todos os módulos ({modules.length})</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="text-xs bg-card border border-border/50 rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:border-green-500/50"
            >
              <option value="all">Todos os arquivos ({files.length})</option>
              {files.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Active filter info */}
          {(selectedModule !== "all" || selectedFile !== "all" || searchQuery) && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Mostrando {filteredTests.length} de {tests.length} testes
              </p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedModule("all"); setSelectedFile("all"); }}
                className="text-xs text-green-400 hover:text-green-300"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Module Summary (collapsed by default) */}
        <details className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors">
            📊 Resumo por Módulo ({moduleStats.length} módulos)
          </summary>
          <div className="px-4 pb-4 space-y-1.5 max-h-60 overflow-y-auto">
            {moduleStats.map(([mod, count]) => (
              <div key={mod} className="flex items-center justify-between py-1">
                <span className="text-xs text-muted-foreground truncate max-w-[70%]">{mod}</span>
                <span className="text-xs font-medium text-foreground">{count} testes</span>
              </div>
            ))}
          </div>
        </details>

        {/* Test List */}
        <div className="space-y-2">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-card border border-border/50 rounded-xl p-3 hover:border-green-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">#{test.id}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                      {test.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{test.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{test.functionality}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                      <FileCode className="w-3 h-3" />
                      {test.file}
                    </span>
                    <span className="text-xs text-purple-400">{test.module}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {test.duration < 1000 ? `${test.duration.toFixed(0)}ms` : `${(test.duration / 1000).toFixed(2)}s`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <TestTube className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum teste encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
}
