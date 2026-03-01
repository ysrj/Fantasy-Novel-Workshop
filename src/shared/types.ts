export interface Project {
  id: string
  title: string
  description: string
  coverPath?: string
  targetWordCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Chapter {
  id: string
  number: number
  title: string
  fileName: string
  wordCount: number
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  name: string
  nickname?: string
  gender?: string
  age?: string
  appearance: string
  personality: string
  background: string
  abilities: string
  role: string
  status: string
}

export interface WorldData {
  cultivation: CultivationSystem
  geography: GeographyData
  history: HistoryEvent[]
  artifacts: Artifact[]
  factions: Faction[]
  customSettings: Record<string, string>
}

export interface CultivationSystem {
  realms: CultivationRealm[]
  techniques: Technique[]
  skills: Skill[]
}

export interface CultivationRealm {
  id: string
  name: string
  order: number
  description: string
}

export interface Technique {
  id: string
  name: string
  realm: string
  description: string
  type: string
}

export interface Skill {
  id: string
  name: string
  description: string
  techniqueId?: string
}

export interface GeographyData {
  locations: Location[]
}

export interface Location {
  id: string
  name: string
  description: string
  type: string
  parentId?: string
  imagePath?: string
}

export interface HistoryEvent {
  id: string
  year: string
  title: string
  description: string
  relatedLocations: string[]
}

export interface Artifact {
  id: string
  name: string
  type: string
  description: string
  owner?: string
  power: string
}

export interface Faction {
  id: string
  name: string
  type: string
  description: string
  leader?: string
  members: string[]
}

export interface OutlineData {
  storyOutline: string
  structure: StructureData
  chapterOutlines: ChapterOutline[]
  scenes: Scene[]
  plotPoints: PlotPoint[]
}

export interface StructureData {
  type: string
  stages: StructureStage[]
}

export interface StructureStage {
  name: string
  description: string
  chapters: string[]
}

export interface ChapterOutline {
  id: string
  number: number
  title: string
  summary: string
  stage?: string
}

export interface Scene {
  id: string
  name: string
  location: string
  time: string
  characters: string[]
  description: string
}

export interface PlotPoint {
  id: string
  title: string
  description: string
  chapter?: string
  type: string
}

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
