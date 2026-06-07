import { prisma } from '@/lib/prisma'
import { safeParseJsonObject } from '@/lib/json-repair'
import { getProjectModelConfig } from '@/lib/config-service'

export type AnyObj = Record<string, unknown>

export function readText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function readRequiredString(value: unknown, field: string): string {
  const text = readText(value).trim()
  if (!text) {
    throw new Error(`${field} is required`)
  }
  return text
}

export function parseVisualResponse(responseText: string): AnyObj {
  return safeParseJsonObject(responseText) as AnyObj
}

export type ResolvedProjectModel = {
  id: string
  novelPromotionData: {
    id: string
    analysisModel: string
  }
}

/**
 * 解析项目模型配置，支持 fallback 到用户全局配置。
 * 优先级：项目配置 > 用户偏好 > 抛出错误
 */
export async function resolveProjectModel(projectId: string, userId: string): Promise<ResolvedProjectModel> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      novelPromotionData: {
        select: {
          id: true,
        },
      },
    },
  })
  if (!project) throw new Error('Project not found')
  if (!project.novelPromotionData) throw new Error('Novel promotion data not found')

  // 使用 getProjectModelConfig 获取配置（已包含 fallback 逻辑）
  const modelConfig = await getProjectModelConfig(projectId, userId)
  if (!modelConfig.analysisModel) {
    throw new Error('请先在设置页面配置分析模型')
  }

  return {
    id: project.id,
    novelPromotionData: {
      id: project.novelPromotionData.id,
      analysisModel: modelConfig.analysisModel,
    },
  }
}
