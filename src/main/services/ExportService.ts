import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import log from 'electron-log'
import { ProjectService } from './ProjectService'
import { WritingService } from './WritingService'
import { OutlineService } from './OutlineService'
import { CharacterService } from './CharacterService'
import { WorldService } from './WorldService'

export interface ExportOptions {
  format: 'epub' | 'txt' | 'json' | 'html' | 'md'
  includeOutline: boolean
  includeCharacters: boolean
  includeWorld: boolean
}

export class ExportService {
  private projectService: ProjectService
  private writingService: WritingService
  private outlineService: OutlineService
  private characterService: CharacterService
  private worldService: WorldService

  constructor() {
    this.projectService = new ProjectService()
    this.writingService = new WritingService()
    this.outlineService = new OutlineService()
    this.characterService = new CharacterService()
    this.worldService = new WorldService()
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
        content += chapterContent + '\n\n---\n\n'
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    let outputPath: string

    switch (options.format) {
      case 'txt':
        outputPath = join(exportDir, `${this.sanitizeFileName(project.title)}_${timestamp}.txt`)
        writeFileSync(outputPath, this.convertToTxt(content, project, options))
        break
      case 'json':
        outputPath = join(exportDir, `${this.sanitizeFileName(project.title)}_${timestamp}.json`)
        writeFileSync(outputPath, this.convertToJson(project, chapters, projectId, options))
        break
      case 'html':
        outputPath = join(exportDir, `${this.sanitizeFileName(project.title)}_${timestamp}.html`)
        writeFileSync(outputPath, this.convertToHtml(project, chapters, projectId, options))
        break
      case 'md':
        outputPath = join(exportDir, `${this.sanitizeFileName(project.title)}_${timestamp}.md`)
        writeFileSync(outputPath, this.convertToMarkdown(content, project, options))
        break
      case 'epub':
      default:
        outputPath = join(exportDir, `${this.sanitizeFileName(project.title)}_${timestamp}.txt`)
        writeFileSync(outputPath, this.convertToTxt(content, project, options))
        break
    }

    log.info(`Project exported: ${projectId} to ${outputPath}`)
    return outputPath
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_')
  }

  private convertToTxt(content: string, project: any, options: ExportOptions): string {
    let result = `# ${project.title}\n\n`
    result += `作者：${project.author || '未知'}\n\n`
    result += `简介：${project.description || '暂无简介'}\n\n`
    result += `标签：${project.tags?.join(', ') || '无'}\n\n`
    result += `目标字数：${project.targetWordCount || 0}\n\n`
    result += `---\n\n`

    if (options.includeOutline) {
      const outline = this.outlineService.loadOutline(project.id)
      if (outline.storyOutline) {
        result += `# 大纲\n\n${outline.storyOutline}\n\n---\n\n`
      }
    }

    if (options.includeCharacters) {
      const characters = this.characterService.listCharacters(project.id)
      if (characters.length > 0) {
        result += `# 角色\n\n`
        for (const char of characters) {
          result += `## ${char.name}\n`
          result += `角色定位：${char.role}\n`
          if (char.gender) result += `性别：${char.gender}\n`
          if (char.appearance) result += `外貌：${char.appearance}\n`
          if (char.personality) result += `性格：${char.personality}\n`
          result += '\n'
        }
        result += '---\n\n'
      }
    }

    result += `# 正文\n\n${content}`
    return result
  }

  private convertToMarkdown(content: string, project: any, options: ExportOptions): string {
    let result = `# ${project.title}\n\n`
    result += `> ${project.description || '暂无简介'}\n\n`
    result += `---\n\n`

    if (options.includeOutline) {
      const outline = this.outlineService.loadOutline(project.id)
      if (outline.storyOutline) {
        result += `## 大纲\n\n${outline.storyOutline}\n\n`
      }
    }

    result += `## 正文\n\n${content}`
    return result
  }

