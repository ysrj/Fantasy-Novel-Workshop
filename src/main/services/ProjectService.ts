import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import Store from 'electron-store'

const store = new Store()

export interface ProjectMetadata {
  id: string
  title: string
  description: string
  coverPath?: string
  targetWordCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
  customPath?: string
}

interface ProjectsConfig {
  projects: string[]
}

function getDataDir(): string {
  const customPath = store.get('customDataPath', '') as string
  if (customPath && existsSync(customPath)) {
    return customPath
  }
  return join(app.getPath('userData'), 'data')
}

const DATA_DIR = getDataDir()
const PROJECTS_DIR = join(DATA_DIR, 'projects')
const PROJECTS_JSON = join(DATA_DIR, 'projects.json')

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!existsSync(PROJECTS_DIR)) {
    mkdirSync(PROJECTS_DIR, { recursive: true })
  }
}

function loadProjectsConfig(): ProjectsConfig {
  ensureDataDir()
  if (!existsSync(PROJECTS_JSON)) {
    writeFileSync(PROJECTS_JSON, JSON.stringify({ projects: [] }, null, 2))
    return { projects: [] }
  }
  return JSON.parse(readFileSync(PROJECTS_JSON, 'utf-8'))
}

function saveProjectsConfig(config: ProjectsConfig): void {
  writeFileSync(PROJECTS_JSON, JSON.stringify(config, null, 2))
}

export class ProjectService {
  private getCurrentDataDir(): string {
    return getDataDir()
  }

  private getCurrentProjectsDir(): string {
    return join(this.getCurrentDataDir(), 'projects')
  }

  listProjects(): ProjectMetadata[] {
    ensureDataDir()
    const config = loadProjectsConfig()
    const projects: ProjectMetadata[] = []
    const projectsDir = this.getCurrentProjectsDir()

    for (const projectId of config.projects) {
      const metaPath = join(projectsDir, projectId, 'metadata.json')
      if (existsSync(metaPath)) {
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
        projects.push(meta)
      }
    }

    return projects.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

  createProject(metadata: Omit<ProjectMetadata, 'id' | 'createdAt' | 'updatedAt'>): ProjectMetadata {
    ensureDataDir()
    const config = loadProjectsConfig()

    const id = `project_${uuidv4().slice(0, 8)}`
    const now = new Date().toISOString()

    const fullMetadata: ProjectMetadata = {
      ...metadata,
      id,
      createdAt: now,
      updatedAt: now
    }

    const projectsDir = this.getCurrentProjectsDir()
    const projectDir = join(projectsDir, id)
    mkdirSync(projectDir, { recursive: true })
    mkdirSync(join(projectDir, 'outline'), { recursive: true })
    mkdirSync(join(projectDir, 'characters'), { recursive: true })
    mkdirSync(join(projectDir, 'world'), { recursive: true })
    mkdirSync(join(projectDir, 'writing', 'chapters'), { recursive: true })
    mkdirSync(join(projectDir, 'writing', 'drafts'), { recursive: true })
    mkdirSync(join(projectDir, 'writing', 'versions'), { recursive: true })
    mkdirSync(join(projectDir, 'stats'), { recursive: true })

    writeFileSync(
      join(projectDir, 'metadata.json'),
      JSON.stringify(fullMetadata, null, 2)
    )

    config.projects.push(id)
    saveProjectsConfig(config)

    log.info(`Project created: ${id}`)
    return fullMetadata
  }

  getProject(projectId: string): ProjectMetadata | null {
    const projectsDir = this.getCurrentProjectsDir()
    const metaPath = join(projectsDir, projectId, 'metadata.json')
    if (!existsSync(metaPath)) {
      return null
    }
    return JSON.parse(readFileSync(metaPath, 'utf-8'))
  }

  deleteProject(projectId: string): boolean {
    const config = loadProjectsConfig()
    const projectsDir = this.getCurrentProjectsDir()
    const projectDir = join(projectsDir, projectId)

    if (!existsSync(projectDir)) {
      return false
    }

    rmSync(projectDir, { recursive: true, force: true })

    config.projects = config.projects.filter((id) => id !== projectId)
    saveProjectsConfig(config)

    log.info(`Project deleted: ${projectId}`)
    return true
  }

  getProjectPath(projectId: string): string {
    const projectsDir = this.getCurrentProjectsDir()
    return join(projectsDir, projectId)
  }

  getSettings(): { customDataPath: string } {
    return {
      customDataPath: store.get('customDataPath', '') as string
    }
  }

  setCustomDataPath(path: string): void {
    store.set('customDataPath', path)
    log.info(`Custom data path set to: ${path}`)
  }
}
