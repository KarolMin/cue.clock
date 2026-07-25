import * as Localization from 'expo-localization';
import { DEFAULT_LANGUAGE, isSupportedLanguage, LanguageCode } from './languages';

// Picks a supported language from the device's own locale list, falling
// back to Polish (the app's native language) when nothing matches.
export function detectLanguage(): LanguageCode {
  try {
    const locales = Localization.getLocales();
    for (const locale of locales) {
      const code = locale.languageCode;
      if (code && isSupportedLanguage(code)) return code;
    }
  } catch {
    // Locale APIs can be unavailable in some environments — fall back below.
  }
  return DEFAULT_LANGUAGE;
}
