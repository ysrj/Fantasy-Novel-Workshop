import { describe, test, expect, beforeEach, jest } from '@jestest/globals'
import { PluginService } from '../../src/main/services/PluginService'

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn()
}))

describe('PluginService', () => {
  let pluginService: PluginService

  beforeEach(() => {
    pluginService = new PluginService()
  })

  describe('插件注册', () => {
    test('应该注册新插件', () => {
      const plugin = {
        id: 'test-plugin',
        name: '测试插件',
        version: '1.0.0',
        enabled: true
      }
      
      pluginService.registerPlugin(plugin)
      const plugins = pluginService.listPlugins()
      
      expect(plugins).toHaveLength(1)
      expect(plugins[0].id).toBe('test-plugin')
    })

    test('应该启用插件', () => {
      const plugin = {
        id: 'test-plugin',
        name: '测试插件',
        version: '1.0.0',
        enabled: false
      }
      
      pluginService.registerPlugin(plugin)
      const result = pluginService.enablePlugin('test-plugin')
      
      expect(result).toBe(true)
      expect(pluginService.listPlugins()[0].enabled).toBe(true)
    })

    test('应该禁用插件', () => {
      const plugin = {
        id: 'test-plugin',
        name: '测试插件',
        version: '1.0.0',
        enabled: true
      }
      
      pluginService.registerPlugin(plugin)
      const result = pluginService.disablePlugin('test-plugin')
      
      expect(result).toBe(true)
      expect(pluginService.listPlugins()[0].enabled).toBe(false)
    })

    test('启用不存在的插件应返回false', () => {
      expect(pluginService.enablePlugin('non-existent')).toBe(false)
    })

    test('禁用不存在的插件应返回false', () => {
      expect(pluginService.disablePlugin('non-existent')).toBe(false)
    })
  })

  describe('获取注册信息', () => {
    test('应该返回空菜单列表', () => {
      const menus = pluginService.getRegisteredMenus()
      expect(menus).toEqual([])
    })

    test('应该返回空视图列表', () => {
      const views = pluginService.getRegisteredViews()
      expect(views).toEqual([])
    })

    test('应该返回空导出格式列表', () => {
      const exports = pluginService.getRegisteredExports()
      expect(exports).toEqual([])
    })

    test('应该返回空AI提供商列表', () => {
      const providers = pluginService.getRegisteredAIProviders()
      expect(providers).toEqual([])
    })
  })

  describe('触发器', () => {
    test('项目打开时应正常执行', () => {
      const project = {
        id: 'test-project',
        title: '测试项目',
        description: '',
        targetWordCount: 100000,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      expect(() => pluginService.triggerProjectOpen(project)).not.toThrow()
    })

    test('章节保存时应正常执行', () => {
      const chapter = {
        id: 'chapter-1',
        projectId: 'project-1',
        title: '第一章',
        content: '内容',
        wordCount: 100
      }
      
      expect(() => pluginService.triggerChapterSave(chapter)).not.toThrow()
    })

    test('角色更新时应正常执行', () => {
      const character = {
        id: 'char-1',
        projectId: 'project-1',
        name: '张三',
        description: '主角'
      }
      
      expect(() => pluginService.triggerCharacterUpdate(character)).not.toThrow()
    })
  })

  describe('边界条件', () => {
    test('重复注册同一插件应覆盖', () => {
      const plugin1 = { id: 'test', name: '插件1', version: '1.0.0', enabled: true }
      const plugin2 = { id: 'test', name: '插件2', version: '2.0.0', enabled: false }
      
      pluginService.registerPlugin(plugin1)
      pluginService.registerPlugin(plugin2)
      
      const plugins = pluginService.listPlugins()
      expect(plugins).toHaveLength(1)
      expect(plugins[0].version).toBe('2.0.0')
    })
  })
})
