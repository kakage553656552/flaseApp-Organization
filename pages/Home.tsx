import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Spinner,
} from '#nexo/ui'
import { $fetch } from '#nexo/shared'
import { LogOut, Users, ChevronDown, ChevronRight, LayoutGrid, List, Network, Building2 } from 'lucide-react'

// 组织节点类型
interface OrgNode {
  id: string
  name: string
  title: string
  department: string
  avatar: string
  children?: OrgNode[]
}

// 用户类型
interface User {
  id: string
  name: string
  email: string
  avatar: string
  department: string
  title: string
}

// 视图类型
type ViewMode = 'tree' | 'grid' | 'list' | 'department'

// 视图切换按钮组件
function ViewToggle({ 
  currentView, 
  onViewChange 
}: { 
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void 
}) {
  const views: { id: ViewMode; icon: typeof Network; label: string }[] = [
    { id: 'tree', icon: Network, label: '树形图' },
    { id: 'grid', icon: LayoutGrid, label: '卡片视图' },
    { id: 'list', icon: List, label: '列表视图' },
    { id: 'department', icon: Building2, label: '部门视图' },
  ]

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border/60">
      {views.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
            ${currentView === id 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
          `}
          title={label}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

// 树形节点组件 - 上下垂直布局
function TreeNodeCard({ 
  node, 
  level = 0,
}: { 
  node: OrgNode
  level?: number
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* 节点卡片 */}
      <div 
        className={`
          relative flex flex-col items-center p-4 rounded-xl border border-border/60 
          bg-card hover:bg-accent/50 hover:border-primary/30 
          transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md
          min-w-[140px] max-w-[180px]
          ${level === 0 ? 'bg-primary/5 border-primary/20 shadow-lg' : ''}
        `}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* 头像 */}
        <div className={`
          w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-2
          ${level === 0 ? 'bg-primary/10 ring-2 ring-primary/20' : 'bg-muted'}
        `}>
          {node.avatar}
        </div>

        {/* 信息 */}
        <div className="text-center">
          <div className="font-semibold text-foreground text-sm">{node.name}</div>
          <div className="text-xs text-primary font-medium mt-0.5">{node.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{node.department}</div>
        </div>

        {/* 展开/收起指示器 */}
        {hasChildren && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm z-10">
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && expanded && (
        <>
          {/* 垂直连接线 */}
          <div className="w-px h-8 bg-border/60" />
          
          {/* 水平连接线（多个子节点时显示） */}
          {node.children!.length > 1 && (
            <div 
              className="h-px bg-border/60"
              style={{ 
                width: `calc(${(node.children!.length - 1) * 180}px + ${(node.children!.length - 1) * 16}px)` 
              }}
            />
          )}
          
          {/* 子节点容器 */}
          <div className="flex gap-4 pt-0">
            {node.children!.map((child, index) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* 每个子节点的垂直连接线 */}
                {node.children!.length > 1 && (
                  <div className="w-px h-4 bg-border/60" />
                )}
                <TreeNodeCard node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// 卡片网格视图
function GridView({ nodes }: { nodes: OrgNode[] }) {
  const flattenNodes = (node: OrgNode): OrgNode[] => {
    const result = [node]
    if (node.children) {
      node.children.forEach(child => result.push(...flattenNodes(child)))
    }
    return result
  }

  const allNodes = nodes.flatMap(flattenNodes)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {allNodes.map((node) => (
        <div 
          key={node.id}
          className="p-4 rounded-xl border border-border/60 bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl mb-3">
            {node.avatar}
          </div>
          <div className="font-semibold text-foreground">{node.name}</div>
          <div className="text-sm text-primary font-medium mt-1">{node.title}</div>
          <div className="text-xs text-muted-foreground mt-1 px-2 py-1 rounded-full bg-muted inline-block">
            {node.department}
          </div>
        </div>
      ))}
    </div>
  )
}

// 列表视图
function ListView({ nodes }: { nodes: OrgNode[] }) {
  const flattenNodes = (node: OrgNode, level = 0): (OrgNode & { level: number })[] => {
    const result: (OrgNode & { level: number })[] = [{ ...node, level }]
    if (node.children) {
      node.children.forEach(child => result.push(...flattenNodes(child, level + 1)))
    }
    return result
  }

  const allNodes = nodes.flatMap(n => flattenNodes(n))

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">员工</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">职位</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">部门</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">层级</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {allNodes.map((node) => (
            <tr key={node.id} className="hover:bg-accent/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{node.avatar}</span>
                  <span className="font-medium">{node.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-primary font-medium">{node.title}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{node.department}</td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  L{node.level + 1}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 部门分组视图
function DepartmentView({ nodes }: { nodes: OrgNode[] }) {
  const flattenNodes = (node: OrgNode): OrgNode[] => {
    const result = [node]
    if (node.children) {
      node.children.forEach(child => result.push(...flattenNodes(child)))
    }
    return result
  }

  const allNodes = nodes.flatMap(flattenNodes)
  
  // 按部门分组
  const departments = allNodes.reduce((acc, node) => {
    if (!acc[node.department]) {
      acc[node.department] = []
    }
    acc[node.department].push(node)
    return acc
  }, {} as Record<string, OrgNode[]>)

  const deptColors: Record<string, string> = {
    '总裁办': 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    '技术部': 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    '产品部': 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    '设计部': 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {Object.entries(departments).map(([dept, members]) => (
        <div 
          key={dept}
          className={`rounded-xl border bg-gradient-to-br p-4 ${deptColors[dept] || 'from-gray-500/20 to-gray-500/5 border-gray-500/30'}`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-foreground/70" />
            <h3 className="font-bold text-lg">{dept}</h3>
            <span className="ml-auto px-2 py-1 rounded-full bg-background/60 text-xs font-medium">
              {members.length} 人
            </span>
          </div>
          <div className="space-y-2">
            {members.map((member) => (
              <div 
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-background/60 hover:bg-background/80 transition-colors"
              >
                <span className="text-xl">{member.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{member.name}</div>
                  <div className="text-xs text-muted-foreground">{member.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [orgTree, setOrgTree] = useState<OrgNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user')
      
      if (!storedUser) {
        navigate('/login')
        return
      }

      setUser(JSON.parse(storedUser))
      
      try {
        const res = await $fetch('./api/org/tree')
        if (!res.ok) throw new Error('加载失败')
        
        const data = await res.json()
        if (data.success) {
          setOrgTree(data.tree)
        } else {
          setError(data.error || '加载组织架构失败')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await $fetch('./api/auth/logout', { method: 'POST' })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/login')
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/90 px-5 py-4 shadow-lg">
          <Spinner className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">加载中...</span>
        </div>
      </div>
    )
  }

  // 渲染对应视图
  const renderView = () => {
    if (!orgTree) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          暂无组织架构数据
        </div>
      )
    }

    switch (viewMode) {
      case 'tree':
        return <TreeNodeCard node={orgTree} />
      case 'grid':
        return <GridView nodes={[orgTree]} />
      case 'list':
        return <ListView nodes={[orgTree]} />
      case 'department':
        return <DepartmentView nodes={[orgTree]} />
      default:
        return <TreeNodeCard node={orgTree} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 顶部栏 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">组织架构</h1>
              <p className="text-sm text-muted-foreground">Contoso 公司人员结构图</p>
            </div>
          </div>

          {/* 用户信息 */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border/60">
                <span className="text-2xl">{user.avatar}</span>
                <div>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.title}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 组织架构图 */}
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                组织架构图
              </CardTitle>
              {/* 视图切换 */}
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4">
              {renderView()}
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground mt-1">总人数</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500">4</div>
                <div className="text-sm text-muted-foreground mt-1">部门数</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500">4</div>
                <div className="text-sm text-muted-foreground mt-1">层级深度</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
