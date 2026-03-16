import * as XLSX from 'xlsx'
import { db, membersDB, sessionsDB, attendanceDB, statsDB, groupsDB } from './indexeddb'
import { generateId, downloadBlob, dateStamp } from '../utils/helpers'

export async function importMembersFromExcel(file, group_id) {
  const buffer = await file.arrayBuffer()
  const wb     = XLSX.read(buffer)
  const rows   = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
  if (!rows.length) throw new Error('File kosong')

  const required = ['name', 'instrument']
  const missing  = required.filter(k => !rows[0]?.[k])
  if (missing.length) throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(', ')}`)

  const now = new Date().toISOString()
  return rows.map(row => ({
    member_id:  generateId('MBR'),
    group_id,
    name:       String(row.name || '').trim(),
    instrument: String(row.instrument || '').trim(),
    angkatan:   String(row.angkatan || '').trim(),
    jabatan:    String(row.jabatan || 'Anggota').trim(),
    status:     'active',
    joined_at:  now.split('T')[0],
    notes:      String(row.notes || '').trim(),
    created_at: now,
    updated_at: now,
  }))
}

export async function exportGroupToExcel(group_id, group_name) {
  const [members, sessions, attendance, stats] = await Promise.all([
    membersDB.getByGroup(group_id),
    sessionsDB.getByGroup(group_id),
    db.attendance.where('group_id').equals(group_id).toArray(),
    db.stats_history.where('group_id').equals(group_id).toArray(),
  ])

  const wb = XLSX.utils.book_new()
  const sheets = { members, sessions, attendance, stats_history: stats }

  Object.entries(sheets).forEach(([name, data]) => {
    if (data.length) {
      // Flatten scores object for stats
      const flat = data.map(r => {
        if (r.scores) return { ...r, ...r.scores, scores: undefined }
        return r
      })
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flat), name)
    }
  })

  XLSX.writeFile(wb, `BEAT_${group_name}_${dateStamp()}.xlsx`)
}

export async function createBackup(group_id) {
  const [groups, members, sessions, attendance, stats] = await Promise.all([
    groupsDB.getAll().then(gs => gs.filter(g => g.group_id === group_id)),
    membersDB.getByGroup(group_id),
    sessionsDB.getByGroup(group_id),
    db.attendance.where('group_id').equals(group_id).toArray(),
    db.stats_history.where('group_id').equals(group_id).toArray(),
  ])

  const backup = {
    version:     '1.0',
    group_id,
    exported_at: new Date().toISOString(),
    data: { groups, members, sessions, attendance, stats_history: stats }
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `BEAT_backup_${group_id}_${dateStamp()}.json`)
}

export async function restoreBackup(file) {
  const text   = await file.text()
  const backup = JSON.parse(text)
  if (!backup.version || !backup.data) throw new Error('Format backup tidak valid')

  const tableMap = {
    groups:        db.groups,
    members:       db.members,
    sessions:      db.sessions,
    attendance:    db.attendance,
    stats_history: db.stats_history,
  }

  await db.transaction('rw', Object.values(tableMap), async () => {
    for (const [table, rows] of Object.entries(backup.data)) {
      if (rows?.length && tableMap[table]) {
        await tableMap[table].bulkPut(rows)
      }
    }
  })

  return backup.group_id
}
