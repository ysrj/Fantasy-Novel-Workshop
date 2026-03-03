import { describe, it, expect, beforeEach } from '@jest/globals'
import { EventBus, Events } from '../../../../main/infrastructure/events/EventBus'

describe('EventBus', () => {
  beforeEach(() => {
    EventBus.clear()
  })

  describe('Basic Operations', () => {
    it('should register and emit events', () => {
      const handler = jest.fn()
      EventBus.on(Events.CHARACTER_DELETED, handler)
      
      EventBus.emit(Events.CHARACTER_DELETED, { id: 'test-id' })
      
      expect(handler).toHaveBeenCalledWith({ id: 'test-id' })
    })

    it('should allow multiple handlers for same event', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()
      
      EventBus.on(Events.CHARACTER_DELETED, handler1)
      EventBus.on(Events.CHARACTER_DELETED, handler2)
      
      EventBus.emit(Events.CHARACTER_DELETED, { id: 'test' })
      
      expect(handler1).toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should remove handlers', () => {
      const handler = jest.fn()
      const remove = EventBus.on(Events.CHARACTER_DELETED, handler)
      remove()
      
      EventBus.emit(Events.CHARACTER_DELETED, {})
      
      expect(handler).not.toHaveBeenCalled()
    })

    it('should support once handlers', () => {
      const handler = jest.fn()
      EventBus.once(Events.CHARACTER_DELETED, handler)
      
      EventBus.emit(Events.CHARACTER_DELETED, {})
      EventBus.emit(Events.CHARACTER_DELETED, {})
      
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('Event Information', () => {
    it('should return handler count', () => {
      const handler = jest.fn()
      expect(EventBus.getHandlerCount(Events.CHARACTER_DELETED)).toBe(0)
      
      EventBus.on(Events.CHARACTER_DELETED, handler)
      expect(EventBus.getHandlerCount(Events.CHARACTER_DELETED)).toBe(1)
    })

    it('should check if handlers exist', () => {
      const handler = jest.fn()
      expect(EventBus.hasHandlers(Events.CHARACTER_DELETED)).toBe(false)
      
      EventBus.on(Events.CHARACTER_DELETED, handler)
      expect(EventBus.hasHandlers(Events.CHARACTER_DELETED)).toBe(true)
    })

    it('should clear specific or all handlers', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()
      
      EventBus.on(Events.CHARACTER_DELETED, handler1)
      EventBus.on(Events.CHARACTER_UPDATED, handler2)
      
      EventBus.clear(Events.CHARACTER_DELETED)
      expect(EventBus.hasHandlers(Events.CHARACTER_DELETED)).toBe(false)
      expect(EventBus.hasHandlers(Events.CHARACTER_UPDATED)).toBe(true)
      
      EventBus.clear()
      expect(EventBus.hasHandlers(Events.CHARACTER_UPDATED)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle handler errors gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error')
      })
      const normalHandler = jest.fn()
      
      EventBus.on(Events.CHARACTER_DELETED, errorHandler)
      EventBus.on(Events.CHARACTER_DELETED, normalHandler)
      
      expect(() => {
        EventBus.emit(Events.CHARACTER_DELETED, {})
      }).not.toThrow()
      
      expect(normalHandler).toHaveBeenCalled()
    })
  })
})
