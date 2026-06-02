import { NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { prisma } from '@/lib/prisma'
import { decryptApiKey } from '@/lib/crypto-utils'
import type { UnifiedModelType } from '@/lib/model-config-contract'
import type { GatewayModelOption, GatewayModelsByType } from '@/lib/user-api/gateway-models'
import { persistGatewayModels } from '@/lib/user-api/persist-available-models'

/**
 * POST /api/user/utkey/sync-models
 * 从 API 网关同步模型列表到 AvailableModel 表。
 *
 * 流程：
 * 1. 从数据库读取用户已保存的 UT-KEY
 * 2. 用 UT-KEY 调用网关 /v1/models 接口获取模型列表
 * 3. 按 tags 分组映射为 UnifiedModelType
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

  // 从数据库读取已保存的 UT-KEY
  const pref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { utKey: true },
  })

  if (!pref?.utKey) {
    return NextResponse.json({
      success: false,
      message: 'UT-KEY 未配置，请先配置 UT-KEY',
    })
  }

  // 解密并获取所有 key
  let plainKeys: string[]
  try {
    try {
      const parsed = JSON.parse(pref.utKey)
      if (Array.isArray(parsed) && parsed.length > 0) {
        plainKeys = parsed.map((enc: string) => decryptApiKey(enc))
      } else {
        plainKeys = [decryptApiKey(pref.utKey)]
      }
    } catch {
      plainKeys = [decryptApiKey(pref.utKey)]
    }
  } catch {
    return NextResponse.json({
      success: false,
      message: 'UT-KEY 解密失败',
    })
  }

  if (plainKeys.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'UT-KEY 不能为空',
    })
  }

  // 从网关获取模型列表
  const allGatewayRawModels: Array<{ id: string; name?: string; owned_by?: string; tags?: string[] }> = []
  let validKeyCount = 0

  for (const plain of plainKeys) {
    const result = await fetchModelsFromGateway(plain)
    if (result.success && result.rawModels && result.rawModels.length > 0) {
      allGatewayRawModels.push(...result.rawModels)
      validKeyCount++
    }
  }

  if (validKeyCount === 0) {
    return NextResponse.json({
      success: false,
      message: '所有 UT-KEY 验证失败，无法获取模型列表',
    })
  }

  // 对收集到的所有模型去重并按 tags 分组
  const gatewayModels = groupGatewayModelsByTag(allGatewayRawModels)

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

  return NextResponse.json({
    success: true,
    message: `成功同步 ${modelCount} 个模型`,
    modelCount,
    gatewayModels,
  })
})

/**
 * 将模型标签（tags）映射为系统统一模型类型（UnifiedModelType）。
 */
const TAG_TO_MODEL_TYPE: Array<{ patterns: RegExp[]; type: UnifiedModelType }> = [
  {
    patterns: [/文本分析/i, /text.?analysis/i, /llm/i, /文本生成/i, /text.?gen/i, /对话/i, /chat/i, /大语言/i, /语言模型/i, /language.?model/i],
    type: 'llm',
  },
  {
    patterns: [/视频生成/i, /视频/i, /video/i, /video.?gen/i],
    type: 'video',
  },
  {
    patterns: [/图片生成/i, /图像生成/i, /图片/i, /图像/i, /image/i, /image.?gen/i],
    type: 'image',
  },
  {
    patterns: [/音频生成/i, /音频/i, /语音合成/i, /语音/i, /TTS/i, /audio/i, /speech/i, /voice/i],
    type: 'audio',
  },
  {
    patterns: [/口型同步/i, /唇形同步/i, /口型/i, /lipsync/i, /lip.?sync/i],
    type: 'lipsync',
  },
]

function resolveModelTypeFromTags(tags: string[]): UnifiedModelType | null {
  for (const tag of tags) {
    const normalizedTag = tag.trim()
    if (!normalizedTag) continue
    for (const rule of TAG_TO_MODEL_TYPE) {
      for (const pattern of rule.patterns) {
        if (pattern.test(normalizedTag)) return rule.type
      }
    }
  }
  return null
}

/**
 * 将网关原始模型列表去重并按 tags 映射到 UnifiedModelType 分组。
 */
function groupGatewayModelsByTag(
  rawModels: Array<{ id: string; name?: string; owned_by?: string; tags?: string[] }>,
): GatewayModelsByType {
  const seen = new Set<string>()
  const grouped: GatewayModelsByType = {}

  for (const raw of rawModels) {
    const modelId = typeof raw.id === 'string' ? raw.id.trim() : ''
    if (!modelId || seen.has(modelId)) continue
    seen.add(modelId)

    const tags = Array.isArray(raw.tags)
      ? raw.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : []
    if (tags.length === 0) continue

    const type = resolveModelTypeFromTags(tags)
    if (!type) continue

    const option: GatewayModelOption = {
      id: modelId,
      name: (typeof raw.name === 'string' && raw.name.trim()) || modelId,
      ownedBy: typeof raw.owned_by === 'string' ? raw.owned_by.trim() : undefined,
      type,
      tags,
    }

    if (!grouped[type]) grouped[type] = []
    grouped[type]!.push(option)
  }

  return grouped
}

/**
 * 从网关获取模型列表
 */
async function fetchModelsFromGateway(plainKey: string): Promise<{
  success: boolean
  rawModels?: Array<{ id: string; name?: string; owned_by?: string; tags?: string[] }>
}> {
  const host = process.env.MODEL_GATEWAY_URL || 'http://localhost:3000'

  try {
    const modelsRes = await fetch(`${host}/v1/models`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${plainKey}` },
      signal: AbortSignal.timeout(15000),
    })

    if (!modelsRes.ok) {
      return { success: false }
    }

    const modelsData = await modelsRes.json() as {
      data?: Array<{ id?: string; name?: string; owned_by?: string; tags?: string[] }>
      object?: string
    }

    const rawModels = Array.isArray(modelsData.data)
      ? modelsData.data.filter((m): m is { id: string; name?: string; owned_by?: string; tags?: string[] } =>
          typeof m?.id === 'string' && m.id.trim().length > 0,
        )
      : []

    if (rawModels.length === 0) {
      return { success: false }
    }

    return { success: true, rawModels }
  } catch {
    return { success: false }
  }
}
