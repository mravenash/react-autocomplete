
# Autocomplete App

Advanced, accessible React + TypeScript autocomplete component with debounced fetching, caching, retry, keyboard control, and theming.

## Key Features

- TypeScript + strict mode
- Debounced remote fetching with AbortController
- Lightweight in‑memory LRU style cache (size bounded)
- Retry with incremental backoff (2 attempts)
- Keyboard navigation (Arrow Up/Down, Home/End, Enter, Tab, Escape)
- Accessible combobox pattern (aria-* attributes, live region announcements)
- Highlighted substring matches via `<mark>`
- Clear button, empty / error / loading states
- Dark mode friendly styling (prefers-color-scheme)
- Fully controlled via a reusable `useAutocomplete` hook

## Quick Start

```sh
npm install
npm start
```
Visit: http://localhost:3000

## Core Files

| File | Purpose |
|------|---------|
| `src/AutoComplete.tsx` | Autocomplete component (UI + accessibility) |
| `src/useAutocomplete.ts` | Logic hook: debounce, fetch, cache, retry, highlighting state |
| `src/AutoComplete.css` | Component styles (light/dark, animations, focus) |
| `src/App.tsx` | Demo usage |
| `src/App.test.tsx` | Basic render test |

## Component Props (`AutoComplete`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fetchFn` | `(query: string, opts?: { signal?: AbortSignal }) => Promise<string[]>` | Built‑in default API fetch | Async data source; must return an array |
| `debounceMs` | `number` | `300` | Delay before firing fetch after input stops |
| `minChars` | `number` | `1` | Minimum characters before querying |
| `placeholder` | `string` | `"Type a word"` | Input placeholder text |
| `onSelect` | `(value: string) => void` | `undefined` | Callback when a suggestion is chosen |
| `maxResultsNote` | `boolean` | `true` | Show footer line with result count |
| `highlightMatch` | `boolean` | `true` | Wrap matching substring in `<mark>` |
| `clearable` | `boolean` | `true` | Show clear (×) button when there is input |
| `id` | `string` | `"autocomplete"` | Base id for ARIA attributes |

## Hook API (`useAutocomplete`)

```ts
const { state, actions } = useAutocomplete({
	fetchFn,          // required
	debounceMs: 300,
	minChars: 1,
	maxCache: 50,
});

state: {
	input: string;
	query: string;
	suggestions: string[];
	loading: boolean;
	error: string | null;
	highlight: number;      // index of highlighted suggestion
	noResults: boolean;
}

actions: {
	updateInput(val: string): void;
	clear(): void;
	moveHighlight(delta: number): void;
	setHighlightIndex(idx: number): void;
	setSuggestions(s: string[]): void; // rarely needed externally
}
```

## Accessibility Notes

- Uses wrapper `role="combobox"` with `aria-haspopup="listbox"` and dynamic `aria-expanded`.
- Input uses `aria-activedescendant` to link highlighted suggestion.
- Results list uses `role="listbox"` / `role="option"` semantics.
- Live region announces loading / counts / empty state.
- Escape key behavior: first closes list, second clears input.

## Theming

Relies on CSS variables and `prefers-color-scheme: dark`; customize by overriding selectors in `AutoComplete.css`.

## Example Custom Fetch

```ts
const myFetch = async (q: string, { signal }: { signal?: AbortSignal } = {}) => {
	const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal });
	if (!res.ok) throw new Error('Network');
	return res.json(); // must be an array
};

<AutoComplete fetchFn={myFetch} minChars={2} onSelect={(v) => console.log(v)} />
```

## Testing

Run the test suite:
```sh
npm test -- --watchAll=false
```

## Production Build

```sh
npm run build
```
Outputs optimized assets to `build/`.

## License
MIT
