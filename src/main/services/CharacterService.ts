import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { ProjectService } from './ProjectService'
import log from 'electron-log'

export interface Character {
  id: string
  name: string
  nickname?: string
  gender?: string
  age?: string
  appearance: string
  personality: string
  background: string
  abilities: string
  role: string
  status: string
}

export interface CharacterRelationship {
  sourceId: string
  targetId: string
  type: string
  description: string
}

export interface RelationshipData {
  characters: Character[]
  relationships: CharacterRelationship[]
}

export class CharacterService {
  private projectService = new ProjectService()

  listCharacters(projectId: string): Character[] {
    const projectPath = this.projectService.getProjectPath(projectId)
    const charsPath = join(projectPath, 'characters', 'characters.json')

    if (!existsSync(charsPath)) {
      return []
    }

    try {
      const data = JSON.parse(readFileSync(charsPath, 'utf-8'))
      return data.characters || []
    } catch (error) {
      log.error('Failed to load characters:', error)
      return []
    }
  }

  saveCharacters(projectId: string, characters: Character[]): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const charsDir = join(projectPath, 'characters')

    if (!existsSync(charsDir)) {
      mkdirSync(charsDir, { recursive: true })
    }

    writeFileSync(join(charsDir, 'characters.json'), JSON.stringify({ characters }, null, 2))
    log.info(`Characters saved for project: ${projectId}`)
  }

  getRelationships(projectId: string): RelationshipData {
    const projectPath = this.projectService.getProjectPath(projectId)
    const charsPath = join(projectPath, 'characters', 'characters.json')
    const relsPath = join(projectPath, 'characters', 'relationships.json')

    let characters: Character[] = []
    let relationships: CharacterRelationship[] = []

    if (existsSync(charsPath)) {
      try {
        const data = JSON.parse(readFileSync(charsPath, 'utf-8'))
        characters = data.characters || []
      } catch (error) {
        log.error('Failed to load characters:', error)
      }
    }

    if (existsSync(relsPath)) {
      try {
        const data = JSON.parse(readFileSync(relsPath, 'utf-8'))
        relationships = data.relationships || []
      } catch (error) {
        log.error('Failed to load relationships:', error)
      }
    }

    return { characters, relationships }
  }

  saveRelationships(projectId: string, data: RelationshipData): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const charsDir = join(projectPath, 'characters')

    if (!existsSync(charsDir)) {
      mkdirSync(charsDir, { recursive: true })
    }

    writeFileSync(join(charsDir, 'characters.json'), JSON.stringify({ characters: data.characters }, null, 2))
    writeFileSync(join(charsDir, 'relationships.json'), JSON.stringify({ relationships: data.relationships }, null, 2))
    log.info(`Relationships saved for project: ${projectId}`)
  }
}
