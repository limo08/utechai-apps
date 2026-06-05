'use client'

import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveTaskPresentationState } from '@/lib/task/presentation'
import type { CapabilityValue } from '@/lib/model-config-contract'
import {
  encodeModelKey,
  getProviderDisplayName,
  parseModelKey,
  useProviders,
} from '../api-config'
import UtKeySection from '../UtKeySection'
import { ApiConfigToolbar } from './ApiConfigToolbar'
// import { ApiConfigProviderList } from './ApiConfigProviderList'  // TODO: UT-KEY 统一模型网关上线后移除
import { DefaultModelCards } from './DefaultModelCards'
import { useApiConfigFilters } from './hooks/useApiConfigFilters'
import { AppIcon } from '@/components/ui/icons'
import type { GatewayModelsByType } from '@/lib/user-api/gateway-models'
import { TTS_RATES } from '@/lib/constants'

// TODO: UT-KEY 统一模型网关上线后移除以下类型和状态
// type TestStepStatus = 'pass' | 'fail' | 'skip'
// interface TestStep { ... }
// type TestStatus = 'idle' | 'testing' | 'passed' | 'failed'
// type CustomProviderType = 'gemini-compatible' | 'openai-compatible'

const Icons = {
  settings: () => (
    <AppIcon name="settingsHex" className="w-3.5 h-3.5" />
  ),
  llm: () => (
    <AppIcon name="menu" className="w-3.5 h-3.5" />
  ),
  image: () => (
    <AppIcon name="image" className="w-3.5 h-3.5" />
  ),
  video: () => (
    <AppIcon name="video" className="w-3.5 h-3.5" />
  ),
  audio: () => (
    <AppIcon name="audioWave" className="w-3.5 h-3.5" />
  ),
  lipsync: () => (
    <AppIcon name="audioWave" className="w-3.5 h-3.5" />
  ),
  chevronDown: () => (
    <AppIcon name="chevronDown" className="w-3 h-3" />
  ),
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isCapabilityValue(value: unknown): value is CapabilityValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function extractCapabilityFieldsFromModel(
  capabilities: Record<string, unknown> | undefined,
  modelType: string,
): Array<{ field: string; options: CapabilityValue[] }> {
  if (!capabilities) return []
  const namespace = capabilities[modelType]
  if (!isRecord(namespace)) return []
  return Object.entries(namespace)
    .filter(([key, value]) => key.endsWith('Options') && Array.isArray(value) && value.every(isCapabilityValue) && value.length > 0)
    .map(([key, value]) => ({
      field: key.slice(0, -'Options'.length),
      options: value as CapabilityValue[],
    }))
}

function parseBySample(input: string, sample: CapabilityValue): CapabilityValue {
  if (typeof sample === 'number') return Number(input)
  if (typeof sample === 'boolean') return input === 'true'
  return input
}

function toCapabilityFieldLabel(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())
}

