import log from 'electron-log'

type EventHandler = (data: unknown) => void

export const Events = {
  CHARACTER_DELETED: 'character:deleted',
  CHARACTER_UPDATED: 'character:updated',
  CHARACTER_CREATED: 'character:created',
  
  REALM_BREAKTHROUGH: 'realm:breakthrough',
  POWER_LEVEL_CHANGED: 'power:level-changed',
  
  TIMELINE_CONFLICT: 'timeline:conflict',
  TIMELINE_UPDATED: 'timeline:updated',
  
  FORESHADOWING_CREATED: 'foreshadowing:created',
  FORESHADOWING_REDEEMED: 'foreshadowing:redeemed',
  FORESHADOWING_ORPHANED: 'foreshadowing:orphaned',
  
  CHAPTER_SAVED: 'chapter:saved',
  CHAPTER_DELETED: 'chapter:deleted',
  CHAPTER_PUBLISHED: 'chapter:published',
  
  DRAFT_CREATED: 'draft:created',
  DRAFT_UPDATED: 'draft:updated',
  DRAFT_PUBLISHED: 'draft:published',
  
  KNOWLEDGE_ENTRY_CREATED: 'knowledge:entry-created',
  KNOWLEDGE_ENTRY_UPDATED: 'knowledge:entry-updated',
  KNOWLEDGE_ENTRY_DELETED: 'knowledge:entry-deleted',
  
  RULE_VIOLATION: 'rule:violation',
  CONSISTENCY_CHECK: 'consistency:check',
  
  PROJECT_EXPORTED: 'project:exported',
  PROJECT_BACKUP_CREATED: 'project:backup-created',
} as const

export type EventName = typeof Events[keyof typeof Events]

class EventBusClass {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  emit(event: EventName, data?: unknown): void {
    const handlers = this.handlers.get(event)
    if (!handlers || handlers.size === 0) {
      return
    }

    log.debug(`[EventBus] Emitting: ${event}`)
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        log.error(`[EventBus] Handler error for ${event}:`, error)
      }
    })
  }

  on(event: EventName, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    
    this.handlers.get(event)!.add(handler)
    log.debug(`[EventBus] Registered handler for: ${event}`)
    
    return () => this.off(event, handler)
  }

  off(event: EventName, handler: EventHandler): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler)
      log.debug(`[EventBus] Removed handler for: ${event}`)
    }
  }

  once(event: EventName, handler: EventHandler): void {
    const wrappedHandler = (data: unknown) => {
      handler(data)
      this.off(event, wrappedHandler)
    }
    this.on(event, wrappedHandler)
  }

  clear(event?: EventName): void {
    if (event) {
      this.handlers.delete(event)
    } else {
      this.handlers.clear()
    }
  }

  getHandlerCount(event: EventName): number {
    return this.handlers.get(event)?.size ?? 0
  }

  hasHandlers(event: EventName): boolean {
    return this.getHandlerCount(event) > 0
  }
}

export const EventBus = new EventBusClass()
