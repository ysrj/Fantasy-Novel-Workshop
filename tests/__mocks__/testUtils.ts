import { jest } from '@jest/globals'

export const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  statSync: jest.fn(),
  rmSync: jest.fn(),
  createWriteStream: jest.fn(),
  createReadStream: jest.fn()
}

export const mockPath = {
  join: jest.fn((...args: string[]) => args.join('/')),
  dirname: jest.fn(),
  basename: jest.fn(),
  extname: jest.fn()
}

export const mockCrypto = {
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mock-hash')
  }))
}

export function setupFileSystemMocks() {
  jest.unmock('fs')
  jest.unmock('path')
  jest.unmock('crypto')
  
  require('fs').existsSync = mockFs.existsSync
  require('fs').readFileSync = mockFs.readFileSync
  require('fs').writeFileSync = mockFs.writeFileSync
  require('fs').mkdirSync = mockFs.mkdirSync
  require('fs').readdirSync = mockFs.readdirSync
  require('fs').unlinkSync = mockFs.unlinkSync
  require('fs').statSync = mockFs.statSync
}

export function createMockProjectData(overrides = {}) {
  return {
    id: 'test-project-id',
    title: '测试项目',
    description: '这是一个测试项目',
    targetWordCount: 100000,
    tags: ['玄幻', '修仙'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

export function createMockCharacter(overrides = {}) {
  return {
    id: 'char-' + Math.random().toString(36).substr(2, 9),
    name: '测试角色',
    description: '测试角色描述',
    role: 'protagonist',
    realm: '筑基期',
    abilities: ['御剑术', '炼丹术'],
    relationships: [],
    ...overrides
  }
}

export function createMockChapter(overrides = {}) {
  return {
    id: 'chapter-' + Math.random().toString(36).substr(2, 9),
    projectId: 'test-project-id',
    title: '第一章 初入仙途',
    content: '# 第一章 初入仙途\n\n这是测试内容...',
    wordCount: 1000,
    ...overrides
  }
}

export function createMockWorldData(overrides = {}) {
  return {
    cultivation: {
      realms: [
        { id: 'realm-1', name: '炼气期', order: 1, description: '修炼入门' },
        { id: 'realm-2', name: '筑基期', order: 2, description: '奠定基础' }
      ],
      techniques: [
        { id: 'tech-1', name: '青元剑诀', realm: '炼气期', description: '基础剑诀', type: '攻击' }
      ],
      skills: []
    },
    geography: {
      locations: [
        { id: 'loc-1', name: '青云山', description: '修仙门派', type: 'mountain' }
      ]
    },
    history: [],
    artifacts: [],
    factions: [],
    customSettings: {},
    ...overrides
  }
}

export async function generateTestData(characterCount: number, relationshipCount: number) {
  const characters = []
  const relationships = []
  
  for (let i = 0; i < characterCount; i++) {
    characters.push(createMockCharacter({
      id: `char-${i}`,
      name: `角色${i}`
    }))
  }
  
  for (let i = 0; i < relationshipCount; i++) {
    const sourceIndex = Math.floor(Math.random() * characterCount)
    let targetIndex = Math.floor(Math.random() * characterCount)
    while (targetIndex === sourceIndex) {
      targetIndex = Math.floor(Math.random() * characterCount)
    }
    
    relationships.push({
      source: characters[sourceIndex].id,
      target: characters[targetIndex].id,
      type: ['师徒', '兄弟', '仇敌', '伴侣'][Math.floor(Math.random() * 4)]
    })
  }
  
  return { characters, relationships }
}

export async function generateChapters(count: number) {
  const chapters = []
  for (let i = 0; i < count; i++) {
    chapters.push(createMockChapter({
      id: `chapter-${i}`,
      title: `第${i + 1}章`,
      content: `这是第${i + 1}章的内容，包含一些测试关键词。`.repeat(100)
    }))
  }
  return chapters
}

export function measurePerformance(fn: () => void | Promise<void>): { duration: number; result: any } {
  const start = performance.now()
  let result: any
  
  if (fn.constructor.name === 'AsyncFunction') {
    return { duration: -1, result: null }
  }
  
  result = fn()
  const duration = performance.now() - start
  
  return { duration, result }
}

export async function measureAsyncPerformance(fn: () => Promise<void>): Promise<{ duration: number; result: any }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  
  return { duration, result }
}
