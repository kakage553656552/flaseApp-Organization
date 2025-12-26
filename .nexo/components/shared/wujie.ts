
interface Bridge {
  bus?: {
    $on: (event: string, callback: Function) => void
    $off: (event: string, callback: Function) => void
    $emit: (event: string, data?: any) => void
  }
  shadowRoot?: ShadowRoot
  props?: Record<string, any>
  location?: Location
  get?: (key: string) => any
  set?: (key: string, value: any) => void
}

export interface AppInfo {
  name: string
  url: string
  el: string | HTMLElement
  alive?: boolean
  degrade?: boolean
  props?: Record<string, any>
  attrs?: Record<string, any>
  replace?: boolean
  fetch?: (url: string, options?: RequestInit) => Promise<Response>
  plugins?: any[]
  beforeLoad?: (appWindow: Window) => void
  beforeMount?: (appWindow: Window) => void
  afterMount?: (appWindow: Window) => void
  beforeUnmount?: (appWindow: Window) => void
  afterUnmount?: (appWindow: Window) => void
  activated?: (appWindow: Window) => void
  deactivated?: (appWindow: Window) => void
  loadError?: (url: string, e: Error) => void
}

export function getBridge(): Bridge {
  if (typeof window !== 'undefined') {
    return (window as any).$wujie || (window as any).__WUJIE || {}
  }
  return {}
}

export function getApp(): AppInfo | null {
  const runtime = getBridge()
  if (runtime.get) {
    return runtime.get('subAppInfo') || null
  }
  return null
}

export function appName(): string | null {
  const info = getApp()
  return info?.name || null
}

export function appUrl(): string | null {
  const info = getApp()
  return info?.url || null
}

export function useMicroProps(): Record<string, any> {
  if (typeof window !== 'undefined') {
    const runtime = (window as any).$wujie
    if (runtime?.props) {
      return runtime.props
    }
    const legacyRuntime = (window as any).__WUJIE
    if (legacyRuntime?.props) {
      return legacyRuntime.props
    }
  }
  return {}
}

export function shadowRoot(): ShadowRoot | null {
  const runtime = getBridge()
  return runtime.shadowRoot || null
}

export function hostInfo(): {
  name?: string
  url?: string
  [key: string]: any
} {
  const runtime = getBridge()
  if (runtime.get) {
    return runtime.get('mainAppInfo') || {}
  }
  return {}
}

export function onEvent(event: string, callback: Function): void {
  const runtime = getBridge()
  if (runtime.bus?.$on) {
    runtime.bus.$on(event, callback)
  }
}

export function offEvent(event: string, callback: Function): void {
  const runtime = getBridge()
  if (runtime.bus?.$off) {
    runtime.bus.$off(event, callback)
  }
}

export function emitEvent(event: string, data?: any): void {
  const runtime = getBridge()
  if (runtime.bus?.$emit) {
    runtime.bus.$emit(event, data)
  }
}

export function inMicroApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as any).$wujie || !!(window as any).__WUJIE
}

export function appLocation(): Location | null {
  const runtime = getBridge()
  return runtime.location || window.location
}

export function getStorage(key: string): any {
  const runtime = getBridge()
  if (runtime.get) {
    return runtime.get(key)
  }
  return null
}

export function setStorage(key: string, value: any): void {
  const runtime = getBridge()
  if (runtime.set) {
    runtime.set(key, value)
  }
}

export function sendHost(event: string, data?: any): void {
  emitEvent(`sub-app:${event}`, data)
}

export function onHost(event: string, callback: (data?: any) => void): void {
  onEvent(`main-app:${event}`, callback)
}

export function sendApp(appName: string, event: string, data?: any): void {
  emitEvent(`sub-app:${appName}:${event}`, data)
}

export function onApp(appName: string, event: string, callback: (data?: any) => void): void {
  onEvent(`sub-app:${appName}:${event}`, callback)
}

export interface AuthOptions {
  headerName?: string
  tokenPropKeys?: string[]
  formatToken?: (token: string) => string
}

