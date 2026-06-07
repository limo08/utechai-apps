"use client"

/**
 * SearchableSelect - 可输入筛选的下拉选择框
 * 替代原生 <select>，支持输入关键词过滤选项
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AppIcon } from "@/components/ui/icons"

export interface SearchableSelectOption {
    value: string
    label: string
    group?: string
}

export interface SearchableSelectProps {
    options: SearchableSelectOption[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    searchThreshold?: number
}

const PANEL_MAX_HEIGHT = 320
const VIEWPORT_EDGE_GAP = 16

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    className = "",
    searchThreshold = 5,
}: SearchableSelectProps) {
    const defaultPlaceholder = "请选择..."
    const effectivePlaceholder = placeholder ?? defaultPlaceholder
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const triggerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

    const selectedOption = options.find((o) => o.value === value)

    const filteredOptions = searchQuery.trim()
        ? options.filter((o) => {
            const q = searchQuery.toLowerCase()
            return o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || (o.group || "").toLowerCase().includes(q)
        })
        : options

    const updatePanelPlacement = useCallback(() => {
        const trigger = triggerRef.current
        if (!trigger) return
        const rect = trigger.getBoundingClientRect()
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight
        const spaceAbove = Math.max(0, rect.top - VIEWPORT_EDGE_GAP)
        const spaceBelow = Math.max(0, viewportHeight - rect.bottom - VIEWPORT_EDGE_GAP)
        const shouldOpenUpward = spaceBelow < PANEL_MAX_HEIGHT && spaceAbove > spaceBelow
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth
        const panelWidth = Math.max(260, rect.width)
        const maxLeft = viewportWidth - panelWidth - VIEWPORT_EDGE_GAP
        const panelLeft = Math.max(VIEWPORT_EDGE_GAP, Math.min(rect.left, maxLeft))
        setPanelStyle({
            position: "fixed" as const,
            left: panelLeft + "px",
            width: panelWidth + "px",
            maxHeight: PANEL_MAX_HEIGHT + "px",
            ...(shouldOpenUpward
                ? { bottom: (viewportHeight - rect.top + 4) + "px" }
                : { top: (rect.bottom + 4) + "px" }
            ),
        })
    }, [])

    useEffect(() => {
        if (!isOpen) return
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node
            if (triggerRef.current?.contains(target)) return
            if (panelRef.current?.contains(target)) return
            setIsOpen(false)
            setSearchQuery("")
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isOpen])

    useLayoutEffect(() => {
        if (!isOpen) return
        updatePanelPlacement()
        window.addEventListener("resize", updatePanelPlacement)
        window.addEventListener("scroll", updatePanelPlacement, true)
        return () => {
            window.removeEventListener("resize", updatePanelPlacement)
            window.removeEventListener("scroll", updatePanelPlacement, true)
        }
    }, [isOpen, updatePanelPlacement])

    const handleToggle = () => {
        if (isOpen) {
            setIsOpen(false)
            setSearchQuery("")
            return
        }
        setSearchQuery("")
        updatePanelPlacement()
        setIsOpen(true)
        requestAnimationFrame(() => {
            searchInputRef.current?.focus()
        })
    }

    const handleSelect = (val: string) => {
        onChange(val)
        setIsOpen(false)
        setSearchQuery("")
    }

    const groupedOptions = (() => {
        const groups = new Map<string, SearchableSelectOption[]>()
        for (const opt of filteredOptions) {
            const key = opt.group || ""
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(opt)
        }
        return groups
    })()

    return (
        <div ref={triggerRef} className={"relative " + className}>
            <button
                type="button"
                onClick={handleToggle}
                className={"glass-input-base w-full appearance-none px-3 py-2 text-sm rounded-xl outline-none transition-all text-[var(--glass-text-primary)] cursor-pointer " + (
                    isOpen ? "!border-[var(--glass-tone-info-fg)] shadow-[0_0_0_3px_var(--glass-tone-info-bg)]" : ""
                )}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className={"truncate " + (selectedOption ? "text-[var(--glass-text-primary)]" : "text-[var(--glass-text-tertiary)]")}>
                        {selectedOption ? selectedOption.label : effectivePlaceholder}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {selectedOption && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onChange("")
                                    setIsOpen(false)
                                    setSearchQuery("")
                                }}
                                className="w-4 h-4 flex items-center justify-center rounded-full text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-bg-surface-strong)] transition-colors"
                                title={"清除选择"}
                            >
                                <AppIcon name="close" className="w-3 h-3" />
                            </button>
                        )}
                        <AppIcon
                            name="chevronDown"
                            className={"w-4 h-4 transition-transform duration-300 " + (
                                isOpen ? "rotate-180 text-[var(--glass-text-primary)]" : "text-[var(--glass-text-tertiary)]"
                            )}
                        />
                    </div>
                </div>
            </button>

            {isOpen && createPortal(
                <div
                    ref={panelRef}
                    className="glass-surface-modal z-[9999] overflow-hidden flex flex-col rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
                    style={panelStyle}
                >
                    {options.length > searchThreshold && (
                        <div className="sticky top-0 z-20 px-2 pt-2 pb-1 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-md">
                            <div className="relative">
                                <AppIcon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--glass-text-tertiary)] pointer-events-none" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={"搜索模型..."}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-[var(--glass-bg-muted)] border border-[var(--glass-stroke-base)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-tertiary)] outline-none focus:border-[var(--glass-tone-info-fg)] focus:ring-1 focus:ring-[var(--glass-tone-info-fg)]/30 transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                            setIsOpen(false)
                                            setSearchQuery("")
                                        }
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-[var(--glass-bg-surface-strong)] text-[var(--glass-text-tertiary)] hover:text-[var(--glass-text-primary)] transition-colors"
                                    >
                                        <AppIcon name="close" className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="px-2 pb-2 overflow-y-auto app-scrollbar flex-1 min-h-0">
                        {groupedOptions.size === 0 ? (
                            <div className="px-4 py-6 text-center">
                                <p className="text-sm text-[var(--glass-text-tertiary)]">{"未找到匹配的模型"}</p>
                            </div>
                        ) : (
                            Array.from(groupedOptions.entries()).map(([groupLabel, groupOpts]) => (
                                <div key={groupLabel} className="mb-1">
                                    {groupLabel && (
                                        <div className="sticky top-0 z-10 px-2 pt-2 pb-1 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md">
                                            <span className="text-xs font-bold text-[var(--glass-text-tertiary)] tracking-wide">
                                                {groupLabel}
                                            </span>
                                        </div>
                                    )}
                                    <div className="space-y-0.5">
                                        {groupOpts.map((opt) => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => handleSelect(opt.value)}
                                                className={"w-full text-left px-4 py-2 transition-all rounded-lg text-sm " + (
                                                    value === opt.value
                                                        ? "bg-[var(--glass-bg-surface-strong)] font-bold text-[var(--glass-text-primary)]"
                                                        : "hover:bg-[var(--glass-bg-hover)] font-medium text-[var(--glass-text-secondary)]"
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>,
                document.body,
            )}
        </div>
    )
}
