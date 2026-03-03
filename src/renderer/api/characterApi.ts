export interface Character {
  id: string
  projectId: string
  name: string
  description: string
  [key: string]: unknown
}

export const characterApi = {
  list: (projectId: string) => 
    window.api.invoke<Character[]>('character:list', projectId),
  
  save: (projectId: string, characters: Character[]) => 
    window.api.invoke<void>('character:save', projectId, characters),
  
  getRelationships: (projectId: string) => 
    window.api.invoke<unknown>('character:relationships', projectId),
  
  saveRelationships: (projectId: string, data: unknown) => 
    window.api.invoke<void>('character:saveRelationships', projectId, data),
}
