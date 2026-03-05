import log from 'electron-log'
import * as chokidar from 'chokidar'
import { FSWatcher } from 'fs'

interface DebounceOptions {
  delay?: number
  maxWait?: number
}

export class PerformanceService {
  private fileWatchers: Map<string, FSWatcher> = new Map()
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private memoryCache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map()
  private largeFileThreshold = 10 * 1024 * 1024

  watchDirectory(
    dirPath: string,
    callback: (filePath: string, event: string) => void,
    options?: DebounceOptions
  ): void {
    if (this.fileWatchers.has(dirPath)) {
      return
    }

    const delay = options?.delay || 300

    const watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    })

    watcher.on('change', (path) => {
      this.debounce(`watch:${path}`, () => callback(path, 'change'), delay)
    })

    watcher.on('add', (path) => {
      this.debounce(`watch:${path}`, () => callback(path, 'add'), delay)
    })

    watcher.on('unlink', (path) => {
      this.debounce(`watch:${path}`, () => callback(path, 'unlink'), delay)
    })

    this.fileWatchers.set(dirPath, watcher)
    log.info(`[Performance] Started watching directory: ${dirPath}`)
  }

  unwatchDirectory(dirPath: string): void {
    const watcher = this.fileWatchers.get(dirPath)
    if (watcher) {
      watcher.close()
      this.fileWatchers.delete(dirPath)
      log.info(`[Performance] Stopped watching directory: ${dirPath}`)
    }
  }

  private debounce(key: string, fn: () => void, delay: number): void {
    const existingTimer = this.debounceTimers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      fn()
      this.debounceTimers.delete(key)
    }, delay)

    this.debounceTimers.set(key, timer)
  }

  async readLargeFile(
    filePath: string,
    onChunk?: (chunk: string, progress: number) => void
  ): Promise<string> {
    const fs = await import('fs/promises')
    const stats = await fs.stat(filePath)

    if (stats.size < this.largeFileThreshold) {
      return await fs.readFile(filePath, 'utf-8')
    }

    log.info(`[Performance] Processing large file: ${filePath} (${stats.size} bytes)`)

    const chunkSize = 64 * 1024
    const chunks: string[] = []
    const fileHandle = await fs.open(filePath, 'r')
    const buffer = Buffer.alloc(chunkSize)
    let position = 0
    let bytesRead: number

    try {
      while ((bytesRead = await fileHandle.read(buffer, 0, chunkSize, position)) > 0) {
        const chunk = buffer.slice(0, bytesRead).toString('utf-8')
        chunks.push(chunk)

        if (onChunk) {
          const progress = Math.min((position / stats.size) * 100, 100)
          onChunk(chunk, progress)
        }

        position += bytesRead
      }
    } finally {
      await fileHandle.close()
    }

    return chunks.join('')
  }

  setCache(key: string, data: unknown, ttlSeconds: number = 300): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    })
  }

  getCache(key: string): unknown | null {
    const cached = this.memoryCache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.memoryCache.delete(key)
      return null
    }

    return cached.data
  }

  clearCache(): void {
    this.memoryCache.clear()
  }

  clearExpiredCache(): number {
    const now = Date.now()
    let cleared = 0

    for (const [key, value] of this.memoryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.memoryCache.delete(key)
        cleared++
      }
    }

    return cleared
  }

  getMemoryUsage(): { used: number; total: number; percentage: number } {
    const used = process.memoryUsage()
    return {
      used: used.heapUsed,
      total: used.heapTotal,
      percentage: (used.heapUsed / used.heapTotal) * 100
    }
  }

  async forceGC(): Promise<void> {
    if (global.gc) {
      global.gc()
      log.info('[Performance] Garbage collection forced')
    }
  }

  destroy(): void {
    for (const watcher of this.fileWatchers.values()) {
      watcher.close()
    }
    this.fileWatchers.clear()

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()

    this.memoryCache.clear()
    log.info('[Performance] Performance service destroyed')
  }
}

let performanceService: PerformanceService | null = null

export function getPerformanceService(): PerformanceService {
  if (!performanceService) {
    performanceService = new PerformanceService()
  }
  return performanceService
}
