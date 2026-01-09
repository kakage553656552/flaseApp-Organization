/**
 * Server-side API Routes
 * 组织架构图应用 - 支持 CRUD 操作
 */

// ============ Mock 数据 ============

// 组织节点
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

// 用户数据
interface User {
  id: string
  name: string
  email: string
  avatar: string
  department: string
  title: string
}

// 模拟当前登录用户
let currentUser: User | null = null

// 可用的头像列表
const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨', '📊', '📋', '🎨', '🖌️', '👤', '👥']

// Mock 组织架构数据（可修改）
let orgData: OrgNode = {
  id: 'u001',
  name: '王总',
  title: 'CEO',
  department: '总裁办',
  avatar: '👨‍💼',
  email: 'wangzong@contoso.com',
  parentId: null,
  children: [
    {
      id: 'u002',
      name: '张三',
      title: '技术总监',
      department: '技术部',
      avatar: '👨‍💻',
      email: 'zhangsan@contoso.com',
      parentId: 'u001',
      children: [
        {
          id: 'u003',
          name: '李四',
          title: '前端负责人',
          department: '技术部',
          avatar: '👨‍🎨',
          email: 'lisi@contoso.com',
          parentId: 'u002',
          children: [
            { id: 'u004', name: '王五', title: '前端工程师', department: '技术部', avatar: '👩‍💻', email: 'wangwu@contoso.com', parentId: 'u003' },
            { id: 'u005', name: '赵六', title: '前端工程师', department: '技术部', avatar: '👨‍💻', email: 'zhaoliu@contoso.com', parentId: 'u003' },
          ]
        },
        {
          id: 'u006',
          name: '钱七',
          title: '后端负责人',
          department: '技术部',
          avatar: '🧑‍💻',
          email: 'qianqi@contoso.com',
          parentId: 'u002',
          children: [
            { id: 'u007', name: '孙八', title: '后端工程师', department: '技术部', avatar: '👨‍💻', email: 'sunba@contoso.com', parentId: 'u006' },
            { id: 'u008', name: '周九', title: '后端工程师', department: '技术部', avatar: '👩‍💻', email: 'zhoujiu@contoso.com', parentId: 'u006' },
          ]
        },
      ]
    },
    {
      id: 'u009',
      name: '吴十',
      title: '产品总监',
      department: '产品部',
      avatar: '📊',
      email: 'wushi@contoso.com',
      parentId: 'u001',
      children: [
        { id: 'u010', name: '郑一', title: '产品经理', department: '产品部', avatar: '📋', email: 'zhengyi@contoso.com', parentId: 'u009' },
      ]
    },
    {
      id: 'u011',
      name: '冯二',
      title: '设计总监',
      department: '设计部',
      avatar: '🎨',
      email: 'fenger@contoso.com',
      parentId: 'u001',
      children: [
        { id: 'u012', name: '陈三', title: 'UI设计师', department: '设计部', avatar: '🖌️', email: 'chensan@contoso.com', parentId: 'u011' },
      ]
    },
  ]
}

// 辅助函数：在树中查找节点
function findNode(tree: OrgNode, id: string): OrgNode | null {
  if (tree.id === id) return tree
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNode(child, id)
      if (found) return found
    }
  }
  return null
}

// 辅助函数：在树中查找父节点
function findParent(tree: OrgNode, childId: string): OrgNode | null {
  if (tree.children) {
    for (const child of tree.children) {
      if (child.id === childId) return tree
      const found = findParent(child, childId)
      if (found) return found
    }
  }
  return null
}

// 辅助函数：从树中删除节点
function removeNode(tree: OrgNode, id: string): boolean {
  if (tree.children) {
    const index = tree.children.findIndex(c => c.id === id)
    if (index !== -1) {
      tree.children.splice(index, 1)
      return true
    }
    for (const child of tree.children) {
      if (removeNode(child, id)) return true
    }
  }
  return false
}

