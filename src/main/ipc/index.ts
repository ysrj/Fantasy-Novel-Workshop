import { ipcMain, dialog } from 'electron'
import Store from 'electron-store'
import { ProjectService } from '../services/ProjectService'
import { OutlineService } from '../services/OutlineService'
import { CharacterService } from '../services/CharacterService'
import { WorldService } from '../services/WorldService'
import { WritingService } from '../services/WritingService'
import { StatsService } from '../services/StatsService'
import { DatabaseService } from '../services/DatabaseService'
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

const store = new Store()
let dbInitialized = false

const projectService = new ProjectService()
const outlineService = new OutlineService()
const characterService = new CharacterService()
const worldService = new WorldService()
const writingService = new WritingService()
const statsService = new StatsService()
const databaseService = new DatabaseService()
const aiService = new AIService()
const materialService = new MaterialService(databaseService)
const exportService = new ExportService()
const backupService = new BackupService()
const tagService = new TagService(databaseService)
const referenceService = new ReferenceService(databaseService)
const pluginService = new PluginService()
const errorRecoveryService = new ErrorRecoveryService()
const versionedFileService = new VersionedFileService()
const fileIndexService = new FileIndexService()
const templateService = new TemplateService()

async function ensureDbInitialized(): Promise<void> {
  if (!dbInitialized) {
    await databaseService.initialize()
    dbInitialized = true
  }
}

