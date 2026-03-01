import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { ProjectService } from './ProjectService'
import log from 'electron-log'

export interface WorldData {
  cultivation: CultivationSystem
  geography: GeographyData
  history: HistoryEvent[]
  artifacts: Artifact[]
  factions: Faction[]
  customSettings: Record<string, string>
}

export interface CultivationSystem {
  realms: CultivationRealm[]
  techniques: Technique[]
  skills: Skill[]
}

export interface CultivationRealm {
  id: string
  name: string
  order: number
  description: string
}

export interface Technique {
  id: string
  name: string
  realm: string
  description: string
  type: string
}

export interface Skill {
  id: string
  name: string
  description: string
  techniqueId?: string
}

export interface GeographyData {
  locations: Location[]
}

export interface Location {
  id: string
  name: string
  description: string
  type: string
  parentId?: string
  imagePath?: string
}

export interface HistoryEvent {
  id: string
  year: string
  title: string
  description: string
  relatedLocations: string[]
}

export interface Artifact {
  id: string
  name: string
  type: string
  description: string
  owner?: string
  power: string
}

export interface Faction {
  id: string
  name: string
  type: string
  description: string
  leader?: string
  members: string[]
}

const defaultWorldData: WorldData = {
  cultivation: {
    realms: [],
    techniques: [],
    skills: []
  },
  geography: {
    locations: []
  },
  history: [],
  artifacts: [],
  factions: [],
  customSettings: {}
}

export class WorldService {
  private projectService = new ProjectService()

  loadWorld(projectId: string): WorldData {
    const projectPath = this.projectService.getProjectPath(projectId)
    const worldPath = join(projectPath, 'world', 'world_data.json')

    if (!existsSync(worldPath)) {
      this.saveWorld(projectId, defaultWorldData)
      return defaultWorldData
    }

    try {
      return JSON.parse(readFileSync(worldPath, 'utf-8'))
    } catch (error) {
      log.error('Failed to load world data:', error)
      return defaultWorldData
    }
  }

  saveWorld(projectId: string, data: WorldData): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const worldDir = join(projectPath, 'world')

    if (!existsSync(worldDir)) {
      mkdirSync(worldDir, { recursive: true })
    }

    writeFileSync(join(worldDir, 'world_data.json'), JSON.stringify(data, null, 2))
    log.info(`World data saved for project: ${projectId}`)
  }
}
