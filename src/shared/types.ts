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

export interface Realm {
  id: string
  name: string
  order: number
  description: string
  image?: string
  color: string
}

export interface Stage {
  id: string
  realmId: string
  name: string
  order: number
  description: string
  powerLevel: number
}

export interface Breakthrough {
  id: string
  fromRealmId: string
  toRealmId: string
  condition: string
  description: string
  risk: string
  successRate: number
}

export interface Technique {
  id: string
  name: string
  realm: string
  type: 'attack' | 'defense' | 'healing' | 'support' | ' cultivation'
  description: string
  effects: string[]
  requirements: string
  compatibleRealms: string[]
  weaknesses: string[]
  synergies: string[]
}

export interface Pill {
  id: string
  name: string
  grade: 'low' | 'medium' | 'high' | 'super'
  effects: string
  ingredients: { name: string; quantity: number }[]
  sideEffects: string
  successRate: number
  description: string
}

export interface Artifact {
  id: string
  name: string
  type: 'weapon' | 'armor' | 'accessory' | 'spiritual'
  grade: 'low' | 'medium' | 'high' | 'super' | 'legendary'
  owner?: string
  power: string
  abilities: string[]
  description: string
}

export interface CultivationData {
  realms: Realm[]
  stages: Stage[]
  breakthroughs: Breakthrough[]
  techniques: Technique[]
  pills: Pill[]
  artifacts: Artifact[]
}
