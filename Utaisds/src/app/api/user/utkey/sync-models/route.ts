import { NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import type { UnifiedModelType } from '@/lib/model-config-contract'
import type { GatewayModelOption, GatewayModelsByType } from '@/lib/user-api/gateway-models'
import { persistGatewayModels } from '@/lib/user-api/persist-available-models'

/**
 * POST /api/user/utkey/sync-models
 * 从 API 网关同步供应商和模型列表到 AvailableModel 表。
 *
 * 流程：
 * 1. 调用网关 /api/vendors/ 获取供应商列表（id → name 映射）
 * 2. 调用网关 /api/models/ 获取模型列表（分页获取全部）
 * 3. 按 tags 分组映射为 UnifiedModelType，vendor_id 解析为供应商名称
 * 4. 持久化到 AvailableModel 表
 * 5. 返回同步的模型数量
 */

/** 网关返回的单个模型（按 tags 分组后的结构） — 从 gateway-models 共享 */
export type { GatewayModelOption, GatewayModelsByType }

export const POST = apiHandler(async () => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult
  const userId = session.user.id

  // 先从网关获取供应商列表，构建 id → name 映射
  const vendorMap = await fetchVendorsFromGateway()
  console.log('[sync-models] 供应商数量:', vendorMap.size)

  // 再从网关获取模型列表
  const result = await fetchModelsFromGateway()
  if (!result.success || !result.rawModels || result.rawModels.length === 0) {
    return NextResponse.json({
      success: false,
      message: '无法从网关获取模型列表',
    })
  }

  const allGatewayRawModels = result.rawModels

  // 对收集到的所有模型去重并按 tags 分组，vendor_id 通过 vendorMap 解析为名称
  const gatewayModels = groupGatewayModelsByTag(allGatewayRawModels, vendorMap)

  console.log('[sync-models] 收集到原始模型数量:', allGatewayRawModels.length)
  console.log('[sync-models] 分组后的模型:', JSON.stringify(gatewayModels, null, 2))

  // 持久化到 AvailableModel 表
  try {
    await persistGatewayModels(userId, gatewayModels)
  } catch (persistError) {
    console.error('[sync-models] 持久化网关模型失败:', persistError)
    return NextResponse.json({
      success: false,
      message: '模型同步失败，请稍后重试',
    })
  }

  // 统计同步的模型数量
  const modelCount = Object.values(gatewayModels).reduce(
    (sum, models) => sum + (Array.isArray(models) ? models.length : 0),
    0,
  )

  console.log('[sync-models] 最终同步模型数量:', modelCount)

  return NextResponse.json({
    success: true,
    message: `成功同步 ${modelCount} 个模型`,
    modelCount,
    gatewayModels,
  })
})

/**
 * 将模型标签（tags）映射为系统统一模型类型（UnifiedModelType）。
 * 同时支持网关实际返回的英文标签（Vision, Audio, Reasoning 等）
 * 和中文标签（图片生成, 视频生成 等）。
 *
 * 注意：一个模型可以同时匹配多个类型（如同时为 lipsync + voice_design）。
 * voice_design 排在 tts 前面，避免被 /voice/i 提前匹配到 tts。
 */
const TAG_TO_MODEL_TYPE: Array<{ patterns: RegExp[]; type: UnifiedModelType }> = [
  {
    patterns: [/视频生成/i, /视频/i, /video/i, /video.?gen/i],
    type: 'video',
  },
  {
    patterns: [/图片生成/i, /图像生成/i, /图片/i, /图像/i, /image/i, /image.?gen/i, /vision/i],
    type: 'image',
  },
  {
    patterns: [/音色设计/i, /voice.?design/i, /声音设计/i, /sound.?design/i],
    type: 'voice_design',
  },
  {
    patterns: [/音频生成/i, /音频/i, /语音合成/i, /语音/i, /TTS/i, /audio/i, /speech/i],
    type: 'tts',
  },
  {
    patterns: [/口型同步/i, /唇形同步/i, /口型/i, /lipsync/i, /lip.?sync/i],
    type: 'lipsync',
  },
  {
    patterns: [/Reasoning/i, /文本分析/i, /text.?analysis/i, /llm/i, /文本生成/i, /text.?gen/i, /对话/i, /chat/i, /大语言/i, /语言模型/i, /language.?model/i],
    type: 'text',
  },
]

