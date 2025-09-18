import React from 'react';
import { useAutocomplete } from './useAutocomplete';
import { DEFAULT_CONFIG, DEFAULT_UI, DEFAULT_API, ARIA_ATTRIBUTES, CSS_CLASSES } from './constants';

const defaultFetch = async (q: string, { signal }: { signal?: AbortSignal } = {}) => {
  const res = await fetch(`${DEFAULT_API.ENDPOINT}?query=${encodeURIComponent(q)}&limit=${DEFAULT_API.RESULT_LIMIT}`, { signal });
  if (!res.ok) throw new Error('Network');
  return res.json();
};

const defaultSelectionFetch = async (selectedValue: string, { signal }: { signal?: AbortSignal } = {}) => {
  // Demo implementation - in production, replace with your actual selection API
  const res = await fetch(`${DEFAULT_API.SELECTION_ENDPOINT}?selected=${encodeURIComponent(selectedValue)}&limit=${DEFAULT_API.RESULT_LIMIT}`, { signal });
  if (!res.ok) {
    // Fallback to demo data for development
    console.log(`Selection API called with: ${selectedValue}`);
    return [
      `${selectedValue} related 1`,
      `${selectedValue} related 2`,
      `${selectedValue} variant`,
      `${selectedValue} alternative`,
      `${selectedValue} suggestion`
    ];
  }
  return res.json();
};

interface AutoCompleteProps {
  fetchFn?: typeof defaultFetch;
  selectionFn?: typeof defaultSelectionFetch;
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
  selectionFn = defaultSelectionFetch,
  debounceMs = DEFAULT_CONFIG.DEBOUNCE_MS,
  minChars = DEFAULT_CONFIG.MIN_CHARS,
  placeholder = DEFAULT_UI.PLACEHOLDER,
  onSelect,
  maxResultsNote = true,
  highlightMatch = true,
  clearable = true,
  id = DEFAULT_UI.COMPONENT_ID,
}, ref) => {
  const { state, actions } = useAutocomplete({ fetchFn, selectionFn, debounceMs, minChars });
  const { input, suggestions, loading, error, highlight, noResults } = state;
  const { updateInput, clear, moveHighlight, setHighlightIndex, setSuggestions, handleSelection } = actions;

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const liveRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSelect = React.useCallback(async (word: string) => {
    updateInput(word);
    setSuggestions([]);
    if (onSelect) onSelect(word);
    
    // Call selection API to get related suggestions
    await handleSelection(word);
  }, [onSelect, setSuggestions, updateInput, handleSelection]);

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

  // Debounced live region announcements to reduce verbosity while typing fast
  React.useEffect(() => {
    if (!liveRef.current) return;
    const id = window.setTimeout(() => {
      let msg = '';
      if (loading) msg = 'Loading suggestions';
      else if (error) msg = 'Error loading suggestions';
      else if (noResults) msg = 'No suggestions';
      else if (suggestions.length) msg = `${suggestions.length} suggestion${suggestions.length>1?'s':''} available.`;
      liveRef.current!.textContent = msg;
    }, DEFAULT_CONFIG.LIVE_REGION_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
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
    else if (e.key === 'Enter' && highlight >= 0 && suggestions[highlight]) { handleSelect(suggestions[highlight] as string); e.preventDefault(); }
    else if (e.key === 'Tab' && highlight >= 0 && suggestions[highlight]) {
      handleSelect(suggestions[highlight] as string);
    }
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
    <div className={CSS_CLASSES.AUTOCOMPLETE} ref={wrapperRef}>
      <div className={CSS_CLASSES.INPUT_WRAPPER} role={ARIA_ATTRIBUTES.ROLE_COMBOBOX} aria-haspopup={ARIA_ATTRIBUTES.HASPOPUP} aria-expanded={suggestions.length > 0} aria-controls={`${id}-list`}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => updateInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-autocomplete={ARIA_ATTRIBUTES.AUTOCOMPLETE}
          aria-activedescendant={highlight >= 0 ? `${id}-item-${highlight}` : undefined}
          className={CSS_CLASSES.INPUT}
        />
        {clearable && input && (
          <button
            type="button"
            className={CSS_CLASSES.CLEAR_BUTTON}
            aria-label="Clear input"
            onMouseDown={(e) => { e.preventDefault(); }}
            onClick={() => clear()}
          >×</button>
        )}
      </div>
      <div className={CSS_CLASSES.VISUALLY_HIDDEN} aria-live={ARIA_ATTRIBUTES.LIVE_POLITE} ref={liveRef} />
      {loading && <div className={`${CSS_CLASSES.STATUS}`} aria-live={ARIA_ATTRIBUTES.LIVE_POLITE}>Loading...</div>}
      {error && <div className={`${CSS_CLASSES.STATUS} ${CSS_CLASSES.ERROR}`} aria-live={ARIA_ATTRIBUTES.LIVE_POLITE}>{error}</div>}
      {noResults && !loading && !error && input && (
        <div className={CSS_CLASSES.STATUS} aria-live={ARIA_ATTRIBUTES.LIVE_POLITE}>No suggestions found</div>
      )}
      {suggestions.length > 0 && !loading && (
        <ul id={`${id}-list`} role={ARIA_ATTRIBUTES.ROLE_LISTBOX} className={CSS_CLASSES.SUGGESTIONS} ref={listRef}>
          {suggestions.map((word, idx) => (
            <li
              key={word as string}
              id={`${id}-item-${idx}`}
              role={ARIA_ATTRIBUTES.ROLE_OPTION}
              aria-selected={idx === highlight}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(word as string); }}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`${CSS_CLASSES.SUGGESTION_ITEM} ${idx === highlight ? CSS_CLASSES.HIGHLIGHT : ''}`}
            >
              {renderWord(word as string)}
            </li>
          ))}
          {maxResultsNote && (
            <li className={CSS_CLASSES.SUGGESTION_FOOTER} aria-hidden="true">Showing {suggestions.length} results</li>
          )}
        </ul>
      )}
    </div>
  );
});

Autocomplete.displayName = DEFAULT_UI.DISPLAY_NAME;

export default Autocomplete;
