export const SUPPORTED_LANGUAGES = ['pl', 'en', 'de', 'fr', 'es'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = 'pl';

// Each language's own name, for the picker — not translated per-viewer since
// a French speaker still needs to recognize "Deutsch" to pick it.
export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  pl: 'Polski',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
};

export function isSupportedLanguage(code: string): code is LanguageCode {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}
