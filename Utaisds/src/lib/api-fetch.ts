/**
 * 从路径中提取语言
 * @param pathname 路径
 * @returns 语言
 */
const LOCALE_PATH_PATTERN = /^\/(zh|en)(\/|$)/

function resolveLocaleFromPath(pathname: string): string {
  const match = pathname.match(LOCALE_PATH_PATTERN)
  return match?.[1] ?? 'zh'
}

export function getPageLocale(): string {
  if (typeof window === 'undefined') return 'zh'
  return resolveLocaleFromPath(window.location.pathname)
}

function resolveRequestPathname(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    if (input.startsWith('/')) return input
    try {
      return new URL(input).pathname
    } catch {
      return ''
    }
  }

  if (input instanceof URL) {
    return input.pathname
  }

  try {
    return new URL(input.url).pathname
  } catch {
    return ''
  }
}

function shouldInjectLocaleHeader(input: RequestInfo | URL): boolean {
  const pathname = resolveRequestPathname(input)
  return pathname === '/api' || pathname.startsWith('/api/')
}

export function mergeLocaleHeader(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getPageLocale())
  }
  return { ...init, headers }
}

/**
 * 发送 API 请求
 * 自动添加语言头
 * @param input 请求输入
 * @param init 请求初始化
 * @returns 响应
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!shouldInjectLocaleHeader(input)) {
    return fetch(input, init)
  }
  return fetch(input, mergeLocaleHeader(init))
}
