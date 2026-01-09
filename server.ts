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

// Mock data generator
function generateMockData(count: number = 100): OrgNode {
  const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
    'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
    'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
    'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Jason', 'Rebecca', 'Edward', 'Sharon',
    'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy',
    'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
    'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen',
    'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Frank', 'Christine', 'Gregory', 'Debra',
    'Raymond', 'Rachel', 'Alexander', 'Carolyn', 'Patrick', 'Janet', 'Jack', 'Virginia',
    'Dennis', 'Maria', 'Jerry', 'Heather', 'Tyler', 'Diane', 'Aaron', 'Julie'
  ]
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
    'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez',
    'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams',
    'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards',
    'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers'
  ]
  
  const departments = [
    'Executive Office', 'Technology', 'Product', 'Design', 'Marketing', 'Sales',
    'Operations', 'Finance', 'HR', 'Legal', 'Customer Success', 'Engineering'
  ]
  
  const titles = [
    'CEO', 'CTO', 'CFO', 'COO', 'VP Engineering', 'VP Product', 'VP Sales', 'VP Marketing',
    'Director', 'Senior Director', 'Manager', 'Senior Manager', 'Lead', 'Senior Lead',
    'Engineer', 'Senior Engineer', 'Product Manager', 'Senior Product Manager',
    'Designer', 'Senior Designer', 'Analyst', 'Senior Analyst', 'Specialist', 'Coordinator'
  ]
  
  const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  
  // Generate flat list of nodes
  const nodes: OrgNode[] = []
  let idCounter = 1
  
  // Root node (CEO)
  const root: OrgNode = {
    id: `u${String(idCounter++).padStart(3, '0')}`,
    name: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
    title: 'CEO',
    department: 'Executive Office',
    avatar: getRandomItem(avatarOptions),
    email: '',
    parentId: null,
    children: []
  }
  root.email = `${root.name.toLowerCase().replace(' ', '.')}@contoso.com`
  nodes.push(root)
  
  // Generate remaining nodes
  while (nodes.length < count) {
    const parent = nodes[getRandomInt(0, Math.min(nodes.length - 1, Math.floor(nodes.length * 0.7)))]
    const firstName = getRandomItem(firstNames)
    const lastName = getRandomItem(lastNames)
    const name = `${firstName} ${lastName}`
    
    const node: OrgNode = {
      id: `u${String(idCounter++).padStart(3, '0')}`,
      name,
      title: getRandomItem(titles),
      department: getRandomItem(departments),
      avatar: getRandomItem(avatarOptions),
      email: `${name.toLowerCase().replace(' ', '.')}@contoso.com`,
      parentId: parent.id,
      children: []
    }
    
    if (!parent.children) {
      parent.children = []
    }
    parent.children.push(node)
    nodes.push(node)
  }
  
  return root
}

// Mock organization chart data (editable)
let orgData: OrgNode = generateMockData(100)

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
