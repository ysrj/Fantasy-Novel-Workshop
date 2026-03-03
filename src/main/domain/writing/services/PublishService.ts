import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from '../../../services/DatabaseService'
import { EventBus, Events } from '../../../infrastructure/events/EventBus'
import { DraftService } from './DraftService'

export interface RewriteSettings {
  style: 'traditional' | 'simplified' | 'web' | 'raw'
  tone: 'formal' | 'casual' | 'humorous'
  removeRedundancy: boolean
  enhanceDescription: boolean
  customizeRules?: string[]
}

export interface PlatformFormat {
  platform: string
  maxWordCount?: number
  titleFormat: string
  chapterTitlePrefix: string
  encoding: string
  lineEnding: '\n' | '\r\n'
}

export interface PublishedChapter {
  id: string
  projectId: string
  draftId: string
  chapterId: string
  title: string
  content: string
  platformFormat: string
  rewriteSettings: RewriteSettings
  similarity: number
  createdAt: string
  publishedAt?: string
}

export interface StructureAnalysis {
  setup: { wordCount: number; ratio: number }
  development: { wordCount: number; ratio: number }
  twist: { wordCount: number; ratio: number }
  conclusion: { wordCount: number; ratio: number }
  hooks: { position: number; text: string }[]
  foreshadows: { position: number; text: string }[]
}

export interface ComparisonResult {
  similarity: number
  structureChanges: {
    setup: { before: number; after: number }
    development: { before: number; after: number }
    twist: { before: number; after: number }
    conclusion: { before: number; after: number }
  }
  techniqueScore: {
    hookImprovement: number
    foreshadowImprovement: number
  }
  suggestions: { type: string; text: string }[]
  wordCountDiff: number
}

const PLATFORM_FORMATS: Record<string, PlatformFormat> = {
  '起点中文网': {
    platform: '起点中文网',
    maxWordCount: 9999,
    titleFormat: '${title}',
    chapterTitlePrefix: '第${number}章 ',
    encoding: 'utf-8',
    lineEnding: '\r\n'
  },
  '番茄小说网': {
    platform: '番茄小说网',
    maxWordCount: 50000,
    titleFormat: '${title}',
    chapterTitlePrefix: '第${number}章 ',
    encoding: 'utf-8',
    lineEnding: '\n'
  },
  '纵横中文网': {
    platform: '纵横中文网',
    maxWordCount: 20000,
    titleFormat: '${title}',
    chapterTitlePrefix: '第${number}章 ',
    encoding: 'utf-8',
    lineEnding: '\r\n'
  },
  '飞卢小说网': {
    platform: '飞卢小说网',
    maxWordCount: 3000,
    titleFormat: '${title}',
    chapterTitlePrefix: '',
    encoding: 'utf-8',
    lineEnding: '\n'
  }
}

export class PublishService {
  private db: DatabaseService
  private draftService: DraftService

  constructor() {
    this.db = new DatabaseService()
    this.db.initialize()
    this.draftService = new DraftService()
  }

