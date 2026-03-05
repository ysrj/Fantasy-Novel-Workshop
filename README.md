# Fantasy Novel Workshop (FNW)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ysrj/Fantasy-Novel-Workshop)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://github.com/ysrj/Fantasy-Novel-Workshop)

纯本地玄幻小说写作系统

## 简介

FNW (Fantasy Novel Workshop) 是一个专为玄幻小说作者设计的本地写作工具，完全离线运行，保护您的创作数据安全。

## 功能特性

- 📚 **项目管理** - 多作品管理，支持切换
- 📝 **大纲管理** - 故事大纲、结构规划、章节大纲
- 👥 **角色管理** - 角色档案、人物关系图
- 🌍 **世界观设定** - 修炼体系、法宝、势力、地理
- ⚔️ **战斗系统** - 战斗力等级、战斗记录
- ⏰ **时间线** - 时代、事件、角色年龄
- ✍️ **正文写作** - Markdown 编辑器、章节管理
- 📊 **写作统计** - 字数统计、进度追踪、番茄钟
- 💾 **本地存储** - SQLite 数据库，纯本地运行
- 🤖 **AI 辅助** - Ollama 本地 AI 集成
- 📤 **多格式导出** - EPUB、PDF、DOCX
- 💡 **素材管理** - 灵感卡片、标签系统
- 🔗 **双向链接** - 角色、场景、情节线关联

## 下载安装

### Windows

#### 便携版 (推荐)
下载 `Fantasy-Novel-Workshop-*-win-portable.zip`，解压后直接运行 `Fantasy Novel Workshop.exe`。

#### 安装版
下载 `Fantasy-Novel-Workshop-*-Setup.exe`，按照安装向导完成安装。

### macOS

下载 `Fantasy-Novel-Workshop-*-mac.dmg`，打开后将应用拖入应用程序文件夹。

### Linux

下载 `Fantasy-Novel-Workshop-*.AppImage`，添加执行权限后运行：
```bash
chmod +x Fantasy-Novel-Workshop-*.AppImage
./Fantasy-Novel-Workshop-*.AppImage
```

## 快速开始

### 首次运行

1. 启动应用
2. 创建新项目或导入已有项目
3. 开始写作！

### 界面介绍

```
┌─────────────────────────────────────────────────────────────┐
│  侧边栏                                                        │
│  ├─ 大纲                                                        │
│  ├─ 角色                                                        │
│  ├─ 世界观                                                      │
│  ├─ 正文                                                        │
│  ├─ 灵感                                                        │
│  ├─ 标签                                                        │
│  ├─ AI 助手                                                     │
│  ├─ 统计                                                        │
│  └─ 发布                                                        │
└─────────────────────────────────────────────────────────────┘
```

### 核心功能

#### 1. 项目管理
- 创建、删除、切换项目
- 项目设置（目标字数、标签）

#### 2. 大纲管理
- 卷/章结构规划
- 情节点管理
- 场景列表

#### 3. 角色管理
- 角色档案（姓名、性别、性格、背景）
- 关系图谱可视化
- 角色成长弧

#### 4. 世界观设定
- 修炼体系（境界划分）
- 法宝/灵兽
- 势力组织
- 地理/地图
- 历史编年

#### 5. 正文写作
- Markdown 编辑器
- 章节管理
- 自动保存
- 版本历史

#### 6. AI 辅助 (需要 Ollama)
- 一致性检查
- 文笔润色
- 歌词/脚本生成
- 自定义提示词

## 开发

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
# 克隆项目
git clone https://github.com/ysrj/Fantasy-Novel-Workshop.git
cd Fantasy-Novel-Workshop

# 安装依赖
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
# 构建应用
npm run build

# 打包便携版
npm run package

# 打包安装版
npm run package:nsis
```

### 测试

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行集成测试
npm run test:integration

# 运行性能测试
npm run test:perf

# 运行带覆盖率
npm run test:coverage
```

### 代码检查

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

## 项目结构

```
Fantasy-Novel-Workshop/
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── index.ts          # 入口
│   │   ├── ipc/              # IPC 通信
│   │   ├── services/         # 业务服务
│   │   ├── database/         # 数据库
│   │   └── engine/           # 规则引擎
│   ├── renderer/             # 前端
│   │   ├── views/            # 页面视图
│   │   ├── stores/           # 状态管理
│   │   ├── components/       # 组件
│   │   └── api/              # API
│   ├── preload/              # 预加载脚本
│   └── shared/               # 共享类型
├── tests/                    # 测试
├── docs/                    # 文档
└── resources/               # 资源文件
```

## 技术栈

- **桌面框架**: Electron 28
- **前端框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **UI 组件**: Ant Design
- **本地数据库**: better-sqlite3
- **构建工具**: electron-vite
- **AI 集成**: Ollama

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

### 提交 Issue

- 报告 Bug 请包含复现步骤
- 功能请求请描述用例

### 提交 Pull Request

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

### 开发规范

- 使用 TypeScript
- 遵循现有代码风格
- 添加单元测试
- 更新文档

### Commit Message 规范

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 代码重构
test: 测试更新
chore: 构建/工具更新
```

## 问题排查

### 应用无法启动

1. 检查是否安装了 Visual C++ Redistributable
2. 删除 `%APPDATA%/fantasy-novel-workshop` 重新运行

### 数据库错误

1. 关闭应用
2. 备份数据目录
3. 删除数据库文件重新创建

### AI 功能不可用

1. 确认 Ollama 已安装并运行
2. 检查 Ollama 地址设置 (默认: http://localhost:11434)

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

## 致谢

感谢所有贡献者！
