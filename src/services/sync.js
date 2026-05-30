/**
 * Offline-first sync queue.
 *
 * Operations are queued in memory and localStorage,
 * then flushed to the server when online.
 * On conflict, the last-write wins.
 */

import { storage } from './storage'

const QUEUE_KEY = 'sync-queue'
const MAX_RETRIES = 3
const FLUSH_DEBOUNCE_MS = 800

let queue = storage.get(QUEUE_KEY, [])
let flushTimer = null
let notifyFn = null    // (notification: { type, message }) => void
let isFlushing = false

/** Register a UI notification callback (e.g. toast) */
export function setSyncNotifier(fn) {
  notifyFn = fn
}

function notify(type, message) {
  notifyFn?.({ type, message })
}

function persistQueue() {
  storage.set(QUEUE_KEY, queue)
}

/** Enqueue a write operation and trigger debounced flush */
export function enqueue(op) {
  // Replace existing op with same name (last-write-wins)
  queue = queue.filter(q => q.name !== op.name)
  queue.push({ ...op, retries: 0, ts: Date.now() })
  persistQueue()
  scheduleFlush()
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(flush, FLUSH_DEBOUNCE_MS)
}

async function flush() {
  if (isFlushing || queue.length === 0) return
  isFlushing = true

  const ops = [...queue]
  for (const op of ops) {
    try {
      await op.fn()
      queue = queue.filter(q => q.name !== op.name)
      persistQueue()
      notify('sync-ok', `Guardado: ${op.name}`)
    } catch (err) {
      op.retries = (op.retries || 0) + 1
      if (op.retries >= MAX_RETRIES) {
        queue = queue.filter(q => q.name !== op.name)
        persistQueue()
        notify('sync-error', `Error guardando: ${op.name}`)
      } else {
        // Back-off retry
        scheduleFlush()
      }
    }
  }

  isFlushing = false
}

/** Force immediate flush (e.g. on page unload) */
export function flushNow() {
  if (flushTimer) clearTimeout(flushTimer)
  return flush()
}

export const syncQueue = { enqueue, flushNow, scheduleFlush }
