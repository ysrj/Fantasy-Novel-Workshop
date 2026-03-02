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

export interface Region {
  id: string
  name: string
  description: string
  color: string
  coordinates: { x: number; y: number }
  size: number
}

export interface Sect {
  id: string
  name: string
  type: 'righteous' | 'demon' | 'neutral' | 'ancient'
  leader?: string
  location: string
  territory: string
  description: string
  power: number
  allies: string[]
  enemies: string[]
  techniques: string[]
  resources: string[]
}

export interface Territory {
  id: string
  sectId: string
  regionId: string
  name: string
  boundaries: { x: number; y: number }[]
}

export interface Location {
  id: string
  name: string
  type: 'secret Realm' | 'ruins' | 'forbidden' | 'treasure' | 'dangerous'
  region: string
  coordinates: { x: number; y: number }
  description: string
  dangerLevel: number
  rewards: string[]
  requirements: string[]
}

export interface Rift {
  id: string
  name: string
  fromLocation: string
  toLocation: string
  coordinates: { x: number; y: number }
  description: string
  stability: 'stable' | 'unstable' | 'dangerous'
  requirements: string
}

export interface PlotPoint {
  id: string
  name: string
  sequence: number
  location: string
  description: string
  characters: string[]
  chapters: string[]
}

export interface Era {
  id: string
  name: string
  startYear: number
  endYear: number | null
  description: string
  color: string
}

export interface HistoricalEvent {
  id: string
  eraId: string
  year: number
  title: string
  description: string
  location: string
  characters: string[]
  consequences: string[]
  relatedEvents: string[]
}

export interface CharacterAge {
  characterId: string
  currentAge: number
  cultivationAge: number
  birthYear: number
  currentYear: number
  status: 'alive' | 'deceased' | 'missing'
}

export interface TimeSkip {
  id: string
  startChapter: string
  endChapter: string
  timePassed: number
  unit: 'day' | 'month' | 'year' | 'decade' | 'century'
  description: string
}

export interface CultivationPeriod {
  id: string
  characterId: string
  startAge: number
  endAge: number | null
  realm: string
  duration: number
  location: string
  events: string[]
}

export interface TimeData {
  eras: Era[]
  events: HistoricalEvent[]
  characterAges: CharacterAge[]
  timeSkips: TimeSkip[]
  cultivationPeriods: CultivationPeriod[]
}

export interface PowerLevel {
  id: string
  realm: string
  stage: string
  value: number
  description: string
  combatPower: number
}

export interface PowerScale {
  levels: PowerLevel[]
  baseMultiplier: number
  realmMultiplier: Record<string, number>
}

export interface Battle {
  id: string
  name: string
  chapter?: string
  date: string
  location: string
  participants: BattleParticipant[]
  result: 'win' | 'lose' | 'draw' | 'unknown'
  description: string
  powerDifference: number
}

export interface BattleParticipant {
  characterId: string
  side: 'attacker' | 'defender' | 'neutral'
  realm: string
  powerLevel: number
  role: 'main' | 'support' | 'observer'
  outcome: 'victory' | 'defeat' | 'injured' | 'fled' | 'died'
}

export interface PowerWarning {
  id: string
  type: 'inflation' | 'inconsistency' | 'impossible'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: string
  relatedCharacters: string[]
  suggestedFix?: string
}

export interface CrossRealmValidation {
  id: string
  battleId?: string
  higherRealm: string
  lowerRealm: string
  powerDifference: number
  isReasonable: boolean
  reason: string
  autoApproved: boolean
}

export interface CombatData {
  powerScale: PowerScale
  battleRecords: Battle[]
  warnings: PowerWarning[]
  validations: CrossRealmValidation[]
}

export type EntityType = 'character' | 'sect' | 'artifact' | 'location' | 'chapter' | 'realm' | 'technique' | 'pill' | 'event' | 'era'

export interface EntityReference {
  id: string
  projectId: string
  sourceType: EntityType
  sourceId: string
  targetType: EntityType
  targetId: string
  relationType: string
  description: string
  createdAt: string
}

export interface ReferenceSearch {
  id: string
  projectId: string
  entityType: EntityType
  entityId: string
  references: EntityReference[]
}

export interface OrphanCheck {
  entityType: EntityType
  entityId: string
  entityName: string
  missingReferences: { type: EntityType; id: string }[]
}

