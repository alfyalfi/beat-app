import { getToken } from './auth'

const API_KEY     = import.meta.env.VITE_SHEETS_API_KEY  || ''
const SPREADSHEET = import.meta.env.VITE_SPREADSHEET_ID  || ''
const BASE        = 'https://sheets.googleapis.com/v4/spreadsheets'

const COLUMNS = {
  groups: [
    'group_id','group_name','description','is_active','created_at','updated_at'
  ],
  members: [
    'member_id','group_id','name','instrument','jabatan','angkatan',
    'status','joined_at','notes','created_at','updated_at'
  ],
  sessions: [
    'session_id','group_id','session_date','title','notes',
    'created_by','created_at','status'
  ],
  attendance: [
    'attendance_id','group_id','session_id','member_id',
    'status','note','recorded_at'
  ],
  stats_history: [
    'stat_id','group_id','session_id','member_id','session_date',
    'loyalitas','skill','kreativitas','attitude','synergy',
    'evaluator_note','recorded_at'
  ],
}

const STATS_SCORE_KEYS = new Set(['loyalitas','skill','kreativitas','attitude','synergy'])

function recordToRow(table, obj) {
  return COLUMNS[table].map(col => {
    if (table === 'stats_history' && STATS_SCORE_KEYS.has(col)) {
      return obj.scores?.[col] ?? obj[col] ?? ''
    }
    const v = obj[col]
    if (v === undefined || v === null) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  })
}

function rowToRecord(table, row) {
  const obj = {}
  COLUMNS[table].forEach((col, i) => { obj[col] = row[i] ?? '' })
  if (table === 'stats_history') {
    obj.scores = {
      loyalitas:   Number(obj.loyalitas)   || 0,
      skill:       Number(obj.skill)       || 0,
      kreativitas: Number(obj.kreativitas) || 0,
      attitude:    Number(obj.attitude)    || 0,
      synergy:     Number(obj.synergy)     || 0,
    }
  }
  return obj
}

function authHeaders() {
  const token = getToken()
  if (!token) throw new Error('Belum login Google. Silakan login dulu.')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

// ── Read ──────────────────────────────────────────────────────
async function getRows(sheet) {
  if (!isConfigured()) return []
  const url = `${BASE}/${SPREADSHEET}/values/${sheet}!A2:Z?key=${API_KEY}`
  const res  = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Sheets read error ${res.status}: ${err.error?.message || ''}`)
  }
  const data = await res.json()
  return (data.values ?? []).map(row => rowToRecord(sheet, row))
}

// ── Append (baris baru) ───────────────────────────────────────
async function appendRow(sheet, obj) {
  const url = `${BASE}/${SPREADSHEET}/values/${sheet}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ values: [recordToRow(sheet, obj)] }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Sheets append error ${res.status}: ${err.error?.message || ''}`)
  }
}

// ── Update (baris existing) ────────────────────────────────────
async function updateRow(sheet, obj) {
  const pkCol  = COLUMNS[sheet][0]
  const rows   = await getRows(sheet)
  const idx    = rows.findIndex(r => r[pkCol] === obj[pkCol])
  if (idx === -1) { await appendRow(sheet, obj); return }
  const rowNum = idx + 2
  const range  = `${sheet}!A${rowNum}`
  const url    = `${BASE}/${SPREADSHEET}/values/${range}?valueInputOption=RAW`
  const res    = await fetch(url, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ values: [recordToRow(sheet, obj)] }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Sheets update error ${res.status}: ${err.error?.message || ''}`)
  }
}

// ── Delete (tandai kosong di kolom deleted_at) ─────────────────
async function deleteRow(sheet, pkValue) {
  const rows   = await getRows(sheet)
  const pkCol  = COLUMNS[sheet][0]
  const idx    = rows.findIndex(r => r[pkCol] === pkValue)
  if (idx === -1) return
  // Hapus baris dengan batchUpdate DeleteDimension
  const rowIdx = idx + 1 // 0-indexed, +1 karena header
  const url    = `${BASE}/${SPREADSHEET}:batchUpdate`
  await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      requests: [{
        deleteDimension: {
          range: {
            sheetId:    await getSheetId(sheet),
            dimension:  'ROWS',
            startIndex: rowIdx,
            endIndex:   rowIdx + 1,
          }
        }
      }]
    }),
  })
}

// ── Ambil sheetId numerik dari nama tab ───────────────────────
const sheetIdCache = {}
async function getSheetId(sheetName) {
  if (sheetIdCache[sheetName]) return sheetIdCache[sheetName]
  const url = `${BASE}/${SPREADSHEET}?fields=sheets.properties&key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  data.sheets?.forEach(s => {
    sheetIdCache[s.properties.title] = s.properties.sheetId
  })
  return sheetIdCache[sheetName] ?? 0
}

// ── Inisialisasi header di semua sheet (jalankan sekali) ───────
export async function initSheetHeaders() {
  for (const [sheet, cols] of Object.entries(COLUMNS)) {
    const url = `${BASE}/${SPREADSHEET}/values/${sheet}!A1:${String.fromCharCode(65 + cols.length - 1)}1?key=${API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    const existing = data.values?.[0] ?? []
    // Jika header kosong, isi
    if (existing.length === 0) {
      const writeUrl = `${BASE}/${SPREADSHEET}/values/${sheet}!A1?valueInputOption=RAW`
      await fetch(writeUrl, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ values: [cols] }),
      })
    }
  }
}

function isConfigured() {
  return !!(API_KEY && SPREADSHEET)
}

export const sheetsAPI = {
  getRows,
  upsertRow: async (sheet, obj) => {
    const pkCol  = COLUMNS[sheet][0]
    const rows   = await getRows(sheet)
    const exists = rows.some(r => r[pkCol] === obj[pkCol])
    if (exists) await updateRow(sheet, obj)
    else        await appendRow(sheet, obj)
  },
  deleteRow,
  initHeaders: initSheetHeaders,
  isConfigured,
}
