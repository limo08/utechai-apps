import { defineRouting } from 'next-intl/routing';

export const locales = ['zh', 'en', 'ja', 'ru', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export const routing = defineRouting({
    locales,
    defaultLocale,
    localePrefix: 'always'
});

export const localeLabels: Record<Locale, { native: string; english: string; short: string }> = {
    zh: { native: '简体中文', english: 'Chinese', short: '中' },
    en: { native: 'English', english: 'English', short: 'EN' },
    ja: { native: '日本語', english: 'Japanese', short: '日' },
    ru: { native: 'Русский', english: 'Russian', short: 'RU' },
    fr: { native: 'Français', english: 'French', short: 'FR' },
};