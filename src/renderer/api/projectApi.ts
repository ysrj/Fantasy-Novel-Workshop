import type { ProjectMetadata } from '../../shared/types'

export const projectApi = {
  list: () => window.api.invoke<ProjectMetadata[]>('project:list'),
  
  create: (metadata: Omit<ProjectMetadata, 'id' | 'createdAt' | 'updatedAt'>) => 
    window.api.invoke<ProjectMetadata>('project:create', metadata),
  
  delete: (projectId: string) => 
    window.api.invoke<boolean>('project:delete', projectId),
  
  get: (projectId: string) => 
    window.api.invoke<ProjectMetadata | null>('project:get', projectId),
  
  getSettings: () => 
    window.api.invoke<{ customDataPath: string }>('project:getSettings'),
}

export const settingsApi = {
  get: (key: string) => window.api.invoke<unknown>('settings:get', key),
  set: (key: string, value: unknown) => window.api.invoke<void>('settings:set', key, value),
  getAll: () => window.api.invoke<Record<string, unknown>>('settings:getAll'),
  setCustomDataPath: (path: string) => window.api.invoke<boolean>('settings:setCustomDataPath', path),
}

export const dialogApi = {
  selectFolder: () => window.api.invoke<string | null>('dialog:selectFolder'),
}