  generateFromDraft(draftId: string, settings: RewriteSettings): PublishedChapter {
    const drafts = this.db.query<{ project_id: string; chapter_id: string; title: string; content: string }>(
      'SELECT * FROM drafts WHERE id = ?',
      [draftId]
    )

    if (drafts.length === 0) {
      throw new Error('Draft not found')
    }

    const draft = drafts[0]
    const transformedContent = this.applyRewriteSettings(draft.content, settings)
    const structureAnalysis = this.analyzeStructure(transformedContent)
    const similarity = this.calculateSimilarity(draft.content, transformedContent)

    const now = new Date().toISOString()
    const published: PublishedChapter = {
      id: uuidv4(),
      projectId: draft.project_id,
      draftId,
      chapterId: draft.chapter_id,
      title: draft.title,
      content: transformedContent,
      platformFormat: settings.style,
      rewriteSettings: settings,
      similarity,
      createdAt: now
    }

    this.db.run(
      `INSERT INTO published_chapters (id, project_id, draft_id, chapter_id, title, content, platform_format, rewrite_settings, similarity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [published.id, published.projectId, published.draftId, published.chapterId, 
       published.title, published.content, published.platformFormat, 
       JSON.stringify(published.rewriteSettings), published.similarity, published.createdAt]
    )

    EventBus.emit(Events.DRAFT_PUBLISHED, { publishedId: published.id, projectId: published.projectId })

    return published
  }

  compareWithDraft(publishedId: string): ComparisonResult {
    const published = this.db.query<PublishedChapter>(
      'SELECT * FROM published_chapters WHERE id = ?',
      [publishedId]
    )[0]

    if (!published) {
      throw new Error('Published chapter not found')
    }

    const draft = this.draftService.getDraft(published.projectId, published.chapterId)
    if (!draft) {
      throw new Error('Draft not found')
    }

    const draftStructure = this.analyzeStructure(draft.content)
    const publishedStructure = this.analyzeStructure(published.content)

    const similarity = this.calculateSimilarity(draft.content, published.content)

    return {
      similarity,
      structureChanges: {
        setup: { before: draftStructure.setup.ratio, after: publishedStructure.setup.ratio },
        development: { before: draftStructure.development.ratio, after: publishedStructure.development.ratio },
        twist: { before: draftStructure.twist.ratio, after: publishedStructure.twist.ratio },
        conclusion: { before: draftStructure.conclusion.ratio, after: publishedStructure.conclusion.ratio }
      },
      techniqueScore: {
        hookImprovement: publishedStructure.hooks.length - draftStructure.hooks.length,
        foreshadowImprovement: publishedStructure.foreshadows.length - draftStructure.foreshadows.length
      },
      suggestions: this.generateSuggestions(draftStructure, publishedStructure),
      wordCountDiff: published.content.length - draft.content.length
    }
  }

  downloadAs(publishedId: string, platform: string): { content: string; filename: string } {
    const published = this.db.query<PublishedChapter>(
      'SELECT * FROM published_chapters WHERE id = ?',
      [publishedId]
    )[0]

    if (!published) {
      throw new Error('Published chapter not found')
    }

    const format = PLATFORM_FORMATS[platform] || PLATFORM_FORMATS['起点中文网']
    const content = this.formatForPlatform(published.content, published.title, format)

    return {
      content,
      filename: `${published.title}_${platform}.txt`
    }
  }

  getPlatformFormats(): PlatformFormat[] {
    return Object.values(PLATFORM_FORMATS)
  }

  getPublishedChapters(projectId: string): PublishedChapter[] {
    return this.db.query<PublishedChapter>(
      'SELECT * FROM published_chapters WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    )
  }

  private applyRewriteSettings(content: string, settings: RewriteSettings): string {
    let result = content

    if (settings.removeRedundancy) {
      result = result.replace(/\s+/g, ' ')
      result = result.replace(/，+/g, '，')
      result = result.replace(/。+/g, '。')
    }

    if (settings.enhanceDescription) {
      result = result.replace(/(\S+)道|(\S+)说/g, '"$1$2"')
    }

    return result
  }

  analyzeStructure(content: string): StructureAnalysis {
    const totalLength = content.length
    if (totalLength === 0) {
      return {
        setup: { wordCount: 0, ratio: 0 },
        development: { wordCount: 0, ratio: 0 },
        twist: { wordCount: 0, ratio: 0 },
        conclusion: { wordCount: 0, ratio: 0 },
        hooks: [],
        foreshadows: []
      }
    }

    const hookKeywords = ['然而', '突然', '就在这时', '没想到', '居然']
    const foreshadowKeywords = ['预示', '埋下', '注意', '日后']

    const hooks: { position: number; text: string }[] = []
    const foreshadows: { position: number; text: string }[] = []

    hookKeywords.forEach(keyword => {
      let idx = content.indexOf(keyword)
      while (idx !== -1) {
        hooks.push({ position: idx / totalLength, text: keyword })
        idx = content.indexOf(keyword, idx + 1)
      }
    })

    foreshadowKeywords.forEach(keyword => {
      let idx = content.indexOf(keyword)
      while (idx !== -1) {
        foreshadows.push({ position: idx / totalLength, text: keyword })
        idx = content.indexOf(keyword, idx + 1)
      }
    })

    const quarterLength = totalLength / 4

    return {
      setup: { wordCount: quarterLength, ratio: 0.25 },
      development: { wordCount: quarterLength, ratio: 0.25 },
      twist: { wordCount: quarterLength, ratio: 0.25 },
      conclusion: { wordCount: quarterLength, ratio: 0.25 },
      hooks,
      foreshadows
    }
  }

  private calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 100
    if (!text1 || !text2) return 0

    const set1 = new Set(text1.split(''))
    const set2 = new Set(text2.split(''))
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return Math.round((intersection.size / union.size) * 100)
  }

  private generateSuggestions(draft: StructureAnalysis, published: StructureAnalysis): { type: string; text: string }[] {
    const suggestions: { type: string; text: string }[] = []

    if (published.hooks.length < draft.hooks.length) {
      suggestions.push({ type: 'hook', text: '建议增加更多钩子吸引读者' })
    }

    if (published.foreshadows.length < draft.foreshadows.length) {
      suggestions.push({ type: 'foreshadow', text: '建议保留更多伏笔' })
    }

    if (Math.abs(published.conclusion.ratio - 0.2) > 0.1) {
      suggestions.push({ type: 'structure', text: '建议调整结尾比例至20%左右' })
    }

    return suggestions
  }

  private formatForPlatform(content: string, title: string, format: PlatformFormat): string {
    let result = content

    if (format.lineEnding === '\r\n') {
      result = result.replace(/\n/g, '\r\n')
    }

    return result
  }
}
