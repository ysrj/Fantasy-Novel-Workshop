export type Language = 'zh-CN' | 'en-US'

export interface Translations {
  // App
  appName: string
  
  // Navigation
  backToList: string
  projectList: string
  
  // Menu
  outline: string
  characters: string
  world: string
  writing: string
  inspiration: string
  aiAssistant: string
  stats: string
  settings: string
  
  // Project
  myProjects: string
  newProject: string
  createProject: string
  projectTitle: string
  projectDescription: string
  targetWordCount: string
  noProjects: string
  delete: string
  confirmDelete: string
  deleteWarning: string
  createdAt: string
  
  // Outline
  outlineManagement: string
  storyOutline: string
  structurePlanning: string
  chapterOutline: string
  save: string
  saved: string
  
  // Characters
  characterList: string
  addCharacter: string
  editCharacter: string
  deleteCharacter: string
  name: string
  role: string
  gender: string
  appearance: string
  personality: string
  selectOrAddCharacter: string
  
  // World
  worldSettings: string
  cultivationSystem: string
  geography: string
  artifacts: string
  factions: string
  addRealm: string
  addLocation: string
  addArtifact: string
  addFaction: string
  
  // Writing
  chapterList: string
  newChapter: string
  chapterTitle: string
  startWriting: string
  noChapter: string
  unsaved: string
  
  // Inspiration
  inspirationLibrary: string
  addInspiration: string
  editInspiration: string
  deleteInspiration: string
  searchInspiration: string
  noInspiration: string
  tags: string
  tagsPlaceholder: string
  
  // AI
  aiHelper: string
  ollamaNotRunning: string
  ollamaReady: string
  consistencyCheck: string
  checkContent: string
  writingPolish: string
  expand: string
  summary: string
  generate: string
  usageTips: string
  
  // Stats
  writingStats: string
  totalWords: string
  todayWords: string
  writingDays: string
  progress: string
  
  // Settings
  systemSettings: string
  basicSettings: string
  editorSettings: string
  aiSettings: string
  autoSaveInterval: string
  fontSize: string
  font: string
  theme: string
  light: string
  dark: string
  language: string
  dataPath: string
  selectFolder: string
  ollamaAddress: string
  aiModel: string
  
  // Common
  cancel: string
  confirm: string
  loading: string
  error: string
  success: string
  words: string
}

export const zhCN: Translations = {
  appName: '玄幻小说工坊',
  
  backToList: '返回列表',
  projectList: '我的作品',
  
  outline: '大纲',
  characters: '角色',
  world: '世界观',
  writing: '正文',
  inspiration: '灵感',
  aiAssistant: 'AI辅助',
  stats: '统计',
  settings: '设置',
  
  myProjects: '我的作品',
  newProject: '新建项目',
  createProject: '创建项目',
  projectTitle: '作品标题',
  projectDescription: '作品简介',
  targetWordCount: '目标字数',
  noProjects: '暂无作品，点击"新建项目"开始创作',
  delete: '删除',
  confirmDelete: '确认删除',
  deleteWarning: '确定要删除这个项目吗？此操作不可恢复。',
  createdAt: '创建于',
  
  outlineManagement: '大纲管理',
  storyOutline: '故事大纲',
  structurePlanning: '结构规划',
  chapterOutline: '章节大纲',
  save: '保存',
  saved: '已保存',
  
  characterList: '角色列表',
  addCharacter: '添加角色',
  editCharacter: '编辑角色',
  deleteCharacter: '删除角色',
  name: '姓名',
  role: '角色定位',
  gender: '性别',
  appearance: '外貌描述',
  personality: '性格特点',
  selectOrAddCharacter: '选择或添加角色进行编辑',
  
  worldSettings: '世界观设定',
  cultivationSystem: '修炼体系',
  geography: '地理',
  artifacts: '法宝',
  factions: '势力',
  addRealm: '添加境界',
  addLocation: '添加地点',
  addArtifact: '添加法宝',
  addFaction: '添加势力',
  
  chapterList: '章节列表',
  newChapter: '新建章节',
  chapterTitle: '章节标题',
  startWriting: '开始写作',
  noChapter: '选择或创建章节开始写作',
  unsaved: '未保存',
  
  inspirationLibrary: '灵感库',
  addInspiration: '添加灵感',
  editInspiration: '编辑灵感',
  deleteInspiration: '删除灵感',
  searchInspiration: '搜索灵感',
  noInspiration: '暂无灵感，点击添加开始记录',
  tags: '标签',
  tagsPlaceholder: '如：场景, 角色, 道具',
  
  aiHelper: 'AI辅助',
  ollamaNotRunning: 'Ollama 未运行',
  ollamaReady: 'AI 已就绪',
  consistencyCheck: '写作一致性检查',
  checkContent: '检查文章中的人物名、时间线、实力等级等是否一致。',
  writingPolish: '润色',
  expand: '扩写',
  summary: '总结',
  generate: '生成示例',
  usageTips: '使用提示',
  
  writingStats: '写作统计',
  totalWords: '总字数',
  todayWords: '今日字数',
  writingDays: '写作天数',
  progress: '进度',
  
  systemSettings: '系统设置',
  basicSettings: '基本设置',
  editorSettings: '编辑器设置',
  aiSettings: 'AI设置（可选）',
  autoSaveInterval: '自动保存间隔',
  fontSize: '字体大小',
  font: '字体',
  theme: '主题',
  light: '浅色',
  dark: '深色',
  language: '语言',
  dataPath: '数据存储路径',
  selectFolder: '选择文件夹',
  ollamaAddress: 'Ollama地址',
  aiModel: 'AI模型',
  
  cancel: '取消',
  confirm: '确认',
  loading: '加载中...',
  error: '操作失败',
  success: '操作成功',
  words: '字',
}

