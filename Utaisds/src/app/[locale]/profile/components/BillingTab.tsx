'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'

type FilterType = 'all' | 'recharge' | 'consume'

interface TransactionItem {
  id: string
  type: string
  amount: number
  balanceAfter: number
  description: string | null
  action: string | null
  projectName: string | null
  episodeNumber: number | null
  episodeName: string | null
  billingMeta: Record<string, unknown> | null
  createdAt: string
}

interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function BillingTab() {
  const t = useTranslations('profile')

  const [filterType, setFilterType] = useState<FilterType>('all')
  const [page, setPage] = useState(1)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback((type: FilterType, p: number) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), pageSize: '20', type })
    fetch(`/api/user/transactions?${params}`)
      .then(r => r.json())
      .then(data => {
        setTransactions(data.transactions || [])
        setPagination(data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 })
      })
      .catch(() => {
        setTransactions([])
        setPagination({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchTransactions(filterType, page)
  }, [filterType, page, fetchTransactions])

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type)
    setPage(1)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? '+' : ''
    return `${prefix}¥${Math.abs(amount).toFixed(2)}`
  }

  const getActionLabel = (action: string | null) => {
    if (!action) return null
    try { return t(`actionTypes.${action}`) } catch { return action }
  }

  const buildBillingDetail = (billingMeta: Record<string, unknown> | null) => {
    if (!billingMeta) return null
    const parts: string[] = []
    const quantity = billingMeta.quantity as number | undefined
    const unit = billingMeta.unit as string | undefined
    const resolution = billingMeta.resolution as string | undefined

    if (quantity && unit) {
      try {
        switch (unit) {
          case 'image':
            parts.push(resolution ? t('billingDetail.imageWithRes', { count: quantity, resolution }) : t('billingDetail.image', { count: quantity }))
            break
          case 'video':
            parts.push(resolution ? t('billingDetail.videoWithRes', { count: quantity, resolution }) : t('billingDetail.video', { count: quantity }))
            break
          case 'tokens':
            parts.push(t('billingDetail.tokens', { count: quantity }))
            break
          case 'seconds':
            parts.push(t('billingDetail.seconds', { count: quantity }))
            break
          case 'calls':
            parts.push(t('billingDetail.calls', { count: quantity }))
            break
          default:
            parts.push(`${quantity}${unit}`)
        }
      } catch {
        parts.push(`${quantity}${unit}`)
      }
    }
    if (billingMeta.model as string) parts.push(String(billingMeta.model))
    return parts.length > 0 ? parts.join(' · ') : null
  }

  return (
    <div className="flex h-full flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-stroke-soft)]">
        <div className="flex items-center gap-2">
          {(['all', 'recharge', 'consume'] as FilterType[]).map(type => (
            <button
              key={type}
              onClick={() => handleFilterChange(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filterType === type
                  ? 'glass-btn-base glass-btn-tone-info'
                  : 'text-[var(--glass-text-secondary)] hover:bg-[var(--glass-bg-muted)]'
              }`}
            >
              {type === 'all' ? t('allTypes') : t(type)}
            </button>
          ))}
        </div>
        {pagination.total > 0 && (
          <div className="text-sm text-[var(--glass-text-tertiary)]">
            {t('pagination', { total: pagination.total, page: pagination.page, totalPages: pagination.totalPages })}
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-[var(--glass-text-secondary)]">...</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AppIcon name="receipt" className="mb-4 h-12 w-12 text-[var(--glass-text-tertiary)]" />
            <p className="text-base font-semibold text-[var(--glass-text-primary)]">{t('noTransactions')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map(item => {
              const actionLabel = getActionLabel(item.action)
              const detail = buildBillingDetail(item.billingMeta)
              const isRecharge = item.type === 'recharge'

              return (
                <div key={item.id} className="glass-surface-soft rounded-xl border border-[var(--glass-stroke-base)] p-4">
                  {/* 头部：日期 + 类型标签 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--glass-text-tertiary)]">{formatDate(item.createdAt)}</span>
                    <span className={`glass-chip ${
                      isRecharge ? 'glass-chip-success' : 'glass-chip-danger'
                    }`}>
                      {isRecharge ? t('recharge') : t('consume')}
                    </span>
                  </div>

                  {/* 主体：操作描述 + 项目/集数 */}
                  <div className="text-sm font-medium text-[var(--glass-text-primary)]">
                    {actionLabel || item.description || '—'}
                  </div>
                  {item.projectName && (
                    <div className="text-xs text-[var(--glass-text-tertiary)] mt-1">
                      {item.projectName}
                      {item.episodeNumber && ` · ${t('episodeLabel', { number: item.episodeNumber })}`}
                    </div>
                  )}
                  {detail && (
                    <div className="text-xs text-[var(--glass-text-tertiary)] mt-1">{detail}</div>
                  )}

                  {/* 底部：金额 + 变动后余额 */}
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-sm font-semibold ${
                      isRecharge ? 'text-[var(--glass-tone-success-fg)]' : 'text-[var(--glass-tone-danger-fg)]'
                    }`}>
                      {formatAmount(item.amount)}
                    </span>
                    <span className="text-xs text-[var(--glass-text-tertiary)]">
                      {t('balanceAfter', { amount: `¥${item.balanceAfter.toFixed(2)}` })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 px-6 py-3 border-t border-[var(--glass-stroke-soft)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={pagination.page <= 1}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
              pagination.page <= 1
                ? 'text-[var(--glass-text-tertiary)] opacity-50 cursor-not-allowed'
                : 'glass-btn-base glass-btn-tone-info cursor-pointer'
            }`}
          >
            <AppIcon name="chevronLeft" className="w-4 h-4" />
            {t('previousPage')}
          </button>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={pagination.page >= pagination.totalPages}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
              pagination.page >= pagination.totalPages
                ? 'text-[var(--glass-text-tertiary)] opacity-50 cursor-not-allowed'
                : 'glass-btn-base glass-btn-tone-info cursor-pointer'
            }`}
          >
            {t('nextPage')}
            <AppIcon name="chevronRight" className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}