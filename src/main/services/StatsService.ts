import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { ProjectService } from './ProjectService'
import log from 'electron-log'

export interface StatsData {
  totalWordCount: number
  chapterWordCounts: Record<string, number>
  dailyProgress: DailyProgress[]
  targetWordCount: number
  lastUpdated: string
}

export interface DailyProgress {
  date: string
  wordCount: number
  writingTime: number
}

export class StatsService {
  private projectService = new ProjectService()

  getStats(projectId: string): StatsData {
    const projectPath = this.projectService.getProjectPath(projectId)
    const statsPath = join(projectPath, 'stats', 'stats.json')

    if (!existsSync(statsPath)) {
      const defaultStats: StatsData = {
        totalWordCount: 0,
        chapterWordCounts: {},
        dailyProgress: [],
        targetWordCount: 100000,
        lastUpdated: new Date().toISOString()
      }
      this.saveStats(projectId, defaultStats)
      return defaultStats
    }

    try {
      return JSON.parse(readFileSync(statsPath, 'utf-8'))
    } catch (error) {
      log.error('Failed to load stats:', error)
      return {
        totalWordCount: 0,
        chapterWordCounts: {},
        dailyProgress: [],
        targetWordCount: 100000,
        lastUpdated: new Date().toISOString()
      }
    }
  }

  saveStats(projectId: string, stats: StatsData): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const statsDir = join(projectPath, 'stats')

    if (!existsSync(statsDir)) {
      mkdirSync(statsDir, { recursive: true })
    }

    stats.lastUpdated = new Date().toISOString()
    writeFileSync(join(statsDir, 'stats.json'), JSON.stringify(stats, null, 2))
  }

  updateWordCount(projectId: string, wordCount: number): StatsData {
    const stats = this.getStats(projectId)
    stats.totalWordCount = wordCount

    const today = new Date().toISOString().split('T')[0]
    const todayProgress = stats.dailyProgress.find((p) => p.date === today)

    if (todayProgress) {
      todayProgress.wordCount = wordCount
    } else {
      stats.dailyProgress.push({
        date: today,
        wordCount,
        writingTime: 0
      })
    }

    if (stats.dailyProgress.length > 365) {
      stats.dailyProgress = stats.dailyProgress.slice(-365)
    }

    this.saveStats(projectId, stats)
    log.info(`Word count updated for project ${projectId}: ${wordCount}`)
    return stats
  }
}
