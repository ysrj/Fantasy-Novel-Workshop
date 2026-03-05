import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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

interface ProjectStore {
  projects: Project[]
  currentProject: Project | null
  loading: boolean
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  removeProject: (projectId: string) => void
  setLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      currentProject: null,
      loading: false,
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (project) => set({ currentProject: project }),
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      removeProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProject:
            state.currentProject?.id === projectId ? null : state.currentProject
        })),
      setLoading: (loading) => set({ loading })
    }),
    {
      name: 'fnw-project-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject
      })
    }
  )
)
