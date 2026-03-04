import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import Database from 'better-sqlite3'
import log from 'electron-log'
import { DatabaseMigrator } from '../database/DatabaseMigrator'
import { migrateLegacyFromUserData } from '../database/legacyMigrator'

let db: Database.Database | null = null
let migrator: DatabaseMigrator | null = null

const DB_DIR = join(app.getPath('userData'), 'database')
const DB_PATH = join(DB_DIR, 'fnw.db')

function initDatabase(): void {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }

  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  
  migrator = new DatabaseMigrator(db)
  migrator.migrate()
  // 兼容迁移：检查用户目录下可能的旧导出并尝试迁移到当前 sqlite 数据库
  migrateLegacyFromUserData(db).catch((err) => {
    log.error('Legacy migration encountered an error:', err)
  })
  
  log.info('Database initialized:', DB_PATH)
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