export function ApiConfigTabContainer() {
  const locale = useLocale()
  const [utKeyConfigured, setUtKeyConfigured] = useState(false)
  /** 从网关验证接口返回的模型列表，按 UnifiedModelType 分组 */
  const [gatewayModels, setGatewayModels] = useState<GatewayModelsByType>({})

  /** 将网关模型按类型转换为 DefaultModelCards 可用的 ModelOption 格式 */
  const gatewayModelOptionsByType = useMemo(() => {
    const result: Record<string, Array<{ modelKey: string; name: string; provider: string; providerName: string }>> = {}
    const typeMap: Record<string, string> = {
      text: 'text',
      image: 'image',
      video: 'video',
      tts: 'tts',
      lipsync: 'lipsync',
      voice_design: 'voice_design',
    }
    for (const [type, models] of Object.entries(gatewayModels)) {
      const normalizedType = typeMap[type]
      if (!normalizedType || !Array.isArray(models)) continue
      result[normalizedType] = models.map((m) => ({
        modelKey: `gateway::${m.id}__${type}`,
        name: m.name || m.id,
        provider: 'gateway',
        providerName: m.ownedBy || 'Model Gateway',
      }))
    }
    return result
  }, [gatewayModels])

  const handleGatewayModels = useCallback((models: GatewayModelsByType) => {
    setGatewayModels(models)
  }, [])
  const {
    providers,
    models,
    defaultModels,
    workflowConcurrency,
    capabilityDefaults,
    availableModels,
    loading,
    saveStatus,
    refreshAvailableModels,
    // flushConfig,           // TODO: UT-KEY 上线后恢复
    // updateProviderHidden,  // TODO: UT-KEY 上线后恢复
    // updateProviderApiKey,  // TODO: UT-KEY 上线后恢复
    // updateProviderBaseUrl, // TODO: UT-KEY 上线后恢复
    // reorderProviders,      // TODO: UT-KEY 上线后恢复
    // addProvider,           // TODO: UT-KEY 上线后恢复
    // deleteProvider,        // TODO: UT-KEY 上线后恢复
    toggleModel,
    // deleteModel,           // TODO: UT-KEY 上线后恢复
    // addModel,              // TODO: UT-KEY 上线后恢复
    // updateModel,           // TODO: UT-KEY 上线后恢复
    updateDefaultModel,
    batchUpdateDefaultModels,
    updateWorkflowConcurrency,
    updateCapabilityDefault,
  } = useProviders()

  const t = useTranslations('apiConfig')
  const tc = useTranslations('common')
  // const tp = useTranslations('providerSection')  // TODO: UT-KEY 上线后恢复

  const savingState =
    saveStatus === 'saving'
      ? resolveTaskPresentationState({
        phase: 'processing',
        intent: 'modify',
        resource: 'text',
        hasOutput: true,
      })
      : null

  const {
    modelProviders,
    // getModelsForProvider,  // TODO: UT-KEY 上线后恢复
    getEnabledModelsByType,
  } = useApiConfigFilters({
    providers,
    models,
    availableModels,
  })

  // TODO: UT-KEY 统一模型网关上线后移除以下状态和 handler
  // const [showAddGeminiProvider, setShowAddGeminiProvider] = useState(false)
  // const [newGeminiProvider, setNewGeminiProvider] = useState(...)
  // const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  // const [testSteps, setTestSteps] = useState<TestStep[]>([])
  // const doAddProvider = useCallback(...)
  // const handleAddGeminiProvider = useCallback(...)
  // const handleForceAdd = useCallback(...)
  // const handleCancelAddGeminiProvider = ()

  const handleWorkflowConcurrencyChange = useCallback(
    (field: 'analysis' | 'image' | 'video', rawValue: string) => {
      const parsed = Number.parseInt(rawValue, 10)
      if (!Number.isFinite(parsed) || parsed <= 0) return
      updateWorkflowConcurrency(field, parsed)
    },
    [updateWorkflowConcurrency],
  )

  // 同步模型状态和处理函数
  const [isSyncingModels, setIsSyncingModels] = useState(false)
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const syncResultTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 自动清除同步结果提示
  useEffect(() => {
    if (syncResult) {
      if (syncResultTimerRef.current) {
        clearTimeout(syncResultTimerRef.current)
      }
      syncResultTimerRef.current = setTimeout(() => {
        setSyncResult(null)
      }, 4000)
    }
    return () => {
      if (syncResultTimerRef.current) {
        clearTimeout(syncResultTimerRef.current)
      }
    }
  }, [syncResult])

  const handleSyncModels = useCallback(async () => {
    if (isSyncingModels) return
    setIsSyncingModels(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/user/utkey/sync-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      console.log('[sync-models] 前端接收到的响应:', data)
      if (data.success) {
        // 更新网关模型列表，使下拉框立即可用
        if (data.gatewayModels) {
          console.log('[sync-models] 设置 gatewayModels:', data.gatewayModels)
          setGatewayModels(data.gatewayModels)
        } else {
          console.warn('[sync-models] 响应中没有 gatewayModels 字段')
        }
        // 刷新数据库中的可用模型列表（持久化后重新加载）
        await refreshAvailableModels()
        setSyncResult({
          type: 'success',
          message: data.message || `成功同步 ${data.modelCount || 0} 个模型`,
        })
      } else {
        setSyncResult({
          type: 'error',
          message: data.message || '模型同步失败',
        })
      }
    } catch (error) {
      console.error('[sync-models] 同步请求失败:', error)
      setSyncResult({
        type: 'error',
        message: '模型同步请求失败，请稍后重试',
      })
    } finally {
      setIsSyncingModels(false)
    }
  }, [isSyncingModels])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-[var(--glass-text-tertiary)]">
        {tc('loading')}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <ApiConfigToolbar
        title={t('title')}
        saveStatus={saveStatus}
        savingState={savingState}
        savingLabel={t('saving')}
        savedLabel={t('saved')}
        saveFailedLabel={t('saveFailed')}
      />

      {/* UT-KEY 模型网关占位卡片（页头） — 已隐藏，上线后恢复 */}
      {/* <div className="px-6 py-3 border-b border-[var(--glass-stroke-soft)]">
        <div className="flex items-center justify-center gap-2">
          <AppIcon name="settingsHex" className="w-4 h-4 text-[var(--glass-text-secondary)]" />
          <span className="text-sm font-semibold text-[var(--glass-text-primary)]">UT-KEY 模型网关</span>
          <span className="glass-chip glass-chip-warning">即将上线</span>
        </div>
        <p className="text-xs text-[var(--glass-text-tertiary)] text-center mt-1">通过 UT-KEY 从 utechai.com 获取文本、图像、视频模型（接口开发中）</p>
      </div> */}

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 p-6">

          {!utKeyConfigured && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <AppIcon name="alert" className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm leading-relaxed">请先配置 UT-KEY 才能使用生成功能</span>
            </div>
          )}

          <UtKeySection onConfiguredChange={setUtKeyConfigured} onGatewayModels={handleGatewayModels} />

          <DefaultModelCards
            t={t}
            defaultModels={defaultModels}
            getEnabledModelsByType={getEnabledModelsByType}
            parseModelKey={parseModelKey}
            encodeModelKey={encodeModelKey}
            getProviderDisplayName={getProviderDisplayName}
            locale={locale}
            updateDefaultModel={updateDefaultModel}
            batchUpdateDefaultModels={batchUpdateDefaultModels}
            extractCapabilityFieldsFromModel={extractCapabilityFieldsFromModel}
            toCapabilityFieldLabel={toCapabilityFieldLabel}
            capabilityDefaults={capabilityDefaults}
            updateCapabilityDefault={updateCapabilityDefault}
            parseBySample={parseBySample}
            workflowConcurrency={workflowConcurrency}
            handleWorkflowConcurrencyChange={handleWorkflowConcurrencyChange}
            gatewayModelOptions={gatewayModelOptionsByType}
            onSyncModels={handleSyncModels}
            isSyncingModels={isSyncingModels}
            utKeyConfigured={utKeyConfigured}
            syncResult={syncResult}
          />

          {/* TODO: UT-KEY 统一模型网关上线后恢复厂商资源池
          <ApiConfigProviderList
            modelProviders={modelProviders}
            allModels={models}
            defaultModels={defaultModels}
            getModelsForProvider={getModelsForProvider}
            onAddGeminiProvider={() => setShowAddGeminiProvider(true)}
            onToggleModel={toggleModel}
            onUpdateApiKey={updateProviderApiKey}
            onUpdateBaseUrl={updateProviderBaseUrl}
            onReorderProviders={reorderProviders}
            onDeleteModel={deleteModel}
            onUpdateModel={updateModel}
            onDeleteProvider={deleteProvider}
            onAddModel={addModel}
            onFlushConfig={flushConfig}
            onToggleProviderHidden={updateProviderHidden}
            labels={{
              providerPool: t('providerPool'),
              providerPoolDesc: t('providerPoolDesc'),
              dragToSort: t('dragToSort'),
              dragToSortHint: t('dragToSortHint'),
              hideProvider: t('hideProvider'),
              showProvider: t('showProvider'),
              showHiddenProviders: t('showHiddenProviders'),
              hideHiddenProviders: t('hideHiddenProviders'),
              hiddenProvidersPrefix: t('hiddenProvidersPrefix'),
              addGeminiProvider: t('addGeminiProvider'),
            }}
          />
          */}
        </div>
      </div>

      {/* TODO: UT-KEY 统一模型网关上线后恢复 Gemini Provider Modal
      <GlassModalShell ... >
        ...
      </GlassModalShell>
      */}
    </div>
  )
}