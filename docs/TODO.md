# FNW 开发计划

## Phase 1: 项目管理 + 框架搭建 (1-2周)

### 1.1 项目初始化
- [ ] 初始化 Electron + React + Vite 项目
- [ ] 配置 TypeScript
- [ ] 配置 electron-builder 打包配置
- [ ] 搭建基础目录结构

### 1.2 主进程基础
- [ ] 窗口管理（主窗口创建、显示、关闭）
- [ ] IPC 通信基础架构
- [ ] 日志系统
- [ ] 全局异常处理

### 1.3 项目管理功能
- [ ] projects.json 读写
- [ ] 创建新项目
- [ ] 加载项目列表
- [ ] 删除项目
- [ ] 项目文件夹结构初始化

### 1.4 前端基础
- [ ] React Router 路由配置
- [ ] Zustand 状态管理基础
- [ ] 项目列表页面
- [ ] 基础 UI 布局

---

## Phase 2: 创作核心 (2-3周)

### 2.1 大纲管理
- [ ] story_outline.md 编辑器
- [ ] structure.json 结构规划
- [ ] chapter_outline.json 章节大纲
- [ ] scenes.json 场景列表
- [ ] plot_points.json 情节点
- [ ] act_structure.json 幕表
- [ ] 大纲可视化（思维导图）

### 2.2 角色管理
- [ ] characters.json CRUD
- [ ] 角色属性编辑（姓名、外貌、性格等）
- [ ] relationships.json 关系图谱
- [ ] 人物关系图可视化（D3.js）
- [ ] arcs.json 角色成长弧

### 2.3 世界观设定（玄幻特色）
- [ ] cultivation.json 修炼体系
- [ ] geography.json 地理/地图
- [ ] history.json 历史编年
- [ ] artifacts.json 法宝/灵兽
- [ ] factions.json 势力组织
- [ ] custom_settings.json 自定义设定

### 2.4 正文写作
- [ ] Markdown 编辑器
- [ ] 章节管理（增删改查）
- [ ] drafts/ 草稿管理
- [ ] annotations.json 批注系统
- [ ] links.json 双向链接
- [ ] versions/ 版本快照
- [ ] editor_config.json 个性化配置

---

## Phase 3: SQLite数据库 + 素材灵感 (1-2周)

### 3.1 数据库搭建
- [ ] better-sqlite3 集成
- [ ] 数据库表结构设计
- [ ] 初始化数据库 migrations

### 3.2 素材管理
- [ ] materials 表 CRUD
- [ ] 文件导入（图片、PDF等）
- [ ] 素材分类浏览

### 3.3 灵感管理
- [ ] inspirations 表 CRUD
- [ ] 灵感卡片编辑
- [ ] 标签系统

### 3.4 双向链接
- [ ] links 表设计
- [ ] 链接创建/删除
- [ ] 链接可视化

### 3.5 资料维护
- [ ] 重复文件检测
- [ ] 合并灵感卡片
- [ ] 过时资料标记

---

## Phase 4: 统计与导出 (1周)

### 4.1 写作统计
- [ ] wordcount.json 实时字数
- [ ] progress.json 进度条
- [ ] speed.json 写作速度
- [ ] word_freq.json 词频分析
- [ ] time_stats.json 时间统计

### 4.2 导出功能
- [ ] EPUB 导出
- [ ] PDF 导出
- [ ] DOCX 导出
- [ ] 图片导出（章节卡片）

### 4.3 目标追踪
- [ ] goals.json 目标设定
- [ ] pomodoro.json 番茄钟
- [ ] achievements.json 成就系统

---

## Phase 5: AI集成 + 版本控制 (1-2周)

### 5.1 版本控制
- [ ] isomorphic-git 集成
- [ ] 自动提交
- [ ] 版本对比
- [ ] 备份功能

### 5.2 AI辅助（基础集成）
- [ ] Ollama API 连接
- [ ] 一致性检查（角色名、等级等）
- [ ] AI 提示词模板
- [ ] 检查结果缓存

---

## Phase 6: 优化测试 + 打包发布 (1周)

### 6.1 性能优化
- [ ] 文件变化监听优化
- [ ] 大文件处理优化
- [ ] 内存占用优化

### 6.2 测试
- [ ] 单元测试
- [ ] 功能测试
- [ ] 边界情况处理

### 6.3 发布
- [ ] Windows 安装包
- [ ] 应用图标
- [ ] 更新机制

---

## 里程碑

| 里程碑 | 内容 | 目标日期 |
|--------|------|----------|
| M1 | 项目基础框架 + 项目管理 | Week 2 |
| M2 | 创作核心完成 | Week 5 |
| M3 | 数据库 + 素材灵感 | Week 7 |
| M4 | 统计导出 | Week 8 |
| M5 | AI + 版本控制 | Week 10 |
| M6 | 测试 + 发布 | Week 11 |

---

*创建日期: 2026-03-01*
