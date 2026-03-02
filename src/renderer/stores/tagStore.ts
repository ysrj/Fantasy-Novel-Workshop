import { create } from 'zustand'
import { Tag } from '../../shared/types'

interface TagStore {
  tags: Tag[]
  selectedTags: string[]
  setTags: (tags: Tag[]) => void
  addTag: (tag: Tag) => void
  removeTag: (id: string) => void
  setSelectedTags: (tags: string[]) => void
  toggleTag: (id: string) => void
}

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  selectedTags: [],
  setTags: (tags) => set({ tags }),
  addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
  removeTag: (id) => set((state) => ({ tags: state.tags.filter((t) => t.id !== id) })),
  setSelectedTags: (selectedTags) => set({ selectedTags }),
  toggleTag: (id) => set((state) => ({
    selectedTags: state.selectedTags.includes(id)
      ? state.selectedTags.filter((t) => t !== id)
      : [...state.selectedTags, id]
  }))
}))