function resolveTokenFromProps(keys: string[]): string | undefined {
  const props = useMicroProps()
  for (const key of keys) {
    const value = props?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return undefined
}

function buildAuthHeaders(initHeaders?: HeadersInit, options?: AuthOptions): Headers {
  const headers = new Headers(initHeaders)
  const tokenKeys = options?.tokenPropKeys ?? ['token', 'authToken', 'accessToken']
  const token = resolveTokenFromProps(tokenKeys)
  const microProps = useMicroProps()

  const extraHeaderKeys = [
    'token',
    'tenantCode',
    'userId',
    'headUrl',
    'loginAsRoleId',
    'loginAsUserId',
    'timezoneOffset',
    'timezoneId',
  ]

  extraHeaderKeys.forEach((key) => {
    const value = microProps?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      headers.set(key, String(value))
    }
  })

  if (token) {
    const headerName = options?.headerName ?? 'Authorization'
    const formatted = options?.formatToken
      ? options.formatToken(token)
      : token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`
    headers.set(headerName, formatted)
  }

  return headers
}

/**
 * Get app ID from window.__MANIFEST__
 * The manifest is injected by manifest-plugin in both dev and build modes
 */
function getAppId(): string {
  if (typeof window !== 'undefined' && (window as any).__MANIFEST__) {
    const manifest = (window as any).__MANIFEST__
    if (manifest?.id) {
      return manifest.id
    }
  }
  
  // Fallback: use default app ID if manifest is not available
  return 'app'
}

/**
 * $fetch - Fetch API with automatic /apps/${appId}/api prefix and auth headers
 * 
 * This function automatically:
 * 1. Adds /apps/${appId}/api prefix to relative API paths (e.g., './api/hello' -> '/apps/${appId}/api/hello')
 * 2. Injects authentication headers from micro app props
 * 
 * Usage:
 *   const res = await $fetch('./api/hello')
 *   // In dev mode, this becomes: /apps/${appId}/api/hello
 */
export function $fetch(input: RequestInfo | URL, init?: RequestInit, options?: AuthOptions): Promise<Response> {
  let url: string
  
  if (typeof input === 'string') {
    url = input
  } else if (input instanceof URL) {
    url = input.href
  } else {
    url = input.url
  }
  
  // Only process relative paths (starting with './' or '/api' or '/apps/')
  // Absolute URLs (http://, https://) are passed through as-is
  if (url.startsWith('./') || (!url.startsWith('http://') && !url.startsWith('https://') && (url.startsWith('/api') || url.startsWith('/apps/')))) {
    let apiPath = url
    
    // Step 1: Remove leading './' if present
    if (apiPath.startsWith('./')) {
      apiPath = apiPath.substring(2)
    }
    
    // Step 2: Normalize path - ensure it starts with '/'
    if (!apiPath.startsWith('/')) {
      apiPath = `/${apiPath}`
    }
    
    // Step 3: Get appId and construct the full API prefix
    const appId = getAppId()
    const apiPrefix = `/apps/${appId}/api`
    
    // Step 4: Handle /api prefix intelligently
    if (apiPath.startsWith(apiPrefix)) {
      // Already has the correct prefix, keep as-is
      // e.g., /apps/react-template/api/hello -> /apps/react-template/api/hello
    } else if (apiPath.startsWith('/apps/')) {
      // Has /apps/ prefix but wrong format, extract path after /apps/${appId}/api or /apps/${appId}/
      // e.g., /apps/react-template/hello -> /apps/react-template/api/hello
      const appsMatch = apiPath.match(/^\/apps\/([^/]+)(\/.*)?$/)
      if (appsMatch) {
        const [, pathAppId, restPath = ''] = appsMatch
        if (pathAppId === appId) {
          // Same app, ensure /api prefix
          if (restPath.startsWith('/api')) {
            apiPath = apiPath // Already has /api
          } else {
            apiPath = `/apps/${appId}/api${restPath.startsWith('/') ? '' : '/'}${restPath}`
          }
        } else {
          // Different app ID, rebuild with current appId
          apiPath = `/apps/${appId}/api${restPath.startsWith('/') ? '' : '/'}${restPath}`
        }
      }
    } else if (apiPath.startsWith('/api/')) {
      // Has /api/ but not /apps/${appId}/api/, remove /api and add /apps/${appId}/api
      // e.g., /api/hello -> /apps/react-template/api/hello
      const pathWithoutApi = apiPath.substring(4) // Remove '/api'
      apiPath = `${apiPrefix}${pathWithoutApi.startsWith('/') ? '' : '/'}${pathWithoutApi}`
    } else {
      // No /api prefix, add /apps/${appId}/api
      // e.g., /hello -> /apps/react-template/api/hello
      apiPath = `${apiPrefix}${apiPath.startsWith('/') ? '' : '/'}${apiPath}`
    }
    
    url = apiPath
  }
  
  const headers = buildAuthHeaders(init?.headers, options)
  return fetch(url, { ...init, headers })
}

