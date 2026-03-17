import { db, syncQueueDB, groupsDB, membersDB, sessionsDB, attendanceDB, statsDB } from './indexeddb'
import { sheetsAPI } from './sheets'
import { generateId } from '../utils/helpers'

const SYNC_INTERVAL = 15_000   // 15 detik — lebih responsif
let timer          = null
let syncing        = false
let listenersAdded = false

const PK_MAP = {
  groups:        'group_id',
  members:       'member_id',
  sessions:      'session_id',
  attendance:    'attendance_id',
  stats_history: 'stat_id',
}

// ── Enqueue perubahan baru ────────────────────────────────────
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

// ── Proses queue → kirim ke Sheets ───────────────────────────
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
      } catch (e) {
        const retries = (item.retries ?? 0) + 1
        await syncQueueDB.update(item.queue_id, {
          status: retries >= 3 ? 'failed' : 'pending',
          retries,
        })
      }
    }
  } finally {
    syncing = false
  }
}

// ── PUSH SEMUA: kirim seluruh IndexedDB ke Sheets ─────────────
// Dipakai saat pertama kali login atau ingin force sync
export async function pushAllToSheets(onProgress) {
  if (!sheetsAPI.isConfigured()) throw new Error('Sheets belum dikonfigurasi')
  if (!navigator.onLine) throw new Error('Tidak ada koneksi internet')

  const tables = [
    { name: 'groups',        getData: () => groupsDB.getAll() },
    { name: 'members',       getData: () => db.members.toArray() },
    { name: 'sessions',      getData: () => db.sessions.toArray() },
    { name: 'attendance',    getData: () => db.attendance.toArray() },
    { name: 'stats_history', getData: () => db.stats_history.toArray() },
  ]

  let done = 0
  const total = tables.length

  for (const { name, getData } of tables) {
    onProgress?.({ table: name, done, total })
    const rows = await getData()
    for (const row of rows) {
      await sheetsAPI.upsertRow(name, row)
    }
    done++
  }
  onProgress?.({ table: 'selesai', done: total, total })
}

// ── PULL SEMUA: ambil data dari Sheets → simpan ke IndexedDB ──
// Dipakai saat buka di device baru (HP)
export async function pullFromSheets(onProgress) {
  if (!sheetsAPI.isConfigured()) throw new Error('Sheets belum dikonfigurasi')
  if (!navigator.onLine) throw new Error('Tidak ada koneksi internet')

  const tables = [
    { name: 'groups',        store: db.groups },
    { name: 'members',       store: db.members },
    { name: 'sessions',      store: db.sessions },
    { name: 'attendance',    store: db.attendance },
    { name: 'stats_history', store: db.stats_history },
  ]

  let done = 0
  const total = tables.length

  for (const { name, store } of tables) {
    onProgress?.({ table: name, done, total })
    try {
      const rows = await sheetsAPI.getRows(name)
      if (rows.length > 0) {
        await store.bulkPut(rows)
      }
    } catch (e) {
      console.warn(`Pull ${name} failed:`, e.message)
    }
    done++
  }
  onProgress?.({ table: 'selesai', done: total, total })
}

// ── Init listeners ────────────────────────────────────────────
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
  // Sync saat tab kembali aktif (pindah tab → kembali)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      runSync()
    }
  })
  if (navigator.onLine) {
    runSync()
    timer = setInterval(runSync, SYNC_INTERVAL)
  }
}
