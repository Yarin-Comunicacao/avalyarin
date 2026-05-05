// Design: AvaLyarin — Intelligent search bar with autocomplete dropdown
// Shows up to 4 suggestions + "Todos os resultados" as 5th option
// Searches: establishments by name, items by name, items by description
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Search, X, MapPin, UtensilsCrossed, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SearchResult {
  type: "establishment" | "item-name" | "item-description";
  name: string;
  subtitle: string;
  href: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults } = trpc.establishments.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  // Transform API results into SearchResult format
  const results: SearchResult[] = [];
  if (searchResults) {
    // Priority 1: Establishments by name
    for (const est of searchResults.establishments) {
      results.push({
        type: "establishment",
        name: est.name,
        subtitle: `${est.categoryName} • ${est.neighborhood || ""}`,
        href: `/estabelecimento/${est.slug}`,
      });
    }
    // Priority 2: Menu items by name
    for (const item of searchResults.menuItemsByName) {
      results.push({
        type: "item-name",
        name: item.name,
        subtitle: `${item.establishmentName} • R$ ${Number(item.price).toFixed(2)}`,
        href: `/estabelecimento/${item.establishmentSlug}`,
      });
    }
    // Priority 3: Menu items by description
    for (const item of searchResults.menuItemsByDescription) {
      results.push({
        type: "item-description",
        name: item.name,
        subtitle: `${item.establishmentName} • R$ ${Number(item.price).toFixed(2)}`,
        href: `/estabelecimento/${item.establishmentSlug}`,
      });
    }
  }

  const suggestions = results.slice(0, 4);
  const totalResults = results.length;

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
        {query && (
          <button onClick={clearSearch} className="p-0.5 rounded hover:bg-secondary transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/50 bg-background shadow-xl shadow-black/20 overflow-hidden z-[100]">
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
            </button>
          ))}

          {/* "Todos os resultados" option */}
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
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && debouncedQuery.length >= 2 && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/50 bg-background shadow-xl shadow-black/20 overflow-hidden z-[100]">
          <div className="px-4 py-6 text-center">
            <Search className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum resultado para "{query}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
