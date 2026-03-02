import { DatabaseService } from './DatabaseService'
import type { EntityReference, PlotLine, EntityType, OrphanCheck, ImpactScope } from '../../shared/types'

export class ReferenceService {
  private db: DatabaseService

  constructor(db: DatabaseService) {
    this.db = db
  }

  link(sourceType: EntityType, sourceId: string, targetType: EntityType, targetId: string, relationType: string, projectId: string, description: string = ''): EntityReference {
    const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    this.db.run(
      `INSERT INTO entity_references (id, project_id, source_type, source_id, target_type, target_id, relation_type, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId, sourceType, sourceId, targetType, targetId, relationType, description, now]
    )

    return { id, projectId, sourceType, sourceId, targetType, targetId, relationType, description, createdAt: now }
  }

  unlink(referenceId: string): void {
    this.db.run('DELETE FROM entity_references WHERE id = ?', [referenceId])
  }

  getReferences(projectId: string): EntityReference[] {
    return this.db.query<EntityReference>(
      'SELECT * FROM entity_references WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    )
  }

  findForwardReferences(entityType: EntityType, entityId: string): EntityReference[] {
    return this.db.query<EntityReference>(
      'SELECT * FROM entity_references WHERE source_type = ? AND source_id = ?',
      [entityType, entityId]
    )
  }

  findBackwardReferences(entityType: EntityType, entityId: string): EntityReference[] {
    return this.db.query<EntityReference>(
      'SELECT * FROM entity_references WHERE target_type = ? AND target_id = ?',
      [entityType, entityId]
    )
  }

  findAllReferences(entityType: EntityType, entityId: string): EntityReference[] {
    const forward = this.findForwardReferences(entityType, entityId)
    const backward = this.findBackwardReferences(entityType, entityId)
    return [...forward, ...backward]
  }

  checkOrphanedReferences(projectId: string): OrphanCheck[] {
    const orphans: OrphanCheck[] = []
    const references = this.getReferences(projectId)
    
    const validCharacterIds = new Set(this.db.query<{id: string}>('SELECT id FROM characters WHERE project_id = ?', [projectId]).map(c => c.id))
    const validChapterIds = new Set(this.db.query<{id: string}>('SELECT id FROM chapters WHERE project_id = ?', [projectId]).map(c => c.id))
    
    references.forEach(ref => {
      if (ref.targetType === 'character' && !validCharacterIds.has(ref.targetId)) {
        const existing = orphans.find(o => o.entityType === ref.targetType && o.entityId === ref.targetId)
        if (existing) {
          existing.missingReferences.push({ type: ref.sourceType, id: ref.sourceId })
        } else {
          orphans.push({
            entityType: ref.targetType,
            entityId: ref.targetId,
            entityName: `已删除的角色 (${ref.targetId})`,
            missingReferences: [{ type: ref.sourceType, id: ref.sourceId }]
          })
        }
      }
    })
    
    return orphans
  }

  analyzeImpact(entityType: EntityType, entityId: string, projectId: string): ImpactScope {
    const references = this.findAllReferences(entityType, entityId)
    
    const chapterRefs = references.filter(r => r.sourceType === 'chapter' || r.targetType === 'chapter')
    const characterRefs = references.filter(r => r.sourceType === 'character' || r.targetType === 'character')
    const locationRefs = references.filter(r => r.sourceType === 'location' || r.targetType === 'location')
    
    const chapters = chapterRefs.map(r => ({
      id: r.sourceType === 'chapter' ? r.sourceId : r.targetId,
      title: `章节 (${r.relationType})`,
      relevance: 1
    }))
    
    const characters = characterRefs.map(r => ({
      id: r.sourceType === 'character' ? r.sourceId : r.targetId,
      name: `角色 (${r.relationType})`,
      relevance: 1
    }))
    
    const locations = locationRefs.map(r => ({
      id: r.sourceType === 'location' ? r.sourceId : r.targetId,
      name: `地点 (${r.relationType})`,
      relevance: 1
    }))

    return {
      entityId,
      entityType,
      chapters: [...new Map(chapters.map(c => [c.id, c])).values()],
      characters: [...new Map(characters.map(c => [c.id, c])).values()],
      locations: [...new Map(locations.map(l => [l.id, l])).values()],
      totalAffected: chapters.length + characters.length + locations.length
    }
  }

  getRelationMatrix(projectId: string): Record<string, Record<string, string[]>> {
    const references = this.getReferences(projectId)
    const matrix: Record<string, Record<string, string[]>> = {}
    
    references.forEach(ref => {
      const key = `${ref.sourceType}_${ref.sourceId}`
      if (!matrix[key]) matrix[key] = {}
      if (!matrix[key][ref.targetType]) matrix[key][ref.targetType] = []
      matrix[key][ref.targetType].push(ref.targetId)
    })
    
    return matrix
  }

  savePlotLine(plotLine: PlotLine): void {
    const now = new Date().toISOString()
    const id = plotLine.id || `plot_${Date.now()}`
    
    this.db.run(
      `INSERT OR REPLACE INTO plot_lines (id, project_id, name, type, status, description, involved_characters, key_events, chapters, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, plotLine.projectId, plotLine.name, plotLine.type, plotLine.status, plotLine.description,
       JSON.stringify(plotLine.involvedCharacters), JSON.stringify(plotLine.keyEvents), JSON.stringify(plotLine.chapters), now]
    )
  }

  getPlotLines(projectId: string): PlotLine[] {
    const rows = this.db.query<any>('SELECT * FROM plot_lines WHERE project_id = ?', [projectId])
    return rows.map(row => ({
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      type: row.type,
      status: row.status,
      description: row.description,
      involvedCharacters: JSON.parse(row.involved_characters || '[]'),
      keyEvents: JSON.parse(row.key_events || '[]'),
      foreshadowings: [],
      payoffs: [],
      chapters: JSON.parse(row.chapters || '[]'),
      createdAt: row.created_at
    }))
  }

  deletePlotLine(plotLineId: string): void {
    this.db.run('DELETE FROM plot_lines WHERE id = ?', [plotLineId])
  }
}
