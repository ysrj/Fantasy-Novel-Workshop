import type { ProjectMetadata, ChapterData, Tag, EntityReference, PlotLine, CombatData, TimeData, WritingGoal, PomodoroSession, WritingSpeed } from '../shared/types'

interface Character {
  id: string
  projectId: string
  name: string
  description: string
  [key: string]: unknown
}

interface Inspiration {
  id: number
  projectId: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface StatsData {
  totalWords: number
  todayWords: number
  chapterWords: number
  writingTime: number
  sessions: number
}

interface OutlineData {
  volumes: unknown[]
  chapters: unknown[]
}

interface WorldData {
  cultivation?: unknown
  geography?: unknown
  factions?: unknown
}

interface AICheckResult {
  type: string
  severity: 'info' | 'warning' | 'error'
  message: string
  location?: string
}

export interface ElectronAPI {
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
  send: (channel: string, ...args: unknown[]) => void
}

export interface ProjectAPI {
  'project:list': () => Promise<ProjectMetadata[]>
  'project:create': (metadata: Omit<ProjectMetadata, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ProjectMetadata>
  'project:delete': (projectId: string) => Promise<boolean>
  'project:get': (projectId: string) => Promise<ProjectMetadata | null>
  'project:getSettings': () => Promise<{ customDataPath: string }>
}

export interface SettingsAPI {
  'settings:get': (key: string) => Promise<unknown>
  'settings:set': (key: string, value: unknown) => Promise<void>
  'settings:getAll': () => Promise<Record<string, unknown>>
  'settings:setCustomDataPath': (path: string) => Promise<boolean>
}

export interface DialogAPI {
  'dialog:selectFolder': () => Promise<string | null>
}

export interface OutlineAPI {
  'outline:load': (projectId: string) => Promise<OutlineData>
  'outline:save': (projectId: string, data: OutlineData) => Promise<void>
}

export interface CharacterAPI {
  'character:list': (projectId: string) => Promise<Character[]>
  'character:save': (projectId: string, characters: Character[]) => Promise<void>
  'character:relationships': (projectId: string) => Promise<unknown>
  'character:saveRelationships': (projectId: string, data: unknown) => Promise<void>
}

export interface WorldAPI {
  'world:load': (projectId: string) => Promise<WorldData>
  'world:save': (projectId: string, data: WorldData) => Promise<void>
}

export interface WritingAPI {
  'writing:listChapters': (projectId: string) => Promise<ChapterData[]>
  'writing:getChapter': (projectId: string, chapterId: string) => Promise<string>
  'writing:saveChapter': (projectId: string, chapterId: string, content: string) => Promise<void>
  'writing:createChapter': (projectId: string, title: string) => Promise<ChapterData>
  'writing:deleteChapter': (projectId: string, chapterId: string) => Promise<void>
}

export interface StatsAPI {
  'stats:get': (projectId: string) => Promise<StatsData>
  'stats:update': (projectId: string, wordCount: number) => Promise<void>
}

export interface AIAPI {
  'ai:checkStatus': () => Promise<boolean>
  'ai:isAvailable': () => Promise<boolean>
  'ai:checkConsistency': (projectId: string) => Promise<AICheckResult[]>
  'ai:enhanceWriting': (content: string, type: 'polish' | 'expand' | 'summary') => Promise<string | null>
  'ai:generateLyrics': (projectId: string, style: string) => Promise<string | null>
  'ai:generateScript': (projectId: string, type: string) => Promise<string | null>
  'ai:generate': (prompt: string, model?: string) => Promise<string | null>
  'ai:chat': (messages: { role: string; content: string }[], model?: string) => Promise<string | null>
  'ai:listPrompts': (projectId: string) => Promise<unknown[]>
  'ai:savePrompt': (projectId: string, id: string | null, name: string, prompt: string) => Promise<boolean>
  'ai:deletePrompt': (id: string) => Promise<boolean>
}

export interface MaterialAPI {
  'material:list': (projectId: string) => Promise<unknown[]>
  'material:add': (projectId: string, name: string, type: string, path: string, tags: string[]) => Promise<unknown>
  'material:delete': (id: number) => Promise<void>
}

export interface InspirationAPI {
  'inspiration:list': (projectId: string) => Promise<Inspiration[]>
  'inspiration:add': (projectId: string, content: string, tags: string[]) => Promise<Inspiration>
  'inspiration:update': (id: number, content: string, tags: string[]) => Promise<void>
  'inspiration:delete': (id: number) => Promise<void>
  'inspiration:search': (projectId: string, keyword: string) => Promise<Inspiration[]>
}

export interface ExportAPI {
  'export:project': (projectId: string, options: unknown) => Promise<void>
  'export:chapter': (projectId: string, chapterId: string, format: string) => Promise<void>
  'export:list': (projectId: string) => Promise<unknown[]>
}

export interface DatabaseAPI {
  'db:query': (sql: string, params: unknown[]) => Promise<unknown[]>
  'db:run': (sql: string, params: unknown[]) => Promise<{ changes: number }>
}

export interface BackupAPI {
  'backup:create': () => Promise<void>
  'backup:list': () => Promise<unknown[]>
  'backup:restore': (backupName: string) => Promise<void>
  'backup:delete': (backupName: string) => Promise<void>
  'backup:getPath': () => Promise<string>
}

export interface TagAPI {
  'tag:list': (projectId: string) => Promise<Tag[]>
  'tag:add': (projectId: string, name: string, parentId: string | null, color: string, description: string, type: string) => Promise<Tag>
  'tag:update': (id: string, name: string, parentId: string | null, color: string, description: string) => Promise<void>
  'tag:delete': (id: string) => Promise<void>
  'goal:get': (projectId: string, date: string) => Promise<WritingGoal | null>
  'goal:set': (projectId: string, date: string, targetWords: number) => Promise<void>
  'goal:updateProgress': (projectId: string, date: string, wordsWritten: number, writingTime: number) => Promise<void>
  'goal:history': (projectId: string, days: number) => Promise<WritingGoal[]>
  'pomodoro:add': (projectId: string, startTime: string, endTime: string, wordsWritten: number) => Promise<PomodoroSession>
  'pomodoro:stats': (projectId: string, days: number) => Promise<unknown[]>
  'pomodoro:speed': (projectId: string, days: number) => Promise<WritingSpeed[]>
}

export interface ReferenceAPI {
  'reference:link': (sourceType: string, sourceId: string, targetType: string, targetId: string, relationType: string, projectId: string, description?: string) => Promise<EntityReference>
  'reference:unlink': (referenceId: string) => Promise<void>
  'reference:list': (projectId: string) => Promise<EntityReference[]>
  'reference:forward': (entityType: string, entityId: string) => Promise<EntityReference[]>
  'reference:backward': (entityType: string, entityId: string) => Promise<EntityReference[]>
  'reference:checkOrphans': (projectId: string) => Promise<unknown[]>
  'reference:analyzeImpact': (entityType: string, entityId: string, projectId: string) => Promise<unknown>
  'reference:matrix': (projectId: string) => Promise<Record<string, Record<string, string[]>>>
  'plotline:save': (plotLine: PlotLine) => Promise<void>
  'plotline:list': (projectId: string) => Promise<PlotLine[]>
  'plotline:delete': (plotLineId: string) => Promise<void>
}

export interface PluginAPI {
  'plugin:list': () => Promise<unknown[]>
  'plugin:enable': (pluginId: string) => Promise<void>
  'plugin:disable': (pluginId: string) => Promise<void>
}

export interface ErrorRecoveryAPI {
  'errorRecovery:getConfig': () => Promise<unknown>
  'errorRecovery:updateConfig': (config: unknown) => Promise<boolean>
  'errorRecovery:getOperations': (entityType: string, limit: number) => Promise<unknown[]>
  'errorRecovery:undo': (operationId: string) => Promise<boolean>
  'errorRecovery:autoBackup': () => Promise<void>
  'errorRecovery:checkIntegrity': (projectPath: string) => Promise<unknown>
  'errorRecovery:repair': (projectPath: string, issues: unknown) => Promise<boolean>
}

export interface VersionAPI {
  'version:save': (projectId: string, filePath: string, content: string, comment: string) => Promise<void>
  'version:list': (projectId: string, filePath: string) => Promise<unknown[]>
  'version:getContent': (projectId: string, filePath: string, versionId: string) => Promise<string>
  'version:restore': (projectId: string, filePath: string, versionId: string) => Promise<void>
  'version:stats': (projectId: string) => Promise<unknown>
}

export interface FileIndexAPI {
  'index:build': (projectId: string) => Promise<boolean>
  'index:buildRelationships': (projectId: string, characters: unknown[], locations: unknown[]) => Promise<boolean>
  'index:getFilesWithEntity': (projectId: string, entityName: string, entityType: string) => Promise<unknown[]>
  'index:getEntityReferences': (projectId: string, entityType: string) => Promise<unknown>
  'index:getEntityRelationships': (projectId: string, entityId: string) => Promise<unknown>
  'index:rebuildAll': (projectId: string, characters: unknown[], locations: unknown[]) => Promise<boolean>
}

export interface TemplateAPI {
  'template:getCharacterTemplates': () => Promise<unknown[]>
  'template:getChapterTemplates': () => Promise<unknown[]>
  'template:getWorldTemplates': () => Promise<unknown[]>
  'template:addCharacter': (template: unknown) => Promise<unknown>
  'template:addChapter': (template: unknown) => Promise<unknown>
  'template:updateCharacter': (id: string, updates: unknown) => Promise<unknown>
  'template:deleteCharacter': (id: string) => Promise<unknown>
  'template:generateCharacter': (templateId: string, data: unknown) => Promise<unknown>
  'template:generateChapter': (templateId: string, data: unknown) => Promise<unknown>
  'template:setVariables': (variables: unknown) => Promise<boolean>
  'template:getVariables': () => Promise<unknown>
  'template:reset': () => Promise<boolean>
}

export interface CombatAPI {
  'combat:load': (projectId: string) => Promise<CombatData>
  'combat:save': (projectId: string, combatData: CombatData) => Promise<boolean>
  'combat:addPowerLevel': (projectId: string, powerLevel: unknown) => Promise<boolean>
  'combat:addBattle': (projectId: string, battle: unknown) => Promise<boolean>
  'combat:validate': (projectId: string) => Promise<unknown>
}

export interface TimelineAPI {
  'timeline:load': (projectId: string) => Promise<TimeData>
  'timeline:save': (projectId: string, timeData: TimeData) => Promise<boolean>
  'timeline:addEra': (projectId: string, era: unknown) => Promise<boolean>
  'timeline:addEvent': (projectId: string, event: unknown) => Promise<boolean>
  'timeline:addCharacterAge': (projectId: string, characterAge: unknown) => Promise<boolean>
  'timeline:getCharacterTimeline': (projectId: string, characterId: string) => Promise<unknown>
  'timeline:checkChronology': (projectId: string) => Promise<unknown>
  'timeline:summary': (projectId: string) => Promise<unknown>
}

export type IPCChannels = ProjectAPI & SettingsAPI & DialogAPI & OutlineAPI & CharacterAPI & WorldAPI & WritingAPI & StatsAPI & AIAPI & MaterialAPI & InspirationAPI & ExportAPI & DatabaseAPI & BackupAPI & TagAPI & ReferenceAPI & PluginAPI & ErrorRecoveryAPI & VersionAPI & FileIndexAPI & TemplateAPI & CombatAPI & TimelineAPI

export type IPCChannel = keyof IPCChannels
