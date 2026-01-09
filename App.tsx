import * as React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Spinner } from '#nexo/ui'
import type { MenuNode } from '@/layouts/components/MenuItem'
import { Home as HomeIcon, LogIn, Network } from 'lucide-react'

type RouteMeta = {
  name: string
  label: string
  path: string
  icon?: string
}

const DefaultLayout = React.lazy(() =>
  import('@/layouts').then((mod) => ({ default: mod.Default })),
)

const lazyPage = <C extends React.ComponentType>(
  importer: () => Promise<Record<string, C>>,
  exportName: string,
) => React.lazy(() => importer().then((mod) => ({ default: mod[exportName] })))

type PageConfig = {
  label: string
  path: string
  routePath: string
  isIndex?: boolean
  icon?: React.ComponentType
  Component: React.LazyExoticComponent<React.ComponentType>
}

const Icons: Record<string, React.ComponentType | undefined> = {
  Home: HomeIcon,
  LogIn: LogIn,
  Network: Network,
}

const pageModules = import.meta.glob('./pages/**/*.tsx')

const NotFoundPage = lazyPage(() => import('./pages/NotFound'), 'NotFound')

/**
 * 将 name 转换为组件名称（首字母大写）
 * 例如: "home" -> "Home"
 */
function toComponentName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * 从 name 推断 componentPath
 * 例如: "home" -> "Home.tsx"
 */
function getComponentPath(name: string): string {
  return `${toComponentName(name)}.tsx`
}

/**
 * 从 path 推断 routePath 和 isIndex
 */
function getRouteInfo(path: string): { routePath: string; isIndex: boolean } {
  if (path === '/') {
    return { routePath: '', isIndex: true }
  }
  return { routePath: path, isIndex: false }
}

function App() {
  const [routeMetas, setRouteMetas] = React.useState<RouteMeta[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // 优先从 window.__MANIFEST__ 获取（build 模式）
    if (window.__MANIFEST__?.menus) {
      setRouteMetas(window.__MANIFEST__.menus as RouteMeta[])
      setLoading(false)
      return
    }
    
    // 降级到 fetch（dev 模式）
    fetch('/manifest.json')
      .then(res => res.json())
      .then(data => {
        setRouteMetas(data.menus || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load manifest:', err)
        setRouteMetas([])
        setLoading(false)
      })
  }, [])

  const pages: PageConfig[] = React.useMemo(() => {
    return routeMetas
      .map((meta): PageConfig | null => {
        // 从 name 推断 componentPath 和 exportName
        const componentPath = getComponentPath(meta.name)
        const exportName = toComponentName(meta.name)
        const moduleKey = `./pages/${componentPath}`
        const importer = pageModules[moduleKey]

        if (!importer) {
          console.error(`Page module not found for ${moduleKey}`)
          return null
        }

        // 从 path 推断 routePath 和 isIndex
        const { routePath, isIndex } = getRouteInfo(meta.path)

        const iconComponent = meta.icon ? Icons[meta.icon] : undefined

        return {
          label: meta.label,
          path: meta.path,
          routePath,
          isIndex,
          icon: iconComponent,
          Component: lazyPage(importer as () => Promise<Record<string, React.ComponentType>>, exportName),
        }
      })
      .filter((page): page is PageConfig => page !== null)
  }, [routeMetas])

  const menuItems: MenuNode[] = React.useMemo(() => {
    return pages.map(({ label, path, icon }) => ({
      label,
      path,
      icon,
    }))
  }, [pages])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/40">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/90 px-5 py-4 shadow-lg backdrop-blur">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Spinner className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-medium text-foreground">Loading manifest...</div>
            <div className="text-xs text-muted-foreground">Initializing application</div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/40">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/90 px-5 py-4 shadow-lg backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Spinner className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-foreground">Loading content...</div>
              <div className="text-xs text-muted-foreground">Setting up your workspace</div>
            </div>
          </div>
        </div>
      }
    >
      <Routes>
        {pages.map(({ routePath, Component, isIndex }) =>
          isIndex ? (
            <Route key="index" path="/" element={<Component />} />
          ) : (
            <Route key={routePath} path={routePath} element={<Component />} />
          ),
        )}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </React.Suspense>
  )
}

export default App

