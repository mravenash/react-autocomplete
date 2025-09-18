import React from 'react';
import { useAutocomplete } from './useAutocomplete';

const defaultFetch = async (q: string, { signal }: { signal?: AbortSignal } = {}) => {
  const res = await fetch(`https://autocomplete-lyart.vercel.app/api/words?query=${encodeURIComponent(q)}&limit=5`, { signal });
  if (!res.ok) throw new Error('Network');
  return res.json();
};

interface AutoCompleteProps {
  fetchFn?: typeof defaultFetch;
  debounceMs?: number;
  minChars?: number;
  placeholder?: string;
  onSelect?: (value: string) => void;
  maxResultsNote?: boolean;
  highlightMatch?: boolean;
  clearable?: boolean;
  id?: string;
}

export interface AutocompleteHandle {
  focus: () => void;
  clear: () => void;
  value: string;
}

const Autocomplete = React.forwardRef<AutocompleteHandle, AutoCompleteProps>(({
  fetchFn = defaultFetch,
  debounceMs = 300,
  minChars = 1,
  placeholder = 'Type a word',
  onSelect,
  maxResultsNote = true,
  highlightMatch = true,
  clearable = true,
  id = 'autocomplete',
}, ref) => {
  const { state, actions } = useAutocomplete({ fetchFn, debounceMs, minChars });
  const { input, suggestions, loading, error, highlight, noResults } = state;
  const { updateInput, clear, moveHighlight, setHighlightIndex, setSuggestions } = actions;

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const liveRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSelect = React.useCallback((word: string) => {
    updateInput(word);
    setSuggestions([]);
    if (onSelect) onSelect(word);
  }, [onSelect, setSuggestions, updateInput]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setHighlightIndex, setSuggestions]);

  React.useEffect(() => {
    if (!liveRef.current) return;
    let msg = '';
    if (loading) msg = 'Loading suggestions';
    else if (error) msg = 'Error loading suggestions';
    else if (noResults) msg = 'No suggestions';
    else if (suggestions.length) msg = `${suggestions.length} suggestion${suggestions.length>1?'s':''} available.`;
    liveRef.current.textContent = msg;
  }, [loading, error, noResults, suggestions]);

  const scrollToItem = React.useCallback((idxParam?: number) => {
    const idx = typeof idxParam === 'number' ? idxParam : highlight;
    if (idx < 0) return;
    if (listRef.current) {
      const el = listRef.current.children[idx] as HTMLElement | undefined;
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { moveHighlight(1); e.preventDefault(); scrollToItem(); }
    else if (e.key === 'ArrowUp') { moveHighlight(-1); e.preventDefault(); scrollToItem(); }
    else if ((e.key === 'Enter' || e.key === 'Tab') && highlight >= 0 && suggestions[highlight]) { handleSelect(suggestions[highlight] as string); e.preventDefault(); }
    else if (e.key === 'Home') { setHighlightIndex(0); scrollToItem(0); e.preventDefault(); }
    else if (e.key === 'End') { setHighlightIndex(suggestions.length -1); scrollToItem(suggestions.length -1); e.preventDefault(); }
    else if (e.key === 'Escape') {
      if (suggestions.length) { setSuggestions([]); setHighlightIndex(-1); }
      else if (input) { clear(); }
    }
  };

  React.useImperativeHandle(ref, () => ({
    focus: () => { inputRef.current?.focus(); },
    clear,
    get value() { return input; }
  }), [clear, input]);

  const renderWord = (word: string) => {
    if (!highlightMatch) return word;
    const idx = word.toLowerCase().indexOf(input.toLowerCase());
    if (idx === -1 || !input) return word;
    return (
      <>
        {word.slice(0, idx)}<mark>{word.slice(idx, idx + input.length)}</mark>{word.slice(idx + input.length)}
      </>
    );
  };

  return (
    <div className="autocomplete" ref={wrapperRef}>
      <div className="ac-input-wrapper" role="combobox" aria-haspopup="listbox" aria-owns={`${id}-list`} aria-expanded={suggestions.length > 0} aria-controls={`${id}-list`}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => updateInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-autocomplete="list"
          /* aria-expanded moved to combobox wrapper */
          aria-activedescendant={highlight >= 0 ? `${id}-item-${highlight}` : undefined}
          className="autocomplete-input"
        />
        {clearable && input && (
          <button
            type="button"
            className="ac-clear-btn"
            aria-label="Clear input"
            onClick={() => clear()}
          >×</button>
        )}
      </div>
      <div className="visually-hidden" aria-live="polite" ref={liveRef} />
      {loading && <div className="status" aria-live="polite">Loading...</div>}
      {error && <div className="status error" aria-live="polite">{error}</div>}
      {noResults && !loading && !error && input && (
        <div className="status" aria-live="polite">No suggestions found</div>
      )}
      {suggestions.length > 0 && !loading && (
        <ul id={`${id}-list`} role="listbox" className="suggestions" ref={listRef}>
          {suggestions.map((word, idx) => (
            <li
              key={word as string}
              id={`${id}-item-${idx}`}
              role="option"
              aria-selected={idx === highlight}
              onMouseDown={() => handleSelect(word as string)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`suggestion-item ${idx === highlight ? 'highlight' : ''}`}
            >
              {renderWord(word as string)}
            </li>
          ))}
          {maxResultsNote && (
            <li className="suggestion-footer" aria-hidden="true">Showing {suggestions.length} results</li>
          )}
        </ul>
      )}
    </div>
  );
});

Autocomplete.displayName = 'Autocomplete';

export default Autocomplete;
