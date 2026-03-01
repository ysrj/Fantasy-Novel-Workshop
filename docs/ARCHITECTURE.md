# FNW 纯本地玄幻小说写作系统 - 架构方案

## 一、技术选型

| 层级 | 技术选型 |
|------|----------|
| **桌面框架** | Electron 28+ |
| **前端框架** | React 18 + TypeScript |
| **状态管理** | Zustand |
| **UI组件库** | Ant Design / 自定义 |
| **本地数据库** | better-sqlite3 |
| **AI集成** | Ollama REST API (可选) |
| **版本控制** | isomorphic-git |
| **构建工具** | Vite + electron-builder |

## 二、目录结构

```
Fantasy-Novel-Workshop/
├── src/
│   ├── main/                      # Electron主进程
│   │   ├── index.ts               # 入口
│   │   ├── ipc/                   # IPC通信
│   │   │   ├── project.ipc.ts
│   │   │   ├── writing.ipc.ts
│   │   │   ├── ai.ipc.ts
│   │   │   └── stats.ipc.ts
│   │   ├── services/              # 业务服务
│   │   │   ├── ProjectService.ts
│   │   │   ├── OutlineService.ts
│   │   │   ├── CharacterService.ts
│   │   │   ├── WorldService.ts
│   │   │   ├── WritingService.ts
│   │   │   ├── AIService.ts
│   │   │   ├── StatsService.ts
│   │   │   ├── ExportService.ts
│   │   │   ├── GitService.ts
│   │   │   └── DatabaseService.ts
│   │   ├── database/              # SQLite
│   │   │   ├── db.ts
│   │   │   ├── migrations/
│   │   │   └── schemas.ts
│   │   └── utils/
│   │       ├── file.ts
│   │       └── logger.ts
│   ├── renderer/                  # 前端
│   │   ├── components/
│   │   │   ├── Editor/
│   │   │   ├── TreeView/
│   │   │   ├── MindMap/
│   │   │   └── RelationshipGraph/
│   │   ├── views/
│   │   │   ├── ProjectList/
│   │   │   ├── Workspace/
│   │   │   ├── OutlineEditor/
│   │   │   ├── CharacterEditor/
│   │   │   ├── WorldEditor/
│   │   │   ├── WritingEditor/
│   │   │   ├── Analysis/
│   │   │   ├── Stats/
│   │   │   └── Settings/
│   │   ├── stores/
│   │   │   ├── projectStore.ts
│   │   │   ├── editorStore.ts
│   │   │   └── uiStore.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   └── shared/
│       ├── types.ts
│       └── constants.ts
├── resources/
│   ├── icon.ico
│   └── default_templates/
├── data/
│   ├── projects.json
│   ├── projects/
│   └── database/fnw.db
├── docs/
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 三、核心模块

| 模块 | 职责 | 核心方法 |
|------|------|----------|
| ProjectService | 项目CRUD | createProject, loadProjects, deleteProject |
| OutlineService | 大纲管理 | saveOutline, generateStructure, linkChapter |
| CharacterService | 角色/关系图 | CRUD characters, buildRelationshipGraph |
| WorldService | 修炼体系/法宝/势力 | CRUD 设定, bidirectionalLink |
| WritingService | 正文/版本/批注 | saveChapter, loadChapter, compareVersions |
| AIService | Ollama集成 | checkConsistency, enhanceWriting |
| StatsService | 字数/进度统计 | countWords, trackSpeed, analyzeFrequency |
| ExportService | EPUB/PDF导出 | toEPUB, toPDF, toDOCX |
| GitService | 版本控制 | initRepo, commit, getDiff, restore |
| DatabaseService | SQLite操作 | query, insert, transaction |

## 四、数据流

```
┌──────────────┐     IPC      ┌──────────────┐
│   Renderer   │ ←──────────→ │    Main      │
│   (React)    │   invoke    │  (Node.js)   │
└──────┬───────┘              └──────┬───────┘
       │                             │
       │ 状态更新                     │ 文件IO
       ▼                             ▼
┌──────────────┐              ┌──────────────┐
│  Zustand     │              │   文件系统   │
│  Store       │              │  (JSON/MD)   │
└──────────────┘              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │ SQLite (DB)   │
                              │ 素材/灵感/标签│
                              └──────────────┘
```

## 五、开发阶段

| 阶段 | 内容 | 周期 |
|------|------|------|
| Phase 1 | 项目管理 + 框架搭建 | 1-2周 |
| Phase 2 | 创作核心（大纲/角色/世界观/写作） | 2-3周 |
| Phase 3 | SQLite数据库 + 素材灵感 | 1-2周 |
| Phase 4 | 统计与导出 | 1周 |
| Phase 5 | AI集成 + 版本控制 | 1-2周 |
| Phase 6 | 优化测试 + 打包发布 | 1周 |

---

*文档版本: 1.0*
*创建日期: 2026-03-01*
