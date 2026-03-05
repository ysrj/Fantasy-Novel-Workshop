import { ipcMain, dialog } from 'electron'
import Store from 'electron-store'
import { container } from '../di/ServiceContainer'
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
import { PerformanceService } from '../services/PerformanceService'

const store = new Store()

function getProjectService() { return container.get<ProjectService>('project') }
function getOutlineService() { return container.get<OutlineService>('outline') }
function getCharacterService() { return container.get<CharacterService>('character') }
function getWorldService() { return container.get<WorldService>('world') }
function getWritingService() { return container.get<WritingService>('writing') }
function getStatsService() { return container.get<StatsService>('stats') }
function getDatabaseService() { return container.get<DatabaseService>('database') }
function getAiService() { return container.get<AIService>('ai') }
function getMaterialService() { return container.get<MaterialService>('material') }
function getExportService() { return container.get<ExportService>('export') }
function getBackupService() { return container.get<BackupService>('backup') }
function getTagService() { return container.get<TagService>('tag') }
function getReferenceService() { return container.get<ReferenceService>('reference') }
function getPluginService() { return container.get<PluginService>('plugin') }
function getErrorRecoveryService() { return container.get<ErrorRecoveryService>('errorRecovery') }
function getVersionedFileService() { return container.get<VersionedFileService>('versionedFile') }
function getFileIndexService() { return container.get<FileIndexService>('fileIndex') }
function getTemplateService() { return container.get<TemplateService>('template') }
function getCombatService() { return container.get<CombatService>('combat') }
function getTimelineService() { return container.get<TimelineService>('timeline') }
function getPerformanceService() { return container.get<PerformanceService>('performance') }

