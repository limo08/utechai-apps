'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AppIcon } from '@/components/ui/icons'
import type { GatewayModelsByType } from '@/lib/user-api/gateway-models'

interface UtKeySectionProps {
  onConfiguredChange?: (configured: boolean) => void
  /** 验证成功后，将网关返回的模型（按 tags 分组）上抛给父组件 */
  onGatewayModels?: (models: GatewayModelsByType) => void
}

interface KeyEntry {
  id: number
  masked: string
}

type ValidateStatus = 'idle' | 'validating' | 'valid' | 'invalid'

/** 每个已保存 KEY 的验证状态 */
interface SavedKeyValidateState {
  status: ValidateStatus
  message: string
}

export default function UtKeySection({ onConfiguredChange, onGatewayModels }: UtKeySectionProps) {
  const t = useTranslations('profile')

  const [configured, setConfigured] = useState(false)
  const [keys, setKeys] = useState<KeyEntry[]>([])
  const [total, setTotal] = useState(0)
  const [inputKey, setInputKey] = useState('')
  const [validateStatus, setValidateStatus] = useState<ValidateStatus>('idle')
  const [validateMessage, setValidateMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const [addError, setAddError] = useState('')

  /** 已保存 KEY 的逐个验证状态 */
  const [savedKeyValidates, setSavedKeyValidates] = useState<Record<number, SavedKeyValidateState>>({})
  /** 整体验证（验证所有已保存 KEY） */
  const [allValidateStatus, setAllValidateStatus] = useState<ValidateStatus>('idle')
  const [allValidateMessage, setAllValidateMessage] = useState('')

  /** 解析多行输入为独立的 key 列表（去空行、去重） */
  const parseInputKeys = (): string[] => {
    const lines = inputKey
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    // 去重
    return [...new Set(lines)]
  }

  const fetchKeys = () => {
    fetch('/api/user/utkey')
      .then(r => r.json())
      .then(data => {
        setConfigured(data.configured)
        onConfiguredChange?.(data.configured)
        setKeys(data.keys || [])
        setTotal(data.total || 0)
      })
      .catch(() => { setConfigured(false); onConfiguredChange?.(false) })
  }

  useEffect(() => { fetchKeys() }, [])

  const handleValidate = async () => {
    const keyList = parseInputKeys()
    if (keyList.length === 0) return
    setValidateStatus('validating')
    setValidateMessage('')
    setAddError('')
    try {
      // 批量验证：发送所有 key，后端逐个验证
      const res = await fetch('/api/user/utkey/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utKeys: keyList }),
      })
      const data = await res.json()
      if (data.valid) {
        setValidateStatus('valid')
        setValidateMessage(data.message || t('utKeyValid'))
      } else {
        setValidateStatus('invalid')
        setValidateMessage(data.message || t('utKeyInvalid'))
      }
      // 无论验证结果如何，只要有 gatewayModels 就上抛给父组件
      if (data.gatewayModels) {
        onGatewayModels?.(data.gatewayModels)
      }
    } catch {
      setValidateStatus('invalid')
      setValidateMessage('网络错误，请稍后重试')
    }
  }

  const handleSave = async () => {
    const keyList = parseInputKeys()
    if (keyList.length === 0) return
    setSaving(true)
    setAddError('')
    try {
      // 批量保存：发送所有 key，后端逐个添加（跳过重复）
      const res = await fetch('/api/user/utkey', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utKeys: keyList }),
      })
      const data = await res.json()
      if (data.configured) {
        setConfigured(true)
        onConfiguredChange?.(true)
        setKeys(data.keys || [])
        setTotal(data.total || 0)
        setInputKey('')
        setValidateStatus('idle')
        setValidateMessage('')
        setEditing(false)
      } else if (data.error) {
        setAddError(data.error)
      }
    } catch {
      setAddError('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (index: number) => {
    setRemovingIndex(index)
    try {
      const res = await fetch('/api/user/utkey', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      })
      const data = await res.json()
      setConfigured(data.configured)
      onConfiguredChange?.(data.configured)
      setKeys(data.keys || [])
      setTotal(data.total || 0)
      if (!data.configured) {
        setEditing(false)
      }
    } catch { /* ignore */ } finally {
      setRemovingIndex(null)
    }
  }

  const handleAddAnother = () => {
    setEditing(true)
    setInputKey('')
    setValidateStatus('idle')
    setValidateMessage('')
    setAddError('')
  }

  const handleStartEdit = () => {
    setEditing(true)
    setInputKey('')
    setValidateStatus('idle')
    setValidateMessage('')
    setAddError('')
  }

  /** 验证已保存的所有 KEY（调用后端，后端从数据库读取明文验证） */
  const handleValidateSavedKeys = async () => {
    setAllValidateStatus('validating')
    setAllValidateMessage('')
    setSavedKeyValidates({})
    try {
      const res = await fetch('/api/user/utkey/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),  // 不传 key，后端从数据库读取已保存的 KEY
      })
      const data = await res.json()
      // 后端统一返回 { valid, message, validKeys, invalidKeys, total }
      if (data.valid) {
        setAllValidateStatus('valid')
        setAllValidateMessage(data.message || t('utKeyValid'))
      } else {
        setAllValidateStatus('invalid')
        setAllValidateMessage(data.message || t('utKeyInvalid'))
      }

      // 逐个标记验证状态
      const newValidates: Record<number, SavedKeyValidateState> = {}
      if (data.validKeys && Array.isArray(data.validKeys)) {
        data.validKeys.forEach((vk: { key: string; valid: boolean; message: string }) => {
          const idx = keys.findIndex(k => k.masked === vk.key)
          if (idx >= 0) newValidates[keys[idx].id] = { status: 'valid', message: vk.message || t('utKeyValid') }
        })
        // 如果 masked 匹配不上，按顺序赋值
        if (Object.keys(newValidates).length === 0 && data.validKeys.length === keys.length) {
          keys.forEach((k, i) => {
            newValidates[k.id] = { status: 'valid', message: data.validKeys[i]?.message || t('utKeyValid') }
          })
        }
      }
      if (data.invalidKeys && Array.isArray(data.invalidKeys)) {
        data.invalidKeys.forEach((ik: { key: string; valid: boolean; message: string }) => {
          const idx = keys.findIndex(k => k.masked === ik.key)
          if (idx >= 0) newValidates[keys[idx].id] = { status: 'invalid', message: ik.message || t('utKeyInvalid') }
        })
      }
      // 单 key 无 validKeys/invalidKeys 时的简化处理
      if (keys.length === 1 && Object.keys(newValidates).length === 0) {
        newValidates[keys[0].id] = { status: data.valid ? 'valid' : 'invalid', message: data.message || (data.valid ? t('utKeyValid') : t('utKeyInvalid')) }
      }
      setSavedKeyValidates(newValidates)
      // 验证已保存 KEY 时，同样将网关模型上抛
      if (data.gatewayModels) {
        onGatewayModels?.(data.gatewayModels)
      }
    } catch {
      setAllValidateStatus('invalid')
      setAllValidateMessage('网络错误，请稍后重试')
    }
  }

  // 已配置且不在编辑模式
  if (configured && !editing) {
    return (
      <div className="glass-surface-soft rounded-xl border border-[var(--glass-stroke-base)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <AppIcon name="lock" className="w-5 h-5 text-[var(--glass-tone-success-fg)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--glass-text-primary)]">{t('utKeyTitle')}</div>
              <div className="text-xs text-[var(--glass-text-tertiary)]">{t('utKeyCount', { count: total })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleValidateSavedKeys}
              disabled={allValidateStatus === 'validating'}
              className="glass-btn-base glass-btn-secondary px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {allValidateStatus === 'validating' ? t('utKeyValidating') : t('utKeyValidate')}
            </button>
            <button
              onClick={handleAddAnother}
              className="glass-btn-base glass-btn-primary px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer"
            >
              {t('utKeyAdd')}
            </button>
          </div>
        </div>

        {/* 已绑定的 KEY 列表 — 两列网格 */}
        <div className="grid grid-cols-2 gap-2">
          {keys.map((entry) => {
            const keyValidate = savedKeyValidates[entry.id]
            return (
              <div key={entry.id} className={`flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-[var(--glass-surface-dimmed)] border ${
                keyValidate?.status === 'valid'
                  ? 'border-green-300 dark:border-green-700'
                  : keyValidate?.status === 'invalid'
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-gray-200 dark:border-[var(--glass-stroke-soft)]'
              }`}>
                <div className="flex items-center gap-2 min-w-0">
                  {keyValidate?.status === 'valid' ? (
                    <AppIcon name="check" className="w-3.5 h-3.5 text-[var(--glass-tone-success-fg)] shrink-0" />
                  ) : keyValidate?.status === 'invalid' ? (
                    <AppIcon name="close" className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  ) : (
                    <AppIcon name="check" className="w-3.5 h-3.5 text-[var(--glass-tone-success-fg)] shrink-0" />
                  )}
                  <span className="text-xs text-[var(--glass-text-secondary)] font-mono truncate">{entry.masked}</span>
                </div>
                <button
                  onClick={() => handleRemove(entry.id)}
                  disabled={removingIndex === entry.id}
                  className="glass-btn-base glass-btn-soft px-2 py-1 text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-red-500 hover:text-red-600 shrink-0"
                >
                  {removingIndex === entry.id ? '...' : t('utKeyRemove')}
                </button>
              </div>
            )
          })}
        </div>

        <div className="text-xs text-[var(--glass-text-tertiary)] mt-3">
          {t('utKeyMultiHint')}
        </div>

        {/* 整体验证结果提示 */}
        {allValidateStatus === 'validating' && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--glass-text-secondary)]">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('utKeyValidating')}
          </div>
        )}
        {allValidateStatus === 'valid' && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-green-500/40 bg-green-500/5 px-3 py-2 text-xs font-medium text-green-600 dark:text-green-400">
            <AppIcon name="check" className="h-4 w-4 shrink-0" />
            {allValidateMessage || t('utKeyValid')}
          </div>
        )}
        {allValidateStatus === 'invalid' && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-red-500/40 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
            <AppIcon name="close" className="h-4 w-4 shrink-0" />
            {allValidateMessage || t('utKeyInvalid')}
          </div>
        )}
      </div>
    )
  }

  // 未配置或编辑模式（添加新 KEY）
  return (
    <div className="glass-surface-soft rounded-xl border border-[var(--glass-stroke-base)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <AppIcon name="lock" className="w-4 h-4 text-[var(--glass-text-secondary)]" />
        <div className="text-sm font-semibold text-[var(--glass-text-primary)]">{t('utKeyTitle')}</div>
        {configured && keys.length > 0 && (
          <span className="glass-chip glass-chip-success">{t('utKeyCount', { count: keys.length })}</span>
        )}
      </div>

      {/* 已有 KEY 列表（编辑模式下也显示） — 两列网格 */}
      {configured && keys.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {keys.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-[var(--glass-surface-dimmed)] border border-gray-200 dark:border-[var(--glass-stroke-soft)]">
              <div className="flex items-center gap-2 min-w-0">
                <AppIcon name="check" className="w-3.5 h-3.5 text-[var(--glass-tone-success-fg)] shrink-0" />
                <span className="text-xs text-[var(--glass-text-secondary)] font-mono truncate">{entry.masked}</span>
              </div>
              <button
                onClick={() => handleRemove(entry.id)}
                disabled={removingIndex === entry.id}
                className="glass-btn-base glass-btn-soft px-2 py-1 text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-red-500 hover:text-red-600 shrink-0"
              >
                {removingIndex === entry.id ? '...' : t('utKeyRemove')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-[var(--glass-text-tertiary)] mb-2">
        {configured ? t('utKeyAddDescription') : t('utKeyDescription')}
      </div>

      {/* 输入框占满宽度 */}
      <textarea
        value={inputKey}
        onChange={e => {
          setInputKey(e.target.value)
          setAddError('')
          setValidateStatus('idle')
          setValidateMessage('')
          // 自动撑开高度
          const el = e.target
          el.style.height = 'auto'
          el.style.height = el.scrollHeight + 'px'
        }}
        placeholder={t('utKeyPlaceholderMulti')}
        rows={1}
        className="glass-input-base w-1/3 px-3 py-2.5 text-sm overflow-hidden max-h-[200px]"
        style={{ height: '40px', width: '50%' }}
        disabled={validateStatus === 'validating' || saving}
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handleValidate}
          disabled={parseInputKeys().length === 0 || validateStatus === 'validating'}
          className="glass-btn-base glass-btn-secondary px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {validateStatus === 'validating' ? t('utKeyValidating') : t('utKeyValidate')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || parseInputKeys().length === 0}
          className="glass-btn-base glass-btn-primary px-3 py-1.5 text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? '...' : t('utKeySave')}
        </button>
      </div>

      <div className="text-xs text-[var(--glass-text-tertiary)] mt-3">
        {t('utKeyMultiHint')}
      </div>

      {addError && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          <AppIcon name="alert" className="h-4 w-4 shrink-0" />
          {addError}
        </div>
      )}

      {validateStatus === 'validating' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--glass-text-secondary)]">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {t('utKeyValidating')}
        </div>
      )}

      {validateStatus === 'valid' && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-green-500/40 bg-green-500/5 px-3 py-2 text-xs font-medium text-green-600 dark:text-green-400">
          <AppIcon name="check" className="h-4 w-4 shrink-0" />
          {validateMessage || t('utKeyValid')}
        </div>
      )}

      {validateStatus === 'invalid' && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-red-500/40 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
          <AppIcon name="close" className="h-4 w-4 shrink-0" />
          {validateMessage || t('utKeyInvalid')}
        </div>
      )}
    </div>
  )
}