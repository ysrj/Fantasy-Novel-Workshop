export const mockProject = {
  id: 'test-project-1',
  title: '测试小说',
  description: '这是一个测试小说项目',
  targetWordCount: 100000,
  tags: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
}

export const mockCharacter = {
  id: 'char-1',
  projectId: 'test-project-1',
  name: '叶凡',
  nickname: '叶天帝',
  gender: '男',
  age: '25',
  appearance: '身材高大，面容坚毅',
  personality: '沉稳内敛',
  background: '出身荒古世家',
  abilities: '修炼荒古圣体',
  role: '主角',
  status: 'alive'
}

export const mockChapter = {
  id: 'chapter-1',
  projectId: 'test-project-1',
  number: 1,
  title: '第一章 初入仙途',
  content: '这一日，天空阴沉沉的，仿佛预示着有什么事情要发生。<br/><br/>主角叶凡站在山巅，望着远处的云海，心中豪情万丈。<br/><br/>就在这时，一道光芒突然从天而降...<br/><br/>然而，这只是开始。',
  wordCount: 150
}

export const mockCombat = {
  attacker: {
    id: 'char-1',
    name: '叶凡',
    realm: { level: 3, name: '化龙境' },
    power: 10000
  },
  defender: {
    id: 'char-2',
    name: '反派',
    realm: { level: 5, name: '仙台境' },
    power: 8000
  }
}

export const mockTimelineEvents = [
  { id: 'event-1', year: 2020, month: 3, day: 15, location: '昆仑山' },
  { id: 'event-2', year: 2020, month: 3, day: 15, location: '昆仑山' },
  { id: 'event-3', year: 2021, month: 6, location: '荒古禁地' }
]

export const mockDraftContent = `
  这一日，天空阴沉沉的，仿佛预示着有什么事...
  主角叶凡站在山巅，望着远处的云海...
  就在这时，一道光芒突然从天而降...
  然而，这只是开始。
`

export const mockPublishedContent = `
  这一日。
  主角叶凡站在山巅，望着远处的云海，心中豪情万丈。
  就在这时，一道光芒突然从天而降。
  然而，这只是开始。
`
