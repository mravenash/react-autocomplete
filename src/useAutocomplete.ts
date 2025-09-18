import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAutocompleteParams<T = string> {
  fetchFn: (q: string, opts?: { signal?: AbortSignal }) => Promise<T[]> | Promise<any>;
  debounceMs?: number;
  minChars?: number;
  maxCache?: number;
}

export interface UseAutocompleteState<T = string> {
  input: string;
  query: string;
  suggestions: T[];
  loading: boolean;
  error: string | null;
  highlight: number;
  noResults: boolean;
}

export interface UseAutocompleteReturn<T = string> {
  state: UseAutocompleteState<T>;
  actions: {
    updateInput: (val: string) => void;
    clear: () => void;
    moveHighlight: (delta: number) => void;
    setHighlightIndex: (idx: number) => void;
    setSuggestions: (sugs: T[]) => void;
  };
}

export function useAutocomplete<T = string>({
  fetchFn,
  debounceMs = 300,
  minChars = 1,
  maxCache = 50,
}: UseAutocompleteParams<T>): UseAutocompleteReturn<T> {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(-1);
  const [noResults, setNoResults] = useState(false);

  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, T[]>>(new Map());

  const clear = useCallback(() => {
    setInput('');
    setQuery('');
    setSuggestions([]);
    setHighlight(-1);
    setNoResults(false);
    setError(null);
  }, []);

  const updateInput = useCallback((val: string) => {
    setInput(val);
    setHighlight(-1);
    if (val.length >= minChars) {
      setQuery(val);
    } else {
      setQuery('');
      setSuggestions([]);
      setNoResults(false);
      setError(null);
    }
  }, [minChars]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const q = query.trim();
    if (!q) return;

    if (cacheRef.current.has(q)) {
      const data = cacheRef.current.get(q)!;
      setSuggestions(data);
      setNoResults(data.length === 0);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      setNoResults(false);
      const controller = new AbortController();
      abortRef.current = controller;
      const maxAttempts = 2;
      const backoffBase = 150;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const data = await fetchFn(q, { signal: controller.signal });
          if (controller.signal.aborted) return;
          const arr: T[] = Array.isArray(data) ? data as T[] : [];
          cacheRef.current.set(q, arr);
          if (cacheRef.current.size > maxCache) {
            const first = cacheRef.current.keys().next();
            if (!first.done) {
              cacheRef.current.delete(first.value);
            }
          }
          setSuggestions(arr);
          setNoResults(arr.length === 0);
          setLoading(false);
          return;
        } catch (e) {
          if (controller.signal.aborted) return;
          if (attempt === maxAttempts - 1) {
            setError('Failed to fetch');
            setSuggestions([]);
            setLoading(false);
            return;
          }
          await new Promise(r => setTimeout(r, backoffBase * (attempt + 1)));
        }
      }
    }, debounceMs);

    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query, debounceMs, fetchFn, maxCache]);

  const moveHighlight = useCallback((delta: number) => {
    setHighlight(prev => {
      if (!suggestions.length) return -1;
      let next = prev + delta;
      if (next < 0) next = suggestions.length - 1;
      if (next >= suggestions.length) next = 0;
      return next;
    });
  }, [suggestions]);

  const setHighlightIndex = useCallback((idx: number) => {
    if (idx < -1 || idx >= suggestions.length) return;
    setHighlight(idx);
  }, [suggestions.length]);

  return {
    state: { input, query, suggestions, loading, error, highlight, noResults },
    actions: { updateInput, clear, moveHighlight, setHighlightIndex, setSuggestions },
  };
}
