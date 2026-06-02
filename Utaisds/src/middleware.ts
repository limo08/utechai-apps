import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/i18n';

export default createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always',
    localeDetection: false
});

export const config = {
    matcher: [
        '/',
        '/(zh|en|ja|ru|fr)/:path*',
        '/((?!api|m|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.ico).*)'
    ]
};