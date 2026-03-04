import Database from 'better-sqlite3'
import log from 'electron-log'

export interface Migration {
  version: number
  description: string
  up: (db: Database.Database) => void
  down: (db: Database.Database) => void
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Initial schema - create materials, inspirations, tags tables',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          desc TEXT DEFAULT '',
          create_time TEXT DEFAULT CURRENT_TIMESTAMP,
          update_time TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      db.exec(`
        CREATE TABLE IF NOT EXISTS contents (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          chapter TEXT,
          content TEXT,
          word_count INTEGER DEFAULT 0,
          create_time TEXT DEFAULT CURRENT_TIMESTAMP,
          update_time TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

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
      
      log.info('[Migration] v1: Initial tables created')
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS materials')
      db.exec('DROP TABLE IF EXISTS inspirations')
      db.exec('DROP TABLE IF EXISTS tags')
      log.info('[Migration] v1: Tables dropped')
    }
  },
  {
    version: 2,
    description: 'Add writing goals and pomodoro tables',
    up: (db) => {
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
      
      log.info('[Migration] v2: Writing goals and pomodoro tables created')
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS writing_goals')
      db.exec('DROP TABLE IF EXISTS pomodoro_sessions')
      log.info('[Migration] v2: Tables dropped')
    }
  },
  {
    version: 3,
    description: 'Add AI custom prompts table',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS ai_custom_prompts (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          prompt TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      log.info('[Migration] v3: AI custom prompts table created')
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS ai_custom_prompts')
      log.info('[Migration] v3: Table dropped')
    }
  },
  {
    version: 4,
    description: 'Add entity references and plot lines tables',
    up: (db) => {
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
      
      log.info('[Migration] v4: Entity references and plot lines tables created')
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS entity_references')
      db.exec('DROP TABLE IF EXISTS plot_lines')
      log.info('[Migration] v4: Tables dropped')
    }
  },
  {
    version: 5,
    description: 'Add knowledge base tables',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS kb_collections (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          type TEXT DEFAULT 'custom',
          parent_id TEXT,
          entry_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS kb_entries (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          collection_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          summary TEXT,
          tags TEXT DEFAULT '[]',
          metadata TEXT DEFAULT '{}',
          source_type TEXT DEFAULT 'manual',
          embedding TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (collection_id) REFERENCES kb_collections(id)
        )
      `)
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS kb_external_configs (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          api_key TEXT,
          model TEXT,
          enabled INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_entries_project ON kb_entries(project_id)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_entries_collection ON kb_entries(collection_id)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_kb_collections_project ON kb_collections(project_id)`)
      
      log.info('[Migration] v5: Knowledge base tables created')
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS kb_entries')
      db.exec('DROP TABLE IF EXISTS kb_collections')
      db.exec('DROP TABLE IF EXISTS kb_external_configs')
      log.info('[Migration] v5: Tables dropped')
    }
  },
  {
    version: 6,
    description: 'Add drafts and published chapters tables',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS drafts (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          title TEXT DEFAULT '',
          content TEXT NOT NULL,
          word_count INTEGER DEFAULT 0,
          status TEXT DEFAULT 'editing',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(project_id, chapter_id)
        )
      `)
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS draft_edits (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          draft_id TEXT NOT NULL,
          timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
          edit_type TEXT DEFAULT 'manual',
          content TEXT NOT NULL,
          changes_summary TEXT
        )
      `)
      
      db.exec(`
        CREATE TABLE IF NOT EXISTS published_chapters (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          draft_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          platform_format TEXT,
          rewrite_settings TEXT,
          similarity REAL DEFAULT 100,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          published_at TEXT
        )
      `)
      
      db.exec(`CREATE INDEX IF NOT EXISTS idx_drafts_project ON drafts(project_id)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_draft_edits_project ON draft_edits(project_id)`)
      db.exec(`CREATE INDEX IF NOT EXISTS idx_published_project ON published_chapters(project_id)`)
      
      log.info('[Migration] v6: Draft and published chapters tables created')
    },
    down: (db) => {
      db.exec('DROP TABLE IF EXISTS drafts')
      db.exec('DROP TABLE IF EXISTS draft_edits')
      db.exec('DROP TABLE IF EXISTS published_chapters')
      log.info('[Migration] v6: Tables dropped')
    }
  }
]

export class DatabaseMigrator {
  private db: Database.Database
  private static META_TABLE = '_schema_migrations'
  private currentVersion: number = 0

  constructor(db: Database.Database) {
    this.db = db
    this.ensureMetaTable()
    this.currentVersion = this.getCurrentVersion()
  }

  private ensureMetaTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${DatabaseMigrator.META_TABLE} (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  private getCurrentVersion(): number {
    try {
      const row = this.db.prepare(`SELECT MAX(version) as version FROM ${DatabaseMigrator.META_TABLE}`).get() as { version: number | null }
      return row?.version ?? 0
    } catch {
      return 0
    }
  }

  migrate(): void {
    if (this.currentVersion >= migrations.length) {
      log.info(`[Migrator] Database is up to date at version ${this.currentVersion}`)
      return
    }

    log.info(`[Migrator] Current version: ${this.currentVersion}, target: ${migrations.length}`)

    for (const migration of migrations) {
      if (migration.version > this.currentVersion) {
        try {
          log.info(`[Migrator] Running migration v${migration.version}: ${migration.description}`)
          migration.up(this.db)
          
          this.db.prepare(
            `INSERT INTO ${DatabaseMigrator.META_TABLE} (version) VALUES (?)`
          ).run(migration.version)
          
          this.currentVersion = migration.version
          log.info(`[Migrator] Migration v${migration.version} completed successfully`)
        } catch (error) {
          log.error(`[Migrator] Migration v${migration.version} failed:`, error)
          throw error
        }
      }
    }
  }

  rollback(steps: number = 1): void {
    if (this.currentVersion === 0) {
      log.info('[Migrator] Nothing to rollback')
      return
    }

    for (let i = 0; i < steps; i++) {
      const migration = migrations.find(m => m.version === this.currentVersion)
      if (!migration) {
        log.warn(`[Migrator] No migration found for version ${this.currentVersion}`)
        break
      }

      try {
        log.info(`[Migrator] Rolling back migration v${migration.version}`)
        migration.down(this.db)
        
        this.db.prepare(
          `DELETE FROM ${DatabaseMigrator.META_TABLE} WHERE version = ?`
        ).run(migration.version)
        
        this.currentVersion--
        log.info(`[Migrator] Rollback v${migration.version} completed`)
      } catch (error) {
        log.error(`[Migrator] Rollback v${migration.version} failed:`, error)
        throw error
      }
    }
  }

  getVersion(): number {
    return this.currentVersion
  }
}
