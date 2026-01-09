/**
 * Server-side API Routes
 * Org Chart Application - Supporting CRUD Operations
 */

import type { Context, ServerExports } from '@mspbots/server'

// ============ Mock Data ============

// Org Node
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

// User Data
interface User {
  id: string
  name: string
  email: string
  avatar: string
  department: string
  title: string
}

// Current logged in user simulation
let currentUser: User | null = null

// Available avatar list
const avatarOptions = ['👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎨', '👩‍🎨', '📊', '📋', '🎨', '🖌️', '👤', '👥']

// Mock organization chart data (editable)
let orgData: OrgNode = {
  id: 'u001',
  name: 'John Wang',
  title: 'CEO',
  department: 'Executive Office',
  avatar: '👨‍💼',
  email: 'john.wang@contoso.com',
  parentId: null,
  children: [
    {
      id: 'u002',
      name: 'Michael Zhang',
      title: 'CTO',
      department: 'Technology',
      avatar: '👨‍💻',
      email: 'michael.zhang@contoso.com',
      parentId: 'u001',
      children: [
        {
          id: 'u003',
          name: 'Sarah Lee',
          title: 'Frontend Lead',
          department: 'Technology',
          avatar: '👨‍🎨',
          email: 'sarah.lee@contoso.com',
          parentId: 'u002',
          children: [
            { id: 'u004', name: 'David Wang', title: 'Frontend Engineer', department: 'Technology', avatar: '👩‍💻', email: 'david.wang@contoso.com', parentId: 'u003' },
            { id: 'u005', name: 'Elena Zhao', title: 'Frontend Engineer', department: 'Technology', avatar: '👨‍💻', email: 'elena.zhao@contoso.com', parentId: 'u003' },
          ]
        },
        {
          id: 'u006',
          name: 'Robert Qian',
          title: 'Backend Lead',
          department: 'Technology',
          avatar: '🧑‍💻',
          email: 'robert.qian@contoso.com',
          parentId: 'u002',
          children: [
            { id: 'u007', name: 'Steve Sun', title: 'Backend Engineer', department: 'Technology', avatar: '👨‍💻', email: 'steve.sun@contoso.com', parentId: 'u006' },
            { id: 'u008', name: 'Jenny Zhou', title: 'Backend Engineer', department: 'Technology', avatar: '👩‍💻', email: 'jenny.zhou@contoso.com', parentId: 'u006' },
          ]
        },
      ]
    },
    {
      id: 'u009',
      name: 'Lisa Wu',
      title: 'Product Director',
      department: 'Product',
      avatar: '📊',
      email: 'lisa.wu@contoso.com',
      parentId: 'u001',
      children: [
        { id: 'u010', name: 'Adam Zheng', title: 'Product Manager', department: 'Product', avatar: '📋', email: 'adam.zheng@contoso.com', parentId: 'u009' },
      ]
    },
    {
      id: 'u011',
      name: 'Kevin Feng',
      title: 'Design Director',
      department: 'Design',
      avatar: '🎨',
      email: 'kevin.feng@contoso.com',
      parentId: 'u001',
      children: [
        { id: 'u012', name: 'Alice Chen', title: 'UI Designer', department: 'Design', avatar: '🖌️', email: 'alice.chen@contoso.com', parentId: 'u011' },
      ]
    },
  ]
}

// Helper: Find node in tree
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

// Helper: Find parent node in tree
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

// Helper: Remove node from tree
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

// Helper: Count nodes
function countNodes(tree: OrgNode): number {
  let count = 1
  if (tree.children) {
    for (const child of tree.children) {
      count += countNodes(child)
    }
  }
  return count
}

// Generate unique ID
let idCounter = 100
function generateId(): string {
  return `u${++idCounter}`
}

// Flatten tree to user list
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

// ============ API Routes ============

