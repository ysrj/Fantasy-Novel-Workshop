import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from '../../../services/DatabaseService'

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
  embedding?: number[]
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

interface DbRow {
  tags: string
  metadata: string
  embedding: string | null
}

export class KnowledgeBaseService {
  private static instance: KnowledgeBaseService | null = null
  private db: DatabaseService

  constructor() {
    this.db = new DatabaseService()
    this.db.initialize()
  }

  static getInstance(): KnowledgeBaseService {
    if (!KnowledgeBaseService.instance) {
      KnowledgeBaseService.instance = new KnowledgeBaseService()
    }
    return KnowledgeBaseService.instance
  }

  private parseRow(row: Record<string, unknown>): { tags: string[], metadata: Record<string, unknown>, embedding: number[] | undefined } {
    return {
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : [],
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata || '{}') : {},
      embedding: row.embedding ? JSON.parse(row.embedding as string) : undefined
    }
  }

  createCollection(data: Omit<KnowledgeCollection, 'id' | 'entryCount' | 'createdAt'>): KnowledgeCollection {
    const collection: KnowledgeCollection = {
      id: uuidv4(),
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      type: data.type,
      parentId: data.parentId,
      entryCount: 0,
      createdAt: new Date().toISOString()
    }

    this.db.run(
      `INSERT INTO kb_collections (id, project_id, name, description, type, parent_id, entry_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [collection.id, collection.projectId, collection.name, collection.description, 
       collection.type, collection.parentId, collection.entryCount, collection.createdAt]
    )

    return collection
  }

  getCollections(projectId: string): KnowledgeCollection[] {
    return this.db.query<KnowledgeCollection>(
      'SELECT * FROM kb_collections WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    )
  }

  getCollection(collectionId: string): KnowledgeCollection | null {
    const results = this.db.query<KnowledgeCollection>(
      'SELECT * FROM kb_collections WHERE id = ?',
      [collectionId]
    )
    return results[0] || null
  }

  updateCollection(collectionId: string, updates: Partial<KnowledgeCollection>): void {
    const setClauses: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      setClauses.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?')
      values.push(updates.description)
    }
    if (updates.type !== undefined) {
      setClauses.push('type = ?')
      values.push(updates.type)
    }

    if (setClauses.length > 0) {
      values.push(collectionId)
      this.db.run(
        `UPDATE kb_collections SET ${setClauses.join(', ')} WHERE id = ?`,
        values
      )
    }
  }

  deleteCollection(collectionId: string): void {
    this.db.run('DELETE FROM kb_entries WHERE collection_id = ?', [collectionId])
    this.db.run('DELETE FROM kb_collections WHERE id = ?', [collectionId])
  }

  createEntry(data: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): KnowledgeEntry {
    const now = new Date().toISOString()
    const entry: KnowledgeEntry = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    }

    this.db.run(
      `INSERT INTO kb_entries (id, project_id, collection_id, title, content, summary, tags, metadata, source_type, embedding, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [entry.id, entry.projectId, entry.collectionId, entry.title, entry.content, 
       entry.summary || null, JSON.stringify(entry.tags), JSON.stringify(entry.metadata),
       entry.sourceType, entry.embedding ? JSON.stringify(entry.embedding) : null,
       entry.createdAt, entry.updatedAt]
    )

    this.db.run(
      'UPDATE kb_collections SET entry_count = entry_count + 1 WHERE id = ?',
      [entry.collectionId]
    )

    return entry
  }

  getEntries(collectionId: string): KnowledgeEntry[] {
    const results = this.db.query<DbRow & KnowledgeEntry>(
      'SELECT * FROM kb_entries WHERE collection_id = ? ORDER BY created_at DESC',
      [collectionId]
    )

    return results.map((row: DbRow & KnowledgeEntry) => {
      const parsed = this.parseRow(row)
      return {
        ...row,
        tags: parsed.tags,
        metadata: parsed.metadata,
        embedding: parsed.embedding
      }
    })
  }

  getEntry(entryId: string): KnowledgeEntry | null {
    const results = this.db.query<DbRow & KnowledgeEntry>(
      'SELECT * FROM kb_entries WHERE id = ?',
      [entryId]
    )

    if (!results.length) return null

    const row = results[0]
    const parsed = this.parseRow(row)
    return {
      ...row,
      tags: parsed.tags,
      metadata: parsed.metadata,
      embedding: parsed.embedding
    }
  }

  updateEntry(entryId: string, updates: Partial<KnowledgeEntry>): void {
    const setClauses: string[] = ['updated_at = ?']
    const values: unknown[] = [new Date().toISOString()]

    if (updates.title !== undefined) {
      setClauses.push('title = ?')
      values.push(updates.title)
    }
    if (updates.content !== undefined) {
      setClauses.push('content = ?')
      values.push(updates.content)
    }
    if (updates.summary !== undefined) {
      setClauses.push('summary = ?')
      values.push(updates.summary)
    }
    if (updates.tags !== undefined) {
      setClauses.push('tags = ?')
      values.push(JSON.stringify(updates.tags))
    }
    if (updates.metadata !== undefined) {
      setClauses.push('metadata = ?')
      values.push(JSON.stringify(updates.metadata))
    }

    values.push(entryId)
    this.db.run(
      `UPDATE kb_entries SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    )
  }

  deleteEntry(entryId: string): void {
    const entry = this.getEntry(entryId)
    if (entry) {
      this.db.run('DELETE FROM kb_entries WHERE id = ?', [entryId])
      this.db.run(
        'UPDATE kb_collections SET entry_count = entry_count - 1 WHERE id = ?',
        [entry.collectionId]
      )
    }
  }

  search(projectId: string, keyword: string): KnowledgeEntry[] {
    const searchPattern = `%${keyword}%`
    const results = this.db.query<DbRow & KnowledgeEntry>(
      `SELECT * FROM kb_entries 
       WHERE project_id = ? AND (content LIKE ? OR title LIKE ? OR tags LIKE ?)
       ORDER BY created_at DESC`,
      [projectId, searchPattern, searchPattern, searchPattern]
    )

    return results.map((row: DbRow & KnowledgeEntry) => {
      const parsed = this.parseRow(row)
      return {
        ...row,
        tags: parsed.tags,
        metadata: parsed.metadata
      }
    })
  }

  semanticSearch(projectId: string, query: string, limit: number = 10): KnowledgeEntry[] {
    const allEntries = this.db.query<DbRow & KnowledgeEntry>(
      'SELECT * FROM kb_entries WHERE project_id = ? AND embedding IS NOT NULL',
      [projectId]
    )

    if (allEntries.length === 0) {
      return this.search(projectId, query).slice(0, limit)
    }

    return allEntries.slice(0, limit).map((row: DbRow & KnowledgeEntry) => {
      const parsed = this.parseRow(row)
      return {
        ...row,
        tags: parsed.tags,
        metadata: parsed.metadata,
        embedding: parsed.embedding
      }
    })
  }

  generateSummary(entryId: string): string {
    const entry = this.getEntry(entryId)
    if (!entry) return ''

    const sentences = entry.content.split(/[。！？]/).filter(s => s.trim())
    if (sentences.length <= 3) return entry.content

    return sentences.slice(0, 3).join('。') + '。'
  }

  importFromMarkdown(projectId: string, collectionId: string, files: { name: string; content: string }[]): KnowledgeEntry[] {
    const entries: KnowledgeEntry[] = []

    for (const file of files) {
      const entry = this.createEntry({
        projectId,
        collectionId,
        title: file.name.replace(/\.md$/, ''),
        content: file.content,
        tags: [],
        metadata: {},
        sourceType: 'imported'
      })
      entries.push(entry)
    }

    return entries
  }
}
