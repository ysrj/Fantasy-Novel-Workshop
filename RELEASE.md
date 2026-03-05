# Fantasy Novel Workshop 发布说明

## 关于

Fantasy Novel Workshop (FNW) 是一款专为玄幻小说作者设计的本地写作工具，完全离线运行，保护您的创作数据安全。

## 下载

### Windows

- **安装版**: `Fantasy-Novel-Workshop-1.0.0-Setup.exe`
- **便携版**: `Fantasy-Novel-Workshop-1.0.0-portable.exe`

### macOS

- **DMG**: `Fantasy-Novel-Workshop-1.0.0.dmg`

### Linux

- **AppImage**: `Fantasy-Novel-Workshop-1.0.0.AppImage`

## 新功能

### v1.0.0 (2026-03-05)

#### 核心功能
- 📚 **项目管理** - 多作品管理，支持切换
- 📝 **大纲管理** - 故事大纲、结构规划、章节大纲
- 👥 **角色管理** - 角色档案、人物关系图
- 🌍 **世界观设定** - 修炼体系，法宝、势力、地理
- ⚔️ **战斗系统** - 战斗力等级、战斗记录验证
- ⏰ **时间线** - 时代、事件、角色年龄追踪
- ✍️ **正文写作** - Markdown 编辑器、章节管理
- 📊 **写作统计** - 字数统计、进度追踪、番茄钟
- 💾 **本地存储** - SQLite 数据库，纯本地运行
- 🤖 **AI 辅助** - Ollama 本地 AI 集成
- 📤 **多格式导出** - EPUB、PDF、DOCX
- 💡 **素材管理** - 灵感卡片、标签系统
- 🔗 **双向链接** - 角色、场景、情节线关联
- 🔄 **版本控制** - 文件版本历史
- 🧩 **插件系统** - 插件加载/启用/禁用
- 🔧 **错误恢复** - 自动备份、完整性检查

#### 技术特性
- Electron 28 + React 18 + TypeScript
- Zustand 状态管理 + 持久化
- Ant Design UI 组件
- 完善的测试覆盖
- ESLint 代码规范

## 安装说明

### Windows

1. 下载安装版或便携版
2. 运行安装程序或解压
3. 启动应用

### macOS

1. 下载 DMG 文件
2. 打开并将应用拖入应用程序

### Linux

1. 下载 AppImage
2. 添加执行权限
3. 运行

## 常见问题

### Q: 应用无法启动
A: 请确保已安装 Visual C++ Redistributable

### Q: 数据存储在哪里
A: Windows: `%APPDATA%/fantasy-novel-workshop/`

### Q: 如何使用 AI 功能
A: 需要安装 Ollama，地址: https://ollama.ai

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的玄幻小说写作功能
- 本地 SQLite 数据库
- AI 辅助集成