/**
 * 返回 tags 匹配到的所有模型类型（一个模型可属于多个类型）。
 */
function resolveModelTypesFromTags(tags: string[]): UnifiedModelType[] {
  const matched = new Set<UnifiedModelType>()
  for (const tag of tags) {
    const normalizedTag = tag.trim()
    if (!normalizedTag) continue
    for (const rule of TAG_TO_MODEL_TYPE) {
      if (matched.has(rule.type)) continue
      for (const pattern of rule.patterns) {
        if (pattern.test(normalizedTag)) {
          matched.add(rule.type)
          break
        }
      }
    }
  }
  return [...matched]
}

/**
 * 返回 tags 匹配到的第一个模型类型（向后兼容，用于只需要单个类型的场景）。
 */
function resolveModelTypeFromTags(tags: string[]): UnifiedModelType | null {
  const types = resolveModelTypesFromTags(tags)
  return types.length > 0 ? types[0] : null
}

/**
 * 当 tags 无法匹配类型时，根据 model_name 推断。
 * 用于兜底处理无 tags 或 tags 不包含类型信息的模型。
 */
function resolveModelTypeFromName(modelName: string): UnifiedModelType | null {
  const name = modelName.toLowerCase()
  if (/video|veo|sora|wan.*video|视频/.test(name)) return 'video'
  if (/image|imagen|dall|flux|图片|图像|vision/.test(name)) return 'image'
  if (/voice.?design|音色设计|声音设计/.test(name)) return 'voice_design'
  if (/tts|audio|speech|voice|whisper|语音|音频|声音/.test(name)) return 'tts'
  if (/lipsync|lip.?sync|口型|唇形/.test(name)) return 'lipsync'
  if (/chat|llm|text|gpt|qwen|claude|gemini|language|对话|语言/.test(name)) return 'text'
  return null
}

/**
 * 将网关原始模型列表按 tags 映射到 UnifiedModelType 分组。
 * 一个模型可以属于多个类型（如同时为 lipsync + voice_design）。
 * 优先用 tags 判断类型；tags 为空或无法匹配时 fallback 到 model_name 推断。
 * 仍无法归类的模型将被跳过。
 */
function groupGatewayModelsByTag(
  rawModels: Array<{ id: string; model_name?: string; vendor_id?: string | number; tags?: string[] }>,
  vendorMap: Map<number, string>,
): GatewayModelsByType {
  const seen = new Set<string>()
  const grouped: GatewayModelsByType = {}

  console.log('[groupGatewayModelsByTag] 开始处理模型数量:', rawModels.length)

  for (const raw of rawModels) {
    const modelId = typeof raw.id === 'string' ? raw.id.trim() : ''
    if (!modelId || seen.has(modelId)) continue
    seen.add(modelId)

    const modelName = (typeof raw.model_name === 'string' && raw.model_name.trim()) || modelId
    const tags = Array.isArray(raw.tags)
      ? raw.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : []

    // 优先用 tags 判断（可匹配多个类型），fallback 到 model_name 推断（单个类型）
    let types = resolveModelTypesFromTags(tags)
    if (types.length === 0) {
      const fallbackType = resolveModelTypeFromName(modelName)
      if (fallbackType) types = [fallbackType]
    }
    if (types.length === 0) {
      console.log(`[groupGatewayModelsByTag] 模型 ${modelId} (${modelName}) 无法匹配类型，跳过`)
      continue
    }

    console.log(`[groupGatewayModelsByTag] 模型 ${modelId} (${modelName}) → [${types.join(', ')}]`)

    const vendorId = raw.vendor_id != null ? Number(raw.vendor_id) : NaN
    const vendorName = vendorMap.get(vendorId)

    for (const type of types) {
      const option: GatewayModelOption = {
        id: modelId,
        name: modelName,
        ownedBy: vendorName || undefined,
        type,
        tags,
      }

      if (!grouped[type]) grouped[type] = []
      grouped[type]!.push(option)
    }
  }

  console.log('[groupGatewayModelsByTag] 最终分组结果:', Object.entries(grouped).map(([k, v]) => `${k}: ${v!.length}`).join(', '))

  return grouped
}

