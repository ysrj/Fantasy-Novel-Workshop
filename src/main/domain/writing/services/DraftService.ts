import { v4 as uuidv4 } from 'uuid'
import { DatabaseService } from '../../../services/DatabaseService'
import { EventBus, Events } from '../../../infrastructure/events/EventBus'

export interface Draft {
  id: string
  projectId: string
  chapterId: string
  title: string
  content: string
  wordCount: number
  createdAt: string
  updatedAt: string
  status: 'editing' | 'reviewing' | 'finalized'
}

export interface DraftEdit {
  id: string
  draftId: string
  timestamp: string
  editType: 'auto-save' | 'manual' | 'ai-enhance'
  content: string
  changesSummary?: string
}

export class DraftService {
  private db: DatabaseService

  constructor() {
    this.db = new DatabaseService()
    this.db.initialize()
  }

  saveDraft(projectId: string, chapterId: string, content: string, title?: string): Draft {
    const now = new Date().toISOString()
    const wordCount = this.countWords(content)

    const existing = this.db.query<{ id: string }>(
      'SELECT id FROM drafts WHERE project_id = ? AND chapter_id = ?',
      [projectId, chapterId]
    )

    if (existing.length > 0) {
      this.db.run(
        'UPDATE drafts SET content = ?, word_count = ?, title = ?, updated_at = ? WHERE project_id = ? AND chapter_id = ?',
        [content, wordCount, title || '', now, projectId, chapterId]
      )
      
      const draft = this.getDraft(projectId, chapterId)
      if (draft) {
        EventBus.emit(Events.DRAFT_UPDATED, { draftId: draft.id, projectId })
      }
      return draft!
    }

    const draft: Draft = {
      id: uuidv4(),
      projectId,
      chapterId,
      title: title || '',
      content,
      wordCount,
      createdAt: now,
      updatedAt: now,
      status: 'editing'
    }

    this.db.run(
      `INSERT INTO drafts (id, project_id, chapter_id, title, content, word_count, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [draft.id, draft.projectId, draft.chapterId, draft.title, draft.content, 
       draft.wordCount, draft.status, draft.createdAt, draft.updatedAt]
    )

    EventBus.emit(Events.DRAFT_CREATED, { draftId: draft.id, projectId })

    return draft
  }

  getDraft(projectId: string, chapterId: string): Draft | null {
    const results = this.db.query<Draft>(
      'SELECT * FROM drafts WHERE project_id = ? AND chapter_id = ?',
      [projectId, chapterId]
    )
    return results[0] || null
  }

  getAllDrafts(projectId: string): Draft[] {
    return this.db.query<Draft>(
      'SELECT * FROM drafts WHERE project_id = ? ORDER BY updated_at DESC',
      [projectId]
    )
  }

  getDraftHistory(projectId: string, chapterId: string): DraftEdit[] {
    return this.db.query<DraftEdit>(
      'SELECT * FROM draft_edits WHERE project_id = ? AND chapter_id = ? ORDER BY timestamp DESC LIMIT 50',
      [projectId, chapterId]
    )
  }

  autoSave(projectId: string, chapterId: string, content: string): void {
    this.saveDraft(projectId, chapterId, content)
  }

  deleteDraft(projectId: string, chapterId: string): void {
    this.db.run('DELETE FROM drafts WHERE project_id = ? AND chapter_id = ?', [projectId, chapterId])
    this.db.run('DELETE FROM draft_edits WHERE project_id = ? AND chapter_id = ?', [projectId, chapterId])
  }

  updateStatus(draftId: string, status: Draft['status']): void {
    this.db.run('UPDATE drafts SET status = ? WHERE id = ?', [status, draftId])
  }

  private countWords(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const numbers = (text.match(/\d+/g) || []).join('').length
    return chineseChars + englishWords + numbers
  }
}
