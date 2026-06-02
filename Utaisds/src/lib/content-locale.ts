import type { Locale } from '@/i18n/routing'

export type ContentLocale = 'zh' | 'en'

export function toContentLocale(locale: Locale): ContentLocale {
  if (locale === 'zh' || locale === 'en') return locale
  return 'en'
}