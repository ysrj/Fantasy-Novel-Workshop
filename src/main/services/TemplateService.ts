import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import Store from 'electron-store'
import type { TemplateSystem, CharacterTemplate, ChapterTemplate, WorldTemplate } from '../../shared/types'

const store = new Store()

const DEFAULT_CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    id: 'protagonist',
    name: '主角模板',
    description: '小说主角的模板',
    role: 'protagonist',
    abilities: [],
    background: '',
    personality: '',
    goals: []
  },
  {
    id: 'antagonist',
    name: '反派模板',
    description: '主要反派的模板',
    role: 'antagonist',
    abilities: [],
    background: '',
    personality: '',
    goals: []
  },
  {
    id: 'supporting',
    name: '配角模板',
    description: '配角的模板',
    role: 'supporting',
    abilities: [],
    background: '',
    personality: '',
    goals: []
  },
  {
    id: 'elder',
    name: '长老模板',
    description: '宗门长老/前辈模板',
    role: 'supporting',
    abilities: [],
    background: '',
    personality: '',
    goals: []
  },
  {
    id: 'cultivator',
    name: '散修模板',
    description: '散修角色模板',
    role: 'supporting',
    abilities: [],
    background: '',
    personality: '',
    goals: []
  }
]

const DEFAULT_CHAPTER_TEMPLATES: ChapterTemplate[] = [
  {
    id: 'standard',
    name: '标准章节',
    type: 'standard',
    structure: {
      opening: '场景铺垫，引入人物',
      development: '情节发展，冲突显现',
      climax: '高潮冲突，悬念揭晓',
      conclusion: '收束情节，埋下伏笔'
    }
  },
  {
    id: 'prologue',
    name: '序章/楔子',
    type: 'prologue',
    structure: {
      opening: '背景介绍，世界观引入',
      development: '埋下伏笔，悬念设置',
      climax: '关键事件，引出主角',
      conclusion: '正式进入主线'
    }
  },
  {
    id: 'epilogue',
    name: '尾声',
    type: 'epilogue',
    structure: {
      opening: '结局交代',
      development: '人物归宿',
      climax: '情感升华',
      conclusion: '留有余味'
    }
  },
  {
    id: 'climax',
    name: '高潮章节',
    type: 'climax',
    structure: {
      opening: '紧张铺垫',
      development: '冲突升级',
      climax: '最高潮部分',
      conclusion: '转折或悬念'
    }
  },
  {
    id: 'interlude',
    name: '过渡章节',
    type: 'interlude',
    structure: {
      opening: '场景转换',
      development: '信息交代',
      climax: '小高潮',
      conclusion: '引出后续'
    }
  }
]

const DEFAULT_WORLD_TEMPLATES: WorldTemplate[] = [
  {
    category: 'realm',
    name: '修炼境界',
    description: '境界设定模板',
    attributes: {
      level: '1',
      power: '',
      requirements: '',
      specialAbilities: ''
    }
  },
  {
    category: 'technique',
    name: '功法',
    description: '功法技能模板',
    attributes: {
      type: 'attack/defense/cultivation',
      level: '',
      requirements: '',
      effects: '',
      drawbacks: ''
    }
  },
  {
    category: 'item',
    name: '法宝',
    description: '法宝武器模板',
    attributes: {
      type: 'weapon/armor/accessory',
      rank: '',
      abilities: '',
      history: '',
      currentOwner: ''
    }
  },
  {
    category: 'location',
    name: '地点',
    description: '地点场景模板',
    attributes: {
      type: 'mountain/forest/city/underground',
      features: '',
      dangers: '',
      resources: '',
      inhabitants: ''
    }
  },
  {
    category: 'faction',
    name: '势力',
    description: '宗门/帮派模板',
    attributes: {
      type: 'sect/clan/alliance',
      leader: '',
      corePhilosophy: '',
      strength: '',
      allies: '',
      enemies: ''
    }
  }
]

export class TemplateService {
  private templates: TemplateSystem = {
    character: DEFAULT_CHARACTER_TEMPLATES,
    chapter: DEFAULT_CHAPTER_TEMPLATES,
    world: DEFAULT_WORLD_TEMPLATES,
    variables: {
      projectName: '',
      author: '',
      date: new Date().toISOString().split('T')[0],
      customFields: {}
    }
  }

  constructor() {
    this.loadTemplates()
  }