export function setupIpcHandlers(): void {
  // Project handlers
  ipcMain.handle('project:list', () => projectService.listProjects())
  ipcMain.handle('project:create', (_, metadata) => projectService.createProject(metadata))
  ipcMain.handle('project:delete', (_, projectId) => projectService.deleteProject(projectId))
  ipcMain.handle('project:get', (_, projectId) => projectService.getProject(projectId))
  ipcMain.handle('project:getSettings', () => projectService.getSettings())

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
  ipcMain.handle('outline:load', (_, projectId) => outlineService.loadOutline(projectId))
  ipcMain.handle('outline:save', (_, projectId, data) => outlineService.saveOutline(projectId, data))

  // Character handlers
  ipcMain.handle('character:list', (_, projectId) => characterService.listCharacters(projectId))
  ipcMain.handle('character:save', (_, projectId, characters) =>
    characterService.saveCharacters(projectId, characters)
  )
  ipcMain.handle('character:relationships', (_, projectId) =>
    characterService.getRelationships(projectId)
  )
  ipcMain.handle('character:saveRelationships', (_, projectId, data) =>
    characterService.saveRelationships(projectId, data)
  )

  // World handlers
  ipcMain.handle('world:load', (_, projectId) => worldService.loadWorld(projectId))
  ipcMain.handle('world:save', (_, projectId, data) => worldService.saveWorld(projectId, data))

  // Writing handlers
  ipcMain.handle('writing:listChapters', (_, projectId) =>
    writingService.listChapters(projectId)
  )
  ipcMain.handle('writing:getChapter', (_, projectId, chapterId) =>
    writingService.getChapter(projectId, chapterId)
  )
  ipcMain.handle('writing:saveChapter', (_, projectId, chapterId, content) =>
    writingService.saveChapter(projectId, chapterId, content)
  )
  ipcMain.handle('writing:createChapter', (_, projectId, title) =>
    writingService.createChapter(projectId, title)
  )
  ipcMain.handle('writing:deleteChapter', (_, projectId, chapterId) =>
    writingService.deleteChapter(projectId, chapterId)
  )

  // Stats handlers
  ipcMain.handle('stats:get', (_, projectId) => statsService.getStats(projectId))
  ipcMain.handle('stats:update', (_, projectId, wordCount) =>
    statsService.updateWordCount(projectId, wordCount)
  )

  // AI handlers
  ipcMain.handle('ai:checkStatus', () => aiService.checkOllamaStatus())
  ipcMain.handle('ai:isAvailable', () => aiService.isAvailable())
  ipcMain.handle('ai:checkConsistency', async (_, projectId) => {
    const chapters = writingService.listChapters(projectId)
    const contents = chapters.map(c => writingService.getChapter(projectId, c.id)).filter(Boolean) as string[]
    return aiService.checkConsistency(projectId, contents)
  })
  ipcMain.handle('ai:enhanceWriting', (_, content, type) =>
    aiService.enhanceWriting(content, type)
  )
  ipcMain.handle('ai:generateLyrics', async (_, projectId, style) => {
    const chapters = writingService.listChapters(projectId)
    const contents = chapters.map(c => writingService.getChapter(projectId, c.id)).filter(Boolean) as string[]
    const content = contents.join('\n\n').slice(0, 5000)
    return aiService.generateLyrics(content, style)
  })
  ipcMain.handle('ai:generateScript', async (_, projectId, type) => {
    const chapters = writingService.listChapters(projectId)
    const contents = chapters.map(c => writingService.getChapter(projectId, c.id)).filter(Boolean) as string[]
    const content = contents.join('\n\n').slice(0, 5000)
    return aiService.generateScript(content, type)
  })
  ipcMain.handle('ai:generate', (_, prompt, model) =>
    aiService.generate(prompt, model)
  )
  ipcMain.handle('ai:chat', (_, messages, model) =>
    aiService.chat(messages, model)
  )

  // Material handlers
  ipcMain.handle('material:list', async (_, projectId) => {
    await ensureDbInitialized()
    return materialService.listMaterials(projectId)
  })
  ipcMain.handle('material:add', async (_, projectId, name, type, path, tags) => {
    await ensureDbInitialized()
    return materialService.addMaterial(projectId, name, type, path, tags)
  })
  ipcMain.handle('material:delete', async (_, id) => {
    await ensureDbInitialized()
    return materialService.deleteMaterial(id)
  })

  // Inspiration handlers
  ipcMain.handle('inspiration:list', async (_, projectId) => {
    await ensureDbInitialized()
    return materialService.listInspirations(projectId)
  })
  ipcMain.handle('inspiration:add', async (_, projectId, content, tags) => {
    await ensureDbInitialized()
    return materialService.addInspiration(projectId, content, tags)
  })
  ipcMain.handle('inspiration:update', async (_, id, content, tags) => {
    await ensureDbInitialized()
    return materialService.updateInspiration(id, content, tags)
  })
  ipcMain.handle('inspiration:delete', async (_, id) => {
    await ensureDbInitialized()
    return materialService.deleteInspiration(id)
  })
  ipcMain.handle('inspiration:search', async (_, projectId, keyword) => {
    await ensureDbInitialized()
    return materialService.searchInspirations(projectId, keyword)
  })

  // Export handlers
  ipcMain.handle('export:project', (_, projectId, options) =>
    exportService.exportProject(projectId, options)
  )
  ipcMain.handle('export:chapter', (_, projectId, chapterId, format) =>
    exportService.exportChapter(projectId, chapterId, format)
  )
  ipcMain.handle('export:list', (_, projectId) =>
    exportService.listExports(projectId)
  )

  // Database handlers
  ipcMain.handle('db:query', async (_, sql, params) => {
    await ensureDbInitialized()
    return databaseService.query(sql, params)
  })
  ipcMain.handle('db:run', async (_, sql, params) => {
    await ensureDbInitialized()
    return databaseService.run(sql, params)
  })

  // Backup handlers
  ipcMain.handle('backup:create', () => backupService.createBackup())
  ipcMain.handle('backup:list', () => backupService.listBackups())
  ipcMain.handle('backup:restore', (_, backupName) => backupService.restoreBackup(backupName))
  ipcMain.handle('backup:delete', (_, backupName) => backupService.deleteBackup(backupName))
  ipcMain.handle('backup:getPath', () => backupService.getBackupPath())

  // Tag handlers
  ipcMain.handle('tag:list', async (_, projectId) => {
    await ensureDbInitialized()
    return tagService.listTags(projectId)
  })
  ipcMain.handle('tag:add', async (_, projectId, name, parentId, color, description, type) => {
    await ensureDbInitialized()
    return tagService.addTag(projectId, name, parentId, color, description, type)
  })
  ipcMain.handle('tag:update', async (_, id, name, parentId, color, description) => {
    await ensureDbInitialized()
    return tagService.updateTag(id, name, parentId, color, description)
  })
  ipcMain.handle('tag:delete', async (_, id) => {
    await ensureDbInitialized()
    return tagService.deleteTag(id)
  })

  // Writing goal handlers
  ipcMain.handle('goal:get', async (_, projectId, date) => {
    await ensureDbInitialized()
    return tagService.getWritingGoal(projectId, date)
  })
  ipcMain.handle('goal:set', async (_, projectId, date, targetWords) => {
    await ensureDbInitialized()
    return tagService.setWritingGoal(projectId, date, targetWords)
  })
  ipcMain.handle('goal:updateProgress', async (_, projectId, date, wordsWritten, writingTime) => {
    await ensureDbInitialized()
    return tagService.updateWritingProgress(projectId, date, wordsWritten, writingTime)
  })
  ipcMain.handle('goal:history', async (_, projectId, days) => {
    await ensureDbInitialized()
    return tagService.getGoalsHistory(projectId, days)
  })

  // Pomodoro handlers
  ipcMain.handle('pomodoro:add', async (_, projectId, startTime, endTime, wordsWritten) => {
    await ensureDbInitialized()
    return tagService.addPomodoroSession(projectId, startTime, endTime, wordsWritten)
  })
  ipcMain.handle('pomodoro:stats', async (_, projectId, days) => {
    await ensureDbInitialized()
    return tagService.getPomodoroStats(projectId, days)
  })
  ipcMain.handle('pomodoro:speed', async (_, projectId, days) => {
    await ensureDbInitialized()
    return tagService.getWritingSpeed(projectId, days)
  })

  // AI custom prompts handlers
  ipcMain.handle('ai:listPrompts', async (_, projectId) => {
    await ensureDbInitialized()
    return databaseService.query('SELECT * FROM ai_custom_prompts WHERE project_id = ?', [projectId])
  })
  ipcMain.handle('ai:savePrompt', async (_, projectId, id, name, prompt) => {
    await ensureDbInitialized()
    if (id) {
      databaseService.run('UPDATE ai_custom_prompts SET name = ?, prompt = ? WHERE id = ?', [name, prompt, id])
    } else {
      const { v4: uuidv4 } = require('uuid')
      databaseService.run('INSERT INTO ai_custom_prompts (id, project_id, name, prompt) VALUES (?, ?, ?, ?)', [uuidv4(), projectId, name, prompt])
    }
    return true
  })
  ipcMain.handle('ai:deletePrompt', async (_, id) => {
    await ensureDbInitialized()
    databaseService.run('DELETE FROM ai_custom_prompts WHERE id = ?', [id])
    return true
  })

  // Reference handlers
  ipcMain.handle('reference:link', async (_, sourceType, sourceId, targetType, targetId, relationType, projectId, description) => {
    await ensureDbInitialized()
    return referenceService.link(sourceType, sourceId, targetType, targetId, relationType, projectId, description)
  })
  ipcMain.handle('reference:unlink', async (_, referenceId) => {
    await ensureDbInitialized()
    return referenceService.unlink(referenceId)
  })
  ipcMain.handle('reference:list', async (_, projectId) => {
    await ensureDbInitialized()
    return referenceService.getReferences(projectId)
  })
  ipcMain.handle('reference:forward', async (_, entityType, entityId) => {
    await ensureDbInitialized()
    return referenceService.findForwardReferences(entityType, entityId)
  })
  ipcMain.handle('reference:backward', async (_, entityType, entityId) => {
    await ensureDbInitialized()
    return referenceService.findBackwardReferences(entityType, entityId)
  })
  ipcMain.handle('reference:checkOrphans', async (_, projectId) => {
    await ensureDbInitialized()
    return referenceService.checkOrphanedReferences(projectId)
  })
  ipcMain.handle('reference:analyzeImpact', async (_, entityType, entityId, projectId) => {
    await ensureDbInitialized()
    return referenceService.analyzeImpact(entityType, entityId, projectId)
  })
  ipcMain.handle('reference:matrix', async (_, projectId) => {
    await ensureDbInitialized()
    return referenceService.getRelationMatrix(projectId)
  })

  // Plot line handlers
  ipcMain.handle('plotline:save', async (_, plotLine) => {
    await ensureDbInitialized()
    return referenceService.savePlotLine(plotLine)
  })
  ipcMain.handle('plotline:list', async (_, projectId) => {
    await ensureDbInitialized()
    return referenceService.getPlotLines(projectId)
  })
  ipcMain.handle('plotline:delete', async (_, plotLineId) => {
    await ensureDbInitialized()
    return referenceService.deletePlotLine(plotLineId)
  })

  ipcMain.handle('plugin:list', () => {
    return pluginService.listPlugins()
  })

  ipcMain.handle('plugin:enable', (_, pluginId) => {
    return pluginService.enablePlugin(pluginId)
  })

  ipcMain.handle('plugin:disable', (_, pluginId) => {
    return pluginService.disablePlugin(pluginId)
  })

  ipcMain.handle('errorRecovery:getConfig', () => {
    return errorRecoveryService.getConfig()
  })

  ipcMain.handle('errorRecovery:updateConfig', (_, config) => {
    errorRecoveryService.updateConfig(config)
    return true
  })

  ipcMain.handle('errorRecovery:getOperations', (_, entityType, limit) => {
    return errorRecoveryService.getRecentOperations(entityType, limit)
  })

  ipcMain.handle('errorRecovery:undo', (_, operationId) => {
    return errorRecoveryService.undoOperation(operationId)
  })

  ipcMain.handle('errorRecovery:autoBackup', async () => {
    return errorRecoveryService.performAutoBackup()
  })

  ipcMain.handle('errorRecovery:checkIntegrity', async (_, projectPath) => {
    return errorRecoveryService.checkIntegrity(projectPath)
  })

  ipcMain.handle('errorRecovery:repair', async (_, projectPath, issues) => {
    await errorRecoveryService.repairProject(projectPath, issues)
    return true
  })

  ipcMain.handle('version:save', async (_, projectId, filePath, content, comment) => {
    return versionedFileService.saveWithVersion(projectId, filePath, content, comment)
  })

  ipcMain.handle('version:list', (_, projectId, filePath) => {
    return versionedFileService.getVersions(projectId, filePath)
  })

  ipcMain.handle('version:getContent', (_, projectId, filePath, versionId) => {
    return versionedFileService.getVersionContent(projectId, filePath, versionId)
  })

  ipcMain.handle('version:restore', (_, projectId, filePath, versionId) => {
    return versionedFileService.restoreVersion(projectId, filePath, versionId)
  })

  ipcMain.handle('version:stats', (_, projectId) => {
    return versionedFileService.getVersionStats(projectId)
  })

  ipcMain.handle('index:build', (_, projectId) => {
    fileIndexService.buildIndex(projectId)
    return true
  })

  ipcMain.handle('index:buildRelationships', (_, projectId, characters, locations) => {
    fileIndexService.buildRelationships(projectId, characters, locations)
    return true
  })

  ipcMain.handle('index:getFilesWithEntity', (_, projectId, entityName, entityType) => {
    return fileIndexService.getFilesWithEntity(projectId, entityName, entityType)
  })

  ipcMain.handle('index:getEntityReferences', (_, projectId, entityType) => {
    return fileIndexService.findEntityReferences(projectId, entityType)
  })

  ipcMain.handle('index:getEntityRelationships', (_, projectId, entityId) => {
    return fileIndexService.getEntityRelationships(projectId, entityId)
  })

  ipcMain.handle('index:rebuildAll', (_, projectId, characters, locations) => {
    fileIndexService.rebuildAllIndexes(projectId, characters, locations)
    return true
  })

  ipcMain.handle('template:getCharacterTemplates', () => {
    return templateService.getCharacterTemplates()
  })

  ipcMain.handle('template:getChapterTemplates', () => {
    return templateService.getChapterTemplates()
  })

  ipcMain.handle('template:getWorldTemplates', () => {
    return templateService.getWorldTemplates()
  })

  ipcMain.handle('template:addCharacter', (_, template) => {
    return templateService.addCharacterTemplate(template)
  })

  ipcMain.handle('template:addChapter', (_, template) => {
    return templateService.addChapterTemplate(template)
  })

  ipcMain.handle('template:updateCharacter', (_, id, updates) => {
    return templateService.updateCharacterTemplate(id, updates)
  })

  ipcMain.handle('template:deleteCharacter', (_, id) => {
    return templateService.deleteCharacterTemplate(id)
  })

  ipcMain.handle('template:generateCharacter', (_, templateId, data) => {
    return templateService.generateCharacterFromTemplate(templateId, data)
  })

  ipcMain.handle('template:generateChapter', (_, templateId, data) => {
    return templateService.generateChapterFromTemplate(templateId, data)
  })

  ipcMain.handle('template:setVariables', (_, variables) => {
    templateService.setVariables(variables)
    return true
  })

  ipcMain.handle('template:getVariables', () => {
    return templateService.getVariables()
  })

  ipcMain.handle('template:reset', () => {
    templateService.resetToDefaults()
    return true
  })
}