  private convertToHtml(project: any, chapters: any[], projectId: string, options: ExportOptions): string {
    let body = ''

    body += `<header><h1>${project.title}</h1></header>`
    body += `<div class="meta">`
    body += `<p>作者：${project.author || '未知'}</p>`
    body += `<p>简介：${project.description || '暂无简介'}</p>`
    body += `<p>标签：${project.tags?.join(', ') || '无'}</p>`
    body += `<p>目标字数：${project.targetWordCount || 0}</p>`
    body += `</div>`

    if (options.includeOutline) {
      const outline = this.outlineService.loadOutline(project.id)
      if (outline.storyOutline) {
        body += `<section><h2>大纲</h2><p>${outline.storyOutline.replace(/\n/g, '<br>')}</p></section>`
      }
    }

    if (options.includeCharacters) {
      const characters = this.characterService.listCharacters(project.id)
      if (characters.length > 0) {
        body += `<section><h2>角色</h2>`
        for (const char of characters) {
          body += `<div class="character"><h3>${char.name}</h3>`
          body += `<p><strong>角色定位：</strong>${char.role || '未设置'}</p>`
          if (char.appearance) body += `<p><strong>外貌：</strong>${char.appearance}</p>`
          if (char.personality) body += `<p><strong>性格：</strong>${char.personality}</p>`
          body += `</div>`
        }
        body += `</section>`
      }
    }

    if (options.includeWorld) {
      const world = this.worldService.loadWorld(project.id)
      if (world.cultivation.realms?.length > 0) {
        body += `<section><h2>修炼体系</h2><ul>`
        for (const realm of world.cultivation.realms) {
          body += `<li>${realm.name}：${realm.description || ''}</li>`
        }
        body += `</ul></section>`
      }
    }

    body += `<section><h2>正文</h2>`
    for (const chapter of chapters) {
      const chapterContent = this.writingService.getChapter(projectId, chapter.id)
      if (chapterContent) {
        body += `<article><h3>${chapter.title}</h3>`
        body += `<div class="content">${chapterContent.replace(/\n/g, '<br>')}</div></article>`
      }
    }
    body += `</section>`

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.8; }
    h1 { color: #333; border-bottom: 2px solid #1890ff; padding-bottom: 10px; }
    h2 { color: #1890ff; margin-top: 30px; }
    h3 { color: #52c41a; }
    .meta { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .character { border-left: 3px solid #1890ff; padding-left: 15px; margin: 15px 0; }
    .content { text-indent: 2em; }
    section { margin: 20px 0; }
    article { margin: 30px 0; }
  </style>
</head>
<body>
${body}
<footer><p>导出时间：${new Date().toLocaleString()}</p></footer>
</body>
</html>`

    return html
  }

  private convertToJson(project: any, chapters: any[], projectId: string, options: ExportOptions): string {
    const data: any = {
      title: project.title,
      description: project.description,
      author: project.author,
      targetWordCount: project.targetWordCount,
      tags: project.tags,
      createdAt: project.createdAt,
      exportedAt: new Date().toISOString()
    }

    if (options.includeOutline) {
      data.outline = this.outlineService.loadOutline(projectId)
    }

    if (options.includeCharacters) {
      data.characters = this.characterService.listCharacters(projectId)
    }

    if (options.includeWorld) {
      data.world = this.worldService.loadWorld(projectId)
    }

    data.chapters = chapters.map(ch => ({
      ...ch,
      content: this.writingService.getChapter(projectId, ch.id)
    }))

    return JSON.stringify(data, null, 2)
  }

  async exportChapter(projectId: string, chapterId: string, format: 'txt' | 'md' | 'html' = 'md'): Promise<string> {
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
    const project = this.projectService.getProject(projectId)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    let outputPath: string

    if (format === 'html') {
      outputPath = join(exportDir, `${this.sanitizeFileName(chapter?.title || chapterId)}_${timestamp}.html`)
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${chapter?.title || chapterId}</title>
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; }
    h1 { text-align: center; color: #333; }
  </style>
</head>
<body>
<h1>${chapter?.title}</h1>
<div>${content.replace(/\n/g, '<br>')}</div>
</body>
</html>`
      writeFileSync(outputPath, html)
    } else {
      const ext = format === 'md' ? 'md' : 'txt'
      outputPath = join(exportDir, `${this.sanitizeFileName(chapter?.title || chapterId)}_${timestamp}.${ext}`)
      writeFileSync(outputPath, content)
    }

    log.info(`Chapter exported: ${projectId}/${chapterId}`)
    return outputPath
  }

  listExports(projectId: string): { name: string; path: string; time: string; size: number }[] {
    const projectPath = this.projectService.getProjectPath(projectId)
    const exportDir = join(projectPath, 'exports')

    if (!existsSync(exportDir)) {
      return []
    }

    const files = readdirSync(exportDir)
    return files
      .filter(f => f.endsWith('.txt') || f.endsWith('.json') || f.endsWith('.html') || f.endsWith('.md'))
      .map(f => {
        const filePath = join(exportDir, f)
        const stats = require('fs').statSync(filePath)
        return {
          name: f,
          path: filePath,
          time: stats.mtime.toISOString(),
          size: stats.size
        }
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  }
}
