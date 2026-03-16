import { syncQueueDB } from './indexeddb'
import { sheetsAPI } from './sheets'
import { generateId } from '../utils/helpers'

const SYNC_INTERVAL = 30_000
let timer    = null
let syncing  = false
let listenersAdded = false

const PK_MAP = {
  groups:        'group_id',
  members:       'member_id',
  sessions:      'session_id',
  attendance:    'attendance_id',
  stats_history: 'stat_id',
}

export async function enqueue(op, table, payload) {
  await syncQueueDB.add({
    queue_id:   generateId('Q'),
    op,
    table,
    record_id:  payload[PK_MAP[table]],
    group_id:   payload.group_id ?? null,
    payload,
    status:     'pending',
    retries:    0,
    created_at: new Date().toISOString(),
    synced_at:  null,
  })
  if (navigator.onLine) runSync()
}

export async function runSync() {
  if (syncing || !navigator.onLine || !sheetsAPI.isConfigured()) return
  syncing = true
  try {
    const pending = await syncQueueDB.getPending()
    for (const item of pending) {
      await syncQueueDB.update(item.queue_id, { status: 'syncing' })
      try {
        if (item.op === 'upsert') await sheetsAPI.upsertRow(item.table, item.payload)
        if (item.op === 'delete') await sheetsAPI.deleteRow(item.table, item.record_id)
        await syncQueueDB.update(item.queue_id, {
          status: 'done', synced_at: new Date().toISOString()
        })
      } catch {
        const retries = (item.retries ?? 0) + 1
        await syncQueueDB.update(item.queue_id, {
          status: retries >= 3 ? 'failed' : 'pending',
          retries
        })
      }
    }
  } finally {
    syncing = false
  }
}

export function initSync() {
  if (listenersAdded) return
  listenersAdded = true
  window.addEventListener('online', () => {
    runSync()
    timer = setInterval(runSync, SYNC_INTERVAL)
  })
  window.addEventListener('offline', () => {
    clearInterval(timer)
    timer = null
  })
  if (navigator.onLine) {
    runSync()
    timer = setInterval(runSync, SYNC_INTERVAL)
  }
}
