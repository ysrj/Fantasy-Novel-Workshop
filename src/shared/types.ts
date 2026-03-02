export interface Tag {
  id: string
  projectId: string
  name: string
  parentId: string | null
  color: string
  description: string
  type: 'character' | 'world' | 'inspiration' | 'chapter' | 'custom'
}

export interface TagCategory {
  id: string
  name: string
  tags: Tag[]
}

export interface WritingGoal {
  id: string
  projectId: string
  date: string
  targetWords: number
  actualWords: number
  pomodoroSessions: number
  totalWritingTime: number
}

export interface PomodoroSession {
  id: string
  projectId: string
  startTime: string
  endTime: string
  wordsWritten: number
  completed: boolean
}

export interface WritingSpeed {
  date: string
  wordsPerMinute: number
  sessionCount: number
}
