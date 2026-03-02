import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { DatabaseService } from './DatabaseService'
import { Tag, WritingGoal, PomodoroSession } from '../../shared/types'

export class TagService {
  private db: DatabaseService

  constructor(db: DatabaseService) {
    this.db = db
  }

  async listTags(projectId: string): Promise<Tag[]> {
    const results = this.db.query<any>(
      'SELECT * FROM tags WHERE project_id = ? ORDER BY name',
      [projectId]
    )
    return results.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : []
    }))
  }

  async addTag(projectId: string, name: string, parentId: string | null, color: string, description: string, type: string): Promise<Tag> {
    const id = uuidv4()
    const now = new Date().toISOString()
    this.db.run(
      'INSERT INTO tags (id, project_id, name, parent_id, color, description, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, projectId, name, parentId, color, description, type, now]
    )
    log.info(`Tag added: ${name}`)
    return { id, projectId, name, parentId, color, description, type: type as any }
  }

  async updateTag(id: string, name: string, parentId: string | null, color: string, description: string): Promise<void> {
    this.db.run(
      'UPDATE tags SET name = ?, parent_id = ?, color = ?, description = ? WHERE id = ?',
      [name, parentId, color, description, id]
    )
    log.info(`Tag updated: ${id}`)
  }

  async deleteTag(id: string): Promise<void> {
    this.db.run('DELETE FROM tags WHERE id = ?', [id])
    log.info(`Tag deleted: ${id}`)
  }

  async getWritingGoal(projectId: string, date: string): Promise<WritingGoal | null> {
    const results = this.db.query<any>(
      'SELECT * FROM writing_goals WHERE project_id = ? AND date = ?',
      [projectId, date]
    )
    if (results.length === 0) return null
    return results[0]
  }

  async setWritingGoal(projectId: string, date: string, targetWords: number): Promise<WritingGoal> {
    const existing = await this.getWritingGoal(projectId, date)
    if (existing) {
      this.db.run(
        'UPDATE writing_goals SET target_words = ? WHERE project_id = ? AND date = ?',
        [targetWords, projectId, date]
      )
      return { ...existing, targetWords }
    }
    const id = uuidv4()
    this.db.run(
      'INSERT INTO writing_goals (id, project_id, date, target_words, actual_words, pomodoro_sessions, total_writing_time) VALUES (?, ?, ?, ?, 0, 0, 0)',
      [id, projectId, date, targetWords]
    )
    return { id, projectId, date, targetWords, actualWords: 0, pomodoroSessions: 0, totalWritingTime: 0 }
  }

  async updateWritingProgress(projectId: string, date: string, wordsWritten: number, writingTime: number): Promise<void> {
    const existing = await this.getWritingGoal(projectId, date)
    if (existing) {
      this.db.run(
        'UPDATE writing_goals SET actual_words = actual_words + ?, total_writing_time = total_writing_time + ? WHERE project_id = ? AND date = ?',
        [wordsWritten, writingTime, projectId, date]
      )
    } else {
      const id = uuidv4()
      this.db.run(
        'INSERT INTO writing_goals (id, project_id, date, target_words, actual_words, pomodoro_sessions, total_writing_time) VALUES (?, ?, ?, 0, ?, 0, ?)',
        [id, projectId, date, wordsWritten, writingTime]
      )
    }
  }

  async getGoalsHistory(projectId: string, days: number = 30): Promise<WritingGoal[]> {
    return this.db.query<any>(
      'SELECT * FROM writing_goals WHERE project_id = ? AND date >= date("now", "-" || ? || " days") ORDER BY date DESC',
      [projectId, days]
    )
  }

  async addPomodoroSession(projectId: string, startTime: string, endTime: string, wordsWritten: number): Promise<PomodoroSession> {
    const id = uuidv4()
    const completed = true
    this.db.run(
      'INSERT INTO pomodoro_sessions (id, project_id, start_time, end_time, words_written, completed) VALUES (?, ?, ?, ?, ?, ?)',
      [id, projectId, startTime, endTime, wordsWritten, completed ? 1 : 0]
    )
    return { id, projectId, startTime, endTime, wordsWritten, completed }
  }

  async getPomodoroStats(projectId: string, days: number = 7): Promise<{ date: string; sessions: number; words: number }[]> {
    const results = this.db.query<any>(
      `SELECT date(start_time) as date, COUNT(*) as sessions, SUM(words_written) as words 
       FROM pomodoro_sessions 
       WHERE project_id = ? AND date(start_time) >= date('now', '-' || ? || ' days')
       GROUP BY date(start_time) ORDER BY date DESC`,
      [projectId, days]
    )
    return results
  }

  async getWritingSpeed(projectId: string, days: number = 7): Promise<{ date: string; wordsPerMinute: number; sessionCount: number }[]> {
    const results = this.db.query<any>(
      `SELECT date(start_time) as date, 
              CASE WHEN SUM((julianday(end_time) - julianday(start_time)) * 24 * 60) > 0 
                   THEN CAST(SUM(words_written) AS REAL) / SUM((julianday(end_time) - julianday(start_time)) * 24 * 60)
                   ELSE 0 END as wordsPerMinute,
              COUNT(*) as sessionCount
       FROM pomodoro_sessions 
       WHERE project_id = ? AND date(start_time) >= date('now', '-' || ? || ' days')
       GROUP BY date(start_time) ORDER BY date ASC`,
      [projectId, days]
    )
    return results
  }
}
