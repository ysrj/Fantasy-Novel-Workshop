export interface AICheckResult {
  type: string
  severity: 'info' | 'warning' | 'error'
  message: string
  location?: string
}

export interface CustomPrompt {
  id: string
  projectId: string
  name: string
  prompt: string
}

export const aiApi = {
  checkStatus: () => window.api.invoke<boolean>('ai:checkStatus'),
  isAvailable: () => window.api.invoke<boolean>('ai:isAvailable'),
  
  checkConsistency: (projectId: string) => 
    window.api.invoke<AICheckResult[]>('ai:checkConsistency', projectId),
  
  enhanceWriting: (content: string, type: 'polish' | 'expand' | 'summary') => 
    window.api.invoke<string | null>('ai:enhanceWriting', content, type),
  
  generateLyrics: (projectId: string, style: string) => 
    window.api.invoke<string | null>('ai:generateLyrics', projectId, style),
  
  generateScript: (projectId: string, type: string) => 
    window.api.invoke<string | null>('ai:generateScript', projectId, type),
  
  generate: (prompt: string, model?: string) => 
    window.api.invoke<string | null>('ai:generate', prompt, model),
  
  chat: (messages: { role: string; content: string }[], model?: string) => 
    window.api.invoke<string | null>('ai:chat', messages, model),
  
  listPrompts: (projectId: string) => 
    window.api.invoke<CustomPrompt[]>('ai:listPrompts', projectId),
  
  savePrompt: (projectId: string, id: string | null, name: string, prompt: string) => 
    window.api.invoke<boolean>('ai:savePrompt', projectId, id, name, prompt),
  
  deletePrompt: (id: string) => 
    window.api.invoke<boolean>('ai:deletePrompt', id),
}
