import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  type Locale,
  detectLocaleFromPath,
  localePath as localePathFn,
  getAlternateUrl as getAlternateUrlFn,
} from '@/lib/i18nRoutes';
import { normalizeToSlug } from '@/lib/slugUtils';

// Cache version – bump when translations change in DB
const TRANSLATIONS_VERSION = '1.0.0';

/** Shape stored in context */
interface LanguageContextValue {
  locale: Locale;
  /** Translate a Spanish text to the active locale */
  t: (spanishText: string) => string;
  /** Build a locale-aware path from an ES canonical path */
  localePath: (esPath: string) => string;
  /** Translate a Spanish city name into a slug for the active locale */
  translateCitySlug: (cityNameES: string) => string;
  /** Get the alternate URL for hreflang */
  getAlternateUrl: (currentPath: string, targetLocale: Locale) => string;
  /** Format a date according to locale */
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  /** Format a price according to locale */
  formatPrice: (amount: number, currency?: string) => string;
  /** Whether translations have loaded */
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Map: spanish_text → english_text (lowercased key for case-insensitive lookup) */
type TranslationMap = Map<string, string>;

function buildTranslationMap(rows: { spanish_text: string; english_text: string }[]): TranslationMap {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.spanish_text, row.english_text);
  }
  return map;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const locale = detectLocaleFromPath(pathname);

  // Persist preference
  useEffect(() => {
    try {
      localStorage.setItem('preferredLanguage', locale);
    } catch {
      // SSR / private browsing – ignore
    }
  }, [locale]);

  // Load translations (only needed for EN; ES texts are hardcoded in components)
  const { data: translationMap, isSuccess } = useQuery({
    queryKey: ['tm_translations', TRANSLATIONS_VERSION],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tm_translations')
        .select('spanish_text, english_text');
      if (error) throw error;
      return buildTranslationMap(data ?? []);
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 h
    gcTime: 48 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // ---- Memoised helpers ----

  const t = useCallback(
    (spanishText: string): string => {
      if (locale === 'es' || !translationMap) return spanishText;
      return translationMap.get(spanishText) ?? spanishText;
    },
    [locale, translationMap],
  );

  const lp = useCallback(
    (esPath: string) => localePathFn(esPath, locale),
    [locale],
  );

  const translateCitySlug = useCallback(
    (cityNameES: string): string => {
      if (locale === 'es' || !translationMap) return normalizeToSlug(cityNameES);
      const translated = translationMap.get(cityNameES);
      return normalizeToSlug(translated ?? cityNameES);
    },
    [locale, translationMap],
  );

  const getAlt = useCallback(
    (currentPath: string, targetLocale: Locale) => getAlternateUrlFn(currentPath, targetLocale),
    [],
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const defaults: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return new Intl.DateTimeFormat(
        locale === 'es' ? 'es-ES' : 'en-US',
        options ?? defaults,
      ).format(d);
    },
    [locale],
  );

  const formatPrice = useCallback(
    (amount: number, currency = 'EUR'): string =>
      new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount),
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      t,
      localePath: lp,
      translateCitySlug,
      getAlternateUrl: getAlt,
      formatDate,
      formatPrice,
      isReady: locale === 'es' || isSuccess,
    }),
    [locale, t, lp, translateCitySlug, getAlt, formatDate, formatPrice, isSuccess],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/**
 * Hook to consume the i18n context.
 * Must be used inside <LanguageProvider>.
 */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
