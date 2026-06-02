import { NextResponse } from 'next/server'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { prisma } from '@/lib/prisma'
import { decryptApiKey } from '@/lib/crypto-utils'
import type { UnifiedModelType } from '@/lib/model-config-contract'
import type { GatewayModelOption, GatewayModelsByType } from '@/lib/user-api/gateway-models'

/**
 * POST /api/user/utkey/validate
 * 验证 UT-KEY 的合法性与可用性（通过 MODEL_GATEWAY_URL 的 /v1/models 接口验证）
 * UT-KEY 即 OneAPI/NewAPI 网关令牌，用 Bearer Token 调用 /v1/models，
 * 成功获取模型列表则 key 合法且可用。
 * 支持传入明文 key 直接验证：
 * - utKey: string 单个 key 验证（兼容旧格式）
 * - utKeys: string[] 批量验证多个 key
 * 不传 key 时从数据库读取已保存的 key 进行验证
 *
 * 验证成功后，额外返回按 tags 分组的模型列表（gatewayModels），
 * 用于前端"默认模型配置"下拉框。
 */

interface ValidateResult {
  key: string      // 遮蔽后的 key
  valid: boolean
  message: string
}

/** 网关返回的单个模型（按 tags 分组后的结构） — 从 gateway-models 共享 */
export type { GatewayModelOption, GatewayModelsByType }

export const POST = apiHandler(async (request) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const { utKey, utKeys } = body as { utKey?: string; utKeys?: string[] }

  // 收集待验证的明文 key 列表
  let plainKeys: string[]
  if (utKeys && Array.isArray(utKeys) && utKeys.length > 0) {
    plainKeys = utKeys.map(k => k.trim()).filter(k => k !== '')
  } else if (utKey && utKey.trim() !== '') {
    plainKeys = [utKey.trim()]
  } else {
    // 从数据库读取已保存的 key，全部验证
    const pref = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
      select: { utKey: true },
    })
    if (!pref?.utKey) {
      return NextResponse.json({ valid: false, message: 'UT-KEY 未配置' })
    }
    try {
      // 尝试解析多 key 格式
      try {
        const parsed = JSON.parse(pref.utKey)
        if (Array.isArray(parsed) && parsed.length > 0) {
          plainKeys = parsed.map((enc: string) => decryptApiKey(enc))
        } else {
          plainKeys = [decryptApiKey(pref.utKey)]
        }
      } catch {
        // 旧格式：单个加密字符串
        plainKeys = [decryptApiKey(pref.utKey)]
      }
    } catch {
      return NextResponse.json({ valid: false, message: 'UT-KEY 解密失败' })
    }
  }

  if (plainKeys.length === 0) {
    return NextResponse.json({ valid: false, message: 'UT-KEY 不能为空' })
  }

  // 逐个验证所有 key，统一返回 { valid, message } 格式
  const results: ValidateResult[] = []
  // 收集所有有效 key 返回的模型（合并去重）
  const allGatewayRawModels: Array<{ id: string; name?: string; owned_by?: string; tags?: string[] }> = []

  for (const plain of plainKeys) {
    const result = await validateSingleKey(plain)
    const masked = plain.length > 8
      ? `${plain.slice(0, 4)}****${plain.slice(-4)}`
      : `${plain.slice(0, 2)}****`
    results.push({
      key: masked,
      valid: result.valid,
      message: result.message || '',
    })
    // 收集模型数据（仅有效 key）
    if (result.valid && result.rawModels && result.rawModels.length > 0) {
      allGatewayRawModels.push(...result.rawModels)
    }
  }

  // 对收集到的所有模型去重并按 tags 分组
  const gatewayModels = groupGatewayModelsByTag(allGatewayRawModels)

  const validCount = results.filter(r => r.valid).length
  const invalidCount = results.length - validCount

  const baseResponse = {
    total: results.length,
    validCount,
    invalidCount,
    validKeys: results.filter(r => r.valid),
    invalidKeys: results.filter(r => !r.valid),
    // 始终返回 gatewayModels（即使为空对象，方便前端判断）
    gatewayModels,
  }

  if (validCount === results.length) {
    // 全部有效
    return NextResponse.json({
      valid: true,
      message: results.length === 1
        ? results[0].message
        : `全部 ${results.length} 个 KEY 验证成功`,
      ...baseResponse,
    })
  } else if (validCount > 0) {
    // 部分有效
    return NextResponse.json({
      valid: false,
      message: `${validCount} 个有效，${invalidCount} 个无效`,
      ...baseResponse,
    })
  } else {
    // 全部无效
    return NextResponse.json({
      valid: false,
      message: results.length === 1
        ? results[0].message
        : `全部 ${results.length} 个 KEY 验证失败`,
      invalidKeys: results,
      total: results.length,
      validCount,
      invalidCount,
      // 全部无效时不返回模型
      gatewayModels: {} as GatewayModelsByType,
    })
  }
})

/**
 * 将模型标签（tags）映射为系统统一模型类型（UnifiedModelType）。
 * 支持中文和英文标签，按优先级匹配第一个命中的标签。
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
 * 没有可识别 tag 的模型将被忽略（不参与下拉框展示）。
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
 * 验证单个 UT-KEY（通过 /v1/models 接口验证 key 的合法性与可用性）
 *
 * UT-KEY 即 OneAPI/NewAPI 网关的令牌（Token），验证方式为：
 * 用 UT-KEY 作为 Bearer Token 调用 /v1/models 接口，如果能成功获取模型列表，
 * 则说明 key 合法且可用；如果返回 401/403，则 key 无效或已禁用。
 *
 * 参考: MODEL_GATEWAY_URL — GET /v1/models (Authorization: Bearer <UT-KEY>)
 */
async function validateSingleKey(plainKey: string): Promise<{
  valid: boolean
  message: string
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
      // 认证失败：key 无效、已禁用或过期
      if (modelsRes.status === 401 || modelsRes.status === 403) {
        return {
          valid: false,
          message: `UT-KEY 无效或已禁用 (HTTP ${modelsRes.status})`,
        }
      }
      // 其他 HTTP 错误（如 429 限流、500 服务器错误）
      const text = await modelsRes.text().catch(() => '')
      return {
        valid: false,
        message: `验证请求失败 (HTTP ${modelsRes.status})${text ? `: ${text.slice(0, 200)}` : ''}`,
      }
    }

    const modelsData = await modelsRes.json() as {
      data?: Array<{ id?: string; name?: string; owned_by?: string; tags?: string[] }>
      object?: string
    }
    // OpenAI 格式返回 { object: "list", data: [...] }
    const rawModels = Array.isArray(modelsData.data)
      ? modelsData.data.filter((m): m is { id: string; name?: string; owned_by?: string; tags?: string[] } =>
          typeof m?.id === 'string' && m.id.trim().length > 0,
        )
      : []

    if (rawModels.length === 0) {
      return {
        valid: false,
        message: 'UT-KEY 验证通过，但可用模型列表为空',
      }
    }

    return {
      valid: true,
      message: `验证成功，可用 ${rawModels.length} 个模型`,
      rawModels,
    }
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error && error.name === 'AbortError'
        ? '验证请求超时，请稍后重试'
        : '无法连接验证服务器，请检查网络或 MODEL_GATEWAY_URL 配置',
    }
  }
}
