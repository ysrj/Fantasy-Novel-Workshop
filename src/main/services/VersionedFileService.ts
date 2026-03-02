import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync, createReadStream, createWriteStream } from 'fs'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { ProjectService } from './ProjectService'
import type { FileVersion, VersionedFile } from '../../shared/types'

export class VersionedFileService {
  private projectService = new ProjectService()
  private versionIndex: Map<string, VersionedFile> = new Map()

  getVersionDir(projectId: string, filePath: string): string {
    const projectPath = this.projectService.getProjectPath(projectId)
    const baseDir = join(projectPath, '.versions', filePath.replace(/[\\\/]/g, '_'))
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true })
    }
    return baseDir
  }

  getIndexPath(projectId: string): string {
    const projectPath = this.projectService.getProjectPath(projectId)
    return join(projectPath, '.versions', 'index.json')
  }

  loadIndex(projectId: string): void {
    const indexPath = this.getIndexPath(projectId)
    if (existsSync(indexPath)) {
      try {
        const data = JSON.parse(readFileSync(indexPath, 'utf-8'))
        this.versionIndex = new Map(Object.entries(data))
      } catch (err) {
        log.error('Failed to load version index:', err)
        this.versionIndex = new Map()
      }
    }
  }

  saveIndex(projectId: string): void {
    const indexPath = this.getIndexPath(projectId)
    const indexDir = join(indexPath, '..')
    if (!existsSync(indexDir)) {
      mkdirSync(indexDir, { recursive: true })
    }
    writeFileSync(indexPath, JSON.stringify(Object.fromEntries(this.versionIndex), null, 2))
  }

  async saveWithVersion(projectId: string, filePath: string, content: string, comment?: string): Promise<FileVersion> {
    const hash = createHash('md5').update(content).digest('hex')
    const size = Buffer.byteLength(content, 'utf-8')
    const versionId = uuidv4()
    const timestamp = Date.now()

    const version: FileVersion = {
      id: versionId,
      timestamp,
      hash,
      size,
      comment
    }

    const versionDir = this.getVersionDir(projectId, filePath)
    const versionFile = join(versionDir, `${timestamp}-${hash.slice(0, 8)}`)
    writeFileSync(versionFile, content)

    if (!this.versionIndex.has(filePath)) {
      this.versionIndex.set(filePath, {
        path: filePath,
        versions: [],
        currentVersion: versionId
      })
    }

    const fileVersion = this.versionIndex.get(filePath)!
    fileVersion.versions.unshift(version)
    fileVersion.currentVersion = versionId

    if (fileVersion.versions.length > 50) {
      const oldVersions = fileVersion.versions.slice(50)
      fileVersion.versions = fileVersion.versions.slice(0, 50)
      
      oldVersions.forEach(v => {
        const oldFile = join(versionDir, `${v.timestamp}-${v.hash.slice(0, 8)}`)
        if (existsSync(oldFile)) {
          unlinkSync(oldFile)
        }
      })
    }

    this.saveIndex(projectId)
    log.info(`Version saved for ${filePath}: ${versionId}`)

    return version
  }

  getVersions(projectId: string, filePath: string): FileVersion[] {
    this.loadIndex(projectId)
    return this.versionIndex.get(filePath)?.versions || []
  }

  getVersionContent(projectId: string, filePath: string, versionId: string): string | null {
    this.loadIndex(projectId)
    const fileVersion = this.versionIndex.get(filePath)
    if (!fileVersion) return null

    const version = fileVersion.versions.find(v => v.id === versionId)
    if (!version) return null

    const versionDir = this.getVersionDir(projectId, filePath)
    const versionFile = join(versionDir, `${version.timestamp}-${version.hash.slice(0, 8)}`)
    
    if (existsSync(versionFile)) {
      return readFileSync(versionFile, 'utf-8')
    }
    return null
  }

  restoreVersion(projectId: string, filePath: string, versionId: string): boolean {
    const content = this.getVersionContent(projectId, filePath, versionId)
    if (!content) return false

    const projectPath = this.projectService.getProjectPath(projectId)
    const fullPath = join(projectPath, filePath)
    writeFileSync(fullPath, content)
    return true
  }

  getVersionStats(projectId: string): { totalVersions: number; totalSize: number; fileCount: number } {
    this.loadIndex(projectId)
    let totalVersions = 0
    let totalSize = 0

    this.versionIndex.forEach(fv => {
      totalVersions += fv.versions.length
      fv.versions.forEach(v => {
        totalSize += v.size
      })
    })

    return {
      totalVersions,
      totalSize,
      fileCount: this.versionIndex.size
    }
  }
}

export const versionedFileService = new VersionedFileService()
