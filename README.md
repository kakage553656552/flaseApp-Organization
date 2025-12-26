# MSPBots App Template

MSPBots 应用模板，基于 Node.js + React + Vite。

## 项目结构

```
my-app/
├── pages/              # 页面组件
│   ├── Home.tsx
│   └── NotFound.tsx
├── App.tsx             # 根组件
├── index.html          # HTML 入口
├── server.ts           # 后端服务（使用 Vite 编译）
├── package.template.json # 模板配置（会被复制为 package.json）
├── vite.config.ts      # Vite 配置（支持多入口）
├── tailwind.config.ts  # Tailwind 配置
└── tsconfig.json       # TypeScript 配置
```

## 快速开始

```bash
npx mspbot init my-app
cd my-app
npx mspbot dev
```

访问 http://localhost:3000

## 前端开发

### 创建页面

页面组件需要使用命名导出（named export），组件名称需要与菜单配置中的 `name` 字段对应（首字母大写）：

```tsx
// pages/About.tsx
export function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold">关于</h1>
    </div>
  );
}
```

**注意**：
- 必须使用命名导出（`export function About`），不能使用默认导出
- 组件名称需要与菜单配置中的 `name` 字段对应（首字母大写）
- 例如：菜单配置 `name: "about"` → 组件名 `About`

### 添加路由

路由配置在 `package.json` 的 `manifest.menus` 字段中管理，`App.tsx` 会自动读取并生成路由。

**1. 创建页面组件** (`pages/About.tsx`):
```tsx
export function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold">关于</h1>
    </div>
  );
}
```

**2. 在 `package.json` 中添加菜单配置**:
```json
{
  "manifest": {
    "menus": [
      {
        "name": "home",
        "label": "首页",
        "path": "/",
        "icon": "Home"
      },
      {
        "name": "about",
        "label": "关于",
        "path": "/about",
        "icon": "Info"
      }
    ]
  }
}
```

**菜单字段说明**：
- `name`: 路由的唯一标识（必需），用于推断组件路径（例如 "about" → "About.tsx"）
- `label`: 菜单显示名称（必需）
- `path`: 路由路径（必需），"/" 表示首页（index route）
- `icon`: 图标名称（可选），对应 `lucide-react` 中的图标组件名

**自动推断规则**：
- 组件路径：从 `name` 推断，例如 "about" → "About.tsx"
- 导出名称：从 `name` 推断，首字母大写，例如 "about" → "About"
- 路由配置：从 `path` 推断，"/" → index route，其他路径直接使用

## 后端开发

### server.ts

```typescript
const routes: ServerExports = {
  async 'GET /api/hello'(req: Request, ctx: Context) {
    return {
      message: 'Hello World!',
      timestamp: new Date().toISOString(),
      app: ctx.app,
    };
  },

  async 'POST /api/data'(req: Request, ctx: Context) {
    const body = await req.json();
    const { key, value } = body;
    
    // 使用全局 api() 函数调用 Gateway SDK
    const result = await api(`/apps/${ctx.app.id}/sdk/kv/set`, {
      method: 'POST',
      body: { key, value },
    });
    
    return result;
  },

  async 'GET /api/users/:id'(req: Request, ctx: Context) {
    const id = ctx.params?.id;
    
    // 使用 api() 函数调用 KV Store
    const result = await api(`/apps/${ctx.app.id}/sdk/kv/get/${id}`, {
      method: 'GET',
    });
    
    return result;
  },
};

export default routes;
```

**构建说明：**
- `server.ts` 使用 Vite lib 模式编译
- 所有 node_modules 和 @mspbots/* 包会被外部化
- 输出为 `server.js`（ESM 格式）
- 类型 `Context` 和 `ServerExports` 由 `@mspbots/server` 包自动提供，无需手动导入

### Context API

Context 只包含应用的基础信息：

| 属性 | 说明 |
|------|------|
| ctx.app | 当前应用信息（id, name, version, description, icon, permissions） |

### 全局 api() 函数

**仅在开发环境可用**（`mspbot dev`）

在开发模式下，使用全局 `api()` 函数调用 Gateway SDK API：

```typescript
// 调用 KV Store
const result = await api(`/apps/${ctx.app.id}/sdk/kv/set`, {
  method: 'POST',
  body: { key: 'myKey', value: { data: 'value' } },
});

// 调用 HTTP Client
const result = await api(`/apps/${ctx.app.id}/sdk/http/fetch`, {
  method: 'POST',
  body: { url: 'https://api.example.com' },
});

// 调用 LangChain
const result = await api(`/apps/${ctx.app.id}/sdk/langchain/chat`, {
  method: 'POST',
  body: { 
    prompt: 'Hello AI',
    options: { model: 'gpt-3.5-turbo' }
  },
});
```

**特点**：
- ✅ 自动序列化 body 为 JSON（传对象即可）
- ✅ 自动处理 Gateway URL 配置
- ✅ 自动添加 `Content-Type: application/json` 头
- ✅ 自动添加 `X-App-Id` 头（值为 `ctx.app.id`）
- ⚠️ 仅在 `mspbot dev` 时可用
- ⚠️ 生产环境由平台提供原生 ctx 工具

## 构建配置

### Vite 配置

模板使用 Vite 多入口配置：

- **前端构建**：构建 React 应用到 `index.html`
- **服务器构建**：使用 lib 模式编译 `server.ts` 到 `server.js`

构建时通过环境变量控制：
- `VITE_BUILD_OUTPUT_DIR`：指定输出目录
- `VITE_BUILD_SERVER`：设置为 `true` 时构建服务器

### 构建输出

使用 `mspbot build` 命令构建时：
- 构建输出直接到 `node_modules/.mspbots-build/<app-name>/`
- **不会创建 `dist` 目录**
- 自动生成 `package.json` 和 `manifest.json`

## manifest 配置

在 `package.json` 的 `manifest` 字段中配置：

```json
{
  "manifest": {
    "icon": "🚀",
    "hasBackend": true,
    "permissions": {
      "kv": true,
      "mspbots": ["chat"],
      "http": ["https://api.example.com"]
    },
    "menus": [
      {
        "name": "home",
        "label": "首页",
        "path": "/",
        "icon": "Home"
      },
      {
        "name": "about",
        "label": "关于",
        "path": "/about",
        "icon": "Info"
      }
    ]
  }
}
```

**菜单配置说明**：
- `name`: 路由唯一标识，用于自动推断组件路径和导出名称
- `label`: 菜单显示名称
- `path`: 路由路径，"/" 表示首页
- `icon`: 图标名称（可选），对应 `lucide-react` 中的图标组件

## CLI 命令

```bash
# 创建项目（支持 --beta 使用 beta 版本依赖）
npx mspbot init <name>
npx mspbot init <name> --beta

# 启动开发服务器
npx mspbot dev

# 构建应用（输出到虚拟目录）
npx mspbot build

# 发布应用
npx mspbot publish
```

## Beta 版本支持

使用 `--beta` 标志创建项目时：
- CLI 会检查每个 @mspbots/* 包的 beta 版本是否存在
- 只有存在 beta 版本时才会替换为 `beta`
- 如果某个包没有 beta 版本，会保持原版本号并显示警告

## License

MIT
