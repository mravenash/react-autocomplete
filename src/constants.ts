// Autocomplete component constants

// Default configuration values
export const DEFAULT_CONFIG = {
  DEBOUNCE_MS: 300,
  MIN_CHARS: 1,
  MAX_CACHE_SIZE: 50,
  RETRY_ATTEMPTS: 2,
  BACKOFF_BASE_MS: 150,
  LIVE_REGION_DEBOUNCE_MS: 120,
} as const;

// Default UI values
export const DEFAULT_UI = {
  PLACEHOLDER: 'Type a word',
  COMPONENT_ID: 'autocomplete',
  DISPLAY_NAME: 'Autocomplete',
} as const;

// API configuration
export const DEFAULT_API = {
  ENDPOINT: 'https://autocomplete-lyart.vercel.app/api/words',
  SELECTION_ENDPOINT: 'https://autocomplete-lyart.vercel.app/api/selection',
  RESULT_LIMIT: 5,
} as const;

// ARIA and accessibility constants
export const ARIA_ATTRIBUTES = {
  AUTOCOMPLETE: 'list',
  HASPOPUP: 'listbox',
  ROLE_COMBOBOX: 'combobox',
  ROLE_LISTBOX: 'listbox',
  ROLE_OPTION: 'option',
  LIVE_POLITE: 'polite',
} as const;

// CSS class names
export const CSS_CLASSES = {
  AUTOCOMPLETE: 'autocomplete',
  INPUT_WRAPPER: 'ac-input-wrapper',
  INPUT: 'autocomplete-input',
  CLEAR_BUTTON: 'ac-clear-btn',
  SUGGESTIONS: 'suggestions',
  SUGGESTION_ITEM: 'suggestion-item',
  SUGGESTION_FOOTER: 'suggestion-footer',
  HIGHLIGHT: 'highlight',
  STATUS: 'status',
  ERROR: 'error',
  VISUALLY_HIDDEN: 'visually-hidden',
} as const;

// Event types for analytics
export const ANALYTICS_EVENTS = {
  SEARCH: 'search',
  SELECT: 'select',
  ERROR: 'error',
  PERFORMANCE: 'performance',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Connection failed. Check your internet.',
  SERVER: 'Server temporarily unavailable.',
  RATE_LIMITED: 'Too many requests. Please wait.',
  GENERIC: 'Search failed. Please try again.',
} as const;
