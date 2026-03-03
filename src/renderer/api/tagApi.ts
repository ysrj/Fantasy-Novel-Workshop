import type { Tag } from '../../shared/types'

export const tagApi = {
  list: (projectId: string) => 
    window.api.invoke<Tag[]>('tag:list', projectId),
  
  add: (projectId: string, name: string, parentId: string | null, color: string, description: string, type: string) => 
    window.api.invoke<Tag>('tag:add', projectId, name, parentId, color, description, type),
  
  update: (id: string, name: string, parentId: string | null, color: string, description: string) => 
    window.api.invoke<void>('tag:update', id, name, parentId, color, description),
  
  delete: (id: string) => 
    window.api.invoke<void>('tag:delete', id),
}

export interface WritingGoal {
  id: string
  projectId: string
  date: string
  targetWords: number
  actualWords?: number
  pomodoroSessions?: number
  totalWritingTime?: number
}

export interface PomodoroStats {
  date: string
  totalSessions: number
  totalWords: number
  totalTime: number
}

export interface WritingSpeed {
  date: string
  wordsPerMinute: number
  sessionCount: number
}

export const goalApi = {
  get: (projectId: string, date: string) => 
    window.api.invoke<WritingGoal | null>('goal:get', projectId, date),
  
  set: (projectId: string, date: string, targetWords: number) => 
    window.api.invoke<void>('goal:set', projectId, date, targetWords),
  
  updateProgress: (projectId: string, date: string, wordsWritten: number, writingTime: number) => 
    window.api.invoke<void>('goal:updateProgress', projectId, date, wordsWritten, writingTime),
  
  history: (projectId: string, days: number) => 
    window.api.invoke<WritingGoal[]>('goal:history', projectId, days),
}

export const pomodoroApi = {
  add: (projectId: string, startTime: string, endTime: string, wordsWritten: number) => 
    window.api.invoke<void>('pomodoro:add', projectId, startTime, endTime, wordsWritten),
  
  stats: (projectId: string, days: number) => 
    window.api.invoke<PomodoroStats[]>('pomodoro:stats', projectId, days),
  
  speed: (projectId: string, days: number) => 
    window.api.invoke<WritingSpeed[]>('pomodoro:speed', projectId, days),
}
