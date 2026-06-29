// Design: AvaLyarin — Intelligent search bar with autocomplete dropdown
// Shows up to 4 suggestions + "Todos os resultados" as 5th option
// Uses standard search for short queries, smartSearch (LLM) for natural language
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, X, MapPin, UtensilsCrossed, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SearchResult {
  type: "establishment" | "item-name" | "item-description";
  name: string;
  subtitle: string;
  href: string;
}

/**
 * Determine if a query needs AI interpretation (natural language)
 * Mirrors the server-side logic in smart-search.ts
 */
function needsAiInterpretation(query: string): boolean {
  const words = query.trim().split(/\s+/);
  if (words.length >= 3) return true;
  const nlIndicators = ["de", "do", "da", "com", "para", "perto", "um", "uma", "que", "no", "na", "ao"];
  if (words.some(w => nlIndicators.includes(w.toLowerCase()))) return true;
  return false;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine if we should use AI search
  const useAi = useMemo(() => needsAiInterpretation(debouncedQuery), [debouncedQuery]);

  // Debounce the query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, useAi ? 500 : 300); // Longer debounce for AI queries
    return () => clearTimeout(timer);
  }, [query, useAi]);

  // Standard search (fast LIKE SQL)
  const { data: searchResults, isLoading: isStandardLoading } = trpc.establishments.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 && !useAi }
  );

  // Smart search (LLM-powered, for natural language)
  const { data: smartResults, isLoading: isSmartLoading } = trpc.establishments.smartSearch.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 && useAi }
  );

  const isLoading = isStandardLoading || isSmartLoading;

  // Transform API results into SearchResult format
  const results: SearchResult[] = useMemo(() => {
    const items: SearchResult[] = [];

    if (!useAi && searchResults) {
      // Standard search results
      for (const est of searchResults.establishments) {
        items.push({
          type: "establishment",
          name: est.name,
          subtitle: `${est.categoryName} • ${est.neighborhood || ""}`,
          href: `/estabelecimento/${est.slug}`,
        });
      }
      for (const item of searchResults.menuItemsByName) {
        items.push({
          type: "item-name",
          name: item.name,
          subtitle: `${item.establishmentName} • R$ ${Number(item.price).toFixed(2)}`,
          href: `/estabelecimento/${item.establishmentSlug}`,
        });
      }
      for (const item of searchResults.menuItemsByDescription) {
        items.push({
          type: "item-description",
          name: item.name,
          subtitle: `${item.establishmentName} • R$ ${Number(item.price).toFixed(2)}`,
          href: `/estabelecimento/${item.establishmentSlug}`,
        });
      }
    } else if (useAi && smartResults) {
      // Smart search results
      for (const est of smartResults.establishments) {
        items.push({
          type: "establishment",
          name: est.name,
          subtitle: `${est.categoryName} • ${est.neighborhood || ""}`,
          href: `/estabelecimento/${est.slug}`,
        });
      }
      for (const item of smartResults.menuItems) {
        items.push({
          type: "item-name",
          name: item.name,
          subtitle: `${item.establishmentName} • ${item.price ? `R$ ${Number(item.price).toFixed(2)}` : ""}`,
          href: `/estabelecimento/${item.establishmentSlug}`,
        });
      }
    }

    return items;
  }, [useAi, searchResults, smartResults]);

  const suggestions = results.slice(0, 4);
  const totalResults = results.length;
  const aiInterpretation = useAi && smartResults?.interpretation;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setIsOpen(e.target.value.length >= 2);
  }

  function handleFocus() {
    setIsFocused(true);
    if (query.length >= 2) setIsOpen(true);
  }

  function handleSuggestionClick(href: string) {
    setIsOpen(false);
    setQuery("");
    navigate(href);
  }

  function handleAllResults() {
    setIsOpen(false);
    navigate(`/busca?q=${encodeURIComponent(query)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && query.length >= 2) {
      setIsOpen(false);
      navigate(`/busca?q=${encodeURIComponent(query)}`);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function clearSearch() {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
          isFocused
            ? "border-primary/50 bg-background shadow-lg shadow-primary/5"
            : "border-border/50 bg-secondary/50"
        }`}
      >
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder="Buscar bar, prato ou drink..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {isLoading && debouncedQuery.length >= 2 && (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
        )}
        {query && !isLoading && (
          <button onClick={clearSearch} className="p-0.5 rounded hover:bg-secondary transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/50 bg-background shadow-xl shadow-black/20 overflow-hidden z-[100]">
          {/* AI interpretation badge */}
          {aiInterpretation && (
            <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/5 border-b border-violet-500/20">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-violet-300 italic">
                {aiInterpretation}
              </span>
            </div>
          )}

          {/* Loading state for AI */}
          {isLoading && suggestions.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-4">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">
                {useAi ? "IA interpretando sua busca..." : "Buscando..."}
              </span>
            </div>
          )}

          {suggestions.map((result, i) => (
            <button
              key={`${result.href}-${result.name}-${i}`}
              onClick={() => handleSuggestionClick(result.href)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/80 transition-colors text-left border-b border-border/20 last:border-b-0"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                {result.type === "establishment" ? (
                  <MapPin className="w-4 h-4 text-primary" />
                ) : (
                  <UtensilsCrossed className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{result.name}</p>
                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
              </div>
              {result.type === "establishment" && (
                <span className="text-[10px] text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                  LOCAL
                </span>
              )}
              {result.type === "item-name" && (
                <span className="text-[10px] text-emerald-400/70 bg-emerald-400/10 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                  ITEM
                </span>
              )}
              {result.type === "item-description" && (
                <span className="text-[10px] text-blue-400/70 bg-blue-400/10 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                  DESC
                </span>
              )}
              {/* AI badge on each result when smart search is active */}
              {useAi && smartResults?.isAiPowered && (
                <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
              )}
            </button>
          ))}

          {/* "Todos os resultados" option */}
          {suggestions.length > 0 && (
            <button
              onClick={handleAllResults}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Todos os resultados
                </span>
                <span className="text-xs text-muted-foreground">
                  ({totalResults} {totalResults === 1 ? "resultado" : "resultados"})
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && debouncedQuery.length >= 2 && !isLoading && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/50 bg-background shadow-xl shadow-black/20 overflow-hidden z-[100]">
          <div className="px-4 py-6 text-center">
            <Search className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum resultado para "{query}"
            </p>
            {useAi && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                A IA não encontrou resultados para sua busca
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
