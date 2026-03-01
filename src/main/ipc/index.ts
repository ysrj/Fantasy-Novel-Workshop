import { ipcMain } from 'electron'
import { ProjectService } from '../services/ProjectService'
import { OutlineService } from '../services/OutlineService'
import { CharacterService } from '../services/CharacterService'
import { WorldService } from '../services/WorldService'
import { WritingService } from '../services/WritingService'
import { StatsService } from '../services/StatsService'
import { DatabaseService } from '../services/DatabaseService'

let dbInitialized = false

const projectService = new ProjectService()
const outlineService = new OutlineService()
const characterService = new CharacterService()
const worldService = new WorldService()
const writingService = new WritingService()
const statsService = new StatsService()
const databaseService = new DatabaseService()

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
