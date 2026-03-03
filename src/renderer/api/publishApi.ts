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

export const publishApi = {
  // Draft operations
  saveDraft: (projectId: string, chapterId: string, content: string, title?: string) =>
    window.api.invoke<unknown>('draft:save', { projectId, chapterId, content, title }),
  
  getDraft: (projectId: string, chapterId: string) =>
    window.api.invoke<unknown | null>('draft:get', { projectId, chapterId }),
  
  getAllDrafts: (projectId: string) =>
    window.api.invoke<unknown[]>('draft:list', projectId),
  
  deleteDraft: (projectId: string, chapterId: string) =>
    window.api.invoke<void>('draft:delete', { projectId, chapterId }),

  // Published operations
  generateFromDraft: (draftId: string, settings: RewriteSettings) =>
    window.api.invoke<PublishedChapter>('publish:generate', { draftId, settings }),
  
  getPublishedChapters: (projectId: string) =>
    window.api.invoke<PublishedChapter[]>('publish:list', projectId),
  
  getPublishedChapter: (publishedId: string) =>
    window.api.invoke<PublishedChapter | null>('publish:get', publishedId),

  // Comparison
  compareWithDraft: (publishedId: string) =>
    window.api.invoke<ComparisonResult>('publish:compare', publishedId),

  // Platform download
  downloadAs: (publishedId: string, platform: string) =>
    window.api.invoke<{ content: string; filename: string }>('publish:download', { publishedId, platform }),
  
  getPlatformFormats: () =>
    window.api.invoke<PlatformFormat[]>('publish:platforms'),
}
