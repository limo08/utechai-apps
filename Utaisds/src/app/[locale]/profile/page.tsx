'use client'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Navbar from '@/components/Navbar'
import ApiConfigTab from './components/ApiConfigTab'
import BillingTab from './components/BillingTab'
import { AppIcon } from '@/components/ui/icons'
import { useRouter } from '@/i18n/navigation'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('profile')
  const tc = useTranslations('common')

  // 主要分区：扣费记录 / API配置
  const [activeSection, setActiveSection] = useState<'billing' | 'apiConfig'>('apiConfig')
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) { router.push({ pathname: '/auth/signin' }); return }
    fetch('/api/user/balance').then(r => r.json()).then(data => {
      if (data.success) setBalance(data.balance)
    }).catch(() => setBalance(0))
  }, [router, session, status])

  if (status === 'loading' || !session) {
    return (
      <div className="glass-page flex min-h-screen items-center justify-center">
        <div className="text-[var(--glass-text-secondary)]">{tc('loading')}</div>
      </div>
    )
  }

  return (
    <div className="glass-page min-h-screen">
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex gap-6 h-[calc(100vh-140px)]">

          {/* 左侧侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <div className="glass-surface-elevated h-full flex flex-col p-5">

              {/* 用户信息 */}
              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">{session.user?.name || t('user')}</h2>
                  <p className="text-sm text-[var(--glass-text-tertiary)]">{t('personalAccount')}</p>
                </div>

                {/* 余额卡片 */}
                <div className="glass-surface-soft rounded-2xl border border-[var(--glass-stroke-base)] p-4">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-[var(--glass-text-secondary)]">{t('availableBalance')}</div>
                    <button
                      onClick={() => {
                        setBalance(null)
                        fetch('/api/user/balance').then(r => r.json()).then(data => {
                          if (data.success) setBalance(data.balance)
                        }).catch(() => setBalance(0))
                      }}
                      className="text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)] transition-colors cursor-pointer"
                    >
                      <AppIcon name="refresh" className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-semibold text-[var(--glass-text-primary)]">¥{balance !== null ? balance.toFixed(2) : '—'}</span>
                    <a
                      href="https://www.utechai.com/recharge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-btn-base glass-btn-tone-info px-3 py-1 text-xs rounded-lg transition-all cursor-pointer"
                    >
                      {t('recharge')}
                    </a>
                  </div>
                </div>
              </div>

              {/* 导航菜单 */}
              <nav className="flex-1 space-y-2">
                <button
                  onClick={() => setActiveSection('apiConfig')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer font-semibold border border-transparent ${activeSection === 'apiConfig'
                    ? 'glass-btn-tone-info'
                    : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'
                    }`}
                >
                  <AppIcon name="settingsHexAlt" className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('apiConfig')}</span>
                </button>

                <button
                  onClick={() => setActiveSection('billing')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer font-semibold border border-transparent ${activeSection === 'billing'
                    ? 'glass-btn-tone-info'
                    : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'
                    }`}
                >
                  <AppIcon name="receipt" className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('billingRecords')}</span>
                </button>
              </nav>
              {/* 退出登录 */}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="glass-btn-base glass-btn-tone-danger mt-auto flex items-center gap-2 px-4 py-3 text-sm rounded-xl transition-all cursor-pointer"
              >
                <AppIcon name="logout" className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 min-w-0">
            <div className="glass-surface-elevated h-full flex flex-col">

              {activeSection === 'apiConfig' ? (
                <ApiConfigTab />
              ) : (
                <BillingTab />
              )}
            </div>
          </div>
        </div>
      </main >
    </div >
  )
}
