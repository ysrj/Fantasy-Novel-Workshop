import type { ChapterData } from '../../shared/types'

export interface ChapterBasic extends ChapterData {
}

export const writingApi = {
  listChapters: (projectId: string) => 
    window.api.invoke<ChapterData[]>('writing:listChapters', projectId),
  
  getChapter: (projectId: string, chapterId: string) => 
    window.api.invoke<string>('writing:getChapter', projectId, chapterId),
  
  saveChapter: (projectId: string, chapterId: string, content: string) => 
    window.api.invoke<void>('writing:saveChapter', projectId, chapterId, content),
  
  createChapter: (projectId: string, title: string) => 
    window.api.invoke<ChapterData>('writing:createChapter', projectId, title),
  
  deleteChapter: (projectId: string, chapterId: string) => 
    window.api.invoke<void>('writing:deleteChapter', projectId, chapterId),
}
