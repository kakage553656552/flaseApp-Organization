/**
 * Server-side API Routes
 * 组织架构图应用 - Mock 数据版本
 */

// ============ Mock 数据 ============

// 用户数据
interface User {
  id: string
  name: string
  email: string
  avatar: string
  department: string
  title: string
}

// 组织节点
interface OrgNode {
  id: string
  name: string
  title: string
  department: string
  avatar: string
  children?: OrgNode[]
}

// 模拟当前登录用户（简单的内存存储）
let currentUser: User | null = null

// Mock 用户列表
const mockUsers: User[] = [
  { id: 'u001', name: '王总', email: 'wangzong@contoso.com', avatar: '👨‍💼', department: '总裁办', title: 'CEO' },
  { id: 'u002', name: '张三', email: 'zhangsan@contoso.com', avatar: '👨‍💻', department: '技术部', title: '技术总监' },
  { id: 'u003', name: '李四', email: 'lisi@contoso.com', avatar: '👨‍🎨', department: '技术部', title: '前端负责人' },
  { id: 'u004', name: '王五', email: 'wangwu@contoso.com', avatar: '👩‍💻', department: '技术部', title: '前端工程师' },
  { id: 'u005', name: '赵六', email: 'zhaoliu@contoso.com', avatar: '👨‍💻', department: '技术部', title: '前端工程师' },
  { id: 'u006', name: '钱七', email: 'qianqi@contoso.com', avatar: '🧑‍💻', department: '技术部', title: '后端负责人' },
  { id: 'u007', name: '孙八', email: 'sunba@contoso.com', avatar: '👨‍💻', department: '技术部', title: '后端工程师' },
  { id: 'u008', name: '周九', email: 'zhoujiu@contoso.com', avatar: '👩‍💻', department: '技术部', title: '后端工程师' },
  { id: 'u009', name: '吴十', email: 'wushi@contoso.com', avatar: '📊', department: '产品部', title: '产品总监' },
  { id: 'u010', name: '郑一', email: 'zhengyi@contoso.com', avatar: '📋', department: '产品部', title: '产品经理' },
  { id: 'u011', name: '冯二', email: 'fenger@contoso.com', avatar: '🎨', department: '设计部', title: '设计总监' },
  { id: 'u012', name: '陈三', email: 'chensan@contoso.com', avatar: '🖌️', department: '设计部', title: 'UI设计师' },
]

// Mock 组织架构树
const mockOrgTree: OrgNode = {
  id: 'u001',
  name: '王总',
  title: 'CEO',
  department: '总裁办',
  avatar: '👨‍💼',
  children: [
    {
      id: 'u002',
      name: '张三',
      title: '技术总监',
      department: '技术部',
      avatar: '👨‍💻',
      children: [
        {
          id: 'u003',
          name: '李四',
          title: '前端负责人',
          department: '技术部',
          avatar: '👨‍🎨',
          children: [
            { id: 'u004', name: '王五', title: '前端工程师', department: '技术部', avatar: '👩‍💻' },
            { id: 'u005', name: '赵六', title: '前端工程师', department: '技术部', avatar: '👨‍💻' },
          ]
        },
        {
          id: 'u006',
          name: '钱七',
          title: '后端负责人',
          department: '技术部',
          avatar: '🧑‍💻',
          children: [
            { id: 'u007', name: '孙八', title: '后端工程师', department: '技术部', avatar: '👨‍💻' },
            { id: 'u008', name: '周九', title: '后端工程师', department: '技术部', avatar: '👩‍💻' },
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
      children: [
        { id: 'u010', name: '郑一', title: '产品经理', department: '产品部', avatar: '📋' },
      ]
    },
    {
      id: 'u011',
      name: '冯二',
      title: '设计总监',
      department: '设计部',
      avatar: '🎨',
      children: [
        { id: 'u012', name: '陈三', title: 'UI设计师', department: '设计部', avatar: '🖌️' },
      ]
    },
  ]
}

// ============ API 路由 ============

const routes: ServerExports = {
  /**
   * 模拟微软 OAuth2 登录
   * 接收邮箱，返回对应用户信息
   */
  async 'POST /api/auth/login'(req: Request, ctx: Context) {
    const body = await req.json()
    const { email } = body
    
    // 查找用户（如果没提供邮箱，默认返回第一个用户）
    const user = email 
      ? mockUsers.find(u => u.email === email)
      : mockUsers[0]
    
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

  /**
   * 获取当前登录用户
   */
  async 'GET /api/auth/me'(req: Request, ctx: Context) {
    if (!currentUser) {
      return { success: false, error: '未登录' }
    }
    return { success: true, user: currentUser }
  },

  /**
   * 退出登录
   */
  async 'POST /api/auth/logout'(req: Request, ctx: Context) {
    currentUser = null
    return { success: true }
  },

  /**
   * 获取组织成员列表
   */
  async 'GET /api/org/members'(req: Request, ctx: Context) {
    return {
      success: true,
      members: mockUsers,
      total: mockUsers.length,
    }
  },

  /**
   * 获取组织架构树
   */
  async 'GET /api/org/tree'(req: Request, ctx: Context) {
    return {
      success: true,
      tree: mockOrgTree,
    }
  },

  /**
   * 简单的 Hello World 端点（保留）
   */
  async 'GET /api/hello'(req: Request, ctx: Context) {
    return {
      message: 'Hello World!',
      timestamp: new Date().toISOString(),
      app: ctx.app,
    }
  },
}

export default routes