const routes: ServerExports = {
  // Login
  async 'POST /api/auth/login'(req: Request, ctx: Context) {
    const body = await req.json()
    const { email } = body
    const users = flattenTree(orgData)
    const user = email ? users.find(u => u.email === email) : users[0]
    
    if (!user) {
      return { success: false, error: 'User does not exist' }
    }
    
    currentUser = user
    return {
      success: true,
      user,
      accessToken: `mock-token-${user.id}-${Date.now()}`,
    }
  },

  // Get current user
  async 'GET /api/auth/me'(req: Request, ctx: Context) {
    if (!currentUser) {
      return { success: false, error: 'Not logged in' }
    }
    return { success: true, user: currentUser }
  },

  // Logout
  async 'POST /api/auth/logout'(req: Request, ctx: Context) {
    currentUser = null
    return { success: true }
  },

  // Get members list
  async 'GET /api/org/members'(req: Request, ctx: Context) {
    const members = flattenTree(orgData)
    return {
      success: true,
      members,
      total: members.length,
    }
  },

  // Get organization tree
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

  // ===== CRUD Operations =====

  // Create member
  async 'POST /api/org/member'(req: Request, ctx: Context) {
    const body = await req.json()
    const { name, title, department, avatar, email, parentId } = body

    if (!name || !title || !department || !parentId) {
      return { success: false, error: 'Missing required fields' }
    }

    const parent = findNode(orgData, parentId)
    if (!parent) {
      return { success: false, error: 'Superior does not exist' }
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
      message: 'Member added successfully',
    }
  },

  // Update member
  async 'PUT /api/org/member/:id'(req: Request, ctx: Context) {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // URL format: /api/org/member/[id]
    const memberIndex = pathParts.indexOf('member')
    const id = memberIndex >= 0 && pathParts.length > memberIndex + 1 ? pathParts[memberIndex + 1] : null
    
    if (!id) {
      return { success: false, error: 'Missing member ID' }
    }

    const body = await req.json()
    const { name, title, department, avatar, email } = body

    if (!name && !title && !department && !avatar && email === undefined) {
      return { success: false, error: 'No fields provided for update' }
    }

    const member = findNode(orgData, id)
    if (!member) {
      return { success: false, error: 'Member does not exist' }
    }

    if (name) member.name = name
    if (title) member.title = title
    if (department) member.department = department
    if (avatar) member.avatar = avatar
    if (email !== undefined) member.email = email

    return {
      success: true,
      member,
      message: 'Member updated successfully',
    }
  },

  // Delete member
  async 'DELETE /api/org/member/:id'(req: Request, ctx: Context) {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // URL format: /api/org/member/[id]
    const memberIndex = pathParts.indexOf('member')
    const id = memberIndex >= 0 && pathParts.length > memberIndex + 1 ? pathParts[memberIndex + 1] : null
    
    if (!id) {
      return { success: false, error: 'Missing member ID' }
    }

    if (id === orgData.id) {
      return { success: false, error: 'Cannot delete the organization head (root node)' }
    }

    const member = findNode(orgData, id)
    if (!member) {
      return { success: false, error: 'Member does not exist' }
    }

    if (member.children && member.children.length > 0) {
      return { success: false, error: 'Cannot delete a member who has subordinates. Please reassign or delete subordinates first.' }
    }

    const removed = removeNode(orgData, id)
    if (!removed) {
      return { success: false, error: 'Failed to delete member from the database' }
    }

    return {
      success: true,
      message: 'Member deleted successfully',
    }
  },

  // Get single member details
  async 'GET /api/org/member/:id'(req: Request, ctx: Context) {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // URL format: /api/org/member/[id]
    const memberIndex = pathParts.indexOf('member')
    const id = memberIndex >= 0 && pathParts.length > memberIndex + 1 ? pathParts[memberIndex + 1] : null
    
    if (!id) {
      return { success: false, error: 'Missing member ID' }
    }

    const member = findNode(orgData, id)
    if (!member) {
      return { success: false, error: 'Member does not exist' }
    }

    return {
      success: true,
      member,
    }
  },

  // Move member to new superior
  async 'POST /api/org/member/:id/move'(req: Request, ctx: Context) {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    // URL format: /api/org/member/[id]/move
    const moveIndex = pathParts.indexOf('move')
    const id = moveIndex > 0 ? pathParts[moveIndex - 1] : null
    
    if (!id) {
      return { success: false, error: 'Missing member ID' }
    }

    const body = await req.json()
    const { newParentId } = body

    if (!newParentId) {
      return { success: false, error: 'Missing target superior ID' }
    }

    if (id === orgData.id) {
      return { success: false, error: 'Cannot move root node' }
    }

    if (id === newParentId) {
      return { success: false, error: 'Cannot move under yourself' }
    }

    const member = findNode(orgData, id)
    if (!member) {
      return { success: false, error: 'Member does not exist' }
    }

    const newParent = findNode(orgData, newParentId)
    if (!newParent) {
      return { success: false, error: 'Target superior does not exist' }
    }

    // Check for circular reference
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
      return { success: false, error: 'Cannot move under your own subordinates' }
    }

    const removed = removeNode(orgData, id)
    if (!removed) {
      return { success: false, error: 'Move failed' }
    }

    if (!newParent.children) {
      newParent.children = []
    }
    member.parentId = newParentId
    newParent.children.push(member)

    return {
      success: true,
      message: 'Member moved successfully',
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
