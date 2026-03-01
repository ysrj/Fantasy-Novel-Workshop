import { ipcMain } from 'electron'
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
}
