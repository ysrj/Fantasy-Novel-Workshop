import log from 'electron-log'

export interface ExternalKnowledgeConfig {
  id: string
  name: string
  type: 'ollama-anything-llm' | 'lm-studio' | 'custom-api' | 'local-vector'
  endpoint: string
  apiKey?: string
  model?: string
  enabled: boolean
}

export interface ExternalQueryResult {
  id: string
  title: string
  content: string
  score: number
  source: string
}

export interface WritingContext {
  chapterId: string
  chapterTitle: string
  currentContent: string
  characterNames: string[]
  locationNames: string[]
}

export interface Suggestion {
  type: 'reference' | 'background' | 'plot' | 'character'
  content: string
  sourceEntryId?: string
  relevance: number
}

export class ExternalKnowledgeAdapter {
  private config: ExternalKnowledgeConfig | null = null

  setConfig(config: ExternalKnowledgeConfig): void {
    this.config = config
    log.info(`[ExternalKnowledge] Configured: ${config.name} (${config.type})`)
  }

  getConfig(): ExternalKnowledgeConfig | null {
    return this.config
  }

  isEnabled(): boolean {
    return this.config?.enabled ?? false
  }

  async connect(): Promise<boolean> {
    if (!this.config) {
      log.warn('[ExternalKnowledge] No configuration set')
      return false
    }

    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        headers: this.getHeaders()
      })
      return response.ok
    } catch (error) {
      log.error('[ExternalKnowledge] Connection failed:', error)
      return false
    }
  }

  async query(query: string, options?: { limit?: number; threshold?: number }): Promise<ExternalQueryResult[]> {
    if (!this.config || !this.config.enabled) {
      return []
    }

    try {
      const response = await fetch(`${this.config.endpoint}/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          query,
          limit: options?.limit ?? 5,
          threshold: options?.threshold ?? 0.5
        })
      })

      if (!response.ok) {
        log.error('[ExternalKnowledge] Query failed:', response.statusText)
        return []
      }

      const data = await response.json()
      return data.results || []
    } catch (error) {
      log.error('[ExternalKnowledge] Query error:', error)
      return []
    }
  }

  async getSuggestionsForWriting(context: WritingContext): Promise<Suggestion[]> {
    if (!this.config || !this.config.enabled) {
      return []
    }

    try {
      const response = await fetch(`${this.config.endpoint}/suggestions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          context: context.currentContent,
          characters: context.characterNames,
          locations: context.locationNames,
          model: this.config.model
        })
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.suggestions || []
    } catch (error) {
      log.error('[ExternalKnowledge] Suggestions error:', error)
      return []
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.config || !this.config.enabled) {
      return []
    }

    try {
      const response = await fetch(`${this.config.endpoint}/embeddings`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          input: text
        })
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.embedding || []
    } catch (error) {
      log.error('[ExternalKnowledge] Embedding error:', error)
      return []
    }
  }

  async syncCollection(collectionId: string, entries: { id: string; title: string; content: string }[]): Promise<{ success: number; failed: number }> {
    if (!this.config || !this.config.enabled) {
      return { success: 0, failed: 0 }
    }

    let success = 0
    let failed = 0

    for (const entry of entries) {
      try {
        const response = await fetch(`${this.config.endpoint}/documents`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            id: entry.id,
            collection_id: collectionId,
            title: entry.title,
            content: entry.content
          })
        })

        if (response.ok) {
          success++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    log.info(`[ExternalKnowledge] Sync complete: ${success} success, ${failed} failed`)
    return { success, failed }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.config?.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    return headers
  }
}

export const externalKnowledgeAdapter = new ExternalKnowledgeAdapter()
