# 开发者文档

## 技术栈

FNW 使用以下技术构建：

### 核心
- **Electron 28** - 跨平台桌面应用框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Zustand** - 状态管理

### 编辑器
- **Monaco Editor** - 代码编辑器（用于写作）
- **G6** - 关系图可视化

### 数据
- **sql.js** - 浏览器内 SQLite
- **electron-store** - 配置存储

### 构建
- **electron-vite** - Vite + Electron 集成
- **electron-builder** - 打包发布

## 目录结构

```
src/
├── main/                    # 主进程
│   ├── index.ts            # 入口点
│   ├── ipc/               # IPC 处理器
│   │   └── index.ts       # 所有 IPC 通道
│   └── services/          # 后端服务
│       ├── ProjectService.ts
│       ├── CharacterService.ts
│       ├── WorldService.ts
│       └── ...
├── renderer/               # 渲染进程
│   ├── App.tsx           # 根组件
│   ├── main.tsx          # React 入口
│   ├── components/       # React 组件
│   ├── views/            # 页面视图
│   ├── stores/           # Zustand 状态
│   ├── hooks/            # 自定义 Hooks
│   └── workers/          # Web Workers
├── preload/              # 预加载脚本
│   └── index.ts
└── shared/               # 共享类型
    └── types.ts
```

## 数据流

```
用户操作 → React组件 → IPC invoke → 主进程Service → 文件系统/SQLite
                              ↓
                         响应数据
                              ↓
                       React状态更新 → UI更新
```

## 关键服务

### ProjectService
管理项目创建、删除、列表。

### CharacterService
角色 CRUD，关系图数据。

### WorldService
修炼体系、地理、势力设定。

### WritingService
章节管理、字数统计。

### AIService
Ollama 本地 AI 集成。

## 开发命令

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 打包
npm run package
```

## 测试

```bash
# 运行所有测试
npm test

# 覆盖率
npm run test:coverage

# 单元测试
npm run test:unit
```
