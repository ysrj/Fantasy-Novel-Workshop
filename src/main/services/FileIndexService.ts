import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { ProjectService } from './ProjectService'
import type { FileIndexEntry, EntityFileReference, FileRelationship } from '../../shared/types'

export class FileIndexService {
  private projectService = new ProjectService()
  private indexCache: Map<string, FileIndexEntry[]> = new Map()
  private relationshipCache: Map<string, FileRelationship[]> = new Map()

  getIndexPath(projectId: string): string {
    const projectPath = this.projectService.getProjectPath(projectId)
    return join(projectPath, '.index', 'file-index.json')
  }

  getRelationshipPath(projectId: string): string {
    const projectPath = this.projectService.getProjectPath(projectId)
    return join(projectPath, '.index', 'relationships.json')
  }

  buildIndex(projectId: string): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const chaptersDir = join(projectPath, 'chapters')
    const entries: FileIndexEntry[] = []

    if (existsSync(chaptersDir)) {
      const files = this.getAllFiles(chaptersDir, ['.md', '.txt'])
      
      files.forEach(filePath => {
        const content = readFileSync(filePath, 'utf-8')
        const relativePath = filePath.replace(projectPath + '\\', '').replace(projectPath + '/', '')
        
        const entry: FileIndexEntry = {
          filePath: relativePath,
          entities: {
            characters: this.extractEntities(content, 'character'),
            locations: this.extractEntities(content, 'location'),
            items: this.extractEntities(content, 'item'),
            techniques: this.extractEntities(content, 'technique')
          }
        }
        entries.push(entry)
      })
    }

    this.indexCache.set(projectId, entries)
    this.saveIndex(projectId, entries)
    log.info(`File index built for project ${projectId}: ${entries.length} files`)
  }

  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = []
    
    if (!existsSync(dir)) return files
    
    const items = readdirSync(dir, { withFileTypes: true })
    
    items.forEach(item => {
      const fullPath = join(dir, item.name)
      if (item.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, extensions))
      } else if (extensions.some(ext => item.name.endsWith(ext))) {
        files.push(fullPath)
      }
    })
    
    return files
  }

  private extractEntities(content: string, type: 'character' | 'location' | 'item' | 'technique'): string[] {
    const entities: string[] = []
    const patterns: Record<string, RegExp> = {
      character: /\[\[角色:([^\]]+)\]\]/g,
      location: /\[\[地点:([^\]]+)\]\]/g,
      item: /\[\[法宝:([^\]]+)\]\]/g,
      technique: /\[\[功法:([^\]]+)\]\]/g
    }

    let match
    while ((match = patterns[type].exec(content)) !== null) {
      if (!entities.includes(match[1])) {
        entities.push(match[1])
      }
    }

    return entities
  }

  private saveIndex(projectId: string, entries: FileIndexEntry[]): void {
    const indexPath = this.getIndexPath(projectId)
    const indexDir = join(indexPath, '..')
    
    if (!existsSync(indexDir)) {
      mkdirSync(indexDir, { recursive: true })
    }
    
    writeFileSync(indexPath, JSON.stringify(entries, null, 2))
  }

  loadIndex(projectId: string): FileIndexEntry[] {
    if (this.indexCache.has(projectId)) {
      return this.indexCache.get(projectId)!
    }

    const indexPath = this.getIndexPath(projectId)
    if (existsSync(indexPath)) {
      try {
        const entries = JSON.parse(readFileSync(indexPath, 'utf-8'))
        this.indexCache.set(projectId, entries)
        return entries
      } catch (err) {
        log.error('Failed to load file index:', err)
      }
    }
    return []
  }

  getFilesWithEntity(projectId: string, entityName: string, entityType: keyof FileIndexEntry['entities']): string[] {
    const entries = this.loadIndex(projectId)
    return entries
      .filter(e => e.entities[entityType].includes(entityName))
      .map(e => e.filePath)
  }

  findEntityReferences(projectId: string, entityType: 'character' | 'location' | 'item' | 'technique'): EntityFileReference[] {
    const entries = this.loadIndex(projectId)
    const references: EntityFileReference[] = []

    entries.forEach(entry => {
      const entities = entry.entities[entityType]
      entities.forEach(name => {
        references.push({
          entityType,
          entityId: name,
          entityName: name,
          filePath: entry.filePath,
          positions: []
        })
      })
    })

    return references
  }

  buildRelationships(projectId: string, characters: any[], locations: any[]): void {
    const relationships: FileRelationship[] = []
    const projectPath = this.projectService.getProjectPath(projectId)
    const chaptersDir = join(projectPath, 'chapters')

    if (existsSync(chaptersDir)) {
      const files = this.getAllFiles(chaptersDir, ['.md'])

      files.forEach(filePath => {
        const content = readFileSync(filePath, 'utf-8')
        const relativePath = filePath.replace(projectPath + '\\', '').replace(projectPath + '/', '')

        characters?.forEach(char => {
          if (content.includes(char.name)) {
            relationships.push({
              id: uuidv4(),
              type: 'character-appears-in',
              fromEntity: char.id,
              filePath: relativePath
            })
          }
        })

        locations?.forEach(loc => {
          if (content.includes(loc.name)) {
            relationships.push({
              id: uuidv4(),
              type: 'location-mentioned',
              fromEntity: loc.id,
              filePath: relativePath
            })
          }
        })
      })
    }

    this.relationshipCache.set(projectId, relationships)
    this.saveRelationships(projectId, relationships)
    log.info(`Built ${relationships.length} relationships for project ${projectId}`)
  }

  private saveRelationships(projectId: string, relationships: FileRelationship[]): void {
    const relPath = this.getRelationshipPath(projectId)
    const relDir = join(relPath, '..')
    
    if (!existsSync(relDir)) {
      mkdirSync(relDir, { recursive: true })
    }
    
    writeFileSync(relPath, JSON.stringify(relationships, null, 2))
  }

  loadRelationships(projectId: string): FileRelationship[] {
    if (this.relationshipCache.has(projectId)) {
      return this.relationshipCache.get(projectId)!
    }

    const relPath = this.getRelationshipPath(projectId)
    if (existsSync(relPath)) {
      try {
        const relationships = JSON.parse(readFileSync(relPath, 'utf-8'))
        this.relationshipCache.set(projectId, relationships)
        return relationships
      } catch (err) {
        log.error('Failed to load relationships:', err)
      }
    }
    return []
  }

  getEntityRelationships(projectId: string, entityId: string): FileRelationship[] {
    const relationships = this.loadRelationships(projectId)
    return relationships.filter(r => r.fromEntity === entityId || r.toEntity === entityId)
  }

  rebuildAllIndexes(projectId: string, characters: any[], locations: any[]): void {
    this.buildIndex(projectId)
    this.buildRelationships(projectId, characters, locations)
    log.info(`All indexes rebuilt for project ${projectId}`)
  }
}

export const fileIndexService = new FileIndexService()