// 辅助函数：统计节点数量
function countNodes(tree: OrgNode): number {
  let count = 1
  if (tree.children) {
    for (const child of tree.children) {
      count += countNodes(child)
    }
  }
  return count
}

// 生成唯一 ID
let idCounter = 100
function generateId(): string {
  return `u${++idCounter}`
}

// 转换为用户列表
function flattenTree(tree: OrgNode): User[] {
  const users: User[] = [{
    id: tree.id,
    name: tree.name,
    email: tree.email || '',
    avatar: tree.avatar,
    department: tree.department,
    title: tree.title,
  }]
  if (tree.children) {
    tree.children.forEach(child => users.push(...flattenTree(child)))
  }
  return users
}

// ============ API 路由 ============

const routes: ServerExports = {
  // 登录
  async 'POST /api/auth/login'(req: Request, ctx: Context) {
    const body = await req.json()
    const { email } = body
    const users = flattenTree(orgData)
    const user = email ? users.find(u => u.email === email) : users[0]
    
    if (!user) {
      return { success: false, error: '用户不存在' }
    }
    
    currentUser = user
    return {
      success: true,
      user,
      accessToken: `mock-token-${user.id}-${Date.now()}`,
    }
  },

  // 获取当前用户
  async 'GET /api/auth/me'(req: Request, ctx: Context) {
    if (!currentUser) {
      return { success: false, error: '未登录' }
    }
    return { success: true, user: currentUser }
  },

  // 退出登录
  async 'POST /api/auth/logout'(req: Request, ctx: Context) {
    currentUser = null
    return { success: true }
  },

  // 获取组织成员列表
  async 'GET /api/org/members'(req: Request, ctx: Context) {
    const members = flattenTree(orgData)
    return {
      success: true,
      members,
      total: members.length,
    }
  },

  // 获取组织架构树
  async 'GET /api/org/tree'(req: Request, ctx: Context) {
    return {
      success: true,
      tree: orgData,
      stats: {
        total: countNodes(orgData),
        avatarOptions,
      }
    }
  },

  // ===== CRUD 操作 =====

  // 创建成员
  async 'POST /api/org/member'(req: Request, ctx: Context) {
    const body = await req.json()
    const { name, title, department, avatar, email, parentId } = body

    if (!name || !title || !department || !parentId) {
      return { success: false, error: '缺少必填字段' }
    }

    const parent = findNode(orgData, parentId)
    if (!parent) {
      return { success: false, error: '上级不存在' }
    }

    const newMember: OrgNode = {
      id: generateId(),
      name,
      title,
      department,
      avatar: avatar || '👤',
      email: email || '',
      parentId,
    }

    if (!parent.children) {
      parent.children = []
    }
    parent.children.push(newMember)

    return {
      success: true,
      member: newMember,
      message: '成员添加成功',
    }
  },

  // 更新成员
  async 'PUT /api/org/member/:id'(req: Request, ctx: Context) {
    // 从 URL 中提取 id（ctx.params 在此框架中可能不可用）
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // 路径格式: /apps/test-app/api/org/member/:id
    const memberIndex = pathParts.indexOf('member')
    const id = memberIndex >= 0 && pathParts.length > memberIndex + 1 ? pathParts[memberIndex + 1] : ctx.params?.id
    
    if (!id) {
      return { success: false, error: '缺少成员 ID' }
    }

    const body = await req.json()
    const { name, title, department, avatar, email } = body

    const member = findNode(orgData, id)
    if (!member) {
      return { success: false, error: '成员不存在' }
    }

    // 更新字段
    if (name) member.name = name
    if (title) member.title = title
    if (department) member.department = department
    if (avatar) member.avatar = avatar
    if (email !== undefined) member.email = email

    return {
      success: true,
      member,
      message: '成员更新成功',
    }
  },

  // 删除成员
  async 'DELETE /api/org/member/:id'(req: Request, ctx: Context) {
    // 从 URL 中提取 id（ctx.params 在此框架中可能不可用）
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // 路径格式: /apps/test-app/api/org/member/:id
    const memberIndex = pathParts.indexOf('member')
    const id = memberIndex >= 0 && pathParts.length > memberIndex + 1 ? pathParts[memberIndex + 1] : ctx.params?.id
    
    if (!id) {
      return { success: false, error: '缺少成员 ID' }
    }

    // 不能删除根节点
    if (id === orgData.id) {
      return { success: false, error: '不能删除根节点' }
    }

    const member = findNode(orgData, id)
    if (!member) {
      return { success: false, error: '成员不存在' }
    }

    // 检查是否有子节点
    if (member.children && member.children.length > 0) {
      return { success: false, error: '请先删除该成员的下属' }
    }

    const removed = removeNode(orgData, id)
    if (!removed) {
      return { success: false, error: '删除失败' }
    }

    return {
      success: true,
      message: '成员删除成功',
    }
  },

  // 获取单个成员详情
  async 'GET /api/org/member/:id'(req: Request, ctx: Context) {
    // 从 URL 中提取 id（ctx.params 在此框架中可能不可用）
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // 路径格式: /apps/test-app/api/org/member/:id
    const memberIndex = pathParts.indexOf('member')
    const id = memberIndex >= 0 && pathParts.length > memberIndex + 1 ? pathParts[memberIndex + 1] : ctx.params?.id
    
    if (!id) {
      return { success: false, error: '缺少成员 ID' }
    }

    const member = findNode(orgData, id)
    if (!member) {
      return { success: false, error: '成员不存在' }
    }

    return {
      success: true,
      member,
    }
  },

  // 移动成员到新的上级
  async 'POST /api/org/member/:id/move'(req: Request, ctx: Context) {
    // 从 URL 中提取 id
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // 路径格式: /apps/test-app/api/org/member/:id/move
    const moveIndex = pathParts.indexOf('move')
    const id = moveIndex > 0 ? pathParts[moveIndex - 1] : ctx.params?.id
    
    console.log('Move API called:', { url: req.url, id, pathParts })
    
    if (!id) {
      return { success: false, error: '缺少成员 ID' }
    }

    const body = await req.json()
    const { newParentId } = body

    if (!newParentId) {
      return { success: false, error: '缺少目标上级 ID' }
    }

    // 不能移动根节点
    if (id === orgData.id) {
      return { success: false, error: '不能移动根节点' }
    }

    // 不能移动到自己下面
    if (id === newParentId) {
      return { success: false, error: '不能移动到自己下面' }
    }

    const member = findNode(orgData, id)
    if (!member) {
      return { success: false, error: '成员不存在' }
    }

    const newParent = findNode(orgData, newParentId)
    if (!newParent) {
      return { success: false, error: '目标上级不存在' }
    }

    // 检查是否会形成循环（不能移动到自己的子节点下）
    const isDescendant = (node: OrgNode, targetId: string): boolean => {
      if (node.id === targetId) return true
      if (node.children) {
        for (const child of node.children) {
          if (isDescendant(child, targetId)) return true
        }
      }
      return false
    }

    if (isDescendant(member, newParentId)) {
      return { success: false, error: '不能移动到自己的下属节点下' }
    }

    // 从原位置移除
    const removed = removeNode(orgData, id)
    if (!removed) {
      return { success: false, error: '移动失败' }
    }

    // 添加到新位置
    if (!newParent.children) {
      newParent.children = []
    }
    member.parentId = newParentId
    newParent.children.push(member)

    return {
      success: true,
      message: '成员移动成功',
      member,
    }
  },

  // Hello World
  async 'GET /api/hello'(req: Request, ctx: Context) {
    return {
      message: 'Hello World!',
      timestamp: new Date().toISOString(),
      app: ctx.app,
    }
  },
}

export default routes
