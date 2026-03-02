import { useRef, useCallback, useEffect } from 'react'
import type { WorkerMessage, WorkerResponse } from '../../shared/types'

export function useWorker() {
  const workerRef = useRef<Worker | null>(null)
  const callbacksRef = useRef<Map<string, (response: WorkerResponse) => void>>(new Map())

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/compute.worker.ts', import.meta.url),
      { type: 'module' }
    )

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { requestId } = e.data
      if (requestId && callbacksRef.current.has(requestId)) {
        const callback = callbacksRef.current.get(requestId)
        if (callback) callback(e.data)
        callbacksRef.current.delete(requestId)
      }
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const postMessage = useCallback(<T = any>(
    type: WorkerMessage['type'],
    payload: any,
    callback?: (response: WorkerResponse) => void
  ): Promise<T | null> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve(null)
        return
      }

      const requestId = crypto.randomUUID()
      
      if (callback) {
        callbacksRef.current.set(requestId, callback)
      }

      workerRef.current.postMessage({ type, payload, requestId })

      if (callback) {
        const handler = (e: MessageEvent<WorkerResponse>) => {
          if (e.data.requestId === requestId) {
            resolve(e.data.data as T)
            callbacksRef.current.delete(requestId)
            workerRef.current?.removeEventListener('message', handler)
          }
        }
        workerRef.current.addEventListener('message', handler)
      } else {
        resolve(null)
      }
    })
  }, [])

  const getWordCount = useCallback((content: string) => {
    return postMessage<{ wordCount: number; charCount: number; lineCount: number }>(
      'stats',
      { content, type: 'wordCount' }
    )
  }, [postMessage])

  const getWordFrequency = useCallback((content: string) => {
    return postMessage<[string, number][]>(
      'stats',
      { content, type: 'frequency' }
    )
  }, [postMessage])

  const analyzeRelationships = useCallback((characters: any[], chapters: any[]) => {
    return postMessage(
      'relationship',
      { characters, chapters }
    )
  }, [postMessage])

  const searchContent = useCallback((content: string, query: string) => {
    return postMessage(
      'search',
      { content, query }
    )
  }, [postMessage])

  return {
    postMessage,
    getWordCount,
    getWordFrequency,
    analyzeRelationships,
    searchContent
  }
}
