import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Users, TrendingUp, ChevronRight, Zap } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { membersDB, sessionsDB, attendanceDB } from '../services/indexeddb'
import { Card, SectionTitle, EmptyState } from '../components/ui'
import { formatDate } from '../utils/helpers'
import { ATTENDANCE_STATUS } from '../utils/constants'

export default function Dashboard() {
  const { activeGroup } = useGroup()
  const [stats,  setStats]  = useState(null)
  const [recent, setRecent] = useState([])

  useEffect(() => {
    if (!activeGroup) return
    const gid = activeGroup.group_id
    Promise.all([
      membersDB.getByGroup(gid),
      sessionsDB.getByGroup(gid),
    ]).then(async ([members, sessions]) => {
      const lastSession = sessions[0]
      let attendanceSummary = null
      if (lastSession) {
        const att = await attendanceDB.getBySession(lastSession.session_id, gid)
        const counts = {}
        ATTENDANCE_STATUS.forEach(s => { counts[s.key] = 0 })
        att.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })
        attendanceSummary = { session: lastSession, counts, total: att.length }
      }
      setStats({
        totalMembers:   members.length,
        activeMembers:  members.filter(m => m.status === 'active').length,
        totalSessions:  sessions.length,
        lastAttendance: attendanceSummary,
      })
      setRecent(sessions.slice(0, 4))
    })
  }, [activeGroup])

  if (!activeGroup) {
    return (
      <div className="px-4 pt-12 pb-24 max-w-2xl mx-auto flex flex-col items-center gap-4 text-center">
        <div className="w-20 h-20 rounded-full card-glass flex items-center justify-center mb-2"
          style={{ boxShadow: '0 0 30px rgba(0,229,255,0.15)' }}>
          <Zap size={36} className="text-beat-cyan" style={{ filter: 'drop-shadow(0 0 8px #00e5ff)' }}/>
        </div>
        <h2 className="font-display text-beat-cyan text-lg neon-text-cyan">Mentor</h2>
        <p className="text-beat-sub font-body text-sm">Buat grup pertamamu di menu <span className="text-beat-cyan">Kelola</span></p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto space-y-5 animate-fade-in">

      {/* Hero card */}
      <div className="card-glass rounded-2xl p-5 overflow-hidden relative"
        style={{ boxShadow: '0 0 40px rgba(0,229,255,0.06), inset 0 1px 0 rgba(0,229,255,0.08)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)' }}/>
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,230,0,0.05) 0%, transparent 70%)' }}/>
        <p className="text-[10px] font-display text-beat-cyan uppercase tracking-[0.2em] mb-1 opacity-70">Grup Aktif</p>
        <h1 className="font-display font-bold text-beat-yellow text-lg leading-tight neon-text-yellow">
          {activeGroup.group_name}
        </h1>
        {activeGroup.description && (
          <p className="text-beat-sub text-xs font-body mt-1">{activeGroup.description}</p>
        )}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: 'Anggota Aktif', val: stats.activeMembers,  color: '#00e5ff' },
              { label: 'Total Sesi',    val: stats.totalSessions,   color: '#ffe600' },
              { label: 'Alumni',        val: stats.totalMembers - stats.activeMembers, color: '#b56aff' },
            ].map(s => (
              <div key={s.label} className="bg-beat-surface/50 rounded-xl p-3 text-center border border-beat-border">
                <div className="text-2xl font-display font-bold" style={{ color: s.color, textShadow: `0 0 12px ${s.color}60` }}>
                  {s.val}
                </div>
                <div className="text-[10px] font-body text-beat-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last attendance */}
      {stats?.lastAttendance && (
        <div>
          <SectionTitle>Sesi Terakhir</SectionTitle>
          <Card className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-body text-sm text-beat-text font-medium">
                  {stats.lastAttendance.session.title}
                </p>
                <p className="font-body text-xs text-beat-muted">
                  {formatDate(stats.lastAttendance.session.session_date)}
                </p>
              </div>
              <Link to={`/sessions/${stats.lastAttendance.session.session_id}`}
                className="text-xs text-beat-cyan font-body flex items-center gap-0.5 hover:neon-text-cyan">
                Detail <ChevronRight size={12}/>
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Hadir', val: stats.lastAttendance.counts.hadir,  color: '#00e5ff' },
                { label: 'Izin',  val: stats.lastAttendance.counts.izin,   color: '#ffe600' },
                { label: 'Sakit', val: stats.lastAttendance.counts.sakit,  color: '#b56aff' },
                { label: 'Alpha', val: stats.lastAttendance.counts.alpha,  color: '#ff4d6d' },
              ].map(s => (
                <div key={s.label} className="bg-beat-surface rounded-lg p-2 text-center border border-beat-border">
                  <div className="text-lg font-display font-bold" style={{ color: s.color, textShadow: `0 0 10px ${s.color}60` }}>
                    {s.val}
                  </div>
                  <div className="text-[10px] font-body text-beat-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <SectionTitle>Aksi Cepat</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: '/sessions', icon: ClipboardList, label: 'Sesi Baru', color: '#00e5ff', glow: 'rgba(0,229,255,0.2)' },
            { to: '/members',  icon: Users,         label: 'Anggota',   color: '#ffe600', glow: 'rgba(255,230,0,0.2)'  },
            { to: '/stats',    icon: TrendingUp,    label: 'Stats',     color: '#b56aff', glow: 'rgba(181,106,255,0.2)'},
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="card-glass rounded-xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-all active:scale-95"
              style={{ '--hover-glow': a.glow }}>
              <a.icon size={22} style={{ color: a.color, filter: `drop-shadow(0 0 6px ${a.color})` }}/>
              <span className="text-xs font-body text-beat-sub">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div>
          <SectionTitle>Riwayat Sesi</SectionTitle>
          <div className="space-y-2">
            {recent.map(s => (
              <Link key={s.session_id} to={`/sessions/${s.session_id}`}
                className="flex items-center justify-between card-glass rounded-xl px-4 py-3 hover:border-beat-cyan/25 transition-all">
                <div>
                  <p className="text-sm font-body text-beat-text font-medium">{s.title}</p>
                  <p className="text-xs font-body text-beat-muted">{formatDate(s.session_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] border rounded px-1.5 py-0.5 font-body ${
                    s.status === 'open'
                      ? 'text-beat-cyan border-beat-cyan/30 bg-beat-cyan/5'
                      : 'text-beat-muted border-beat-border'
                  }`}>
                    {s.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                  <ChevronRight size={13} className="text-beat-muted"/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
