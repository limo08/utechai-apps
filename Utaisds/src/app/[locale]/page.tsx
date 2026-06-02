'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useRouter } from '@/i18n/navigation'
import Navbar from '@/components/Navbar'
import { Link } from '@/i18n/navigation'
import { buildAuthenticatedHomeTarget } from '@/lib/home/default-route'
import { AppIcon, type AppIconName } from '@/components/ui/icons'

type FeatureKey = 'scriptToStoryboard' | 'characterDesign' | 'worldBuilding' | 'voiceSynthesis' | 'videoComposition' | 'lipsync'

const FEATURE_ICONS: Record<FeatureKey, AppIconName> = {
  scriptToStoryboard: 'bookOpen',
  characterDesign: 'user',
  worldBuilding: 'image',
  voiceSynthesis: 'mic',
  videoComposition: 'video',
  lipsync: 'volumeOff',
}

const FEATURE_KEYS: FeatureKey[] = Object.keys(FEATURE_ICONS) as FeatureKey[]

export default function Home() {
  const t = useTranslations('landing')
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(buildAuthenticatedHomeTarget())
    }
  }, [status, router])

  if (status !== 'unauthenticated') {
    return (
      <div className="glass-page min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo-small.png?v=1"
            alt="UTECHAI"
            width={80}
            height={80}
            className="animate-pulse"
          />
        </div>
      </div>
    )
  }

  const featureKeys = FEATURE_KEYS

  return (
    <div className="glass-page min-h-screen overflow-hidden font-sans selection:bg-[var(--glass-tone-info-bg)]">
      {/* Navbar */}
      <div className="relative z-50">
        <Navbar />
      </div>

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(138,170,255,0.12),transparent),radial-gradient(900px_500px_at_0%_100%,rgba(148,163,184,0.16),transparent)] dark:bg-[radial-gradient(1200px_600px_at_80%_-10%,rgba(47,123,255,0.08),transparent),radial-gradient(900px_500px_at_0%_100%,rgba(96,165,250,0.06),transparent)]"></div>
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center px-4 pt-8">
          <div className="container mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero text */}
            <div className="text-left space-y-6 animate-slide-up" style={{ animationDuration: '0.8s' }}>
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.12] animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <span className="block text-[var(--glass-text-primary)]">
                  {t('heroTagline')}
                </span>
                <span className="block hero-gradient-text">
                  {t('subtitle')}
                </span>
              </div>

              <p className="text-base md:text-lg text-[var(--glass-text-secondary)] max-w-lg leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {t('heroDescription')}
              </p>

              <div className="flex flex-wrap gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <Link
                  href={{ pathname: '/auth/signup' }}
                  className="glass-btn-base glass-btn-primary px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300"
                >
                  {t('getStarted')}
                  <AppIcon name="arrowRight" className="h-4 w-4" />
                </Link>
                <Link
                  href={{ pathname: '/auth/signin' }}
                  className="glass-btn-base glass-btn-secondary px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 flex items-center gap-2"
                >
                  <AppIcon name="playCircle" className="h-5 w-5" />
                  {t('watchDemo')}
                </Link>
              </div>
            </div>

            {/* Right: Cinematic visual */}
            <div className="relative h-[500px] hidden lg:flex items-center justify-center animate-scale-in" style={{ animationDuration: '1s' }}>
              <div className="relative w-full max-w-md">
                {/* Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(47,123,255,0.15),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(47,123,255,0.2),transparent_65%)] rounded-full blur-3xl opacity-80"></div>

                {/* Main storyboard card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 glass-surface rounded-2xl overflow-hidden animate-float">
                  {/* Film strip header */}
                  <div className="h-12 bg-[var(--glass-bg-muted)] flex items-center px-4 gap-2 border-b border-[var(--glass-stroke-soft)]">
                    <div className="w-2 h-2 rounded-full bg-[var(--glass-tone-danger-fg)]"></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--glass-tone-warning-fg)]"></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--glass-tone-success-fg)]"></div>
                    <span className="text-xs font-semibold text-[var(--glass-text-tertiary)] ml-2">Storyboard</span>
                    <div className="ml-auto flex items-center gap-1">
                      <AppIcon name="sparkles" className="h-3 w-3 text-[var(--glass-tone-info-fg)]" />
                      <span className="text-xs text-[var(--glass-tone-info-fg)]">AI</span>
                    </div>
                  </div>
                  {/* Panels grid */}
                  <div className="p-4 grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className={`glass-surface rounded-lg overflow-hidden ${i <= 3 ? 'animate-fade-in' : 'animate-fade-in'}`} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                        <div className="h-20 bg-[var(--glass-bg-muted)] relative">
                          <div className="absolute inset-0 bg-[var(--glass-tone-info-bg)]/10"></div>
                          <div className={`absolute ${i % 3 === 1 ? 'bottom-2 left-2' : i % 3 === 2 ? 'top-2 right-2' : 'center'} ${i % 3 === 2 ? 'w-8 h-8' : 'w-6 h-6'} rounded-full bg-[var(--glass-bg-surface-strong)] border border-[var(--glass-stroke-soft)]`}></div>
                        </div>
                        <div className="px-2 py-1.5">
                          <div className="h-1.5 w-3/4 bg-[var(--glass-bg-muted)] rounded-full"></div>
                          <div className="h-1.5 w-1/2 bg-[var(--glass-bg-muted)] rounded-full mt-1"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Bottom bar */}
                  <div className="px-4 py-3 flex items-center justify-between border-t border-[var(--glass-stroke-soft)]">
                    <div className="flex items-center gap-2">
                      <AppIcon name="clapperboard" className="h-4 w-4 text-[var(--glass-text-tertiary)]" />
                      <span className="text-xs text-[var(--glass-text-tertiary)]">6 panels</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AppIcon name="video" className="h-3.5 w-3.5 text-[var(--glass-tone-success-fg)]" />
                      <span className="text-xs font-semibold text-[var(--glass-tone-success-fg)]">Ready</span>
                    </div>
                  </div>
                </div>

                {/* Floating character card */}
                <div className="absolute top-4 right-2 w-52 glass-surface-soft rounded-xl p-4 animate-float-delayed">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--glass-tone-info-bg)] flex items-center justify-center">
                      <AppIcon name="user" className="h-5 w-5 text-[var(--glass-tone-info-fg)]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--glass-text-primary)]">Character</div>
                      <div className="text-xs text-[var(--glass-text-tertiary)]">Consistent style</div>
                    </div>
                  </div>
                  <div className="h-20 bg-[var(--glass-bg-muted)] rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-[var(--glass-tone-info-bg)]/15"></div>
                    <div className="absolute top-2 left-2 w-16 h-16 rounded-full bg-[var(--glass-bg-surface-strong)] border border-[var(--glass-stroke-soft)]"></div>
                  </div>
                </div>

                {/* Floating voice card */}
                <div className="absolute bottom-8 left-0 w-48 glass-surface-soft rounded-xl p-3 animate-float-slow">
                  <div className="flex items-center gap-2 mb-2">
                    <AppIcon name="mic" className="h-4 w-4 text-[var(--glass-tone-warning-fg)]" />
                    <span className="text-sm font-semibold text-[var(--glass-text-primary)]">Voice</span>
                  </div>
                  <div className="flex items-end gap-1 h-8">
                    {[3, 5, 8, 6, 4, 7, 9, 5, 3, 6].map((h, i) => (
                      <div key={i} className="w-1.5 bg-[var(--glass-tone-warning-bg)] rounded-full" style={{ height: `${h * 4}px` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <div className="glass-chip glass-chip-neutral inline-flex items-center gap-1.5 mb-4">
                <AppIcon name="bolt" className="h-3.5 w-3.5" />
                {t('features.sectionSubtitle')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--glass-text-primary)] tracking-tight">
                {t('features.sectionTitle')}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featureKeys.map((key) => (
                <div key={key} className="glass-surface rounded-2xl p-6 group hover:shadow-[var(--glass-shadow-lg)] transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-[var(--glass-tone-info-bg)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <AppIcon name={FEATURE_ICONS[key]} className="h-6 w-6 text-[var(--glass-tone-info-fg)]" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--glass-text-primary)] mb-2">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="text-sm text-[var(--glass-text-secondary)] leading-relaxed">
                    {t(`features.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto">
            <div className="glass-surface rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
              {/* Background accent */}
              <div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_50%,rgba(47,123,255,0.08),transparent)] dark:bg-[radial-gradient(600px_300px_at_50%_50%,rgba(47,123,255,0.12),transparent)]"></div>
              <div className="relative z-10 space-y-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--glass-text-primary)] tracking-tight">
                  {t('cta.title')}
                </h2>
                <p className="text-base text-[var(--glass-text-secondary)] max-w-xl mx-auto">
                  {t('cta.description')}
                </p>
                <Link
                  href={{ pathname: '/auth/signup' }}
                  className="glass-btn-base glass-btn-primary px-10 py-4 rounded-xl font-semibold text-base transition-all duration-300 inline-flex items-center gap-2"
                >
                  {t('cta.button')}
                  <AppIcon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-[var(--glass-stroke-soft)]">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/logo-small.png?v=1"
                alt="UTECHAI"
                width={24}
                height={24}
                className="object-contain"
              />
              <span className="text-sm font-semibold text-[var(--glass-text-tertiary)]">UTECHAI</span>
            </div>
            <p className="text-sm text-[var(--glass-text-tertiary)]">
              {t('footer.copyright')}
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}