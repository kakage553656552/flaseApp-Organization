import { memo, useCallback, useState, useEffect, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'

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

// 表单数据类型
interface MemberFormData {
  name: string
  title: string
  department: string
  avatar: string
  email: string
  parentId: string
}

// 可用头像
const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨', '📊', '📋', '🎨', '🖌️', '👤', '👥']

// 部门选项
const departmentOptions = ['总裁办', '技术部', '产品部', '设计部', '市场部', '人事部', '财务部']

// 部门颜色映射
const departmentColors: Record<string, { bg: string; border: string; text: string }> = {
  '总裁办': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
  '技术部': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  '产品部': { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
  '设计部': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  '市场部': { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' },
  '人事部': { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  '财务部': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700' },
}

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
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

// ===== 自定义节点组件 =====
interface OrgNodeData {
  orgNode: OrgNode
  isRoot: boolean
  onEdit: (node: OrgNode) => void
  onDelete: (node: OrgNode) => void
  onAdd: (parentId: string) => void
  isMovingOver?: boolean
}

const OrgNodeComponent = memo(({ data }: NodeProps<OrgNodeData>) => {
  const [showActions, setShowActions] = useState(false)
  const { orgNode, isRoot, onEdit, onDelete, onAdd } = data
  
  const colors = departmentColors[orgNode.department] || {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700'
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 上方连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary/50 !border-2 !border-primary"
      />

      {/* 节点卡片 */}
      <div
        className={`
          relative flex flex-col items-center p-4 rounded-xl border-2 
          ${colors.bg} ${colors.border}
          transition-all duration-200 shadow-lg hover:shadow-xl
          min-w-[160px] max-w-[200px]
          ${isRoot ? 'ring-2 ring-primary/30 ring-offset-2' : ''}
          ${data.isMovingOver ? 'ring-4 ring-emerald-500 scale-105 border-emerald-500 shadow-2xl z-50' : ''}
        `}
      >
        {/* 操作按钮 */}
        {showActions && (
          <div className="absolute -top-3 -right-3 flex gap-1 z-10">
            <button
              onClick={() => onAdd(orgNode.id)}
              className="p-1.5 bg-emerald-500 text-white rounded-full shadow-md hover:bg-emerald-600 transition-colors"
              title="添加下属"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={() => onEdit(orgNode)}
              className="p-1.5 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-colors"
              title="编辑"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            {!isRoot && (
              <button
                onClick={() => onDelete(orgNode)}
                className="p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                title="删除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 头像 */}
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-2 bg-white/80 shadow-inner">
          {orgNode.avatar}
        </div>

        {/* 信息 */}
        <div className="text-center">
          <div className="font-semibold text-foreground text-sm">{orgNode.name}</div>
          <div className={`text-xs font-medium mt-0.5 ${colors.text}`}>{orgNode.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 px-2 py-0.5 rounded-full bg-white/60">
            {orgNode.department}
          </div>
        </div>


      </div>

      {/* 下方连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary/50 !border-2 !border-primary"
      />
    </div>
  )
})


OrgNodeComponent.displayName = 'OrgNodeComponent'


// ===== React Flow 组织架构图主组件 =====
interface ReactFlowOrgChartProps {
  orgTree: OrgNode
  onAdd: (parentId: string) => void
  onEdit: (node: OrgNode) => void
  onDelete: (node: OrgNode) => void
  onMove: (nodeId: string, newParentId: string) => void
}

function ReactFlowOrgChartInternal({
  orgTree,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: ReactFlowOrgChartProps) {
  const { getNodes } = useReactFlow()
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  // 转换函数
  const convertToFlow = useCallback((): { nodes: Node<OrgNodeData>[]; edges: Edge[] } => {
    const nodes: Node<OrgNodeData>[] = []
    const edges: Edge[] = []
    
    const nodeWidth = 180
    const nodeHeight = 140
    const horizontalSpacing = 40
    const verticalSpacing = 80

    function getSubtreeWidth(node: OrgNode): number {
      if (!node.children || node.children.length === 0) {
        return nodeWidth
      }
      const childrenWidth = node.children.reduce((sum, child) => 
        sum + getSubtreeWidth(child) + horizontalSpacing, -horizontalSpacing)
      return Math.max(nodeWidth, childrenWidth)
    }

    function processNode(node: OrgNode, x: number, y: number, isRoot = false): void {
      nodes.push({
        id: node.id,
        type: 'orgNode',
        position: { x, y },
        data: {
          orgNode: node,
          isRoot,
          onEdit,
          onDelete,
          onAdd,
          isMovingOver: hoveredNodeId === node.id
        },
        draggable: !isRoot, // 根节点不可移动
      })

      if (node.children && node.children.length > 0) {
        const totalWidth = node.children.reduce((sum, child) => 
          sum + getSubtreeWidth(child) + horizontalSpacing, -horizontalSpacing)
        
        let currentX = x + nodeWidth / 2 - totalWidth / 2

        node.children.forEach((child) => {
          const childWidth = getSubtreeWidth(child)
          const childX = currentX + childWidth / 2 - nodeWidth / 2
          const childY = y + nodeHeight + verticalSpacing

          edges.push({
            id: `${node.id}-${child.id}`,
            source: node.id,
            target: child.id,
            type: 'smoothstep',
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#94a3b8',
              width: 15,
              height: 15,
            },
          })

          processNode(child, childX, childY)
          currentX += childWidth + horizontalSpacing
        })
      }
    }

    processNode(orgTree, 0, 0, true)
    return { nodes, edges }
  }, [orgTree, onEdit, onDelete, onAdd, hoveredNodeId])

  const { nodes: initialNodes, edges: initialEdges } = convertToFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // 使用 useMemo 缓存 nodeTypes
  const nodeTypes = useMemo(() => ({
    orgNode: OrgNodeComponent,
  }), [])

  // 当 orgTree 或 hoveredNodeId 变化时更新
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertToFlow()
    setNodes(newNodes)
    setEdges(newEdges)
  }, [orgTree, hoveredNodeId, convertToFlow, setNodes, setEdges])

  // 处理拖拽中
  const onNodeDrag = useCallback((_: any, node: Node) => {
    const allNodes = getNodes()
    const found = allNodes.find((n) => {
      if (n.id === node.id) return false
      const x = node.position.x + 90
      const y = node.position.y + 70
      return (
        x >= n.position.x &&
        x <= n.position.x + 180 &&
        y >= n.position.y &&
        y <= n.position.y + 140
      )
    })
    setHoveredNodeId(found ? found.id : null)
  }, [getNodes])

  // 处理拖拽停止
  const onNodeDragStop = useCallback((_: any, node: Node) => {
    const allNodes = getNodes()
    setHoveredNodeId(null)
    
    // 查找当前节点中心点所在的节点
    const droppedOnNode = allNodes.find((n) => {
      if (n.id === node.id) return false
      
      const x = node.position.x + 90 // 节点半宽
      const y = node.position.y + 70 // 节点半高
      
      return (
        x >= n.position.x &&
        x <= n.position.x + 180 &&
        y >= n.position.y &&
        y <= n.position.y + 140
      )
    })

    if (droppedOnNode) {
      onMove(node.id, droppedOnNode.id)
    } else {
      // 如果没掉到任何节点上，重置位置（通过重新转换数据）
      const { nodes: resetNodes } = convertToFlow()
      setNodes(resetNodes)
    }
  }, [getNodes, onMove, convertToFlow, setNodes])

  return (
    <div className="w-full h-[600px] rounded-xl border border-border overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-left"
        nodesDraggable={true}
        panOnDrag={true} // 启用左键在背景处拖拽平移
        selectionKeyCode={null}
      >
        <Controls 
          className="!bg-white !border-border !shadow-lg"
          showInteractive={false}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#cbd5e1"
        />
      </ReactFlow>
      
      {/* 提示 */}
      <div className="absolute bottom-4 left-4 px-3 py-2 bg-white/90 rounded-lg shadow text-xs text-muted-foreground">
        💡 直接拖动<span className="text-primary font-medium">节点卡片</span>到目标节点上即可移动人员关系
      </div>
    </div>
  )
}

function ReactFlowWrapper(props: ReactFlowOrgChartProps) {
  return (
    <ReactFlowProvider>
      <ReactFlowOrgChartInternal {...props} />
    </ReactFlowProvider>
  )
}

export { ReactFlowWrapper as ReactFlowOrgChart }
export { Modal, MemberForm }
export type { OrgNode, MemberFormData }


