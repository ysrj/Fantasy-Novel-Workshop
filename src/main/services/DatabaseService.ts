import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import log from 'electron-log'

let db: Database.Database | null = null

const DB_DIR = join(app.getPath('userData'), 'database')
const DB_PATH = join(DB_DIR, 'fnw.db')

function initDatabase(): void {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  
  createTables()
  log.info('Database initialized:', DB_PATH)
}

function createTables(): void {
  if (!db) return

  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      path TEXT NOT NULL,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS inspirations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      parent_id TEXT,
      color TEXT DEFAULT '#1890ff',
      description TEXT DEFAULT '',
      type TEXT DEFAULT 'custom',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS writing_goals (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      date TEXT NOT NULL,
      target_words INTEGER DEFAULT 0,
      actual_words INTEGER DEFAULT 0,
      pomodoro_sessions INTEGER DEFAULT 0,
      total_writing_time INTEGER DEFAULT 0,
      UNIQUE(project_id, date)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      words_written INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_custom_prompts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      project_id TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS entity_references (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS plot_lines (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'main',
      status TEXT DEFAULT 'active',
      description TEXT,
      involved_characters TEXT,
      key_events TEXT,
      chapters TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  log.info('Database tables created')
}

export class DatabaseService {
  private static instance: DatabaseService | null = null

  constructor() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = this
    }
    return DatabaseService.instance
  }

  initialize(): void {
    if (!db) {
      initDatabase()
    }
  }

  query<T = unknown>(sql: string, params: unknown[] = []): T[] {
    if (!db) throw new Error('Database not initialized')
    try {
      const stmt = db.prepare(sql)
      return stmt.all(...params) as T[]
    } catch (error) {
      log.error('Database query error:', error)
      return []
    }
  }

  run(sql: string, params: unknown[] = []): { changes: number } {
    if (!db) throw new Error('Database not initialized')
    try {
      const stmt = db.prepare(sql)
      const result = stmt.run(...params)
      return { changes: result.changes }
    } catch (error) {
      log.error('Database run error:', error)
      throw error
    }
  }

  get<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
    if (!db) throw new Error('Database not initialized')
    try {
      const stmt = db.prepare(sql)
      return stmt.get(...params) as T | undefined
    } catch (error) {
      log.error('Database get error:', error)
      return undefined
    }
  }

  close(): void {
    if (db) {
      db.close()
      db = null
      log.info('Database closed')
    }
  }
}
