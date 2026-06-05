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
  | 'text'          // 文本分析
  | 'image'         // 图像生成
  | 'video'         // 视频生成
  | 'tts'           // 语音合成
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
  if (unifiedType === 'tts') {
    const hasVoiceDesignTag = tags.some((tag) => {
      const normalized = tag.trim()
      if (!normalized) return false
      return VOICE_DESIGN_TAG_PATTERNS.some((pattern) => pattern.test(normalized))
    })
    if (hasVoiceDesignTag) return 'voice_design'
    return 'tts'
  }
  // llm → llm, image → image, video → video, lipsync → lipsync
  return unifiedType
}

/**
 * 构建网关模型的 modelKey（格式: "gateway::modelId__type"）。
 * 同一个模型可以出现在多个类型分组中（如同时是 lipsync 和 voice_design），
 * 所以 modelKey 需要包含类型信息以避免唯一约束冲突。
 * 使用 __ 作为类型分隔符，避免与 provider::modelId 的 :: 冲突。
 */
function composeGatewayModelKey(modelId: string, type: UnifiedModelType): string {
  return `gateway::${modelId}__${type}`
}

/**
 * 将网关模型列表持久化到 AvailableModel 表。
 * 先清除该用户所有旧的网关模型（modelKey 以 "gateway::" 开头），再批量插入新数据，
 * 确保数据与网关完全一致。
 *
 * 注意：同一个模型可能属于多个类型（如同时是 lipsync 和 voice_design），
 * 所以 modelKey 格式为 "gateway::modelId::type"，以确保唯一性。
 *
 * @param userId 当前用户 ID
 * @param gatewayModels 按 UnifiedModelType 分组的网关模型列表
 */
export async function persistGatewayModels(
  userId: string,
  gatewayModels: GatewayModelsByType,
): Promise<void> {
  // 构建批量创建操作
  const createOperations: Array<ReturnType<typeof prisma.availableModel.create>> = []

  for (const [unifiedType, models] of Object.entries(gatewayModels)) {
    if (!Array.isArray(models)) continue
    const type = unifiedType as UnifiedModelType

    for (const model of models) {
      const modelKey = composeGatewayModelKey(model.id, type)
      const displayType = resolveDisplayModelType(type, model.tags ?? [])

      createOperations.push(
        prisma.availableModel.create({
          data: {
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
        }),
      )
    }
  }

  // 事务：先删除旧的网关模型，再批量插入新的
  await prisma.$transaction([
    // 删除所有 gateway:: 前缀的旧模型
    prisma.availableModel.deleteMany({
      where: {
        userId,
        modelKey: { startsWith: 'gateway::' },
      },
    }),
    // 批量插入新模型
    ...createOperations,
  ])
}
