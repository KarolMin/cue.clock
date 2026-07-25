import { createContext, ReactNode, useContext, useMemo } from 'react';
import { LanguageCode } from './languages';
import { translations, TranslationKey } from './translations';

type TranslateParams = Record<string, string | number>;

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey, params?: TranslateParams) => string;
}

function translate(language: LanguageCode, key: TranslationKey, params?: TranslateParams): string {
  const template = translations[language][key];
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) =>
    name in params ? String(params[name]) : match
  );
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'pl',
  setLanguage: () => {},
  t: (key) => translations.pl[key],
});

interface Props {
  language: LanguageCode;
  onChangeLanguage: (language: LanguageCode) => void;
  children: ReactNode;
}

export function LanguageProvider({ language, onChangeLanguage, children }: Props) {
  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: onChangeLanguage,
      t: (key, params) => translate(language, key, params),
    }),
    [language, onChangeLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  return useContext(LanguageContext);
}
