import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { DatabaseService } from './DatabaseService'

export interface Material {
  id: number
  projectId: string
  name: string
  type: string
  path: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Inspiration {
  id: number
  projectId: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export class MaterialService {
  private db: DatabaseService

  constructor(db: DatabaseService) {
    this.db = db
  }

  async listMaterials(projectId: string): Promise<Material[]> {
    return this.db.query<Material>(
      'SELECT * FROM materials WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    )
  }

  async addMaterial(projectId: string, name: string, type: string, path: string, tags: string[] = []): Promise<Material> {
    const now = new Date().toISOString()
    const result = this.db.run(
      'INSERT INTO materials (project_id, name, type, path, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [projectId, name, type, path, JSON.stringify(tags), now, now]
    )

    return {
      id: result.changes,
      projectId,
      name,
      type,
      path,
      tags,
      createdAt: now,
      updatedAt: now
    }
  }

  async deleteMaterial(id: number): Promise<void> {
    this.db.run('DELETE FROM materials WHERE id = ?', [id])
    log.info(`Material deleted: ${id}`)
  }

  async listInspirations(projectId: string): Promise<Inspiration[]> {
    const results = this.db.query<any>(
      'SELECT * FROM inspirations WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    )

    return results.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : []
    }))
  }

  async addInspiration(projectId: string, content: string, tags: string[] = []): Promise<Inspiration> {
    const now = new Date().toISOString()
    const result = this.db.run(
      'INSERT INTO inspirations (project_id, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [projectId, content, JSON.stringify(tags), now, now]
    )

    return {
      id: result.changes,
      projectId,
      content,
      tags,
      createdAt: now,
      updatedAt: now
    }
  }

  async updateInspiration(id: number, content: string, tags: string[]): Promise<void> {
    const now = new Date().toISOString()
    this.db.run(
      'UPDATE inspirations SET content = ?, tags = ?, updated_at = ? WHERE id = ?',
      [content, JSON.stringify(tags), now, id]
    )
    log.info(`Inspiration updated: ${id}`)
  }

  async deleteInspiration(id: number): Promise<void> {
    this.db.run('DELETE FROM inspirations WHERE id = ?', [id])
    log.info(`Inspiration deleted: ${id}`)
  }

  async searchInspirations(projectId: string, keyword: string): Promise<Inspiration[]> {
    const results = this.db.query<any>(
      'SELECT * FROM inspirations WHERE project_id = ? AND content LIKE ? ORDER BY created_at DESC',
      [projectId, `%${keyword}%`]
    )

    return results.map(r => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : []
    }))
  }
}
