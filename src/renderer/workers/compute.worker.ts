import type { WorkerMessage, WorkerResponse } from '../../shared/types'

const ctx: Worker = self as any

ctx.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload, requestId } = e.data

  try {
    switch (type) {
      case 'stats':
        handleStats(payload, requestId)
        break
      case 'relationship':
        handleRelationship(payload, requestId)
        break
      case 'search':
        handleSearch(payload, requestId)
        break
      case 'export':
        handleExport(payload, requestId)
        break
      default:
        sendResponse({ type: 'error', error: `Unknown message type: ${type}`, requestId })
    }
  } catch (err) {
    sendResponse({ type: 'error', error: String(err), requestId })
  }
}

function sendResponse(response: WorkerResponse): void {
  ctx.postMessage(response)
}

function handleStats(payload: any, requestId?: string): void {
  const { content, type } = payload
  
  if (type === 'wordCount') {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0)
    const charCount = content.length
    const lineCount = content.split('\n').length
    sendResponse({ 
      type: 'result', 
      data: { wordCount: words.length, charCount, lineCount },
      requestId 
    })
  } else if (type === 'frequency') {
    const words = content.toLowerCase().match(/[\u4e00-\u9fa5a-z]+/g) || []
    const freq: Record<string, number> = {}
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
    sendResponse({ type: 'result', data: sorted, requestId })
  }
}

function handleRelationship(payload: any, requestId?: string): void {
  const { characters, chapters } = payload
  
  const relationships: { source: string; target: string; type: string }[] = []
  
  characters?.forEach((char: any) => {
    char.relatedCharacters?.forEach((related: string) => {
      relationships.push({
        source: char.name,
        target: related,
        type: 'association'
      })
    })
  })
  
  sendResponse({ type: 'result', data: relationships, requestId })
}

function handleSearch(payload: any, requestId?: string): void {
  const { content, query, options } = payload
  
  const results: { line: number; text: string; context: string }[] = []
  const lines = content.split('\n')
  const regex = new RegExp(query, 'gi')
  
  lines.forEach((line: string, idx: number) => {
    if (regex.test(line)) {
      const start = Math.max(0, idx - 2)
      const end = Math.min(lines.length, idx + 3)
      results.push({
        line: idx + 1,
        text: line.trim(),
        context: lines.slice(start, end).join('\n')
      })
    }
    regex.lastIndex = 0
  })
  
  sendResponse({ type: 'result', data: results, requestId })
}

function handleExport(payload: any, requestId?: string): void {
  const { data, format } = payload
  const total = data.length
  
  const results: any[] = []
  
  data.forEach((item: any, idx: number) => {
    results.push(item)
    
    if (idx % 100 === 0) {
      sendResponse({ 
        type: 'progress', 
        progress: Math.round((idx / total) * 100), 
        requestId 
      })
    }
  })
  
  sendResponse({ type: 'result', data: results, requestId })
}

export {}
