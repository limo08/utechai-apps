// Supported languages with their display names
export const SUPPORTED_LANGUAGES = {
  zh: { name: '中文', flag: '🇨🇳' },
  en: { name: 'English', flag: '🇺🇸' },
  ja: { name: '日本語', flag: '🇯🇵' },
  ru: { name: 'Русский', flag: '🇷🇺' },
} as const;

export type Locale = keyof typeof SUPPORTED_LANGUAGES;
export type TranslationPath = string;
export type TranslationParams = Record<string, string | number>;

interface LocaleData {
  [key: string]: any;
}

// Locale cache
const localeCache: Record<Locale, LocaleData | null> = {
  zh: null,
  en: null,
  ja: null,
  ru: null,
};

// Current locale state
let currentLocale: Locale = (localStorage.getItem('locale') as Locale) || getDefaultLocale();

function getDefaultLocale(): Locale {
  const browserLang = navigator.language.split('-')[0];
  if (browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as Locale;
  }
  return 'zh'; // Default to Chinese
}

// Dynamic locale loader
async function loadLocale(locale: Locale): Promise<LocaleData> {
  if (localeCache[locale]) {
    return localeCache[locale]!;
  }

  try {
    const response = await fetch(`/i18n/locales/${locale}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load locale: ${locale}`);
    }
    const data = await response.json();
    localeCache[locale] = data;
    return data;
  } catch (error) {
    console.error(`Error loading locale ${locale}:`, error);
    // Fallback to Chinese if locale loading fails
    if (locale !== 'zh') {
      return loadLocale('zh');
    }
    throw error;
  }
}

// Get current locale
export function getCurrentLocale(): Locale {
  return currentLocale;
}

// Set current locale
export async function setLocale(locale: Locale): Promise<void> {
  if (!(locale in SUPPORTED_LANGUAGES)) {
    console.warn(`Unsupported locale: ${locale}. Falling back to 'zh'.`);
    locale = 'zh';
  }

  currentLocale = locale;
  localStorage.setItem('locale', locale);
  document.documentElement.lang = locale;
}

// Get all supported locales
export function getSupportedLocales(): Array<{ code: Locale; name: string; flag: string }> {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => ({
    code: code as Locale,
    name,
    flag,
  }));
}

// Translation function with parameter support
export async function t(path: TranslationPath, params: TranslationParams = {}): Promise<string> {
  const localeData = await loadLocale(currentLocale);
  return translatePath(localeData, path, params);
}

// Synchronous translation function (requires locale to be pre-loaded)
export function tSync(path: TranslationPath, params: TranslationParams = {}): string {
  const localeData = localeCache[currentLocale];
  if (!localeData) {
    console.warn(`Locale ${currentLocale} not loaded. Use async t() or call loadLocale() first.`);
    return path;
  }
  return translatePath(localeData, path, params);
}

// Helper function to navigate translation path
function translatePath(localeData: LocaleData, path: string, params: TranslationParams): string {
  const keys = path.split('.');
  let result: any = localeData;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      console.warn(`Translation not found: ${path} for locale: ${currentLocale}`);
      return path;
    }
  }

  if (typeof result !== 'string') {
    console.warn(`Translation is not a string: ${path} for locale: ${currentLocale}`);
    return path;
  }

  // Replace parameters in the translation string
  return result.replace(/\{(\w+)\}/g, (match: string, param: string) => {
    return params[param]?.toString() || match;
  });
}

// Get terminal demos
export async function getDemos(): Promise<Array<{ user: string; think: string; result: string; time: string }>> {
  const localeData = await loadLocale(currentLocale);
  const demos = localeData.demos as Array<{
    user: string;
    think: string;
    result: string;
  }>;

  // Keep original timing from Chinese version
  const times = ['0.38s', '0.41s', '0.22s', '0.52s', '0.36s'];
  return demos.map((demo, index) => ({
    ...demo,
    time: times[index]
  }));
}

// Synchronous version of getDemos
export function getDemosSync(): Array<{ user: string; think: string; result: string; time: string }> {
  const localeData = localeCache[currentLocale];
  if (!localeData) {
    console.warn(`Locale ${currentLocale} not loaded. Use async getDemos() or call loadLocale() first.`);
    return [];
  }

  const demos = localeData.demos as Array<{
    user: string;
    think: string;
    result: string;
  }>;

  // Keep original timing from Chinese version
  const times = ['0.38s', '0.41s', '0.22s', '0.52s', '0.36s'];
  return demos.map((demo, index) => ({
    ...demo,
    time: times[index]
  }));
}

// Preload all locales (optional, for better performance)
export async function preloadAllLocales(): Promise<void> {
  const promises = Object.keys(SUPPORTED_LANGUAGES).map(locale =>
    loadLocale(locale as Locale).catch(error => {
      console.error(`Failed to preload locale ${locale}:`, error);
    })
  );
  await Promise.all(promises);
}