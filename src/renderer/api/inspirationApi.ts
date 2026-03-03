export interface Inspiration {
  id: number
  projectId: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const inspirationApi = {
  list: (projectId: string) => 
    window.api.invoke<Inspiration[]>('inspiration:list', projectId),
  
  add: (projectId: string, content: string, tags: string[]) => 
    window.api.invoke<Inspiration>('inspiration:add', projectId, content, tags),
  
  update: (id: number, content: string, tags: string[]) => 
    window.api.invoke<void>('inspiration:update', id, content, tags),
  
  delete: (id: number) => 
    window.api.invoke<void>('inspiration:delete', id),
  
  search: (projectId: string, keyword: string) => 
    window.api.invoke<Inspiration[]>('inspiration:search', projectId, keyword),
}

export interface Material {
  id: number
  projectId: string
  name: string
  type: string
  path: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const materialApi = {
  list: (projectId: string) => 
    window.api.invoke<Material[]>('material:list', projectId),
  
  add: (projectId: string, name: string, type: string, path: string, tags: string[]) => 
    window.api.invoke<Material>('material:add', projectId, name, type, path, tags),
  
  delete: (id: number) => 
    window.api.invoke<void>('material:delete', id),
}