export interface ImpactScope {
  entityId: string
  entityType: EntityType
  chapters: { id: string; title: string; relevance: number }[]
  characters: { id: string; name: string; relevance: number }[]
  locations: { id: string; name: string; relevance: number }[]
  totalAffected: number
}

export interface PlotLine {
  id: string
  projectId: string
  name: string
  type: 'main' | 'side' | 'hidden'
  status: 'active' | 'dormant' | 'resolved'
  description: string
  involvedCharacters: string[]
  keyEvents: string[]
  foreshadowings: Foreshadowing[]
  payoffs: Payoff[]
  chapters: string[]
  createdAt: string
}

export interface Foreshadowing {
  id: string
  plotLineId: string
  chapterId: string
  description: string
  subtle: boolean
}

export interface Payoff {
  id: string
  plotLineId: string
  chapterId: string
  foreshadowingId: string
  description: string
}

export interface ReferenceData {
  references: EntityReference[]
  plotLines: PlotLine[]
}

export interface WorkspaceLayout {
  mode: 'single' | 'split-vertical' | 'split-horizontal' | 'grid'
  panels: Panel[]
  activePanelId: string
}

export interface Panel {
  id: string
  type: 'editor' | 'outline' | 'characters' | 'world' | 'stats' | 'timeline' | 'mindmap' | 'git-history' | 'ai-assistant'
  title: string
  isVisible: boolean
  size: number
}

export interface ImmersiveSettings {
  enabled: boolean
  hideUI: boolean
  focusMode: boolean
  typewriterMode: boolean
  backgroundImage: string
  ambientSound: string
  fontSize: number
  lineHeight: number
  maxWidth: number
}

export interface SmartInput {
  trigger: string
  type: 'character' | 'item' | 'location' | 'tag' | 'realm' | 'technique' | 'chapter'
  items: { id: string; name: string; type: string }[]
}

export interface WritingStats {
  totalWords: number
  todayWords: number
  chapterWords: number
  writingTime: number
  sessions: number
}

export interface GeographyData {
  regions: Region[]
  sects: Sect[]
  territories: Territory[]
  importantLocations: Location[]
  spatialRifts: Rift[]
  plotPoints: PlotPoint[]
}

export interface MenuItem {
  id: string
  label: string
  icon?: string
  accelerator?: string
  action: string
  position: 'file' | 'edit' | 'view' | 'tools' | 'help'
}

export interface View {
  id: string
  name: string
  path: string
  icon?: string
}

export interface ExportFormat {
  id: string
  name: string
  extension: string
  handler: string
}

export interface AIProvider {
  id: string
  name: string
  endpoint: string
  model: string
}

export interface Plugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  enabled: boolean
  menus?: MenuItem[]
  views?: View[]
  exports?: ExportFormat[]
  aiProviders?: AIProvider[]
}

export interface PluginAPI {
  registerMenuItem: (menu: MenuItem) => void
  registerView: (view: View) => void
  registerExportFormat: (format: ExportFormat) => void
  registerAIProvider: (provider: AIProvider) => void
  onProjectOpen: (callback: (project: ProjectMetadata) => void) => void
  onChapterSave: (callback: (chapter: ChapterData) => void) => void
  onCharacterUpdate: (callback: (character: CharacterData) => void) => void
}

export interface ProjectMetadata {
  id: string
  title: string
  description: string
  coverPath?: string
  targetWordCount: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ChapterData {
  id: string
  projectId: string
  title: string
  content: string
  wordCount: number
}

export interface CharacterData {
  id: string
  projectId: string
  name: string
  description: string
}

export interface AutoBackupConfig {
  interval: number
  maxBackups: number
  onCrash: boolean
}

export interface IntegrityCheckConfig {
  onStartup: boolean
  onSave: boolean
  repairStrategy: 'auto' | 'manual' | 'prompt'
}

export interface OperationLogConfig {
  enabled: boolean
  maxEntries: number
  undoSteps: number
}

export interface ErrorRecoveryConfig {
  autoBackup: AutoBackupConfig
  integrityCheck: IntegrityCheckConfig
  operationLog: OperationLogConfig
}

export interface OperationEntry {
  id: string
  timestamp: number
  type: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  previousState?: string
  newState?: string
}

export interface WorkerMessage {
  type: 'stats' | 'relationship' | 'search' | 'export'
  payload: any
  requestId?: string
}

export interface WorkerResponse {
  type: 'result' | 'error' | 'progress'
  requestId?: string
  data?: any
  error?: string
  progress?: number
}
