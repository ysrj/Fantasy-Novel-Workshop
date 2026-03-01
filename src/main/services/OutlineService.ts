import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { ProjectService } from './ProjectService'
import log from 'electron-log'

export interface OutlineData {
  storyOutline: string
  structure: StructureData
  chapterOutlines: ChapterOutline[]
  scenes: Scene[]
  plotPoints: PlotPoint[]
  actStructure: ActStructure[]
}

export interface StructureData {
  type: string
  stages: StructureStage[]
}

export interface StructureStage {
  name: string
  description: string
  chapters: string[]
}

export interface ChapterOutline {
  id: string
  number: number
  title: string
  summary: string
  stage?: string
}

export interface Scene {
  id: string
  name: string
  location: string
  time: string
  characters: string[]
  description: string
}

export interface PlotPoint {
  id: string
  title: string
  description: string
  chapter?: string
  type: string
}

export interface ActStructure {
  act: number
  name: string
  description: string
  chapters: number[]
}

const defaultOutline: OutlineData = {
  storyOutline: '',
  structure: {
    type: 'three-act',
    stages: [
      { name: '起', description: '设定世界观和主角出场', chapters: [] },
      { name: '承', description: '主角成长，遇到挑战', chapters: [] },
      { name: '转', description: '重大转折，危机出现', chapters: [] },
      { name: '合', description: '高潮和结局', chapters: [] }
    ]
  },
  chapterOutlines: [],
  scenes: [],
  plotPoints: [],
  actStructure: [
    { act: 1, name: '第一幕', description: '建立世界和主角', chapters: [] },
    { act: 2, name: '第二幕', description: '对抗和成长', chapters: [] },
    { act: 3, name: '第三幕', description: '解决和结局', chapters: [] }
  ]
}

export class OutlineService {
  private projectService = new ProjectService()

  loadOutline(projectId: string): OutlineData {
    const projectPath = this.projectService.getProjectPath(projectId)
    const outlinePath = join(projectPath, 'outline', 'story_outline.json')

    if (!existsSync(outlinePath)) {
      this.saveOutline(projectId, defaultOutline)
      return defaultOutline
    }

    try {
      return JSON.parse(readFileSync(outlinePath, 'utf-8'))
    } catch (error) {
      log.error('Failed to load outline:', error)
      return defaultOutline
    }
  }

  saveOutline(projectId: string, data: OutlineData): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const outlineDir = join(projectPath, 'outline')

    if (!existsSync(outlineDir)) {
      mkdirSync(outlineDir, { recursive: true })
    }

    const outlinePath = join(outlineDir, 'story_outline.json')
    writeFileSync(outlinePath, JSON.stringify(data, null, 2))
    log.info(`Outline saved for project: ${projectId}`)
  }
}
