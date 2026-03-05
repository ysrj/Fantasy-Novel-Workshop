import { DatabaseService } from '../services/DatabaseService'
import { ProjectService } from '../services/ProjectService'
import { OutlineService } from '../services/OutlineService'
import { CharacterService } from '../services/CharacterService'
import { WorldService } from '../services/WorldService'
import { WritingService } from '../services/WritingService'
import { StatsService } from '../services/StatsService'
import { AIService } from '../services/AIService'
import { MaterialService } from '../services/MaterialService'
import { ExportService } from '../services/ExportService'
import { BackupService } from '../services/BackupService'
import { TagService } from '../services/TagService'
import { ReferenceService } from '../services/ReferenceService'
import { PluginService } from '../services/PluginService'
import { ErrorRecoveryService } from '../services/ErrorRecoveryService'
import { VersionedFileService } from '../services/VersionedFileService'
import { FileIndexService } from '../services/FileIndexService'
import { TemplateService } from '../services/TemplateService'
import { CombatService } from '../services/CombatService'
import { TimelineService } from '../services/TimelineService'
import { AutoUpdateService } from '../services/AutoUpdateService'
import { PerformanceService } from '../services/PerformanceService'
import log from 'electron-log'

export class ServiceContainer {
  private static instance: ServiceContainer
  private services: Map<string, unknown> = new Map()
  private initialized: boolean = false

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer()
    }
    return ServiceContainer.instance
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    log.info('[DI] Initializing service container...')

    const databaseService = new DatabaseService()
    databaseService.initialize()
    this.services.set('database', databaseService)
    log.info('[DI] DatabaseService registered')

    this.services.set('project', new ProjectService())
    this.services.set('outline', new OutlineService())
    this.services.set('character', new CharacterService())
    this.services.set('world', new WorldService())
    this.services.set('writing', new WritingService())
    this.services.set('stats', new StatsService())
    this.services.set('ai', new AIService())
    this.services.set('export', new ExportService())
    this.services.set('backup', new BackupService())
    this.services.set('plugin', new PluginService())
    this.services.set('errorRecovery', new ErrorRecoveryService())
    this.services.set('versionedFile', new VersionedFileService())
    this.services.set('fileIndex', new FileIndexService())
    this.services.set('template', new TemplateService())
    this.services.set('combat', new CombatService())
    this.services.set('timeline', new TimelineService())
    this.services.set('autoUpdate', new AutoUpdateService())
    this.services.set('performance', new PerformanceService())

    const db = this.get<DatabaseService>('database')
    this.services.set('material', new MaterialService(db))
    this.services.set('tag', new TagService(db))
    this.services.set('reference', new ReferenceService(db))

    log.info('[DI] All services registered')
    this.initialized = true
  }

  get<T>(serviceName: string): T {
    const service = this.services.get(serviceName)
    if (!service) {
      throw new Error(`[DI] Service not found: ${serviceName}`)
    }
    return service as T
  }

  has(serviceName: string): boolean {
    return this.services.has(serviceName)
  }

  getAllServiceNames(): string[] {
    return Array.from(this.services.keys())
  }
}

export const container = ServiceContainer.getInstance()
