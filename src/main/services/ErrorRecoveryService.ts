import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import Store from 'electron-store'
import type { ErrorRecoveryConfig, OperationEntry, AutoBackupConfig, IntegrityCheckConfig, OperationLogConfig } from '../../shared/types'

const store = new Store()

const DEFAULT_CONFIG: ErrorRecoveryConfig = {
  autoBackup: {
    interval: 300000,
    maxBackups: 10,
    onCrash: true
  },
  integrityCheck: {
    onStartup: true,
    onSave: true,
    repairStrategy: 'prompt'
  },
  operationLog: {
    enabled: true,
    maxEntries: 1000,
    undoSteps: 50
  }
}

export class ErrorRecoveryService {
  private config: ErrorRecoveryConfig
  private operationLog: OperationEntry[] = []
  private autoBackupTimer: NodeJS.Timeout | null = null

  constructor() {
    this.config = store.get('errorRecoveryConfig', DEFAULT_CONFIG) as ErrorRecoveryConfig
    this.loadOperationLog()
    this.startAutoBackup()
  }

  getConfig(): ErrorRecoveryConfig {
    return this.config
  }

  updateConfig(newConfig: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig }
    store.set('errorRecoveryConfig', this.config)
    
    if (newConfig.autoBackup) {
      this.startAutoBackup()
    }
    
    log.info('Error recovery config updated')
  }

  private getDataDir(): string {
    const customPath = store.get('customDataPath', '') as string
    if (customPath && existsSync(customPath)) {
      return customPath
    }
    return join(app.getPath('userData'), 'data')
  }

  private getBackupDir(): string {
    const backupDir = join(this.getDataDir(), 'backups', 'auto')
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true })
    }
    return backupDir
  }

  private getOperationLogPath(): string {
    return join(this.getDataDir(), 'operation_log.json')
  }

  private loadOperationLog(): void {
    const logPath = this.getOperationLogPath()
    if (existsSync(logPath)) {
      try {
        this.operationLog = JSON.parse(readFileSync(logPath, 'utf-8'))
      } catch (err) {
        log.error('Failed to load operation log:', err)
        this.operationLog = []
      }
    }
  }

  private saveOperationLog(): void {
    const logPath = this.getOperationLogPath()
    writeFileSync(logPath, JSON.stringify(this.operationLog, null, 2))
  }

  logOperation(
    type: string,
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    previousState?: any,
    newState?: any
  ): void {
    if (!this.config.operationLog.enabled) return

    const entry: OperationEntry = {
      id: uuidv4(),
      timestamp: Date.now(),
      type,
      entityType,
      entityId,
      action,
      previousState: previousState ? JSON.stringify(previousState) : undefined,
      newState: newState ? JSON.stringify(newState) : undefined
    }

    this.operationLog.unshift(entry)

    if (this.operationLog.length > this.config.operationLog.maxEntries) {
      this.operationLog = this.operationLog.slice(0, this.config.operationLog.maxEntries)
    }

    this.saveOperationLog()
  }

  getRecentOperations(entityType?: string, limit?: number): OperationEntry[] {
    let ops = this.operationLog
    
    if (entityType) {
      ops = ops.filter(op => op.entityType === entityType)
    }
    
    return ops.slice(0, limit || 50)
  }

  undoOperation(operationId: string): any {
    const operation = this.operationLog.find(op => op.id === operationId)
    if (!operation) {
      log.warn('Operation not found:', operationId)
      return null
    }

    if (operation.action === 'create') {
      return { action: 'delete', entityType: operation.entityType, entityId: operation.entityId }
    } else if (operation.action === 'delete') {
      return { action: 'restore', entityType: operation.entityType, entityId: operation.entityId, previousState: operation.previousState }
    } else if (operation.action === 'update') {
      return { action: 'restore', entityType: operation.entityType, entityId: operation.entityId, previousState: operation.previousState }
    }

    return null
  }

  private startAutoBackup(): void {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer)
    }

    const { interval } = this.config.autoBackup
    this.autoBackupTimer = setInterval(() => {
      this.performAutoBackup()
    }, interval)

    log.info(`Auto backup started with interval: ${interval}ms`)
  }

  async performAutoBackup(): Promise<string | null> {
    const { maxBackups } = this.config.autoBackup
    const backupDir = this.getBackupDir()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `auto_${timestamp}.zip`
    const backupPath = join(backupDir, backupName)

    try {
      const dataDir = this.getDataDir()
      
      const { createWriteStream } = await import('fs')
      const archiver = await import('archiver')
      
      return new Promise((resolve, reject) => {
        const output = createWriteStream(backupPath)
        const archive = archiver.default('zip', { zlib: { level: 9 } })
        
        output.on('close', () => {
          log.info(`Auto backup created: ${backupName}`)
          this.cleanupOldBackups(backupDir, maxBackups)
          resolve(backupPath)
        })
        
        archive.on('error', reject)
        archive.pipe(output)
        archive.directory(dataDir, false)
        archive.finalize()
      })
    } catch (err) {
      log.error('Auto backup failed:', err)
      return null
    }
  }

  private cleanupOldBackups(backupDir: string, maxBackups: number): void {
    const files = readdirSync(backupDir)
      .filter(f => f.startsWith('auto_'))
      .map(f => ({ name: f, path: join(backupDir, f), mtime: statSync(join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.mtime - a.mtime)

    files.slice(maxBackups).forEach(f => {
      unlinkSync(f.path)
      log.info(`Deleted old backup: ${f.name}`)
    })
  }

  async checkIntegrity(projectPath: string): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    const requiredDirs = ['chapters', 'world', 'characters']
    requiredDirs.forEach(dir => {
      const dirPath = join(projectPath, dir)
      if (!existsSync(dirPath)) {
        issues.push(`Missing directory: ${dir}`)
      }
    })

    const projectJson = join(projectPath, 'project.json')
    if (!existsSync(projectJson)) {
      issues.push('Missing project.json')
    } else {
      try {
        JSON.parse(readFileSync(projectJson, 'utf-8'))
      } catch {
        issues.push('Corrupted project.json')
      }
    }

    return { valid: issues.length === 0, issues }
  }

  async repairProject(projectPath: string, issues: string[]): Promise<void> {
    for (const issue of issues) {
      if (issue.startsWith('Missing directory:')) {
        const dirName = issue.replace('Missing directory: ', '')
        const dirPath = join(projectPath, dirName)
        mkdirSync(dirPath, { recursive: true })
        log.info(`Created missing directory: ${dirName}`)
      }
    }
  }

  getAutoBackups(): { name: string; path: string; size: number; created: Date }[] {
    const backupDir = this.getBackupDir()
    if (!existsSync(backupDir)) return []

    return readdirSync(backupDir)
      .filter(f => f.startsWith('auto_'))
      .map(f => {
        const stats = statSync(join(backupDir, f))
        return {
          name: f,
          path: join(backupDir, f),
          size: stats.size,
          created: stats.birthtime
        }
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime())
  }
}

export const errorRecoveryService = new ErrorRecoveryService()
