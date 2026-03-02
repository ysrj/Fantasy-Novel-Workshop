import log from 'electron-log'
import type { Plugin, MenuItem, View, ExportFormat, AIProvider, ProjectMetadata, ChapterData, CharacterData } from '../../shared/types'

export class PluginService {
  private plugins: Map<string, Plugin> = new Map()
  private projectOpenCallbacks: ((project: ProjectMetadata) => void)[] = []
  private chapterSaveCallbacks: ((chapter: ChapterData) => void)[] = []
  private characterUpdateCallbacks: ((character: CharacterData) => void)[] = []
  private registeredMenus: MenuItem[] = []
  private registeredViews: View[] = []
  private registeredExports: ExportFormat[] = []
  private registeredAIProviders: AIProvider[] = []

  registerPlugin(plugin: Plugin): void {
    this.plugins.set(plugin.id, plugin)
    log.info(`Plugin registered: ${plugin.name} v${plugin.version}`)
  }

  enablePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.enabled = true
      log.info(`Plugin enabled: ${plugin.name}`)
      return true
    }
    return false
  }

  disablePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.enabled = false
      log.info(`Plugin disabled: ${plugin.name}`)
      return true
    }
    return false
  }

  listPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  getRegisteredMenus(): MenuItem[] {
    return this.registeredMenus
  }

  getRegisteredViews(): View[] {
    return this.registeredViews
  }

  getRegisteredExports(): ExportFormat[] {
    return this.registeredExports
  }

  getRegisteredAIProviders(): AIProvider[] {
    return this.registeredAIProviders
  }

  triggerProjectOpen(project: ProjectMetadata): void {
    this.projectOpenCallbacks.forEach(cb => {
      try {
        cb(project)
      } catch (err) {
        log.error('Plugin projectOpen callback error:', err)
      }
    })
  }

  triggerChapterSave(chapter: ChapterData): void {
    this.chapterSaveCallbacks.forEach(cb => {
      try {
        cb(chapter)
      } catch (err) {
        log.error('Plugin chapterSave callback error:', err)
      }
    })
  }

  triggerCharacterUpdate(character: CharacterData): void {
    this.characterUpdateCallbacks.forEach(cb => {
      try {
        cb(character)
      } catch (err) {
        log.error('Plugin characterUpdate callback error:', err)
      }
    })
  }
}

export const pluginService = new PluginService()
