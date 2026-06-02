import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserAuth, isErrorResponse } from '@/lib/api-auth'
import { apiHandler } from '@/lib/api-errors'
import { encryptApiKey, decryptApiKey } from '@/lib/crypto-utils'

/**
 * 多 UT-KEY 数据结构
 * utKey 字段存储 JSON 数组，每个元素为加密后的 key
 * 兼容旧格式：单个加密字符串自动升级为数组
 */

interface UtKeyEntry {
  encrypted: string   // 加密后的 key
  masked: string      // 遮蔽显示（前4+后4）
}

/** 从数据库 utKey 字段解析出 UtKeyEntry 数组（兼容旧单 key 格式） */
function parseUtKeyEntries(raw: string | null | undefined): UtKeyEntry[] {
  if (!raw) return []

  // 尝试解析为新格式 JSON 数组
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((enc: string) => {
        try {
          const plain = decryptApiKey(enc)
          const masked = plain.length > 8
            ? `${plain.slice(0, 4)}****${plain.slice(-4)}`
            : `${plain.slice(0, 2)}****`
          return { encrypted: enc, masked }
        } catch {
          return { encrypted: enc, masked: '****' }
        }
      })
    }
  } catch { /* 不是 JSON，当作旧格式单个加密 key */ }

  // 旧格式：单个加密字符串
  try {
    const plain = decryptApiKey(raw)
    const masked = plain.length > 8
      ? `${plain.slice(0, 4)}****${plain.slice(-4)}`
      : `${plain.slice(0, 2)}****`
    return [{ encrypted: raw, masked }]
  } catch {
    return [{ encrypted: raw, masked: '****' }]
  }
}

/** 将 UtKeyEntry 数组序列化为 JSON 字符串（用于写入数据库） */
function serializeUtKeyEntries(entries: UtKeyEntry[]): string {
  return JSON.stringify(entries.map(e => e.encrypted))
}

function maskPlainKey(plain: string): string {
  return plain.length > 8
    ? `${plain.slice(0, 4)}****${plain.slice(-4)}`
    : `${plain.slice(0, 2)}****`
}

/**
 * GET /api/user/utkey
 * 查询所有 UT-KEY 配置状态（不返回明文）
 */
export const GET = apiHandler(async () => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const pref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: { utKey: true },
  })

  const entries = parseUtKeyEntries(pref?.utKey)
  const configured = entries.length > 0

  return NextResponse.json({
    configured,
    keys: entries.map((e, i) => ({ id: i, masked: e.masked })),
    total: entries.length,
  })
})

/**
 * PUT /api/user/utkey
 * 添加 UT-KEY（支持批量添加，兼容旧单 key 格式）
 * - utKeys: string[] 批量添加多个 key
 * - utKey: string 单个 key（兼容旧格式）
 */
export const PUT = apiHandler(async (request) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const { utKey, utKeys } = body as { utKey?: string; utKeys?: string[] }

  // 兼容旧格式：单个 key 或批量 key
  let plainKeys: string[]
  if (utKeys && Array.isArray(utKeys) && utKeys.length > 0) {
    plainKeys = utKeys.map(k => k.trim()).filter(k => k !== '')
  } else if (utKey && utKey.trim() !== '') {
    plainKeys = [utKey.trim()]
  } else {
    return NextResponse.json({ error: 'UT-KEY 不能为空' }, { status: 400 })
  }

  if (plainKeys.length === 0) {
    return NextResponse.json({ error: 'UT-KEY 不能为空' }, { status: 400 })
  }

  // 查询已有 entries
  const pref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: { utKey: true },
  })
  const existingEntries = parseUtKeyEntries(pref?.utKey)

  // 检查已有明文列表
  const existingPlains = existingEntries.map(e => {
    try { return decryptApiKey(e.encrypted) } catch { return '' }
  })

  // 逐个添加（跳过重复）
  const addedEntries: UtKeyEntry[] = []
  const duplicateKeys: string[] = []

  for (const plain of plainKeys) {
    // 去重（与已有 + 本次新增的均比较）
    const allExisting = [...existingPlains, ...addedEntries.map(e => {
      try { return decryptApiKey(e.encrypted) } catch { return '' }
    })]
    if (allExisting.includes(plain)) {
      duplicateKeys.push(maskPlainKey(plain))
      continue
    }
    const encrypted = encryptApiKey(plain)
    const masked = maskPlainKey(plain)
    addedEntries.push({ encrypted, masked })
  }

  if (addedEntries.length === 0) {
    return NextResponse.json({
      error: duplicateKeys.length > 0
        ? '所有 UT-KEY 已存在，请勿重复添加'
        : 'UT-KEY 不能为空',
    }, { status: 409 })
  }

  // 合并并保存
  const newEntries = [...existingEntries, ...addedEntries]
  const serialized = serializeUtKeyEntries(newEntries)

  await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    update: { utKey: serialized },
    create: {
      userId: session.user.id,
      utKey: serialized,
    },
  })

  return NextResponse.json({
    configured: true,
    keys: newEntries.map((e, i) => ({ id: i, masked: e.masked })),
    total: newEntries.length,
    addedCount: addedEntries.length,
    duplicateCount: duplicateKeys.length,
    duplicateKeys,
  })
})

/**
 * DELETE /api/user/utkey
 * 删除指定位置的 UT-KEY（通过 index）
 */
export const DELETE = apiHandler(async (request) => {
  const authResult = await requireUserAuth()
  if (isErrorResponse(authResult)) return authResult
  const { session } = authResult

  const body = await request.json()
  const { index } = body as { index: number }

  const pref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: { utKey: true },
  })
  const existingEntries = parseUtKeyEntries(pref?.utKey)

  if (index < 0 || index >= existingEntries.length) {
    return NextResponse.json({ error: '无效的 UT-KEY 索引' }, { status: 400 })
  }

  // 删除指定 index
  const newEntries = existingEntries.filter((_, i) => i !== index)
  const serialized = newEntries.length > 0 ? serializeUtKeyEntries(newEntries) : null

  await prisma.userPreference.update({
    where: { userId: session.user.id },
    data: { utKey: serialized },
  })

  return NextResponse.json({
    configured: newEntries.length > 0,
    keys: newEntries.map((e, i) => ({ id: i, masked: e.masked })),
    total: newEntries.length,
  })
})