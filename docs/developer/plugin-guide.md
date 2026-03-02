# 插件开发指南

FNW 支持插件扩展功能。

## 插件结构

```typescript
import type { Plugin, PluginAPI } from '../shared/types'

const myPlugin: Plugin = {
  id: 'my-plugin',
  name: '我的插件',
  version: '1.0.0',
  description: '插件描述',
  enabled: true
}
```

## PluginAPI

插件可以通过 PluginAPI 与主应用交互：

### 注册菜单项

```typescript
api.registerMenuItem({
  id: 'my-menu',
  label: '我的菜单',
  icon: 'setting',
  accelerator: 'CmdOrCtrl+Shift+M',
  action: 'open-my-panel',
  position: 'tools'
})
```

### 注册视图

```typescript
api.registerView({
  id: 'my-view',
  name: '我的面板',
  path: '/my-view',
  icon: 'file'
})
```

### 注册导出格式

```typescript
api.registerExportFormat({
  id: 'my-format',
  name: '我的格式',
  extension: '.myformat',
  handler: 'export-my-format'
})
```

### 生命周期钩子

```typescript
// 项目打开时
api.onProjectOpen((project) => {
  console.log('项目打开了:', project.title)
})

// 章节保存时
api.onChapterSave((chapter) => {
  console.log('章节保存了:', chapter.title)
})

// 角色更新时
api.onCharacterUpdate((character) => {
  console.log('角色更新了:', character.name)
})
```

## 示例插件

```typescript
// my-plugin.ts
export function registerPlugin(api: PluginAPI) {
  api.registerMenuItem({
    id: 'word-count-stats',
    label: '字数统计',
    action: 'show-word-count',
    position: 'view'
  })

  api.onChapterSave((chapter) => {
    const wordCount = chapter.content.length
    console.log(`章节 "${chapter.title}" 字数: ${wordCount}`)
  })
}
```

## 安装插件

1. 将插件文件放入 `plugins/` 目录
2. 重启应用
3. 在设置中启用插件
