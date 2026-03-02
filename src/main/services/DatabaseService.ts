import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import initSqlJs, { Database } from 'sql.js'
import log from 'electron-log'

let db: Database | null = null

const DB_DIR = join(app.getPath('userData'), 'database')
const DB_PATH = join(DB_DIR, 'fnw.db')

async function initDatabase(): Promise<void> {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }

  const SQL = await initSqlJs()

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
    log.info('Database loaded:', DB_PATH)
  } else {
    db = new SQL.Database()
    createTables()
    saveDatabase()
    log.info('Database created:', DB_PATH)
  }
}

function createTables(): void {
  if (!db) return

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS inspirations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
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

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      words_written INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS ai_custom_prompts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      project_id TEXT NOT NULL
    )
  `)

  log.info('Database tables created')
}

function saveDatabase(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

export class DatabaseService {
  private static instance: DatabaseService | null = null

  constructor() {
    if (!DatabaseService.instance) {
      DatabaseService.instance = this
    }
    return DatabaseService.instance
  }

  async initialize(): Promise<void> {
    if (!db) {
      await initDatabase()
    }
  }

  query<T = unknown>(sql: string, params: unknown[] = []): T[] {
    if (!db) throw new Error('Database not initialized')
    try {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const results: T[] = []
      while (stmt.step()) {
        const row = stmt.getAsObject()
        results.push(row as T)
      }
      stmt.free()
      return results
    } catch (error) {
      log.error('Database query error:', error)
      return []
    }
  }

  run(sql: string, params: unknown[] = []): { changes: number } {
    if (!db) throw new Error('Database not initialized')
    try {
      db.run(sql, params)
      saveDatabase()
      return { changes: db.getRowsModified() }
    } catch (error) {
      log.error('Database run error:', error)
      throw error
    }
  }

  close(): void {
    if (db) {
      saveDatabase()
      db.close()
      db = null
    }
  }
}
