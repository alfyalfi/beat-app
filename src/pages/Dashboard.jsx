import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Users, TrendingUp, ChevronRight, Music } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { membersDB, sessionsDB, attendanceDB } from '../services/indexeddb'
import { Card, SectionTitle, EmptyState } from '../components/ui'
import { formatDate } from '../utils/helpers'
import { ATTENDANCE_STATUS } from '../utils/constants'

export default function Dashboard() {
  const { activeGroup } = useGroup()
  const [stats, setStats]   = useState(null)
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
        totalMembers:  members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        totalSessions: sessions.length,
        lastAttendance: attendanceSummary,
      })
      setRecent(sessions.slice(0, 4))
    })
  }, [activeGroup])

  if (!activeGroup) {
    return (
      <EmptyState icon="🎸"
        title="Belum ada grup"
        subtitle="Buat grup pertamamu di menu Kelola untuk mulai mencatat latihan."/>
    )
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Hero */}
      <div className="rounded-2xl bg-beat-card border border-beat-border p-5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-beat-accent/5 rounded-full -translate-y-8 translate-x-8"/>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-body text-beat-muted mb-1 uppercase tracking-widest">Grup aktif</p>
            <h1 className="font-display text-beat-accent text-lg leading-tight">{activeGroup.group_name}</h1>
            {activeGroup.description && (
              <p className="text-beat-sub text-xs font-body mt-1">{activeGroup.description}</p>
            )}
          </div>
          <Music size={32} className="text-beat-border"/>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Anggota', val: stats.activeMembers },
              { label: 'Sesi',    val: stats.totalSessions },
              { label: 'Alumni',  val: stats.totalMembers - stats.activeMembers },
            ].map(s => (
              <div key={s.label} className="bg-beat-surface rounded-xl p-3 text-center border border-beat-border">
                <div className="text-xl font-display text-beat-text">{s.val}</div>
                <div className="text-[10px] font-body text-beat-muted">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last attendance summary */}
      {stats?.lastAttendance && (
        <div>
          <SectionTitle>Sesi terakhir</SectionTitle>
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
                className="text-xs text-beat-accent font-body flex items-center gap-0.5">
                Detail <ChevronRight size={12}/>
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Hadir',  val: stats.lastAttendance.counts.hadir,  cls: 'text-beat-teal' },
                { label: 'Izin',   val: stats.lastAttendance.counts.izin,   cls: 'text-beat-amber' },
                { label: 'Sakit',  val: stats.lastAttendance.counts.sakit,  cls: 'text-beat-purple' },
                { label: 'Alpha',  val: stats.lastAttendance.counts.alpha,  cls: 'text-beat-coral' },
              ].map(s => (
                <div key={s.label} className="bg-beat-surface rounded-lg p-2 text-center border border-beat-border">
                  <div className={`text-base font-display ${s.cls}`}>{s.val}</div>
                  <div className="text-[10px] font-body text-beat-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <SectionTitle>Aksi cepat</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: '/sessions', icon: ClipboardList, label: 'Sesi Baru', color: 'text-beat-accent' },
            { to: '/members',  icon: Users,          label: 'Anggota',   color: 'text-beat-purple' },
            { to: '/stats',    icon: TrendingUp,     label: 'Stats',     color: 'text-beat-teal'   },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="bg-beat-card border border-beat-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-beat-muted transition-all active:scale-95">
              <a.icon size={22} className={a.color}/>
              <span className="text-xs font-body text-beat-sub">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div>
          <SectionTitle>Riwayat sesi</SectionTitle>
          <div className="space-y-2">
            {recent.map(s => (
              <Link key={s.session_id} to={`/sessions/${s.session_id}`}
                className="flex items-center justify-between bg-beat-card border border-beat-border rounded-xl px-4 py-3 hover:border-beat-muted transition-all">
                <div>
                  <p className="text-sm font-body text-beat-text font-medium">{s.title}</p>
                  <p className="text-xs font-body text-beat-muted">{formatDate(s.session_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] border rounded px-1.5 py-0.5 font-body ${s.status === 'open' ? 'text-beat-teal border-beat-teal/30' : 'text-beat-muted border-beat-border'}`}>
                    {s.status === 'open' ? 'Open' : 'Closed'}
                  </span>
                  <ChevronRight size={14} className="text-beat-muted"/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
