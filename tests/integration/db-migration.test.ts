/**
 * @jest-environment node
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import Database from 'better-sqlite3'
import { migrateLegacyFromPath } from '@/main/database/legacyMigrator'
import { DatabaseMigrator } from '@/main/database/DatabaseMigrator'

describe('Legacy migration integration', () => {
  let tmpDir: string
  let dbPath: string
  let dbDir: string
  let db: Database.Database

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fnw-test-'))
    dbDir = path.join(tmpDir, 'database')
    fs.mkdirSync(dbDir, { recursive: true })
    dbPath = path.join(dbDir, 'fnw.db')
    db = new Database(dbPath)

    // Initialize schema via migrator
    const migrator = new DatabaseMigrator(db)
    migrator.migrate()
  })

  afterAll(() => {
    try { db.close() } catch {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
  })

  test('migrates JSON export into sqlite', async () => {
    const legacy = {
      projects: [
        { id: 'p1', name: 'Project 1', desc: 'desc', create_time: new Date().toISOString(), update_time: new Date().toISOString() }
      ],
      contents: [
        { id: 'c1', project_id: 'p1', chapter: '1', content: 'hello world', word_count: 11, create_time: new Date().toISOString(), update_time: new Date().toISOString() }
      ]
    }

    const exportPath = path.join(tmpDir, 'fnw-export.json')
    fs.writeFileSync(exportPath, JSON.stringify(legacy), 'utf8')

    // Run migrator against the db and tmpDir
    await migrateLegacyFromPath(db, tmpDir)

    const proj = db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }
    const cont = db.prepare('SELECT COUNT(*) as c FROM contents').get() as { c: number }

    expect(proj.c).toBeGreaterThanOrEqual(1)
    expect(cont.c).toBeGreaterThanOrEqual(1)
  })
})