export const enUS: Translations = {
  appName: 'Fantasy Novel Workshop',
  
  backToList: 'Back to List',
  projectList: 'My Projects',
  
  outline: 'Outline',
  characters: 'Characters',
  world: 'World',
  writing: 'Writing',
  inspiration: 'Inspiration',
  aiAssistant: 'AI Assistant',
  stats: 'Stats',
  settings: 'Settings',
  
  myProjects: 'My Projects',
  newProject: 'New Project',
  createProject: 'Create Project',
  projectTitle: 'Project Title',
  projectDescription: 'Description',
  targetWordCount: 'Target Word Count',
  noProjects: 'No projects yet. Click "New Project" to start.',
  delete: 'Delete',
  confirmDelete: 'Confirm Delete',
  deleteWarning: 'Are you sure you want to delete this project? This cannot be undone.',
  createdAt: 'Created at',
  
  outlineManagement: 'Outline Management',
  storyOutline: 'Story Outline',
  structurePlanning: 'Structure Planning',
  chapterOutline: 'Chapter Outline',
  save: 'Save',
  saved: 'Saved',
  
  characterList: 'Character List',
  addCharacter: 'Add Character',
  editCharacter: 'Edit Character',
  deleteCharacter: 'Delete Character',
  name: 'Name',
  role: 'Role',
  gender: 'Gender',
  appearance: 'Appearance',
  personality: 'Personality',
  selectOrAddCharacter: 'Select or add a character to edit',
  
  worldSettings: 'World Settings',
  cultivationSystem: 'Cultivation System',
  geography: 'Geography',
  artifacts: 'Artifacts',
  factions: 'Factions',
  addRealm: 'Add Realm',
  addLocation: 'Add Location',
  addArtifact: 'Add Artifact',
  addFaction: 'Add Faction',
  
  chapterList: 'Chapter List',
  newChapter: 'New Chapter',
  chapterTitle: 'Chapter Title',
  startWriting: 'Start Writing',
  noChapter: 'Select or create a chapter to start writing',
  unsaved: 'Unsaved',
  
  inspirationLibrary: 'Inspiration Library',
  addInspiration: 'Add Inspiration',
  editInspiration: 'Edit Inspiration',
  deleteInspiration: 'Delete Inspiration',
  searchInspiration: 'Search Inspiration',
  noInspiration: 'No inspirations yet. Click to add.',
  tags: 'Tags',
  tagsPlaceholder: 'e.g., scene, character, item',
  
  aiHelper: 'AI Assistant',
  ollamaNotRunning: 'Ollama Not Running',
  ollamaReady: 'AI Ready',
  consistencyCheck: 'Writing Consistency Check',
  checkContent: 'Check character names, timelines, power levels, etc. for consistency.',
  writingPolish: 'Polish',
  expand: 'Expand',
  summary: 'Summary',
  generate: 'Generate Example',
  usageTips: 'Usage Tips',
  
  writingStats: 'Writing Statistics',
  totalWords: 'Total Words',
  todayWords: 'Today\'s Words',
  writingDays: 'Writing Days',
  progress: 'Progress',
  
  systemSettings: 'System Settings',
  basicSettings: 'Basic Settings',
  editorSettings: 'Editor Settings',
  aiSettings: 'AI Settings (Optional)',
  autoSaveInterval: 'Auto-save Interval',
  fontSize: 'Font Size',
  font: 'Font',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  language: 'Language',
  dataPath: 'Data Storage Path',
  selectFolder: 'Select Folder',
  ollamaAddress: 'Ollama Address',
  aiModel: 'AI Model',
  
  cancel: 'Cancel',
  confirm: 'Confirm',
  loading: 'Loading...',
  error: 'Operation Failed',
  success: 'Operation Successful',
  words: 'words',
}
