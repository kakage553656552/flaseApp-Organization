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
import { 
  LogOut, Users, ChevronDown, ChevronRight, LayoutGrid, List, Network, Building2,
  Plus, Edit2, Trash2, X, Check, UserPlus
} from 'lucide-react'

// 组织节点类型
interface OrgNode {
  id: string
  name: string
  title: string
  department: string
  avatar: string
  email?: string
  parentId?: string | null
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

// 表单数据类型
interface MemberFormData {
  name: string
  title: string
  department: string
  avatar: string
  email: string
  parentId: string
}

// 视图类型
type ViewMode = 'tree' | 'grid' | 'list' | 'department'

// 可用头像
const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨', '📊', '📋', '🎨', '🖌️', '👤', '👥']

// 部门选项
const departmentOptions = ['总裁办', '技术部', '产品部', '设计部', '市场部', '人事部', '财务部']

// ===== 弹窗组件 =====
function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children 
}: { 
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// ===== 成员表单组件 =====
function MemberForm({
  initialData,
  parentOptions,
  onSubmit,
  onCancel,
  isEdit = false,
}: {
  initialData?: Partial<MemberFormData>
  parentOptions: { id: string; name: string; title: string }[]
  onSubmit: (data: MemberFormData) => void
  onCancel: () => void
  isEdit?: boolean
}) {
  const [formData, setFormData] = useState<MemberFormData>({
    name: initialData?.name || '',
    title: initialData?.title || '',
    department: initialData?.department || '技术部',
    avatar: initialData?.avatar || '👤',
    email: initialData?.email || '',
    parentId: initialData?.parentId || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 头像选择 */}
      <div>
        <label className="block text-sm font-medium mb-2">头像</label>
        <div className="flex flex-wrap gap-2">
          {avatarOptions.map((avatar) => (
            <button
              key={avatar}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, avatar }))}
              className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                formData.avatar === avatar 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      {/* 姓名 */}
      <div>
        <label className="block text-sm font-medium mb-1">姓名 *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="请输入姓名"
        />
      </div>

      {/* 职位 */}
      <div>
        <label className="block text-sm font-medium mb-1">职位 *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="请输入职位"
        />
      </div>

      {/* 部门 */}
      <div>
        <label className="block text-sm font-medium mb-1">部门 *</label>
        <select
          required
          value={formData.department}
          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          {departmentOptions.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* 邮箱 */}
      <div>
        <label className="block text-sm font-medium mb-1">邮箱</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="name@company.com"
        />
      </div>

      {/* 上级（仅新增时显示） */}
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium mb-1">上级 *</label>
          <select
            required
            value={formData.parentId}
            onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">请选择上级</option>
            {parentOptions.map(p => (
              <option key={p.id} value={p.id}>{p.name} - {p.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* 按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          {isEdit ? '保存' : '添加'}
        </button>
      </div>
    </form>
  )
}

// ===== 视图切换组件 =====
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

// ===== 树形节点组件（支持拖拽）=====
function TreeNodeCard({ 
  node, 
  level = 0,
  onEdit,
  onDelete,
  onAdd,
  onMove,
  draggedNodeId,
  setDraggedNodeId,
}: { 
  node: OrgNode
  level?: number
  onEdit: (node: OrgNode) => void
  onDelete: (node: OrgNode) => void
  onAdd: (parentId: string) => void
  onMove: (nodeId: string, newParentId: string) => void
  draggedNodeId: string | null
  setDraggedNodeId: (id: string | null) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [showActions, setShowActions] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const hasChildren = node.children && node.children.length > 0

  // 检查是否可以放置到此节点（不能放到自己身上）
  const canDrop = draggedNodeId !== null && draggedNodeId !== node.id

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent) => {
    if (level === 0) {
      e.preventDefault()
      return
    }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', node.id)
    // 延迟设置，让浏览器先捕获元素
    setTimeout(() => setDraggedNodeId(node.id), 0)
  }

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedNodeId(null)
    setIsDragOver(false)
  }

  // 拖拽经过
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canDrop) {
      e.dataTransfer.dropEffect = 'move'
      setIsDragOver(true)
    }
  }

  // 拖拽离开
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  // 放置
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const draggedId = e.dataTransfer.getData('text/plain') || draggedNodeId
    console.log('Drop event:', { draggedId, targetId: node.id })
    
    if (draggedId && draggedId !== node.id) {
      console.log('Calling onMove:', draggedId, '->', node.id)
      try {
        await onMove(draggedId, node.id)
        console.log('onMove completed')
      } catch (err) {
        console.error('onMove error:', err)
      }
    }
    
    setIsDragOver(false)
    setDraggedNodeId(null)
  }

  const isDragging = draggedNodeId === node.id
  const isDropTarget = isDragOver && canDrop

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`
          relative flex flex-col items-center p-4 rounded-xl border border-border/60 
          bg-card hover:bg-accent/50 hover:border-primary/30 
          transition-all duration-200 shadow-sm hover:shadow-md
          min-w-[160px] max-w-[200px]
          ${level === 0 ? 'bg-primary/5 border-primary/20 shadow-lg' : ''}
          ${isDragging ? 'opacity-50 scale-95' : ''}
          ${isDropTarget ? 'ring-2 ring-primary ring-offset-2 bg-primary/10 border-primary' : ''}
          ${level > 0 ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        draggable={level > 0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* 拖放提示 */}
        {isDropTarget && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-xl z-20">
            <span className="text-xs font-medium text-primary px-2 py-1 bg-background rounded-full shadow">
              放置到此处
            </span>
          </div>
        )}

        {/* 操作按钮 */}
        {showActions && !draggedNodeId && (
          <div className="absolute -top-2 -right-2 flex gap-1 z-10">
            <button
              onClick={() => onAdd(node.id)}
              className="p-1.5 bg-emerald-500 text-white rounded-full shadow-md hover:bg-emerald-600 transition-colors"
              title="添加下属"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onEdit(node)}
              className="p-1.5 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-colors"
              title="编辑"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            {level > 0 && (
              <button
                onClick={() => onDelete(node)}
                className="p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                title="删除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 头像 */}
        <div 
          className={`
            w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-2
            ${level === 0 ? 'bg-primary/10 ring-2 ring-primary/20' : 'bg-muted'}
            ${level > 0 ? 'pointer-events-none' : 'cursor-pointer'}
          `}
          onClick={() => level === 0 && hasChildren && setExpanded(!expanded)}
        >
          {node.avatar}
        </div>

        {/* 信息 */}
        <div className="text-center pointer-events-none">
          <div className="font-semibold text-foreground text-sm">{node.name}</div>
          <div className="text-xs text-primary font-medium mt-0.5">{node.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{node.department}</div>
        </div>

        {/* 展开/收起指示器 */}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shadow-sm z-10 hover:bg-muted"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* 子节点 */}
      {hasChildren && expanded && (
        <>
          <div className="w-px h-8 bg-border/60" />
          {node.children!.length > 1 && (
            <div 
              className="h-px bg-border/60"
              style={{ width: `calc(${(node.children!.length - 1) * 180}px + ${(node.children!.length - 1) * 16}px)` }}
            />
          )}
          <div className="flex gap-4 pt-0">
            {node.children!.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                {node.children!.length > 1 && <div className="w-px h-4 bg-border/60" />}
                <TreeNodeCard 
                  node={child} 
                  level={level + 1} 
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAdd={onAdd}
                  onMove={onMove}
                  draggedNodeId={draggedNodeId}
                  setDraggedNodeId={setDraggedNodeId}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ===== 卡片网格视图 =====
function GridView({ 
  nodes, 
  onEdit, 
  onDelete 
}: { 
  nodes: OrgNode[]
  onEdit: (node: OrgNode) => void
  onDelete: (node: OrgNode) => void
}) {
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
          className="relative p-4 rounded-xl border border-border/60 bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md text-center group"
        >
          {/* 操作按钮 */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(node)}
              className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            {node.parentId && (
              <button
                onClick={() => onDelete(node)}
                className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
          
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

// ===== 列表视图 =====
function ListView({ 
  nodes, 
  onEdit, 
  onDelete 
}: { 
  nodes: OrgNode[]
  onEdit: (node: OrgNode) => void
  onDelete: (node: OrgNode) => void
}) {
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
            <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">操作</th>
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
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(node)}
                    className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {node.parentId && (
                    <button
                      onClick={() => onDelete(node)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== 部门分组视图 =====
function DepartmentView({ nodes }: { nodes: OrgNode[] }) {
  const flattenNodes = (node: OrgNode): OrgNode[] => {
    const result = [node]
    if (node.children) {
      node.children.forEach(child => result.push(...flattenNodes(child)))
    }
    return result
  }

  const allNodes = nodes.flatMap(flattenNodes)
  
  const departments = allNodes.reduce((acc, node) => {
    if (!acc[node.department]) acc[node.department] = []
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

// ===== 主组件 =====
export function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [orgTree, setOrgTree] = useState<OrgNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [totalMembers, setTotalMembers] = useState(0)

  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [actionLoading, setActionLoading] = useState(false)

  // 拖拽状态
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)

  // 获取所有成员作为上级选项
  const getParentOptions = useCallback((tree: OrgNode | null): { id: string; name: string; title: string }[] => {
    if (!tree) return []
    const options: { id: string; name: string; title: string }[] = []
    const traverse = (node: OrgNode) => {
      options.push({ id: node.id, name: node.name, title: node.title })
      node.children?.forEach(traverse)
    }
    traverse(tree)
    return options
  }, [])

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      const res = await $fetch('./api/org/tree')
      if (!res.ok) throw new Error('加载失败')
      
      const data = await res.json()
      if (data.success) {
        setOrgTree(data.tree)
        setTotalMembers(data.stats?.total || 0)
      } else {
        setError(data.error || '加载组织架构失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user')
      
      if (!storedUser) {
        navigate('/login')
        return
      }

      setUser(JSON.parse(storedUser))
      await loadData()
      setLoading(false)
    }

    checkAuth()
  }, [navigate, loadData])

  const handleLogout = useCallback(async () => {
    await $fetch('./api/auth/logout', { method: 'POST' })
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    navigate('/login')
  }, [navigate])

  // 添加成员
  const handleAdd = (parentId: string) => {
    setSelectedParentId(parentId)
    setShowAddModal(true)
  }

  const handleAddSubmit = async (data: MemberFormData) => {
    setActionLoading(true)
    try {
      const res = await $fetch('./api/org/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        await loadData()
        setShowAddModal(false)
      } else {
        alert(result.error || '添加失败')
      }
    } catch {
      alert('添加失败')
    } finally {
      setActionLoading(false)
    }
  }

  // 编辑成员
  const handleEdit = (node: OrgNode) => {
    setSelectedNode(node)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (data: MemberFormData) => {
    if (!selectedNode) return
    setActionLoading(true)
    try {
      const res = await $fetch(`./api/org/member/${selectedNode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.success) {
        await loadData()
        setShowEditModal(false)
        setSelectedNode(null)
      } else {
        alert(result.error || '更新失败')
      }
    } catch {
      alert('更新失败')
    } finally {
      setActionLoading(false)
    }
  }

  // 删除成员
  const handleDelete = (node: OrgNode) => {
    setSelectedNode(node)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedNode) return
    setActionLoading(true)
    try {
      const res = await $fetch(`./api/org/member/${selectedNode.id}`, {
        method: 'DELETE',
      })
      const result = await res.json()
      if (result.success) {
        await loadData()
        setShowDeleteModal(false)
        setSelectedNode(null)
      } else {
        alert(result.error || '删除失败')
      }
    } catch {
      alert('删除失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMove = useCallback(async (nodeId: string, newParentId: string) => {
    console.log('=== handleMove START ===')
    console.log('handleMove called:', { nodeId, newParentId })
    try {
      const url = `./api/org/member/${nodeId}/move`
      console.log('Fetching URL:', url)
      const res = await $fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newParentId }),
      })
      console.log('Response status:', res.status)
      const result = await res.json()
      console.log('Response data:', result)
      if (result.success) {
        console.log('Move success, reloading data...')
        await loadData()
        console.log('Data reloaded')
      } else {
        alert(result.error || '移动失败')
      }
    } catch (err) {
      console.error('Move error:', err)
      alert('移动失败')
    }
    console.log('=== handleMove END ===')
  }, [loadData])

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

  const renderView = () => {
    if (!orgTree) {
      return <div className="text-center py-12 text-muted-foreground">暂无组织架构数据</div>
    }

    switch (viewMode) {
      case 'tree':
        return (
          <TreeNodeCard 
            node={orgTree} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onAdd={handleAdd} 
            onMove={handleMove}
            draggedNodeId={draggedNodeId}
            setDraggedNodeId={setDraggedNodeId}
          />
        )
      case 'grid':
        return <GridView nodes={[orgTree]} onEdit={handleEdit} onDelete={handleDelete} />
      case 'list':
        return <ListView nodes={[orgTree]} onEdit={handleEdit} onDelete={handleDelete} />
      case 'department':
        return <DepartmentView nodes={[orgTree]} />
      default:
        return (
          <TreeNodeCard 
            node={orgTree} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
            onAdd={handleAdd}
            onMove={handleMove}
            draggedNodeId={draggedNodeId}
            setDraggedNodeId={setDraggedNodeId}
          />
        )
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

          {user && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setSelectedParentId(''); setShowAddModal(true) }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                添加成员
              </button>
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
                <span className="text-sm font-normal text-muted-foreground ml-2">共 {totalMembers} 人</span>
              </CardTitle>
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 overflow-auto">
              {renderView()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 添加成员弹窗 */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="添加成员">
        <MemberForm
          initialData={{ parentId: selectedParentId }}
          parentOptions={getParentOptions(orgTree)}
          onSubmit={handleAddSubmit}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* 编辑成员弹窗 */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedNode(null) }} title="编辑成员">
        {selectedNode && (
          <MemberForm
            initialData={{
              name: selectedNode.name,
              title: selectedNode.title,
              department: selectedNode.department,
              avatar: selectedNode.avatar,
              email: selectedNode.email || '',
            }}
            parentOptions={[]}
            onSubmit={handleEditSubmit}
            onCancel={() => { setShowEditModal(false); setSelectedNode(null) }}
            isEdit
          />
        )}
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedNode(null) }} title="删除确认">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            确定要删除 <span className="font-semibold text-foreground">{selectedNode?.name}</span> 吗？此操作不可撤销。
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowDeleteModal(false); setSelectedNode(null) }}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
