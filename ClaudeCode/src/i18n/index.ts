import zhData from './locales/zh.json';
import enData from './locales/en.json';

export const SUPPORTED_LANGUAGES = {
  zh: { name: '中文', flag: '🇨🇳' },
  en: { name: 'English', flag: '🇺🇸' },
} as const;

export type Locale = keyof typeof SUPPORTED_LANGUAGES;
export type TranslationParams = Record<string, string | number>;

interface LocaleData {
  [key: string]: unknown;
}

const localeMap: Record<Locale, LocaleData> = {
  zh: zhData,
  en: enData,
};

let currentLocale: Locale = (localStorage.getItem('locale') as Locale) || getDefaultLocale();

function getDefaultLocale(): Locale {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as Locale;
  }
  return 'zh';
}

export function getCurrentLocale(): Locale {
  return currentLocale;
}

export async function setLocale(locale: Locale): Promise<void> {
  if (!(locale in SUPPORTED_LANGUAGES)) {
    locale = 'zh';
  }

  currentLocale = locale;
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;
}

export function getSupportedLocales(): Array<{ code: Locale; name: string; flag: string }> {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => ({
    code: code as Locale,
    name,
    flag,
  }));
}

export function tSync(path: string, params: TranslationParams = {}): string {
  const localeData = localeMap[currentLocale];
  return translatePath(localeData, path, params);
}

export function tRaw(path: string): unknown {
  const localeData = localeMap[currentLocale];
  return resolvePath(localeData, path);
}

function resolvePath(localeData: LocaleData, path: string): unknown {
  const keys = path.split('.');
  let result: unknown = localeData;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in (result as Record<string, unknown>)) {
      result = (result as Record<string, unknown>)[key];
    } else {
      console.warn(`Translation not found: ${path}`);
      return null;
    }
  }

  return result;
}

function translatePath(localeData: LocaleData, path: string, params: TranslationParams): string {
  const result = resolvePath(localeData, path);

  if (typeof result !== 'string') {
    console.warn(`Translation is not a string: ${path}`);
    return path;
  }

  return result.replace(/\{(\w+)\}/g, (_match: string, param: string) => {
    return params[param]?.toString() || _match;
  });
}

export async function preloadAllLocales(): Promise<void> {
  // Locales are imported statically — no async loading needed.
}