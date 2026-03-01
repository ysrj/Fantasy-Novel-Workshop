import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { ProjectService } from './ProjectService'
import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'

export interface Chapter {
  id: string
  number: number
  title: string
  fileName: string
  wordCount: number
  createdAt: string
  updatedAt: string
}

export class WritingService {
  private projectService = new ProjectService()

  listChapters(projectId: string): Chapter[] {
    const projectPath = this.projectService.getProjectPath(projectId)
    const chaptersDir = join(projectPath, 'writing', 'chapters')

    if (!existsSync(chaptersDir)) {
      mkdirSync(chaptersDir, { recursive: true })
      return []
    }

    try {
      const files = readdirSync(chaptersDir).filter((f) => f.endsWith('.md'))
      const chapters: Chapter[] = []

      for (const file of files) {
        const content = readFileSync(join(chaptersDir, file), 'utf-8')
        const match = file.match(/chapter_(\d+)\.md/)
        const number = match ? parseInt(match[1]) : 0

        chapters.push({
          id: file.replace('.md', ''),
          number,
          title: this.extractTitle(content) || `第${number}章`,
          fileName: file,
          wordCount: this.countWords(content),
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        })
      }

      return chapters.sort((a, b) => a.number - b.number)
    } catch (error) {
      log.error('Failed to list chapters:', error)
      return []
    }
  }

  getChapter(projectId: string, chapterId: string): string | null {
    const projectPath = this.projectService.getProjectPath(projectId)
    const chapterPath = join(projectPath, 'writing', 'chapters', `${chapterId}.md`)

    if (!existsSync(chapterPath)) {
      return null
    }

    return readFileSync(chapterPath, 'utf-8')
  }

  saveChapter(projectId: string, chapterId: string, content: string): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const chaptersDir = join(projectPath, 'writing', 'chapters')

    if (!existsSync(chaptersDir)) {
      mkdirSync(chaptersDir, { recursive: true })
    }

    const chapterPath = join(chaptersDir, `${chapterId}.md`)
    writeFileSync(chapterPath, content)
    log.info(`Chapter saved: ${projectId}/${chapterId}`)
  }

  createChapter(projectId: string, title: string): Chapter {
    const projectPath = this.projectService.getProjectPath(projectId)
    const chaptersDir = join(projectPath, 'writing', 'chapters')

    if (!existsSync(chaptersDir)) {
      mkdirSync(chaptersDir, { recursive: true })
    }

    const existingChapters = this.listChapters(projectId)
    const nextNumber = existingChapters.length + 1
    const id = `chapter_${String(nextNumber).padStart(3, '0')}`
    const fileName = `${id}.md`

    const content = `# ${title}\n\n`

    writeFileSync(join(chaptersDir, fileName), content)

    const now = new Date().toISOString()
    const chapter: Chapter = {
      id,
      number: nextNumber,
      title,
      fileName,
      wordCount: 0,
      createdAt: now,
      updatedAt: now
    }

    log.info(`Chapter created: ${projectId}/${id}`)
    return chapter
  }

  deleteChapter(projectId: string, chapterId: string): boolean {
    const projectPath = this.projectService.getProjectPath(projectId)
    const chapterPath = join(projectPath, 'writing', 'chapters', `${chapterId}.md`)

    if (!existsSync(chapterPath)) {
      return false
    }

    unlinkSync(chapterPath)
    log.info(`Chapter deleted: ${projectId}/${chapterId}`)
    return true
  }

  private extractTitle(content: string): string | null {
    const match = content.match(/^#\s+(.+)$/m)
    return match ? match[1] : null
  }

  private countWords(content: string): number {
    const text = content.replace(/[#*`\[\]()]/g, '').trim()
    if (!text) return 0
    return text.split(/\s+/).filter((w) => w.length > 0).length
  }
}