export function setupIpcHandlers(): void {
  // Project handlers
  ipcMain.handle('project:list', () => getProjectService().listProjects())
  ipcMain.handle('project:create', (_, metadata) => getProjectService().createProject(metadata))
  ipcMain.handle('project:delete', (_, projectId) => getProjectService().deleteProject(projectId))
  ipcMain.handle('project:get', (_, projectId) => getProjectService().getProject(projectId))
  ipcMain.handle('project:getSettings', () => getProjectService().getSettings())

  // Settings handlers
  ipcMain.handle('settings:get', (_, key) => store.get(key))
  ipcMain.handle('settings:set', (_, key, value) => store.set(key, value))
  ipcMain.handle('settings:getAll', () => store.store)
  ipcMain.handle('settings:setCustomDataPath', (_, path) => {
    store.set('customDataPath', path)
    return true
  })

  // Dialog handlers
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: '选择数据存储文件夹'
    })
    if (result.canceled) {
      return null
    }
    return result.filePaths[0]
  })

  // Outline handlers
  ipcMain.handle('outline:load', (_, projectId) => getOutlineService().loadOutline(projectId))
  ipcMain.handle('outline:save', (_, projectId, data) => getOutlineService().saveOutline(projectId, data))

  // Character handlers
  ipcMain.handle('character:list', (_, projectId) => getCharacterService().listCharacters(projectId))
  ipcMain.handle('character:save', (_, projectId, characters) =>
    getCharacterService().saveCharacters(projectId, characters)
  )
  ipcMain.handle('character:relationships', (_, projectId) =>
    getCharacterService().getRelationships(projectId)
  )
  ipcMain.handle('character:saveRelationships', (_, projectId, data) =>
    getCharacterService().saveRelationships(projectId, data)
  )

  // World handlers
  ipcMain.handle('world:load', (_, projectId) => getWorldService().loadWorld(projectId))
  ipcMain.handle('world:save', (_, projectId, data) => getWorldService().saveWorld(projectId, data))

  // Writing handlers
  ipcMain.handle('writing:listChapters', (_, projectId) =>
    getWritingService().listChapters(projectId)
  )
  ipcMain.handle('writing:getChapter', (_, projectId, chapterId) =>
    getWritingService().getChapter(projectId, chapterId)
  )
  ipcMain.handle('writing:saveChapter', (_, projectId, chapterId, content) =>
    getWritingService().saveChapter(projectId, chapterId, content)
  )
  ipcMain.handle('writing:createChapter', (_, projectId, title) =>
    getWritingService().createChapter(projectId, title)
  )
  ipcMain.handle('writing:deleteChapter', (_, projectId, chapterId) =>
    getWritingService().deleteChapter(projectId, chapterId)
  )

  // Stats handlers
  ipcMain.handle('stats:get', (_, projectId) => getStatsService().getStats(projectId))
  ipcMain.handle('stats:update', (_, projectId, wordCount) =>
    getStatsService().updateWordCount(projectId, wordCount)
  )

  // AI handlers
  ipcMain.handle('ai:checkStatus', () => getAiService().checkOllamaStatus())
  ipcMain.handle('ai:isAvailable', () => getAiService().isAvailable())
  ipcMain.handle('ai:checkConsistency', async (_, projectId) => {
    const chapters = getWritingService().listChapters(projectId)
    const contents = chapters.map(c => getWritingService().getChapter(projectId, c.id)).filter(Boolean) as string[]
    return getAiService().checkConsistency(projectId, contents)
  })
  ipcMain.handle('ai:enhanceWriting', (_, content, type) =>
    getAiService().enhanceWriting(content, type)
  )
  ipcMain.handle('ai:generateLyrics', async (_, projectId, style) => {
    const chapters = getWritingService().listChapters(projectId)
    const contents = chapters.map(c => getWritingService().getChapter(projectId, c.id)).filter(Boolean) as string[]
    const content = contents.join('\n\n').slice(0, 5000)
    return getAiService().generateLyrics(content, style)
  })
  ipcMain.handle('ai:generateScript', async (_, projectId, type) => {
    const chapters = getWritingService().listChapters(projectId)
    const contents = chapters.map(c => getWritingService().getChapter(projectId, c.id)).filter(Boolean) as string[]
    const content = contents.join('\n\n').slice(0, 5000)
    return getAiService().generateScript(content, type)
  })
  ipcMain.handle('ai:generate', (_, prompt, model) =>
    getAiService().generate(prompt, model)
  )
  ipcMain.handle('ai:chat', (_, messages, model) =>
    getAiService().chat(messages, model)
  )

  // Material handlers
  ipcMain.handle('material:list', async (_, projectId) => {
    return getMaterialService().listMaterials(projectId)
  })
  ipcMain.handle('material:add', async (_, projectId, name, type, path, tags) => {
    return getMaterialService().addMaterial(projectId, name, type, path, tags)
  })
  ipcMain.handle('material:delete', async (_, id) => {
    return getMaterialService().deleteMaterial(id)
  })

  // Inspiration handlers
  ipcMain.handle('inspiration:list', async (_, projectId) => {
    return getMaterialService().listInspirations(projectId)
  })
  ipcMain.handle('inspiration:add', async (_, projectId, content, tags) => {
    return getMaterialService().addInspiration(projectId, content, tags)
  })
  ipcMain.handle('inspiration:update', async (_, id, content, tags) => {
    return getMaterialService().updateInspiration(id, content, tags)
  })
  ipcMain.handle('inspiration:delete', async (_, id) => {
    return getMaterialService().deleteInspiration(id)
  })
  ipcMain.handle('inspiration:search', async (_, projectId, keyword) => {
    return getMaterialService().searchInspirations(projectId, keyword)
  })

  // Export handlers
  ipcMain.handle('export:project', (_, projectId, options) =>
    getExportService().exportProject(projectId, options)
  )
  ipcMain.handle('export:chapter', (_, projectId, chapterId, format) =>
    getExportService().exportChapter(projectId, chapterId, format)
  )
  ipcMain.handle('export:list', (_, projectId) =>
    getExportService().listExports(projectId)
  )

  // Database handlers
  ipcMain.handle('db:query', async (_, sql, params) => {
    return getDatabaseService().query(sql, params)
  })
  ipcMain.handle('db:run', async (_, sql, params) => {
    return getDatabaseService().run(sql, params)
  })

  // Backup handlers
  ipcMain.handle('backup:create', () => getBackupService().createBackup())
  ipcMain.handle('backup:list', () => getBackupService().listBackups())
  ipcMain.handle('backup:restore', (_, backupName) => getBackupService().restoreBackup(backupName))
  ipcMain.handle('backup:delete', (_, backupName) => getBackupService().deleteBackup(backupName))
  ipcMain.handle('backup:getPath', () => getBackupService().getBackupPath())

  // Tag handlers
  ipcMain.handle('tag:list', async (_, projectId) => {
    return getTagService().listTags(projectId)
  })
  ipcMain.handle('tag:add', async (_, projectId, name, parentId, color, description, type) => {
    return getTagService().addTag(projectId, name, parentId, color, description, type)
  })
  ipcMain.handle('tag:update', async (_, id, name, parentId, color, description) => {
    return getTagService().updateTag(id, name, parentId, color, description)
  })
  ipcMain.handle('tag:delete', async (_, id) => {
    return getTagService().deleteTag(id)
  })

  // Writing goal handlers
  ipcMain.handle('goal:get', async (_, projectId, date) => {
    return getTagService().getWritingGoal(projectId, date)
  })
  ipcMain.handle('goal:set', async (_, projectId, date, targetWords) => {
    return getTagService().setWritingGoal(projectId, date, targetWords)
  })
  ipcMain.handle('goal:updateProgress', async (_, projectId, date, wordsWritten, writingTime) => {
    return getTagService().updateWritingProgress(projectId, date, wordsWritten, writingTime)
  })
  ipcMain.handle('goal:history', async (_, projectId, days) => {
    return getTagService().getGoalsHistory(projectId, days)
  })

  // Pomodoro handlers
  ipcMain.handle('pomodoro:add', async (_, projectId, startTime, endTime, wordsWritten) => {
    return getTagService().addPomodoroSession(projectId, startTime, endTime, wordsWritten)
  })
  ipcMain.handle('pomodoro:stats', async (_, projectId, days) => {
    return getTagService().getPomodoroStats(projectId, days)
  })
  ipcMain.handle('pomodoro:speed', async (_, projectId, days) => {
    return getTagService().getWritingSpeed(projectId, days)
  })

  // AI custom prompts handlers
  ipcMain.handle('ai:listPrompts', async (_, projectId) => {
    return getDatabaseService().query('SELECT * FROM ai_custom_prompts WHERE project_id = ?', [projectId])
  })
  ipcMain.handle('ai:savePrompt', async (_, projectId, id, name, prompt) => {
    if (id) {
      getDatabaseService().run('UPDATE ai_custom_prompts SET name = ?, prompt = ? WHERE id = ?', [name, prompt, id])
    } else {
      const { v4: uuidv4 } = require('uuid')
      getDatabaseService().run('INSERT INTO ai_custom_prompts (id, project_id, name, prompt) VALUES (?, ?, ?, ?)', [uuidv4(), projectId, name, prompt])
    }
    return true
  })
  ipcMain.handle('ai:deletePrompt', async (_, id) => {
    getDatabaseService().run('DELETE FROM ai_custom_prompts WHERE id = ?', [id])
    return true
  })

  // Reference handlers
  ipcMain.handle('reference:link', async (_, sourceType, sourceId, targetType, targetId, relationType, projectId, description) => {
    return getReferenceService().link(sourceType, sourceId, targetType, targetId, relationType, projectId, description)
  })
  ipcMain.handle('reference:unlink', async (_, referenceId) => {
    return getReferenceService().unlink(referenceId)
  })
  ipcMain.handle('reference:list', async (_, projectId) => {
    return getReferenceService().getReferences(projectId)
  })
  ipcMain.handle('reference:forward', async (_, entityType, entityId) => {
    return getReferenceService().findForwardReferences(entityType, entityId)
  })
  ipcMain.handle('reference:backward', async (_, entityType, entityId) => {
    return getReferenceService().findBackwardReferences(entityType, entityId)
  })
  ipcMain.handle('reference:checkOrphans', async (_, projectId) => {
    return getReferenceService().checkOrphanedReferences(projectId)
  })
  ipcMain.handle('reference:analyzeImpact', async (_, entityType, entityId, projectId) => {
    return getReferenceService().analyzeImpact(entityType, entityId, projectId)
  })
  ipcMain.handle('reference:matrix', async (_, projectId) => {
    return getReferenceService().getRelationMatrix(projectId)
  })

  // Plot line handlers
  ipcMain.handle('plotline:save', async (_, plotLine) => {
    return getReferenceService().savePlotLine(plotLine)
  })
  ipcMain.handle('plotline:list', async (_, projectId) => {
    return getReferenceService().getPlotLines(projectId)
  })
  ipcMain.handle('plotline:delete', async (_, plotLineId) => {
    return getReferenceService().deletePlotLine(plotLineId)
  })

  ipcMain.handle('plugin:list', () => {
    return getPluginService().listPlugins()
  })

  ipcMain.handle('plugin:enable', (_, pluginId) => {
    return getPluginService().enablePlugin(pluginId)
  })

  ipcMain.handle('plugin:disable', (_, pluginId) => {
    return getPluginService().disablePlugin(pluginId)
  })

  ipcMain.handle('errorRecovery:getConfig', () => {
    return getErrorRecoveryService().getConfig()
  })

  ipcMain.handle('errorRecovery:updateConfig', (_, config) => {
    getErrorRecoveryService().updateConfig(config)
    return true
  })

  ipcMain.handle('errorRecovery:getOperations', (_, entityType, limit) => {
    return getErrorRecoveryService().getRecentOperations(entityType, limit)
  })

  ipcMain.handle('errorRecovery:undo', (_, operationId) => {
    return getErrorRecoveryService().undoOperation(operationId)
  })

  ipcMain.handle('errorRecovery:autoBackup', async () => {
    return getErrorRecoveryService().performAutoBackup()
  })

  ipcMain.handle('errorRecovery:checkIntegrity', async (_, projectPath) => {
    return getErrorRecoveryService().checkIntegrity(projectPath)
  })

  ipcMain.handle('errorRecovery:repair', async (_, projectPath, issues) => {
    await getErrorRecoveryService().repairProject(projectPath, issues)
    return true
  })

  ipcMain.handle('version:save', async (_, projectId, filePath, content, comment) => {
    return getVersionedFileService().saveWithVersion(projectId, filePath, content, comment)
  })

  ipcMain.handle('version:list', (_, projectId, filePath) => {
    return getVersionedFileService().getVersions(projectId, filePath)
  })

  ipcMain.handle('version:getContent', (_, projectId, filePath, versionId) => {
    return getVersionedFileService().getVersionContent(projectId, filePath, versionId)
  })

  ipcMain.handle('version:restore', (_, projectId, filePath, versionId) => {
    return getVersionedFileService().restoreVersion(projectId, filePath, versionId)
  })

  ipcMain.handle('version:stats', (_, projectId) => {
    return getVersionedFileService().getVersionStats(projectId)
  })

  ipcMain.handle('index:build', (_, projectId) => {
    getFileIndexService().buildIndex(projectId)
    return true
  })

  ipcMain.handle('index:buildRelationships', (_, projectId, characters, locations) => {
    getFileIndexService().buildRelationships(projectId, characters, locations)
    return true
  })

  ipcMain.handle('index:getFilesWithEntity', (_, projectId, entityName, entityType) => {
    return getFileIndexService().getFilesWithEntity(projectId, entityName, entityType)
  })

  ipcMain.handle('index:getEntityReferences', (_, projectId, entityType) => {
    return getFileIndexService().findEntityReferences(projectId, entityType)
  })

  ipcMain.handle('index:getEntityRelationships', (_, projectId, entityId) => {
    return getFileIndexService().getEntityRelationships(projectId, entityId)
  })

  ipcMain.handle('index:rebuildAll', (_, projectId, characters, locations) => {
    getFileIndexService().rebuildAllIndexes(projectId, characters, locations)
    return true
  })

  ipcMain.handle('template:getCharacterTemplates', () => {
    return getTemplateService().getCharacterTemplates()
  })

  ipcMain.handle('template:getChapterTemplates', () => {
    return getTemplateService().getChapterTemplates()
  })

  ipcMain.handle('template:getWorldTemplates', () => {
    return getTemplateService().getWorldTemplates()
  })

  ipcMain.handle('template:addCharacter', (_, template) => {
    return getTemplateService().addCharacterTemplate(template)
  })

  ipcMain.handle('template:addChapter', (_, template) => {
    return getTemplateService().addChapterTemplate(template)
  })

  ipcMain.handle('template:updateCharacter', (_, id, updates) => {
    return getTemplateService().updateCharacterTemplate(id, updates)
  })

  ipcMain.handle('template:deleteCharacter', (_, id) => {
    return getTemplateService().deleteCharacterTemplate(id)
  })

  ipcMain.handle('template:generateCharacter', (_, templateId, data) => {
    return getTemplateService().generateCharacterFromTemplate(templateId, data)
  })

  ipcMain.handle('template:generateChapter', (_, templateId, data) => {
    return getTemplateService().generateChapterFromTemplate(templateId, data)
  })

  ipcMain.handle('template:setVariables', (_, variables) => {
    getTemplateService().setVariables(variables)
    return true
  })

  ipcMain.handle('template:getVariables', () => {
    return getTemplateService().getVariables()
  })

  ipcMain.handle('template:reset', () => {
    getTemplateService().resetToDefaults()
    return true
  })

  ipcMain.handle('combat:load', (_, projectId) => {
    return getCombatService().loadCombatData(projectId)
  })

  ipcMain.handle('combat:save', (_, projectId, combatData) => {
    getCombatService().saveCombatData(projectId, combatData)
    return true
  })

  ipcMain.handle('combat:addPowerLevel', (_, projectId, powerLevel) => {
    getCombatService().addPowerLevel(projectId, powerLevel)
    return true
  })

  ipcMain.handle('combat:addBattle', (_, projectId, battle) => {
    getCombatService().addBattleRecord(projectId, battle)
    return true
  })

  ipcMain.handle('combat:validate', (_, projectId) => {
    const data = getCombatService().loadCombatData(projectId)
    return getCombatService().validateAllBattles(data.battleRecords, data.powerScale, data.powerScale.levels)
  })

  ipcMain.handle('timeline:load', (_, projectId) => {
    return getTimelineService().loadTimeData(projectId)
  })

  ipcMain.handle('timeline:save', (_, projectId, timeData) => {
    getTimelineService().saveTimeData(projectId, timeData)
    return true
  })

  ipcMain.handle('timeline:addEra', (_, projectId, era) => {
    getTimelineService().addEra(projectId, era)
    return true
  })

  ipcMain.handle('timeline:addEvent', (_, projectId, event) => {
    getTimelineService().addEvent(projectId, event)
    return true
  })

  ipcMain.handle('timeline:addCharacterAge', (_, projectId, characterAge) => {
    getTimelineService().addCharacterAge(projectId, characterAge)
    return true
  })

  ipcMain.handle('timeline:getCharacterTimeline', (_, projectId, characterId) => {
    return getTimelineService().getCharacterTimeline(projectId, characterId)
  })

  ipcMain.handle('timeline:checkChronology', (_, projectId) => {
    return getTimelineService().checkChronology(projectId)
  })

  ipcMain.handle('timeline:summary', (_, projectId) => {
    return getTimelineService().getTimelineSummary(projectId)
  })

  ipcMain.handle('performance:getMemoryUsage', () => {
    return getPerformanceService().getMemoryUsage()
  })

  ipcMain.handle('performance:clearCache', () => {
    getPerformanceService().clearCache()
    return true
  })

  ipcMain.handle('performance:clearExpiredCache', () => {
    return getPerformanceService().clearExpiredCache()
  })

  ipcMain.handle('performance:forceGC', async () => {
    await getPerformanceService().forceGC()
    return true
  })
}
