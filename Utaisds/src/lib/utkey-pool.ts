/**
 * UT-KEY 轮询池
 * 
 * 支持多 UT-KEY 的并发请求场景：
 * - 从数据库 utKey 字段解析出所有加密的 key
 * - 解密后按轮询（Round-Robin）策略分配 key
 * - 不同任务请求将使用不同的 key，提升并发能力
 */

import { prisma } from '@/lib/prisma'
import { decryptApiKey } from '@/lib/crypto-utils'
import { createScopedLogger } from '@/lib/logging/core'

const logger = createScopedLogger({ module: 'utkey-pool' })

/** 每个用户的轮询计数器（内存中，进程级别） */
const roundRobinCounter = new Map<string, number>()

/**
 * 从数据库 utKey 字段解析出所有明文 key
 * 兼容旧格式（单个加密字符串）和新格式（JSON 数组）
 */
function parsePlainKeys(raw: string | null | undefined): string[] {
  if (!raw) return []

  // 尝试解析为新格式 JSON 数组
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((enc: string) => {
        try { return decryptApiKey(enc) } catch { return '' }
      }).filter((k: string) => k !== '')
    }
  } catch { /* 不是 JSON，当作旧格式 */ }

  // 旧格式：单个加密字符串
  try {
    return [decryptApiKey(raw)]
  } catch {
    return []
  }
}

/**
 * 获取用户的下一个 UT-KEY（轮询策略）
 * 
 * @param userId 用户 ID
 * @returns 明文 UT-KEY，如果没有配置则返回 null
 */
export async function getNextUtKey(userId: string): Promise<string | null> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { utKey: true },
  })

  if (!pref?.utKey) return null

  const plainKeys = parsePlainKeys(pref.utKey)
  if (plainKeys.length === 0) return null

  // 单个 key 时直接返回
  if (plainKeys.length === 1) return plainKeys[0]

  // 多个 key 时轮询选择
  const currentCounter = roundRobinCounter.get(userId) || 0
  const selectedKey = plainKeys[currentCounter % plainKeys.length]

  // 更新计数器
  roundRobinCounter.set(userId, currentCounter + 1)

  logger.debug(`UT-KEY 轮询: userId=${userId}, selected=${currentCounter % plainKeys.length}, total=${plainKeys.length}`)

  return selectedKey
}

/**
 * 获取用户所有明文 UT-KEY（用于并发分发场景）
 * 
 * @param userId 用户 ID
 * @returns 明文 UT-KEY 数组，如果没有配置则返回空数组
 */
export async function getAllUtKeys(userId: string): Promise<string[]> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { utKey: true },
  })

  return parsePlainKeys(pref?.utKey)
}

/**
 * 检查用户是否已配置 UT-KEY（不解密，仅检查是否存在）
 */
export async function isUtKeyConfigured(userId: string): Promise<boolean> {
  const pref = await prisma.userPreference.findUnique({
    where: { userId },
    select: { utKey: true },
  })

  if (!pref?.utKey) return false

  // 检查新格式是否为空数组
  try {
    const parsed = JSON.parse(pref.utKey)
    if (Array.isArray(parsed)) return parsed.length > 0
  } catch { /* 旧格式 */ }

  return true
}
