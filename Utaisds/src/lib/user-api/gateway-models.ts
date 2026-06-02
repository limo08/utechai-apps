/**
 * 网关模型类型定义 — 客户端与服务端共享
 *
 * UT-KEY 验证成功后，网关返回的模型列表按 tags 字段分组后用于填充
 * "默认模型配置"中的下拉框（文本分析、视频、图片、音频、口型同步）。
 */
import type { UnifiedModelType } from '@/lib/model-config-contract'

/** 网关返回的单个模型（按 tags 分组后的结构） */
export interface GatewayModelOption {
  id: string           // 模型 ID（网关原始 id）
  name: string         // 显示名称
  ownedBy?: string     // 所属厂商
  type: UnifiedModelType  // 映射后的统一类型
  tags: string[]       // 原始标签
}

/** 按 UnifiedModelType 分组的模型集合 */
export type GatewayModelsByType = Partial<Record<UnifiedModelType, GatewayModelOption[]>>
