import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface EditorStore {
  currentChapterId: string | null
  content: string
  isDirty: boolean
  setCurrentChapter: (chapterId: string | null) => void
  setContent: (content: string) => void
  setDirty: (dirty: boolean) => void
}

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      currentChapterId: null,
      content: '',
      isDirty: false,
      setCurrentChapter: (chapterId) => set({ currentChapterId: chapterId }),
      setContent: (content) => set({ content, isDirty: true }),
      setDirty: (dirty) => set({ isDirty: dirty })
    }),
    {
      name: 'fnw-editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentChapterId: state.currentChapterId
      })
    }
  )
)
