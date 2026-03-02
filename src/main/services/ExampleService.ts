import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import log from 'electron-log'
import { ProjectService } from './ProjectService'

export interface ExampleProject {
  id: string
  name: string
  description: string
  characters: number
  chapters: number
  version: string
  author: string
  world?: {
    style: string
    focus: string[]
  }
}

const EXAMPLES_DIR = join(__dirname, '../../examples')

const AVAILABLE_EXAMPLES: Record<string, ExampleProject> = {
  xianxia: {
    id: 'xianxia',
    name: '凡人修仙传风格示例',
    description: '包含完整修炼体系、势力设定的东方玄幻世界观',
    characters: 5,
    chapters: 5,
    version: '1.0.0',
    author: 'FNW Team',
    world: {
      style: '东方玄幻',
      focus: ['修炼体系', '宗门势力', '法宝丹药']
    }
  }
}

export class ExampleService {
  private projectService = new ProjectService()

  listExamples(): ExampleProject[] {
    return Object.values(AVAILABLE_EXAMPLES)
  }

  getExample(id: string): ExampleExample | undefined {
    return AVAILABLE_EXAMPLES[id]
  }

  async importExample(exampleId: string, projectName?: string): Promise<string | null> {
    const example = AVAILABLE_EXAMPLES[exampleId]
    if (!example) {
      log.error(`Example not found: ${exampleId}`)
      return null
    }

    try {
      const newProjectId = uuidv4()
      const exampleDir = join(EXAMPLES_DIR, exampleId)
      
      if (!existsSync(exampleDir)) {
        log.error(`Example directory not found: ${exampleDir}`)
        return null
      }

      await this.projectService.createProject({
        title: projectName || example.name,
        description: example.description,
        targetWordCount: 100000,
        tags: [example.world?.style || '玄幻'].filter(Boolean)
      })

      const projectPath = this.projectService.getProjectPath(newProjectId)
      
      this.copyExampleFiles(exampleDir, projectPath)

      log.info(`Example imported: ${example.name}`)
      return newProjectId
    } catch (err) {
      log.error('Failed to import example:', err)
      return null
    }
  }

  private copyExampleFiles(sourceDir: string, targetDir: string): void {
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    const items = readdirSync(sourceDir)
    
    items.forEach(item => {
      const sourcePath = join(sourceDir, item)
      const targetPath = join(targetDir, item)
      
      if (item === 'example.json') return
      
      copyFileSync(sourcePath, targetPath)
    })
  }
}

export const exampleService = new ExampleService()
