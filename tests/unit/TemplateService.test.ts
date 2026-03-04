import { describe, test, expect, beforeEach } from '@jest/globals'
import { TemplateService } from '../../src/main/services/TemplateService'

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
    store: {}
  }))
})

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn()
}))

describe('TemplateService', () => {
  let templateService: TemplateService

  beforeEach(() => {
    templateService = new TemplateService()
    templateService.resetToDefaults()
  })

  describe('角色模板', () => {
    test('应该获取默认角色模板列表', () => {
      const templates = templateService.getCharacterTemplates()
      expect(templates.length).toBeGreaterThan(0)
      expect(templates.find(t => t.id === 'protagonist')).toBeDefined()
      expect(templates.find(t => t.id === 'antagonist')).toBeDefined()
    })

    test('应该获取特定角色模板', () => {
      const template = templateService.getCharacterTemplate('protagonist')
      expect(template).toBeDefined()
      expect(template?.role).toBe('protagonist')
    })

    test('应该添加新角色模板', () => {
      const newTemplate = templateService.addCharacterTemplate({
        name: '新角色模板',
        description: '测试模板',
        role: 'supporting',
        abilities: [],
        background: '',
        personality: '',
        goals: []
      })
      expect(newTemplate.id).toBeDefined()
      expect(newTemplate.name).toBe('新角色模板')
    })

    test('应该更新角色模板', () => {
      const updated = templateService.updateCharacterTemplate('protagonist', {
        name: '更新后的主角模板'
      })
      expect(updated).toBe(true)
      const template = templateService.getCharacterTemplate('protagonist')
      expect(template?.name).toBe('更新后的主角模板')
    })

    test('应该删除角色模板', () => {
      const newTemplate = templateService.addCharacterTemplate({
        name: '待删除模板',
        description: '测试',
        role: 'minor',
        abilities: [],
        background: '',
        personality: '',
        goals: []
      })
      const deleted = templateService.deleteCharacterTemplate(newTemplate.id)
      expect(deleted).toBe(true)
      expect(templateService.getCharacterTemplate(newTemplate.id)).toBeUndefined()
    })
  })

  describe('章节模板', () => {
    test('应该获取默认章节模板', () => {
      const templates = templateService.getChapterTemplates()
      expect(templates.length).toBeGreaterThan(0)
      expect(templates.find(t => t.type === 'standard')).toBeDefined()
      expect(templates.find(t => t.type === 'prologue')).toBeDefined()
    })

    test('应该添加新章节模板', () => {
      const newTemplate = templateService.addChapterTemplate({
        name: '高潮章节',
        type: 'climax',
        structure: {
          opening: '紧张氛围',
          development: '冲突升级',
          climax: '最高潮',
          conclusion: '转折'
        }
      })
      expect(newTemplate.id).toBeDefined()
      expect(newTemplate.type).toBe('climax')
    })

    test('应该根据模板生成章节', () => {
      const chapter = templateService.generateChapterFromTemplate('standard', {
        title: '测试章节'
      })
      expect(chapter).toBeDefined()
      expect(chapter?.title).toBe('测试章节')
      expect(chapter?.type).toBe('standard')
      expect(chapter?.structure).toBeDefined()
    })
  })

  describe('世界观模板', () => {
    test('应该获取默认世界观模板', () => {
      const templates = templateService.getWorldTemplates()
      expect(templates.length).toBeGreaterThan(0)
      expect(templates.find(t => t.category === 'realm')).toBeDefined()
      expect(templates.find(t => t.category === 'technique')).toBeDefined()
      expect(templates.find(t => t.category === 'item')).toBeDefined()
    })

    test('应该添加新世界观模板', () => {
      templateService.addWorldTemplate({
        category: 'location',
        name: '新地点类型',
        description: '测试',
        attributes: {}
      })
      const templates = templateService.getWorldTemplates()
      expect(templates.find(t => t.name === '新地点类型')).toBeDefined()
    })
  })

  describe('模板变量', () => {
    test('应该设置和获取变量', () => {
      templateService.setVariables({
        projectName: '测试项目',
        author: '测试作者'
      })
      const vars = templateService.getVariables()
      expect(vars.projectName).toBe('测试项目')
      expect(vars.author).toBe('测试作者')
    })

    test('应该应用变量替换', () => {
      const result = templateService.applyTemplate(
        '《{{projectName}}》- {{author}}',
        { projectName: '仙逆', author: '耳根' }
      )
      expect(result).toBe('《仙逆》- 耳根')
    })

    test('应该根据模板生成角色', () => {
      const character = templateService.generateCharacterFromTemplate('protagonist', {
        name: '主角张三',
        realm: '金丹期',
        abilities: '御剑,炼丹'
      })
      expect(character).toBeDefined()
      expect(character?.name).toBe('主角张三')
      expect(character?.realm).toBe('金丹期')
      expect(character?.abilities).toContain('御剑')
    })
  })

  describe('边界条件', () => {
    test('不存在的模板应返回undefined', () => {
      expect(templateService.getCharacterTemplate('non-existent')).toBeUndefined()
    })

    test('更新不存在的模板应返回false', () => {
      expect(templateService.updateCharacterTemplate('non-existent', { name: 'test' })).toBe(false)
    })

    test('删除不存在的模板应返回false', () => {
      expect(templateService.deleteCharacterTemplate('non-existent')).toBe(false)
    })

    test('重置应恢复默认模板', () => {
      templateService.addCharacterTemplate({
        name: '自定义模板',
        description: 'test',
        role: 'minor',
        abilities: [],
        background: '',
        personality: '',
        goals: []
      })
      templateService.resetToDefaults()
      const templates = templateService.getCharacterTemplates()
      expect(templates.find(t => t.name === '自定义模板')).toBeUndefined()
    })
  })
})
