export interface KnowledgeEntry {
  id: string
  projectId: string
  collectionId: string
  title: string
  content: string
  summary?: string
  tags: string[]
  metadata: Record<string, unknown>
  sourceType: 'manual' | 'imported' | 'ai-generated'
  createdAt: string
  updatedAt: string
}

export interface KnowledgeCollection {
  id: string
  projectId: string
  name: string
  description: string
  type: 'world-building' | 'character' | 'plot' | 'technology' | 'custom'
  parentId?: string
  entryCount: number
  createdAt: string
}

export interface ExternalKnowledgeConfig {
  id: string
  name: string
  type: 'ollama-anything-llm' | 'lm-studio' | 'custom-api' | 'local-vector'
  endpoint: string
  apiKey?: string
  model?: string
  enabled: boolean
}

export const knowledgeApi = {
  // Collections
  createCollection: (projectId: string, name: string, description: string, type: KnowledgeCollection['type'], parentId?: string) =>
    window.api.invoke<KnowledgeCollection>('kb:createCollection', { projectId, name, description, type, parentId }),
  
  listCollections: (projectId: string) =>
    window.api.invoke<KnowledgeCollection[]>('kb:listCollections', projectId),
  
  updateCollection: (collectionId: string, updates: Partial<KnowledgeCollection>) =>
    window.api.invoke<void>('kb:updateCollection', { collectionId, ...updates }),
  
  deleteCollection: (collectionId: string) =>
    window.api.invoke<void>('kb:deleteCollection', collectionId),

  // Entries
  createEntry: (collectionId: string, title: string, content: string, tags: string[]) =>
    window.api.invoke<KnowledgeEntry>('kb:createEntry', { collectionId, title, content, tags }),
  
  getEntries: (collectionId: string) =>
    window.api.invoke<KnowledgeEntry[]>('kb:getEntries', collectionId),
  
  getEntry: (entryId: string) =>
    window.api.invoke<KnowledgeEntry | null>('kb:getEntry', entryId),
  
  updateEntry: (entryId: string, updates: Partial<KnowledgeEntry>) =>
    window.api.invoke<void>('kb:updateEntry', { entryId, ...updates }),
  
  deleteEntry: (entryId: string) =>
    window.api.invoke<void>('kb:deleteEntry', entryId),

  // Search
  search: (projectId: string, keyword: string) =>
    window.api.invoke<KnowledgeEntry[]>('kb:search', { projectId, keyword }),
  
  semanticSearch: (projectId: string, query: string, limit?: number) =>
    window.api.invoke<KnowledgeEntry[]>('kb:semanticSearch', { projectId, query, limit }),

  // Import/Export
  importFromMarkdown: (projectId: string, collectionId: string, folderPath: string) =>
    window.api.invoke<KnowledgeEntry[]>('kb:importMarkdown', { projectId, collectionId, folderPath }),
  
  exportToMarkdown: (collectionId: string, folderPath: string) =>
    window.api.invoke<void>('kb:exportMarkdown', { collectionId, folderPath }),

  // External Knowledge Base
  getExternalConfig: () =>
    window.api.invoke<ExternalKnowledgeConfig | null>('kb:getExternalConfig'),
  
  setExternalConfig: (config: ExternalKnowledgeConfig) =>
    window.api.invoke<void>('kb:setExternalConfig', config),
  
  testExternalConnection: () =>
    window.api.invoke<boolean>('kb:testExternalConnection'),
}
