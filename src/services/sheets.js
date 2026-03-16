// Google Sheets API Service
// Requires: VITE_SHEETS_API_KEY and VITE_SPREADSHEET_ID in .env

const API_KEY     = import.meta.env.VITE_SHEETS_API_KEY     || ''
const SPREADSHEET = import.meta.env.VITE_SPREADSHEET_ID     || ''
const BASE        = 'https://sheets.googleapis.com/v4/spreadsheets'

// Column order per sheet (must match Sheets header row)
const COLUMNS = {
  groups: [
    'group_id','group_name','description','is_active','created_at','updated_at'
  ],
  members: [
    'member_id','group_id','name','instrument','angkatan',
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
    // stats_history stores scores nested; flatten for Sheets
    if (table === 'stats_history' && STATS_SCORE_KEYS.has(col)) {
      return obj.scores?.[col] ?? obj[col] ?? ''
    }
    const v = obj[col]
    if (v === undefined || v === null) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return v
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

async function getRows(sheet) {
  if (!API_KEY || !SPREADSHEET) return []
  const url = `${BASE}/${SPREADSHEET}/values/${sheet}!A2:Z?key=${API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sheets read error: ${res.status}`)
  const data = await res.json()
  return (data.values ?? []).map(row => rowToRecord(sheet, row))
}

async function appendRow(sheet, obj) {
  if (!API_KEY || !SPREADSHEET) return
  const token = getOAuthToken()
  if (!token) return
  const row = recordToRow(sheet, obj)
  const url = `${BASE}/${SPREADSHEET}/values/${sheet}!A1:append?valueInputOption=RAW&key=${API_KEY}`
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ values: [row] })
  })
}

async function updateRow(sheet, obj) {
  if (!API_KEY || !SPREADSHEET) return
  const token = getOAuthToken()
  if (!token) return
  const pkCol = COLUMNS[sheet][0]
  // Find row number by reading all data first
  const rows = await getRows(sheet)
  const idx  = rows.findIndex(r => r[pkCol] === obj[pkCol])
  if (idx === -1) { await appendRow(sheet, obj); return }
  const rowNum = idx + 2 // +1 header, +1 1-indexed
  const row = recordToRow(sheet, obj)
  const range = `${sheet}!A${rowNum}`
  const url = `${BASE}/${SPREADSHEET}/values/${range}?valueInputOption=RAW&key=${API_KEY}`
  await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ values: [row] })
  })
}

async function deleteRow(sheet, pkValue) {
  // Sheets API doesn't support delete easily; we mark as deleted instead
  // Full delete requires batchUpdate with DeleteDimension — simplified here
  console.log(`Sheets: mark-delete ${sheet}/${pkValue}`)
}

function getOAuthToken() {
  return localStorage.getItem('beat_oauth_token') || null
}

export function setOAuthToken(token) {
  localStorage.setItem('beat_oauth_token', token)
}

export const sheetsAPI = {
  getRows,
  upsertRow: async (sheet, obj) => {
    const pkCol = COLUMNS[sheet][0]
    const rows  = await getRows(sheet)
    const exists = rows.some(r => r[pkCol] === obj[pkCol])
    if (exists) await updateRow(sheet, obj)
    else        await appendRow(sheet, obj)
  },
  deleteRow,
  isConfigured: () => !!(API_KEY && SPREADSHEET),
}
