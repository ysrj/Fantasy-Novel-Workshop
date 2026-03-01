import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import log from 'electron-log'
import { ProjectService } from './ProjectService'
import { WritingService } from './WritingService'

export interface ExportOptions {
  format: 'epub' | 'txt' | 'json'
  includeOutline: boolean
  includeCharacters: boolean
}

export class ExportService {
  private projectService: ProjectService
  private writingService: WritingService

  constructor() {
    this.projectService = new ProjectService()
    this.writingService = new WritingService()
  }

  async exportProject(projectId: string, options: ExportOptions): Promise<string> {
    const project = this.projectService.getProject(projectId)
    if (!project) {
      throw new Error('Project not found')
    }

    const projectPath = this.projectService.getProjectPath(projectId)
    const exportDir = join(projectPath, 'exports')

    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true })
    }

    const chapters = this.writingService.listChapters(projectId)
    let content = ''

    for (const chapter of chapters) {
      const chapterContent = this.writingService.getChapter(projectId, chapter.id)
      if (chapterContent) {
        content += `${chapterContent}\n\n`
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    let outputPath: string

    switch (options.format) {
      case 'txt':
        outputPath = join(exportDir, `${project.title}_${timestamp}.txt`)
        writeFileSync(outputPath, this.convertToTxt(content, project))
        break
      case 'json':
        outputPath = join(exportDir, `${project.title}_${timestamp}.json`)
        writeFileSync(outputPath, this.convertToJson(project, chapters, projectId))
        break
      case 'epub':
      default:
        outputPath = join(exportDir, `${project.title}_${timestamp}.txt`)
        writeFileSync(outputPath, this.convertToTxt(content, project))
        break
    }

    log.info(`Project exported: ${projectId} to ${outputPath}`)
    return outputPath
  }

  private convertToTxt(content: string, project: any): string {
    let result = `# ${project.title}\n\n`
    result += `作者：${project.author || '未知'}\n\n`
    result += `简介：${project.description || '暂无简介'}\n\n`
    result += `---\n\n`
    result += content
    return result
  }

  private convertToJson(project: any, chapters: any[], projectId: string): string {
    const data = {
      title: project.title,
      description: project.description,
      targetWordCount: project.targetWordCount,
      tags: project.tags,
      chapters: chapters.map(ch => ({
        ...ch,
        content: this.writingService.getChapter(projectId, ch.id)
      }))
    }
    return JSON.stringify(data, null, 2)
  }

  async exportChapter(projectId: string, chapterId: string, format: 'txt' | 'md' = 'md'): Promise<string> {
    const projectPath = this.projectService.getProjectPath(projectId)
    const exportDir = join(projectPath, 'exports')

    if (!existsSync(exportDir)) {
      mkdirSync(exportDir, { recursive: true })
    }

    const content = this.writingService.getChapter(projectId, chapterId)
    if (!content) {
      throw new Error('Chapter not found')
    }

    const chapters = this.writingService.listChapters(projectId)
    const chapter = chapters.find(c => c.id === chapterId)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const ext = format === 'md' ? 'md' : 'txt'
    const outputPath = join(exportDir, `${chapter?.title || chapterId}_${timestamp}.${ext}`)

    writeFileSync(outputPath, content)
    log.info(`Chapter exported: ${projectId}/${chapterId}`)
    return outputPath
  }

  listExports(projectId: string): { name: string; path: string; time: string }[] {
    const projectPath = this.projectService.getProjectPath(projectId)
    const exportDir = join(projectPath, 'exports')

    if (!existsSync(exportDir)) {
      return []
    }

    const files = readdirSync(exportDir)
    return files
      .filter(f => f.endsWith('.txt') || f.endsWith('.json'))
      .map(f => {
        const stats = require('fs').statSync(join(exportDir, f))
        return {
          name: f,
          path: join(exportDir, f),
          time: stats.mtime.toISOString()
        }
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }
}
