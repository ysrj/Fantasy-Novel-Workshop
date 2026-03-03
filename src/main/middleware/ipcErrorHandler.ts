import log from 'electron-log'

export interface IpcError {
  code: string
  message: string
  details?: unknown
}

export function createIpcError(code: string, message: string, details?: unknown): IpcError {
  return { code, message, details }
}

export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>,
  channel: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log.error(`[IPC] ${channel} error:`, errorMessage)
      throw createIpcError('IPC_ERROR', errorMessage, { channel, args })
    }
  }
}

export function withErrorHandlingSync<T extends unknown[], R>(
  handler: (...args: T) => R,
  channel: string
): (...args: T) => R {
  return (...args: T): R => {
    try {
      return handler(...args)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log.error(`[IPC] ${channel} error:`, errorMessage)
      throw createIpcError('IPC_ERROR', errorMessage, { channel, args })
    }
  }
}

export function wrapIpcHandlers(handlers: Record<string, (...args: unknown[]) => unknown>): Record<string, (...args: unknown[]) => unknown> {
  const wrapped: Record<string, (...args: unknown[]) => unknown> = {}
  
  for (const [channel, handler] of Object.entries(handlers)) {
    wrapped[channel] = withErrorHandling(handler as (...args: unknown[]) => Promise<unknown>, channel)
  }
  
  return wrapped
}

export function logIpcCall(channel: string, ...args: unknown[]): void {
  const sanitizedArgs = args.map(arg => {
    if (arg && typeof arg === 'object' && 'password' in arg) {
      return { ...arg, password: '***' }
    }
    return arg
  })
  log.debug(`[IPC] ${channel}`, sanitizedArgs)
}
