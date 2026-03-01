import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, Archiver } from 'fs'
import { app } from 'electron'
import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'

const DATA_DIR = join(app.getPath('userData'), 'data')
const BACKUPS_DIR = join(DATA_DIR, 'backups')

function ensureBackupsDir(): void {
  if (!existsSync(BACKUPS_DIR)) {
    mkdirSync(BACKUPS_DIR, { recursive: true })
  }
}

export class BackupService {
  createBackup(): string | null {
    try {
      ensureBackupsDir()

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const backupName = `fnw_backup_${timestamp}`
      const backupPath = join(BACKUPS_DIR, backupName)

      if (!existsSync(DATA_DIR)) {
        log.warn('Data directory does not exist')
        return null
      }

      mkdirSync(backupPath, { recursive: true })

      const items = readdirSync(DATA_DIR)
      for (const item of items) {
        if (item === 'backups') continue
        const srcPath = join(DATA_DIR, item)
        const destPath = join(backupPath, item)
        
        if (require('fs').statSync(srcPath).isDirectory()) {
          cpSync(srcPath, destPath, { recursive: true })
        } else {
          require('fs').copyFileSync(srcPath, destPath)
        }
      }

      const backupInfo = {
        id: uuidv4(),
        name: backupName,
        timestamp: new Date().toISOString(),
        size: this.getDirSize(backupPath)
      }

      const infoPath = join(backupPath, 'backup_info.json')
      writeFileSync(infoPath, JSON.stringify(backupInfo, null, 2))

      log.info(`Backup created: ${backupName}`)
      return backupPath
    } catch (error) {
      log.error('Failed to create backup:', error)
      return null
    }
  }

  listBackups(): { id: string; name: string; timestamp: string; size: number }[] {
    try {
      ensureBackupsDir()
      const backups: { id: string; name: string; timestamp: string; size: number }[] = []
      
      const items = readdirSync(BACKUPS_DIR)
      for (const item of items) {
        const infoPath = join(BACKUPS_DIR, item, 'backup_info.json')
        if (existsSync(infoPath)) {
          const info = JSON.parse(readFileSync(infoPath, 'utf-8'))
          backups.push(info)
        }
      }

      return backups.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    } catch (error) {
      log.error('Failed to list backups:', error)
      return []
    }
  }

  restoreBackup(backupName: string): boolean {
    try {
      const backupPath = join(BACKUPS_DIR, backupName)
      if (!existsSync(backupPath)) {
        log.warn('Backup not found:', backupName)
        return false
      }

      if (existsSync(DATA_DIR)) {
        const tempDir = join(DATA_DIR, '_temp_restore')
        cpSync(DATA_DIR, tempDir, { recursive: true })
        
        try {
          cpSync(backupPath, DATA_DIR, { recursive: true })
          require('fs').rmSync(tempDir, { recursive: true, force: true })
        } catch (e) {
          cpSync(tempDir, DATA_DIR, { recursive: true })
          require('fs').rmSync(tempDir, { recursive: true, force: true })
          throw e
        }
      }

      log.info(`Backup restored: ${backupName}`)
      return true
    } catch (error) {
      log.error('Failed to restore backup:', error)
      return false
    }
  }

  deleteBackup(backupName: string): boolean {
    try {
      const backupPath = join(BACKUPS_DIR, backupName)
      if (!existsSync(backupPath)) {
        return false
      }

      require('fs').rmSync(backupPath, { recursive: true, force: true })
      log.info(`Backup deleted: ${backupName}`)
      return true
    } catch (error) {
      log.error('Failed to delete backup:', error)
      return false
    }
  }

  private getDirSize(dirPath: string): number {
    let size = 0
    try {
      const items = readdirSync(dirPath)
      for (const item of items) {
        const itemPath = join(dirPath, item)
        const stat = require('fs').statSync(itemPath)
        if (stat.isDirectory()) {
          size += this.getDirSize(itemPath)
        } else {
          size += stat.size
        }
      }
    } catch (e) {
      // ignore
    }
    return size
  }

  getBackupPath(): string {
    return BACKUPS_DIR
  }
}
