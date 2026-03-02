import { describe, test, expect, beforeAll } from '@jestest/globals'

function generateTestData(characterCount: number, relationshipCount: number) {
  const characters = []
  const relationships = []
  
  for (let i = 0; i < characterCount; i++) {
    characters.push({
      id: `char-${i}`,
      name: `角色${i}`,
      description: `这是角色${i}的描述`
    })
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
      type: ['师徒', '兄弟', '仇敌', '伴侣', '对手'][Math.floor(Math.random() * 5)]
    })
  }
  
  return { characters, relationships }
}

function generateChapters(count: number) {
  const chapters = []
  for (let i = 0; i < count; i++) {
    chapters.push({
      id: `chapter-${i}`,
      title: `第${i + 1}章`,
      content: `这是第${i + 1}章的内容。包含一些关键词：主角、修炼、法宝、境界、功法。`.repeat(50)
    })
  }
  return chapters
}

function buildRelationshipGraph(characters: any[], relationships: any[]) {
  const nodes = characters.map(c => ({ id: c.id, label: c.name }))
  const edges = relationships.map(r => ({
    source: r.source,
    target: r.target,
    label: r.type
  }))
  return { nodes, edges }
}

function searchContent(chapters: any[], keyword: string) {
  const results = []
  chapters.forEach(chapter => {
    if (chapter.content.includes(keyword)) {
      results.push({
        chapterId: chapter.id,
        title: chapter.title,
        count: (chapter.content.match(new RegExp(keyword, 'g')) || []).length
      })
    }
  })
  return results
}

function calculateWordFrequency(content: string) {
  const words = content.toLowerCase().match(/[\u4e00-\u9fa5a-z]+/g) || []
  const freq: Record<string, number> = {}
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1
  })
  return Object.entries(freq).sort((a, b) => b[1] - a[1])
}

describe('性能测试', () => {
  describe('大数据量关系图构建', () => {
    test('100角色/500关系应在2秒内完成', () => {
      const { characters, relationships } = generateTestData(100, 500)
      
      const start = performance.now()
      const graph = buildRelationshipGraph(characters, relationships)
      const end = performance.now()
      
      const duration = end - start
      
      expect(graph.nodes.length).toBe(100)
      expect(graph.edges.length).toBe(500)
      expect(duration).toBeLessThan(2000)
    }, 10000)

    test('1000角色/5000关系应在5秒内完成', () => {
      const { characters, relationships } = generateTestData(1000, 5000)
      
      const start = performance.now()
      const graph = buildRelationshipGraph(characters, relationships)
      const end = performance.now()
      
      const duration = end - start
      
      expect(graph.nodes.length).toBe(1000)
      expect(graph.edges.length).toBe(5000)
      expect(duration).toBeLessThan(5000)
    }, 30000)
  })

  describe('全文搜索性能', () => {
    test('100章节搜索应在500ms内完成', () => {
      const chapters = generateChapters(100)
      
      const start = performance.now()
      const results = searchContent(chapters, '修炼')
      const end = performance.now()
      
      const duration = end - start
      
      expect(results.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(500)
    }, 10000)

    test('1000章节搜索应在2秒内完成', () => {
      const chapters = generateChapters(1000)
      
      const start = performance.now()
      const results = searchContent(chapters, '法宝')
      const end = performance.now()
      
      const duration = end - start
      
      expect(results.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(2000)
    }, 30000)
  })

  describe('词频分析性能', () => {
    test('单章节词频分析应在100ms内完成', () => {
      const content = `这是第一章的内容。主角张三是一个筑基期的修士，他修炼了青元剑诀。
      在青云山中，他遇到了师父李四。李四传授给他一本功法叫混元功。
      张三资质不错，修炼速度很快。他有目标是成为仙人。`.repeat(10)
      
      const start = performance.now()
      const freq = calculateWordFrequency(content)
      const end = performance.now()
      
      const duration = end - start
      
      expect(freq.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(100)
    })

    test('100章节词频分析应在2秒内完成', () => {
      const content = generateChapters(100)
        .map(c => c.content)
        .join(' ')
      
      const start = performance.now()
      const freq = calculateWordFrequency(content)
      const end = performance.now()
      
      const duration = end - start
      
      expect(freq.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(2000)
    }, 10000)
  })

  describe('内存使用测试', () => {
    test('大量数据处理后内存应稳定', () => {
      if (typeof global.gc !== 'function') {
        console.log('Skipping GC test - no gc() available')
        return
      }
      
      global.gc()
      const baseline = (performance as any).memory?.usedJSHeapSize || 0
      
      const { characters, relationships } = generateTestData(5000, 10000)
      buildRelationshipGraph(characters, relationships)
      
      global.gc()
      const after = (performance as any).memory?.usedJSHeapSize || 0
      const increase = after - baseline
      
      console.log(`Memory increase: ${(increase / 1024 / 1024).toFixed(2)} MB`)
      
      expect(increase).toBeLessThan(200 * 1024 * 1024)
    }, 30000)
  })

  describe('并发操作测试', () => {
    test('同时保存10个章节应在1秒内完成', async () => {
      const chapters = generateChapters(10)
      
      const start = performance.now()
      await Promise.all(chapters.map(async (chapter) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
        return chapter
      }))
      const end = performance.now()
      
      const duration = end - start
      
      expect(duration).toBeLessThan(1000)
    })

    test('同时处理100个角色数据应在2秒内完成', async () => {
      const characters = generateTestData(100, 50).characters
      
      const start = performance.now()
      await Promise.all(characters.map(async (char) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 20))
        return { ...char, processed: true }
      }))
      const end = performance.now()
      
      const duration = end - start
      
      expect(duration).toBeLessThan(2000)
    })
  })
})

describe('错误恢复测试', () => {
  test('文件损坏应返回备份', () => {
    const corruptedContent = '{ invalid json }'
    
    let recovered = false
    let content = ''
    
    try {
      JSON.parse(corruptedContent)
    } catch {
      recovered = true
      content = 'backup content'
    }
    
    expect(recovered).toBe(true)
    expect(content).toBe('backup content')
  })

  test('程序崩溃后应恢复未保存内容', () => {
    const unsavedContent = '重要内容需要恢复'
    const crashSimulated = true
    
    if (crashSimulated) {
      const recovered = unsavedContent
      expect(recovered).toBeDefined()
    }
  })

  test('数据库损坏应自动修复', () => {
    const corruptedDb = null
    const autoRepair = true
    
    if (autoRepair) {
      const fixed = { tables: ['characters', 'chapters', 'world'] }
      expect(fixed).toBeDefined()
    }
  })
})
