import Dexie from 'dexie'

export const db = new Dexie('BeatDB')

db.version(1).stores({
  groups:        'group_id, is_active',
  members:       'member_id, group_id, status',
  sessions:      'session_id, group_id, session_date, status',
  attendance:    'attendance_id, group_id, session_id, member_id',
  stats_history: 'stat_id, group_id, member_id, session_id, session_date',
  sync_queue:    'queue_id, status, created_at',
})

// ── Groups ──────────────────────────────────────────────
export const groupsDB = {
  getAll: () => db.groups.toArray(),
  get: (id) => db.groups.get(id),
  put: (g)  => db.groups.put(g),
  delete: (id) => db.groups.delete(id),
}

// ── Members ─────────────────────────────────────────────
export const membersDB = {
  getByGroup: (gid) =>
    db.members.where('group_id').equals(gid).toArray(),
  getActiveByGroup: (gid) =>
    db.members.where('group_id').equals(gid)
      .filter(m => m.status === 'active').toArray(),
  get: (id) => db.members.get(id),
  put: (m)  => db.members.put(m),
  delete: (id) => db.members.delete(id),
}

// ── Sessions ────────────────────────────────────────────
export const sessionsDB = {
  getByGroup: (gid) =>
    db.sessions.where('group_id').equals(gid)
      .toArray()
      .then(rows => rows.sort((a, b) => b.session_date.localeCompare(a.session_date))),
  get: (id) => db.sessions.get(id),
  put: (s)  => db.sessions.put(s),
  delete: (id) => db.sessions.delete(id),
}

// ── Attendance ──────────────────────────────────────────
export const attendanceDB = {
  getBySession: (sid, gid) =>
    db.attendance
      .where('session_id').equals(sid)
      .filter(a => a.group_id === gid)
      .toArray(),
  getByMember: (mid, gid) =>
    db.attendance
      .where('member_id').equals(mid)
      .filter(a => a.group_id === gid)
      .toArray(),
  put: (a)  => db.attendance.put(a),
  bulkPut: (arr) => db.attendance.bulkPut(arr),
  delete: (id) => db.attendance.delete(id),
}

// ── Stats History ────────────────────────────────────────
export const statsDB = {
  getByMember: (mid, gid) =>
    db.stats_history
      .where('member_id').equals(mid)
      .filter(s => s.group_id === gid)
      .toArray()
      .then(rows => rows.sort((a,b) => a.session_date.localeCompare(b.session_date))),
  getLatest: async (mid, gid) => {
    const rows = await db.stats_history
      .where('member_id').equals(mid)
      .filter(s => s.group_id === gid)
      .toArray()
    rows.sort((a,b) => b.session_date.localeCompare(a.session_date))
    return rows[0] ?? null
  },
  getBySession: (session_id, member_id) =>
    db.stats_history
      .where('stat_id').equals(`STAT_${session_id}_${member_id}`)
      .first(),
  put: (s) => db.stats_history.put(s),
  delete: (id) => db.stats_history.delete(id),
}

// ── Sync Queue ───────────────────────────────────────────
export const syncQueueDB = {
  getPending: () =>
    db.sync_queue
      .where('status').anyOf(['pending','failed'])
      .toArray()
      .then(rows => rows
        .filter(r => (r.retries ?? 0) < 3)
        .sort((a,b) => a.created_at.localeCompare(b.created_at))
      ),
  add: (item) => db.sync_queue.add(item),
  update: (id, changes) => db.sync_queue.update(id, changes),
  countPending: () =>
    db.sync_queue.where('status').anyOf(['pending']).count(),
}
