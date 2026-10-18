'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  setStoredLanguage,
  t,
  TranslationKey,
} from '@/lib/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
  languages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: TranslationKey) => t(key, DEFAULT_LANGUAGE),
  languages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(getStoredLanguage());

    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail) {
        setLanguageState(customEvent.detail);
      } else {
        setLanguageState(getStoredLanguage());
      }
    };

    window.addEventListener('finova-language-changed', handleLanguageChange);
    return () => {
      window.removeEventListener('finova-language-changed', handleLanguageChange);
    };
  }, []);

  const changeLanguage = (lang: SupportedLanguage) => {
    setStoredLanguage(lang);
    setLanguageState(lang);
  };

  const translate = (key: TranslationKey) => {
    return t(key, language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t: translate,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}