  private loadTemplates(): void {
    const saved = store.get('templateSystem') as TemplateSystem | undefined
    if (saved) {
      this.templates = { ...this.templates, ...saved }
    }
  }

  private saveTemplates(): void {
    store.set('templateSystem', this.templates)
  }

  getCharacterTemplates(): CharacterTemplate[] {
    return this.templates.character
  }

  getChapterTemplates(): ChapterTemplate[] {
    return this.templates.chapter
  }

  getWorldTemplates(): WorldTemplate[] {
    return this.templates.world
  }

  getCharacterTemplate(id: string): CharacterTemplate | undefined {
    return this.templates.character.find(t => t.id === id)
  }

  getChapterTemplate(id: string): ChapterTemplate | undefined {
    return this.templates.chapter.find(t => t.id === id)
  }

  getWorldTemplate(category: string, name: string): WorldTemplate | undefined {
    return this.templates.world.find(t => t.category === category && t.name === name)
  }

  addCharacterTemplate(template: Omit<CharacterTemplate, 'id'>): CharacterTemplate {
    const newTemplate: CharacterTemplate = {
      ...template,
      id: uuidv4()
    }
    this.templates.character.push(newTemplate)
    this.saveTemplates()
    log.info(`Character template added: ${newTemplate.name}`)
    return newTemplate
  }

  addChapterTemplate(template: Omit<ChapterTemplate, 'id'>): ChapterTemplate {
    const newTemplate: ChapterTemplate = {
      ...template,
      id: uuidv4()
    }
    this.templates.chapter.push(newTemplate)
    this.saveTemplates()
    log.info(`Chapter template added: ${newTemplate.name}`)
    return newTemplate
  }

  addWorldTemplate(template: WorldTemplate): void {
    this.templates.world.push(template)
    this.saveTemplates()
    log.info(`World template added: ${template.name}`)
  }

  updateCharacterTemplate(id: string, updates: Partial<CharacterTemplate>): boolean {
    const index = this.templates.character.findIndex(t => t.id === id)
    if (index !== -1) {
      this.templates.character[index] = { ...this.templates.character[index], ...updates }
      this.saveTemplates()
      return true
    }
    return false
  }

  deleteCharacterTemplate(id: string): boolean {
    const index = this.templates.character.findIndex(t => t.id === id)
    if (index !== -1) {
      this.templates.character.splice(index, 1)
      this.saveTemplates()
      return true
    }
    return false
  }

  setVariables(variables: Partial<TemplateSystem['variables']>): void {
    this.templates.variables = { ...this.templates.variables, ...variables }
    this.saveTemplates()
  }

  getVariables(): TemplateSystem['variables'] {
    return this.templates.variables
  }

  applyTemplate(template: string, variables: Record<string, string>): string {
    let result = template
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })
    return result
  }

  generateCharacterFromTemplate(templateId: string, data: Record<string, string>): any {
    const template = this.getCharacterTemplate(templateId)
    if (!template) return null

    return {
      name: data.name || '',
      description: data.description || template.description,
      role: template.role,
      realm: data.realm || '',
      abilities: data.abilities?.split(',').map(a => a.trim()) || [],
      background: data.background || template.background || '',
      personality: data.personality || template.personality || '',
      goals: data.goals?.split(',').map(g => g.trim()) || [],
      templateId
    }
  }

  generateChapterFromTemplate(templateId: string, data: Record<string, string>): any {
    const template = this.getChapterTemplate(templateId)
    if (!template) return null

    return {
      title: data.title || '',
      type: template.type,
      structure: template.structure ? {
        opening: this.applyTemplate(template.structure.opening, data),
        development: this.applyTemplate(template.structure.development, data),
        climax: this.applyTemplate(template.structure.climax, data),
        conclusion: this.applyTemplate(template.structure.conclusion, data)
      } : undefined,
      templateId
    }
  }

  resetToDefaults(): void {
    this.templates = {
      character: DEFAULT_CHARACTER_TEMPLATES,
      chapter: DEFAULT_CHAPTER_TEMPLATES,
      world: DEFAULT_WORLD_TEMPLATES,
      variables: {
        projectName: '',
        author: '',
        date: new Date().toISOString().split('T')[0],
        customFields: {}
      }
    }
    this.saveTemplates()
    log.info('Templates reset to defaults')
  }
}

export const templateService = new TemplateService()
