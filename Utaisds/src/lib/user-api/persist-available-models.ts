/**
 * 将网关获取到的可用模型持久化到数据库（AvailableModel 表）。
 *
 * UT-KEY 验证成功后，将网关返回的模型列表（GatewayModelsByType）
 * 存入 available_models 表，供"默认模型配置"下拉框从数据库读取。
 */
import { prisma } from '@/lib/prisma'
import type { GatewayModelsByType } from './gateway-models'
import type { UnifiedModelType } from '@/lib/model-config-contract'

/**
 * 模型展示分类（7 种），用于前端"默认模型配置"下拉框分组。
 * 与 UnifiedModelType（5 种）不同：audio 被拆分为 audio（语音合成）和 voice_design（音色设计），
 * 另增 other（其他）用于无法归类的模型。
 */
export type DisplayModelType =
  | 'llm'           // 文本分析
  | 'image'         // 图像生成
  | 'video'         // 视频生成
  | 'audio'         // 语音合成
  | 'lipsync'       // 口型同步
  | 'voice_design'  // 音色设计
  | 'other'         // 其他

/** 音色设计相关的标签匹配模式（从 audio 中区分出 voice_design） */
const VOICE_DESIGN_TAG_PATTERNS: RegExp[] = [
  /音色设计/i,
  /voice.?design/i,
  /声音设计/i,
  /sound.?design/i,
]

/**
 * 根据 UnifiedModelType 和原始 tags 确定展示分类（DisplayModelType）。
 * audio 类型会根据 tags 进一步区分为 audio（语音合成）或 voice_design（音色设计）。
 */
function resolveDisplayModelType(
  unifiedType: UnifiedModelType,
  tags: string[],
): DisplayModelType {
  if (unifiedType === 'audio') {
    const hasVoiceDesignTag = tags.some((tag) => {
      const normalized = tag.trim()
      if (!normalized) return false
      return VOICE_DESIGN_TAG_PATTERNS.some((pattern) => pattern.test(normalized))
    })
    if (hasVoiceDesignTag) return 'voice_design'
    return 'audio'
  }
  // llm → llm, image → image, video → video, lipsync → lipsync
  return unifiedType
}

/**
 * 构建网关模型的 modelKey（格式: "gateway::modelId"）。
 */
function composeGatewayModelKey(modelId: string): string {
  return `gateway::${modelId}`
}

/**
 * 将网关模型列表持久化到 AvailableModel 表。
 * 使用 upsert（基于 userId + modelKey 唯一约束）确保幂等性。
 *
 * @param userId 当前用户 ID
 * @param gatewayModels 按 UnifiedModelType 分组的网关模型列表
 */
export async function persistGatewayModels(
  userId: string,
  gatewayModels: GatewayModelsByType,
): Promise<void> {
  const operations: Array<ReturnType<typeof prisma.availableModel.upsert>> = []

  for (const [unifiedType, models] of Object.entries(gatewayModels)) {
    if (!Array.isArray(models)) continue
    const type = unifiedType as UnifiedModelType

    for (const model of models) {
      const modelKey = composeGatewayModelKey(model.id)
      const displayType = resolveDisplayModelType(type, model.tags ?? [])

      operations.push(
        prisma.availableModel.upsert({
          where: {
            userId_modelKey: {
              userId,
              modelKey,
            },
          },
          create: {
            userId,
            modelKey,
            modelId: model.id,
            name: model.name || model.id,
            ownedBy: model.ownedBy || null,
            modelType: displayType,
            unifiedType: type,
            tags: JSON.stringify(model.tags ?? []),
            enabled: true,
          },
          update: {
            name: model.name || model.id,
            ownedBy: model.ownedBy || null,
            modelType: displayType,
            unifiedType: type,
            tags: JSON.stringify(model.tags ?? []),
            enabled: true,
          },
        }),
      )
    }
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations)
  }
}
