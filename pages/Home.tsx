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
  LogOut, Users, LayoutGrid, List, Network, Building2,
  Plus, Edit2, Trash2, X, Check, UserPlus
} from 'lucide-react'
import { ReactFlowOrgChart } from './components/ReactFlowOrgChart'

// Org Node Type
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

// User Type
interface User {
  id: string
  name: string
  email: string
  avatar: string
  department: string
  title: string
}

// Form Data Type
interface MemberFormData {
  name: string
  title: string
  department: string
  avatar: string
  email: string
  parentId: string
}

// View Type
type ViewMode = 'tree' | 'grid' | 'list' | 'department'

// Available Avatars
const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨', '📊', '📋', '🎨', '🖌️', '👤', '👥']

// Department Options
const departmentOptions = ['Executive Office', 'Technology', 'Product', 'Design', 'Marketing', 'HR', 'Finance']

// ===== Modal Component =====
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

// ===== Member Form Component =====
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
    department: initialData?.department || 'Technology',
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
      {/* Avatar Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Avatar</label>
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

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="Enter name"
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="Enter title"
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium mb-1">Department *</label>
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

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          placeholder="name@company.com"
        />
      </div>

      {/* Superior (Only for new member) */}
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium mb-1">Superior *</label>
          <select
            required
            value={formData.parentId}
            onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">Select Superior</option>
            {parentOptions.map(p => (
              <option key={p.id} value={p.id}>{p.name} - {p.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          {isEdit ? 'Save' : 'Add'}
        </button>
      </div>
    </form>
  )
}

// ===== View Toggle Component =====
function ViewToggle({ 
  currentView, 
  onViewChange 
}: { 
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void 
}) {
  const views: { id: ViewMode; icon: typeof Network; label: string }[] = [
    { id: 'tree', icon: Network, label: 'Tree' },
    { id: 'grid', icon: LayoutGrid, label: 'Grid' },
    { id: 'list', icon: List, label: 'List' },
    { id: 'department', icon: Building2, label: 'Department' },
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


// ===== Grid View =====
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
          {/* Action Buttons */}
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

// ===== List View =====
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
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Employee</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Title</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Department</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Level</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
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

// ===== Department View =====
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
    'Executive Office': 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    'Technology': 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    'Product': 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    'Design': 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
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
              {members.length} {members.length === 1 ? 'Person' : 'People'}
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

// ===== Main Component =====
export function Home() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [orgTree, setOrgTree] = useState<OrgNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [totalMembers, setTotalMembers] = useState(0)

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [actionLoading, setActionLoading] = useState(false)

  // Get all members as superior options
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

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const res = await $fetch('./api/org/tree')
      if (!res.ok) throw new Error('Load failed')
      
      const data = await res.json()
      if (data.success) {
        setOrgTree(data.tree)
        setTotalMembers(data.stats?.total || 0)
      } else {
        setError(data.error || 'Failed to load organization chart')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed')
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

  // Add Member
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
        alert(result.error || 'Add failed')
      }
    } catch {
      alert('Add failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Edit Member
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
        alert(result.error || 'Update failed')
      }
    } catch {
      alert('Update failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Member
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
        alert(result.error || 'Delete failed')
      }
    } catch {
      alert('Delete failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMove = useCallback(async (nodeId: string, newParentId: string) => {
    try {
      const url = `./api/org/member/${nodeId}/move`
      const res = await $fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newParentId }),
      })
      const result = await res.json()
      if (result.success) {
        await loadData()
      } else {
        alert(result.error || 'Move failed')
      }
    } catch {
      alert('Move failed')
    }
  }, [loadData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/90 px-5 py-4 shadow-lg">
          <Spinner className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  const renderView = () => {
    if (!orgTree) {
      return <div className="text-center py-12 text-muted-foreground">No organization data available</div>
    }

    switch (viewMode) {
      case 'tree':
        return (
          <ReactFlowOrgChart
            orgTree={orgTree}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMove={handleMove}
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
          <ReactFlowOrgChart
            orgTree={orgTree}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Organization Chart</h1>
              <p className="text-sm text-muted-foreground">Contoso Corporate Structure</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setSelectedParentId(''); setShowAddModal(true) }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add Member
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
                Logout
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Org Chart Card */}
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                Org Chart
                <span className="text-sm font-normal text-muted-foreground ml-2">Total {totalMembers} members</span>
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

      {/* Add Member Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Member">
        <MemberForm
          initialData={{ parentId: selectedParentId }}
          parentOptions={getParentOptions(orgTree)}
          onSubmit={handleAddSubmit}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedNode(null) }} title="Edit Member">
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelectedNode(null) }} title="Confirm Delete">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">{selectedNode?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowDeleteModal(false); setSelectedNode(null) }}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Deleting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
