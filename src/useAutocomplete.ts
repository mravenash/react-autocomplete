import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_CONFIG } from './constants';

export interface UseAutocompleteParams<T = string> {
  fetchFn: (q: string, opts?: { signal?: AbortSignal }) => Promise<T[]> | Promise<any>;
  selectionFn?: (selectedValue: string, opts?: { signal?: AbortSignal }) => Promise<T[]> | Promise<any>;
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
    handleSelection: (value: string) => Promise<void>;
  };
}

export function useAutocomplete<T = string>({
  fetchFn,
  selectionFn,
  debounceMs = DEFAULT_CONFIG.DEBOUNCE_MS,
  minChars = DEFAULT_CONFIG.MIN_CHARS,
  maxCache = DEFAULT_CONFIG.MAX_CACHE_SIZE,
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
  const cacheRef = useRef<Map<string, T[]>>(new Map()); // keys stored lowercase for normalization
  const lastSuggestionsSizeRef = useRef<number>(0);

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

    const key = q.toLowerCase();
    if (cacheRef.current.has(key)) {
      const data = cacheRef.current.get(key)!;
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
      const maxAttempts = DEFAULT_CONFIG.RETRY_ATTEMPTS;
      const backoffBase = DEFAULT_CONFIG.BACKOFF_BASE_MS;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const data = await fetchFn(q, { signal: controller.signal });
          if (controller.signal.aborted) return;
          const arr: T[] = Array.isArray(data) ? data as T[] : [];
          cacheRef.current.set(key, arr);
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

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query, debounceMs, fetchFn, maxCache]);

  // Reset highlight if suggestions size changes and current highlight out of range
  useEffect(() => {
    if (highlight >= suggestions.length) {
      setHighlight(-1);
    }
    lastSuggestionsSizeRef.current = suggestions.length;
  }, [suggestions, highlight]);

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

  const handleSelection = useCallback(async (value: string) => {
    if (!selectionFn) return;
    
    setLoading(true);
    setError(null);
    setNoResults(false);
    
    const controller = new AbortController();
    abortRef.current = controller;
    
    try {
      const data = await selectionFn(value, { signal: controller.signal });
      if (controller.signal.aborted) return;
      
      const arr: T[] = Array.isArray(data) ? data as T[] : [];
      setSuggestions(arr);
      setNoResults(arr.length === 0);
      setLoading(false);
      setHighlight(-1);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError('Failed to fetch related suggestions');
      setSuggestions([]);
      setLoading(false);
    }
  }, [selectionFn]);

  return {
    state: { input, query, suggestions, loading, error, highlight, noResults },
    actions: { updateInput, clear, moveHighlight, setHighlightIndex, setSuggestions, handleSelection },
  };
}
