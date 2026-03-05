/**
 * @jest-environment node
 */

import fs from 'fs'
import os from 'os'
import path from 'path'
import Database from 'better-sqlite3'
import { migrateLegacyFromPath } from '@/main/database/legacyMigrator'
import { DatabaseMigrator } from '@/main/database/DatabaseMigrator'

describe('Legacy migration mapping', () => {
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

  test('migrates JSON with alternate field names', async () => {
    const legacy = {
      projects: [
        { id: 'p1', name: 'Project 1', description: 'desc', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ],
      contents: [
        { id: 'c1', projectId: 'p1', chapter: '1', content: 'hello world', word_count: 11, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
    }

    const exportPath = path.join(tmpDir, 'fnw-export.json')
    fs.writeFileSync(exportPath, JSON.stringify(legacy), 'utf8')

    await migrateLegacyFromPath(db, tmpDir, { dryRun: false })

    const proj = db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number }
    const cont = db.prepare('SELECT COUNT(*) as c FROM contents').get() as { c: number }

    expect(proj.c).toBeGreaterThanOrEqual(1)
    expect(cont.c).toBeGreaterThanOrEqual(1)
  })

})