/**
 * 从网关获取模型列表（分页获取全部）
 */
async function fetchModelsFromGateway(): Promise<{
  success: boolean
  rawModels?: Array<{ id: string; model_name?: string; vendor_id?: string | number; tags?: string[] }>
}> {
  const host = process.env.MODEL_GATEWAY_URL || 'http://localhost:3000'

  try {
    const allRawModels: Array<{ id: string; model_name?: string; vendor_id?: string | number; tags?: string[] }> = []
    let page = 1
    let hasMore = true

    // 分页循环获取所有模型
    while (hasMore) {
      const response = await fetch(`${host}/api/models/?p=${page}&page_size=50`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        return { success: false }
      }

      const responseData = await response.json() as {
        data?: {
          items?: Array<{ id?: string | number; model_name?: string; vendor_id?: string | number; tags?: string | string[] }>
          page?: number
          page_size?: number
          total?: number
        }
        message?: string
        success?: boolean
      }

      // 检查响应是否成功
      if (!responseData.success || !responseData.data) {
        return { success: false }
      }

      const { items, page: currentPage, page_size, total } = responseData.data

      // 提取有效的模型数据，将 id 转为字符串，tags 从逗号分隔字符串解析为数组
      type NormalizedModel = { id: string; model_name?: string; vendor_id?: string | number; tags: string[] }
      const rawModels: NormalizedModel[] = []
      if (Array.isArray(items)) {
        for (const m of items) {
          if (m?.id == null) continue
          const id = String(m.id).trim()
          if (!id) continue

          // tags 可能是逗号分隔字符串 "Vision,8.2K" 或数组
          let tags: string[] = []
          if (Array.isArray(m.tags)) {
            tags = m.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          } else if (typeof m.tags === 'string' && m.tags.trim()) {
            tags = m.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
          }

          rawModels.push({
            id,
            model_name: typeof m.model_name === 'string' ? m.model_name : undefined,
            vendor_id: m.vendor_id,
            tags,
          })
        }
      }

      allRawModels.push(...rawModels)

      // 判断是否还有更多数据
      if (!currentPage || !page_size || !total) {
        // 如果缺少分页信息，认为获取完成
        hasMore = false
      } else {
        const totalPages = Math.ceil(total / page_size)
        hasMore = currentPage < totalPages
        page++
      }
    }

    if (allRawModels.length === 0) {
      return { success: false }
    }

    return { success: true, rawModels: allRawModels }
  } catch {
    return { success: false }
  }
}

/**
 * 从网关获取供应商列表（分页获取全部），构建 id → name 映射。
 * 调用 /api/vendors/ 接口，无需鉴权。
 */
async function fetchVendorsFromGateway(): Promise<Map<number, string>> {
  const host = process.env.MODEL_GATEWAY_URL || 'http://localhost:3000'
  const vendorMap = new Map<number, string>()

  try {
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await fetch(`${host}/api/vendors/?p=${page}&page_size=50`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) break

      const responseData = await response.json() as {
        data?: {
          items?: Array<{ id?: number; name?: string }>
          page?: number
          page_size?: number
          total?: number
        }
        success?: boolean
      }

      if (!responseData.success || !responseData.data) break

      const { items, page: currentPage, page_size, total } = responseData.data

      if (Array.isArray(items)) {
        for (const v of items) {
          if (v?.id != null && typeof v.name === 'string' && v.name.trim()) {
            vendorMap.set(Number(v.id), v.name.trim())
          }
        }
      }

      if (!currentPage || !page_size || !total) {
        hasMore = false
      } else {
        hasMore = currentPage < Math.ceil(total / page_size)
        page++
      }
    }
  } catch (error) {
    console.error('[sync-models] 获取供应商列表失败:', error)
  }

  return vendorMap
}
