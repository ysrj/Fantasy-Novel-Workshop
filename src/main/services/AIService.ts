import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import log from 'electron-log'

const OLLAMA_HOST = 'http://localhost:11434'

export interface AICheckResult {
  type: string
  severity: 'info' | 'warning' | 'error'
  message: string
  location?: string
}

export class AIService {
  private ollamaAvailable: boolean = false

  constructor() {
    this.checkOllamaStatus()
  }

  async checkOllamaStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      })
      this.ollamaAvailable = response.ok
      log.info(`Ollama status: ${this.ollamaAvailable ? 'available' : 'unavailable'}`)
      return this.ollamaAvailable
    } catch {
      this.ollamaAvailable = false
      log.info('Ollama not available')
      return false
    }
  }

  isAvailable(): boolean {
    return this.ollamaAvailable
  }

  async generate(prompt: string, model: string = 'llama2'): Promise<string | null> {
    if (!this.ollamaAvailable) {
      return null
    }

    try {
      const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.response
      }
    } catch (error) {
      log.error('Ollama generate error:', error)
    }
    return null
  }

  async chat(messages: { role: string; content: string }[], model: string = 'llama2'): Promise<string | null> {
    if (!this.ollamaAvailable) {
      return null
    }

    try {
      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        return data.message.content
      }
    } catch (error) {
      log.error('Ollama chat error:', error)
    }
    return null
  }

  async checkConsistency(projectId: string, chapters: string[]): Promise<AICheckResult[]> {
    const results: AICheckResult[] = []

    if (!this.ollamaAvailable || chapters.length === 0) {
      return results
    }

    const allText = chapters.join('\n\n')
    const characterPattern = /[「」《》]/g
    const namePattern = /[A-Z][a-z]+|[\u4e00-\u9fa5]{2,4}/g
    
    const names = allText.match(namePattern) || []
    const uniqueNames = [...new Set(names)]
    
    const nameCounts: Record<string, number> = {}
    for (const name of uniqueNames) {
      nameCounts[name] = names.filter(n => n === name).length
    }

    for (const [name, count] of Object.entries(nameCounts)) {
      if (count === 1 && name.length >= 2) {
        results.push({
          type: 'consistency',
          severity: 'warning',
          message: `名字 "${name}" 只出现了一次，可能需要确认是否一致`,
          location: '全文'
        })
      }
    }

    const chineseCharCount = (allText.match(/[\u4e00-\u9fa5]/g) || []).length
    const punctuationCount = (allText.match(/[。，！？；：""'']/g) || []).length
    
    if (chineseCharCount > 100) {
      const ratio = punctuationCount / chineseCharCount
      if (ratio < 0.05) {
        results.push({
          type: 'style',
          severity: 'info',
          message: '文章标点符号较少，建议适当增加以提升可读性',
          location: '全文'
        })
      }
    }

    if (chapters.length > 1) {
      for (let i = 0; i < chapters.length - 1; i++) {
        const currentLen = chapters[i].length
        const nextLen = chapters[i + 1].length
        if (Math.abs(currentLen - nextLen) > 5000) {
          results.push({
            type: 'structure',
            severity: 'info',
            message: `第${i + 1}章与第${i + 2}章字数差异较大，建议检查`,
            location: `第${i + 1}章`
          })
        }
      }
    }

    return results
  }

  async enhanceWriting(content: string, type: 'polish' | 'expand' | 'summary'): Promise<string | null> {
    if (!this.ollamaAvailable) {
      return null
    }

    let prompt = ''
    switch (type) {
      case 'polish':
        prompt = `请润色以下玄幻小说内容，保持文风流畅优美：\n\n${content}`
        break
      case 'expand':
        prompt = `请扩写以下玄幻小说内容，增加细节和描写：\n\n${content}`
        break
      case 'summary':
        prompt = `请用简洁的语言概括以下内容：\n\n${content}`
        break
    }

    return this.generate(prompt)
  }

  async generateLyrics(content: string, style: string = '古风'): Promise<string | null> {
    if (!this.ollamaAvailable) {
      return null
    }

    const prompt = `请根据以下玄幻小说内容，创作一首${style}风格的歌词。要求：
1. 歌词要符合小说情节和意境
2. 押韵工整，意境优美
3. 可以包含小说中的角色名、场景名、情感元素
4. 歌词长度适中（8-16句）

小说内容：
${content}

请直接输出歌词，不要有其他说明：`

    return this.generate(prompt)
  }

  async generateScript(content: string, type: string = '小说'): Promise<string | null> {
    if (!this.ollamaAvailable) {
      return null
    }

    const prompt = `请将以下${type}内容改编成剧本格式。要求：
1. 使用标准的剧本格式：场景描述、角色动作、对话
2. 保留原故事的精华情节
3. 添加适当的舞台指示和情感标注
4. 人物对话要符合角色性格

原文内容：
${content}

请直接输出剧本格式内容：`

    return this.generate(prompt)
  }
}
