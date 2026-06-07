'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import AssetsStage from './AssetsStage'
import TaskStatusInline from '@/components/task/TaskStatusInline'
import type { TaskPresentationState } from '@/lib/task/presentation'
import { AppIcon } from '@/components/ui/icons'

interface WorkspaceAssetLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  assetsLoading: boolean
  assetsLoadingState: TaskPresentationState | null
  hasCharacters: boolean
  hasLocations: boolean
  projectId: string
  isAnalyzingAssets: boolean
  focusCharacterId: string | null
  focusCharacterRequestId: number
  triggerGlobalAnalyze: boolean
  onGlobalAnalyzeComplete: () => void
}

export default function WorkspaceAssetLibraryModal({
  isOpen,
  onClose,
  assetsLoading,
  assetsLoadingState,
  hasCharacters,
  hasLocations,
  projectId,
  isAnalyzingAssets,
  focusCharacterId,
  focusCharacterRequestId,
  triggerGlobalAnalyze,
  onGlobalAnalyzeComplete,
}: WorkspaceAssetLibraryModalProps) {
  // 锁定 body 滚动，防止模态框打开时底层页面拦截滚动事件
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') return null

  // 使用 createPortal 渲染到 document.body，避免被父元素的 backdrop-filter 影响
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-fadeIn"
      style={{ background: 'var(--glass-overlay)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-[95vw] max-w-6xl h-[90vh] flex flex-col bg-[var(--glass-bg-surface-modal)] border border-[var(--glass-stroke-soft)] shadow-[var(--glass-shadow-modal)] rounded-[var(--glass-radius-xl)] overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--glass-stroke-base)] flex-shrink-0">
          <h2 className="text-2xl font-bold text-[var(--glass-text-primary)] flex items-center gap-3">
            <AppIcon name="package" className="h-7 w-7 text-[var(--glass-text-secondary)]" />
            资产库
          </h2>
          <button
            onClick={onClose}
            className="glass-btn-base glass-btn-soft rounded-full p-3"
          >
            <AppIcon name="close" className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 app-scrollbar">
          {assetsLoading && !hasCharacters && !hasLocations && (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--glass-text-tertiary)] animate-pulse">
              <TaskStatusInline state={assetsLoadingState} className="text-base [&>span]:text-base" />
            </div>
          )}
          <AssetsStage
            projectId={projectId}
            isAnalyzingAssets={isAnalyzingAssets}
            focusCharacterId={focusCharacterId}
            focusCharacterRequestId={focusCharacterRequestId}
            triggerGlobalAnalyze={triggerGlobalAnalyze}
            onGlobalAnalyzeComplete={onGlobalAnalyzeComplete}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
