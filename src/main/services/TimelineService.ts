import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { ProjectService } from './ProjectService'
import log from 'electron-log'

export interface Era {
  id: string
  name: string
  startYear: number
  endYear?: number
  description?: string
  color?: string
}

export interface TimelineEvent {
  id: string
  eraId: string
  year: number
  title: string
  description?: string
  relatedCharacters?: string[]
  relatedLocations?: string[]
  chapterId?: string
  importance: 'major' | 'minor' | 'plot'
}

export interface CharacterAge {
  id: string
  characterId: string
  characterName: string
  birthYear?: number
  currentYear: number
  age: number
  realm?: string
  keyEvents?: { year: number; event: string }[]
}

export interface TimeSkip {
  id: string
  fromYear: number
  toYear: number
  reason?: string
  affectedCharacters?: string[]
  chapterId?: string
}

export interface TimeData {
  eras: Era[]
  events: TimelineEvent[]
  characterAges: CharacterAge[]
  timeSkips: TimeSkip[]
}

const DEFAULT_TIME_DATA: TimeData = {
  eras: [],
  events: [],
  characterAges: [],
  timeSkips: []
}

export class TimelineService {
  private projectService = new ProjectService()

  loadTimeData(projectId: string): TimeData {
    const projectPath = this.projectService.getProjectPath(projectId)
    const timePath = join(projectPath, 'world', 'time_data.json')
    
    if (!existsSync(timePath)) {
      this.saveTimeData(projectId, DEFAULT_TIME_DATA)
      return DEFAULT_TIME_DATA
    }
    
    try {
      return JSON.parse(readFileSync(timePath, 'utf-8'))
    } catch (error) {
      log.error('Failed to load time data:', error)
      return DEFAULT_TIME_DATA
    }
  }

  saveTimeData(projectId: string, data: TimeData): void {
    const projectPath = this.projectService.getProjectPath(projectId)
    const worldDir = join(projectPath, 'world')
    
    if (!existsSync(worldDir)) {
      mkdirSync(worldDir, { recursive: true })
    }
    
    const timePath = join(worldDir, 'time_data.json')
    writeFileSync(timePath, JSON.stringify(data, null, 2))
    log.info(`Time data saved for project: ${projectId}`)
  }

  addEra(projectId: string, era: Era): void {
    const data = this.loadTimeData(projectId)
    data.eras.push(era)
    data.eras.sort((a, b) => a.startYear - b.startYear)
    this.saveTimeData(projectId, data)
  }

  updateEra(projectId: string, era: Era): void {
    const data = this.loadTimeData(projectId)
    const index = data.eras.findIndex(e => e.id === era.id)
    if (index !== -1) {
      data.eras[index] = era
      this.saveTimeData(projectId, data)
    }
  }

  deleteEra(projectId: string, eraId: string): void {
    const data = this.loadTimeData(projectId)
    data.eras = data.eras.filter(e => e.id !== eraId)
    data.events = data.events.filter(e => e.eraId !== eraId)
    this.saveTimeData(projectId, data)
  }

  addEvent(projectId: string, event: TimelineEvent): void {
    const data = this.loadTimeData(projectId)
    data.events.push(event)
    data.events.sort((a, b) => a.year - b.year)
    this.saveTimeData(projectId, data)
  }

  updateEvent(projectId: string, event: TimelineEvent): void {
    const data = this.loadTimeData(projectId)
    const index = data.events.findIndex(e => e.id === event.id)
    if (index !== -1) {
      data.events[index] = event
      this.saveTimeData(projectId, data)
    }
  }

  deleteEvent(projectId: string, eventId: string): void {
    const data = this.loadTimeData(projectId)
    data.events = data.events.filter(e => e.id !== eventId)
    this.saveTimeData(projectId, data)
  }

  getEventsByEra(projectId: string, eraId: string): TimelineEvent[] {
    const data = this.loadTimeData(projectId)
    return data.events.filter(e => e.eraId === eraId)
  }

  getEventsByYear(projectId: string, year: number): TimelineEvent[] {
    const data = this.loadTimeData(projectId)
    return data.events.filter(e => e.year === year)
  }

  addCharacterAge(projectId: string, characterAge: CharacterAge): void {
    const data = this.loadTimeData(projectId)
    const index = data.characterAges.findIndex(c => c.characterId === characterAge.characterId)
    if (index !== -1) {
      data.characterAges[index] = characterAge
    } else {
      data.characterAges.push(characterAge)
    }
    this.saveTimeData(projectId, data)
  }

  calculateCharacterAge(projectId: string, characterId: string, currentYear: number): number | null {
    const data = this.loadTimeData(projectId)
    const characterAge = data.characterAges.find(c => c.characterId === characterId)
    if (!characterAge || !characterAge.birthYear) return null
    return currentYear - characterAge.birthYear
  }

  getCharacterTimeline(projectId: string, characterId: string): { year: number; event: string }[] {
    const data = this.loadTimeData(projectId)
    const timeline: { year: number; event: string }[] = []
    
    const characterAge = data.characterAges.find(c => c.characterId === characterId)
    if (characterAge?.birthYear) {
      timeline.push({ year: characterAge.birthYear, event: '出生' })
    }
    
    data.events.forEach(event => {
      if (event.relatedCharacters?.includes(characterId)) {
        timeline.push({ year: event.year, event: event.title })
      }
    })
    
    data.timeSkips.forEach(skip => {
      if (skip.affectedCharacters?.includes(characterId)) {
        timeline.push({ year: skip.toYear, event: `时间跳跃: ${skip.reason || '修炼中'}` })
      }
    })
    
    return timeline.sort((a, b) => a.year - b.year)
  }

  addTimeSkip(projectId: string, timeSkip: TimeSkip): void {
    const data = this.loadTimeData(projectId)
    data.timeSkips.push(timeSkip)
    this.saveTimeData(projectId, data)
  }

  checkChronology(projectId: string): { valid: boolean; issues: string[] } {
    const data = this.loadTimeData(projectId)
    const issues: string[] = []
    
    for (let i = 0; i < data.events.length - 1; i++) {
      const current = data.events[i]
      const next = data.events[i + 1]
      
      if (current.year > next.year) {
        issues.push(`时间线混乱: "${current.title}" (年${current.year}) 发生在 "${next.title}" (年${next.year}) 之后`)
      }
    }
    
    data.characterAges.forEach(char => {
      if (char.birthYear) {
        const deathEvents = data.events.filter(e => 
          e.relatedCharacters?.includes(char.characterId) && 
          e.title.includes('死亡')
        )
        
        deathEvents.forEach(event => {
          if (event.year < char.birthYear!) {
            issues.push(`角色${char.characterName}在出生年前死亡`)
          }
        })
      }
    })
    
    return { valid: issues.length === 0, issues }
  }

  getTimelineSummary(projectId: string): { totalEras: number; totalEvents: number; yearRange: { start: number; end: number } } {
    const data = this.loadTimeData(projectId)
    
    const years = data.events.map(e => e.year)
    const start = years.length > 0 ? Math.min(...years) : 0
    const end = years.length > 0 ? Math.max(...years) : 0
    
    return {
      totalEras: data.eras.length,
      totalEvents: data.events.length,
      yearRange: { start, end }
    }
  }
}

export const timelineService = new TimelineService()
