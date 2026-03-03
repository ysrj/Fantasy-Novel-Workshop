import log from 'electron-log'
import type { Plugin, MenuItem, View, ExportFormat, AIProvider, ProjectMetadata, ChapterData, CharacterData } from '../../shared/types'
import { ruleEngine } from '../engine/RuleEngine'
import { EventBus, Events } from '../infrastructure/events/EventBus'

export interface PluginContext {
  services: {
    getRuleEngine: () => typeof ruleEngine
    getEventBus: () => typeof EventBus
  }
  registerMenu: (menu: MenuItem) => void
  registerView: (view: View) => void
  registerExport: (format: ExportFormat) => void
  registerAIProvider: (provider: AIProvider) => void
  registerRule: (rule: unknown) => void
  onEvent: (event: string, handler: (data: unknown) => void) => void
}

export interface EnhancedPlugin extends Plugin {
  hooks?: {
    onActivate?: (context: PluginContext) => void
    onDeactivate?: () => void
    onProjectOpen?: (project: ProjectMetadata) => void
    onChapterSave?: (chapter: ChapterData) => void
    onRuleRegister?: (rule: unknown) => void
  }
  rules?: unknown[]
}

export class PluginService {
  private plugins: Map<string, EnhancedPlugin> = new Map()
  private projectOpenCallbacks: ((project: ProjectMetadata) => void)[] = []
  private chapterSaveCallbacks: ((chapter: ChapterData) => void)[] = []
  private characterUpdateCallbacks: ((character: CharacterData) => void)[] = []
  private registeredMenus: MenuItem[] = []
  private registeredViews: View[] = []
  private registeredExports: ExportFormat[] = []
  private registeredAIProviders: AIProvider[] = []
  private pluginContexts: Map<string, PluginContext> = new Map()

  registerPlugin(plugin: EnhancedPlugin): void {
    this.plugins.set(plugin.id, plugin)
    log.info(`Plugin registered: ${plugin.name} v${plugin.version}`)

    if (plugin.hooks?.onActivate) {
      const context = this.createPluginContext(plugin)
      this.pluginContexts.set(plugin.id, context)
      
      try {
        plugin.hooks.onActivate(context)
      } catch (error) {
        log.error(`Plugin ${plugin.id} activation error:`, error)
      }
    }

    if (plugin.rules) {
      plugin.rules.forEach(rule => {
        try {
          ruleEngine.registerRule(rule as never)
        } catch (error) {
          log.error(`Plugin ${plugin.id} rule registration error:`, error)
        }
      })

      if (plugin.hooks?.onRuleRegister) {
        plugin.hooks.onRuleRegister(plugin.rules)
      }
    }
  }

  private createPluginContext(plugin: EnhancedPlugin): PluginContext {
    return {
      services: {
        getRuleEngine: () => ruleEngine,
        getEventBus: () => EventBus
      },
      registerMenu: (menu: MenuItem) => {
        this.registeredMenus.push(menu)
        log.debug(`Plugin ${plugin.id} registered menu: ${menu.label}`)
      },
      registerView: (view: View) => {
        this.registeredViews.push(view)
        log.debug(`Plugin ${plugin.id} registered view: ${view.path}`)
      },
      registerExport: (format: ExportFormat) => {
        this.registeredExports.push(format)
        log.debug(`Plugin ${plugin.id} registered export: ${format.name}`)
      },
      registerAIProvider: (provider: AIProvider) => {
        this.registeredAIProviders.push(provider)
        log.debug(`Plugin ${plugin.id} registered AI provider: ${provider.name}`)
      },
      registerRule: (rule: unknown) => {
        try {
          ruleEngine.registerRule(rule as never)
        } catch (error) {
          log.error(`Plugin ${plugin.id} custom rule registration error:`, error)
        }
      },
      onEvent: (event: string, handler: (data: unknown) => void) => {
        EventBus.on(event as never, handler as never)
      }
    }
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
      
      if (plugin.hooks?.onDeactivate) {
        try {
          plugin.hooks.onDeactivate()
        } catch (error) {
          log.error(`Plugin ${plugin.id} deactivation error:`, error)
        }
      }
      
      log.info(`Plugin disabled: ${plugin.name}`)
      return true
    }
    return false
  }

  listPlugins(): EnhancedPlugin[] {
    return Array.from(this.plugins.values())
  }

  getEnabledPlugins(): EnhancedPlugin[] {
    return this.listPlugins().filter(p => p.enabled)
  }

  getPlugin(pluginId: string): EnhancedPlugin | undefined {
    return this.plugins.get(pluginId)
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

    this.getEnabledPlugins().forEach(plugin => {
      if (plugin.hooks?.onProjectOpen) {
        try {
          plugin.hooks.onProjectOpen(project)
        } catch (error) {
          log.error(`Plugin ${plugin.id} onProjectOpen error:`, error)
        }
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

    EventBus.emit(Events.CHAPTER_SAVED, chapter)
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

  uninstallPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return false

    this.disablePlugin(pluginId)
    this.plugins.delete(pluginId)
    this.pluginContexts.delete(pluginId)
    
    log.info(`Plugin uninstalled: ${plugin.name}`)
    return true
  }
}

export const pluginService = new PluginService()
