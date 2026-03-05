import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import log from 'electron-log'

/**
 * 兼容迁移器：尝试从若干旧格式（.json 导出或旧 sqlite 文件）迁移到当前 better-sqlite3 DB。
 * 不会覆盖现有 DB；迁移成功后会将原始文件重命名为 .migrated.TIMESTAMP。
 *
 * 注意：旧版本若为内存 sql.js，请先在旧程序中导出为 JSON（工具已在 docs 中说明）。
 */
export async function migrateLegacyFromUserData(db: Database.Database): Promise<void> {
  const userData = app.getPath('userData')
  await migrateLegacyFromPath(db, userData)
}

// 可供测试或手动调用的核心方法（不依赖 electron 的 app）
export interface MigrateOptions {
  dryRun?: boolean
  reportDir?: string
}

export async function migrateLegacyFromPath(db: Database.Database, userDataPath: string, options: MigrateOptions = {}): Promise<void> {
  const report: any = { files: [], inserted: {}, skipped: {}, errors: [] }
  const candidates = [
    'fnw-export.json',        // 可能的 JSON 导出（推荐）
    'fnw-sqljs.json',
    'fnw-old-export.json',
    'fnw-sqljs.sqlite',       // 可能的旧 sqlite 文件名
    'fnw-old.db'
  ]

  for (const name of candidates) {
    const p = join(userDataPath, name)
    if (!fs.existsSync(p)) continue

    try {
      log.info(`[LegacyMigrator] Found legacy export: ${p}`)

      report.files.push(p)

      if (name.endsWith('.json')) {
        const raw = fs.readFileSync(p, 'utf8')
        let payload: any
        try { payload = JSON.parse(raw) } catch (e) { report.errors.push({ file: p, error: 'invalid_json' }); continue }

        // 支持最常见的 JSON 导出结构：{ projects: [...], contents: [...], characters: [...], worldviews: [...] }
        await migrateJsonPayload(db, payload, options, report)

        if (!options.dryRun) {
          const migratedName = `${p}.migrated.${Date.now()}`
          fs.renameSync(p, migratedName)
          log.info(`[LegacyMigrator] JSON migrated and original renamed to ${migratedName}`)
        } else {
          log.info(`[LegacyMigrator] Dry-run: JSON would be migrated (no file rename)`)
        }
      } else if (name.endsWith('.sqlite') || name.endsWith('.db')) {
        // ATTACH 老数据库并拷贝表（如果存在）
        // 注意：路径需为绝对并对 current process 可读取
        const attachAlias = 'old_db'
        try {
          db.exec(`ATTACH DATABASE '${p.replace(/'/g, "''")}' AS ${attachAlias}`)

          // 仅在目标表存在时尝试复制（常见表名）
          const tablesToCopy = ['projects', 'contents', 'characters', 'worldviews', 'materials', 'kb_entries']
          for (const t of tablesToCopy) {
            try {
              if (!options.dryRun) {
                db.exec(`INSERT OR IGNORE INTO ${t} SELECT * FROM ${attachAlias}.${t}`)
                log.info(`[LegacyMigrator] Copied table ${t} from legacy DB`)
              } else {
                log.info(`[LegacyMigrator] Dry-run: would copy table ${t} from legacy DB`)
              }
            } catch (e) {
              // 忽略单表错误（表不存在或结构不兼容）
              report.errors.push({ file: p, table: t, error: String(e) })
              log.info(`[LegacyMigrator] Table ${t} not found or incompatible in legacy DB, skipped`)
            }
          }

          db.exec(`DETACH DATABASE ${attachAlias}`)
          const migratedName = `${p}.migrated.${Date.now()}`
          fs.renameSync(p, migratedName)
          log.info(`[LegacyMigrator] SQLite migrated and original renamed to ${migratedName}`)
        } catch (err) {
          log.error('[LegacyMigrator] Failed to attach/copy legacy sqlite:', err)
          try { db.exec(`DETACH DATABASE ${attachAlias}`) } catch {}
        }
      }
    } catch (err) {
      log.error('[LegacyMigrator] Migration failed for', p, err)
      // 不抛出以避免阻塞应用启动；但记录错误供人工排查
    }
  }
}

async function migrateJsonPayload(db: Database.Database, payload: any, options: MigrateOptions = {}, report: any = {}) {
  if (!payload || typeof payload !== 'object') return

  // 辅助：在事务中插入数组数据（如果目标表存在）
  function safeInsertArray(table: string, columns: string[], rows: any[]) {
    if (!rows || !rows.length) return
    report.inserted[table] = report.inserted[table] || { attempted: 0, inserted: 0 }
    const placeholders = columns.map(() => '?').join(',')
    const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`
    try {
      const stmt = db.prepare(sql)
      const txn = db.transaction((items: any[]) => {
        for (const item of items) {
          const vals = columns.map(c => (c in item ? item[c] : null))
          if (!options.dryRun) {
            stmt.run(...vals)
            report.inserted[table].inserted++
          }
          report.inserted[table].attempted++
        }
      })
      txn(rows)
      log.info(`[LegacyMigrator] Inserted ${rows.length} rows into ${table} (dryRun=${options.dryRun})`)
    } catch (e) {
      report.errors.push({ table, error: String(e) })
      log.info(`[LegacyMigrator] Skipped inserting into ${table} due to error or incompatible schema`)
    }
  }

  // 尝试按常见表名迁移（列名尽量宽容）
  if (Array.isArray(payload.projects)) {
    safeInsertArray('projects', ['id', 'name', 'desc', 'create_time', 'update_time'], payload.projects)
  }
  if (Array.isArray(payload.contents)) {
    safeInsertArray('contents', ['id', 'project_id', 'chapter', 'content', 'word_count', 'create_time', 'update_time'], payload.contents)
  }
  if (Array.isArray(payload.characters)) {
    safeInsertArray('characters', ['id', 'project_id', 'name', 'bio', 'metadata', 'created_at'], payload.characters)
  }
  if (Array.isArray(payload.worldviews)) {
    safeInsertArray('worldviews', ['id', 'project_id', 'name', 'description', 'created_at'], payload.worldviews)
  }
}

  // write report if requested
  try {
    const dir = options.reportDir || join(userDataPath, 'migration_reports')
    fs.mkdirSync(dir, { recursive: true })
    const out = join(dir, `migration-report-${Date.now()}.json`)
    fs.writeFileSync(out, JSON.stringify(report, null, 2), 'utf8')
    log.info(`[LegacyMigrator] Migration report written to ${out}`)
  } catch (e) {
    log.error('[LegacyMigrator] Failed to write migration report', e)
  }

export default {
  migrateLegacyFromUserData,
  migrateLegacyFromPath
}
