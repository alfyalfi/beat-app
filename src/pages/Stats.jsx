import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, BarChart2, Users, TrendingUp, Filter } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { useMembers, useStats, useSessions } from '../hooks'
import { attendanceDB, statsDB, db } from '../services/indexeddb'
import { MemberRadar, ScoreCards, AttendanceTrendChart, AttendanceRateChart, MemberRankingChart } from '../components/charts'
import { Btn, Card, Modal, Slider, Textarea, EmptyState, Spinner, SectionTitle } from '../components/ui'
import { SKILL_VARS, INSTRUMENTS, JABATAN, ATTENDANCE_STATUS } from '../utils/constants'
import { formatDate } from '../utils/helpers'

// ─────────────────────────────────────────────────────────────
// Skeleton loader
function SkeletonCard() {
  return (
    <div className="card-glass rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-beat-border"/>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-beat-border rounded w-1/2"/>
          <div className="h-2 bg-beat-border rounded w-1/3"/>
        </div>
        <div className="w-10 h-4 bg-beat-border rounded"/>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB: Absensi per Grup
function AttendanceCharts({ group_id, members, sessions }) {
  const [filterInstrument, setFilterInstrument] = useState('all')
  const [filterJabatan,    setFilterJabatan]    = useState('all')
  const [filterPeriod,     setFilterPeriod]     = useState('all')  // 'all' | 'last5' | 'last10'
  const [chartData,        setChartData]        = useState([])
  const [rankData,         setRankData]         = useState([])
  const [loading,          setLoading]          = useState(true)
  const [rankMetric,       setRankMetric]       = useState('hadir')  // hadir | alpha | izin

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      if (m.status !== 'active') return false
      if (filterInstrument !== 'all' && m.instrument !== filterInstrument) return false
      if (filterJabatan !== 'all' && m.jabatan !== filterJabatan) return false
      return true
    })
  }, [members, filterInstrument, filterJabatan])

  const memberIds = useMemo(() => new Set(filteredMembers.map(m => m.member_id)), [filteredMembers])

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort((a,b) => a.session_date.localeCompare(b.session_date))
    if (filterPeriod === 'last5')  return sorted.slice(-5)
    if (filterPeriod === 'last10') return sorted.slice(-10)
    return sorted
  }, [sessions, filterPeriod])

  useEffect(() => {
    if (!group_id || filteredSessions.length === 0) { setLoading(false); return }
    setLoading(true)

    async function compute() {
      // Fetch all attendance for filtered sessions
      const allAtt = await Promise.all(
        filteredSessions.map(s => attendanceDB.getBySession(s.session_id, group_id))
      )

      // Build chart data — per session
      const trend = filteredSessions.map((s, i) => {
        const atts = allAtt[i].filter(a => memberIds.has(a.member_id))
        const counts = { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
        atts.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++ })
        const total = atts.length || 1
        return {
          label:     s.title.length > 12 ? s.title.slice(0, 10) + '…' : s.title,
          date:      s.session_date,
          Hadir:     counts.hadir,
          Izin:      counts.izin,
          Sakit:     counts.sakit,
          Alpha:     counts.alpha,
          pctHadir:  Math.round((counts.hadir / total) * 100),
        }
      })
      setChartData(trend)

      // Build ranking data per member
      const memberStats = {}
      filteredMembers.forEach(m => {
        memberStats[m.member_id] = { name: m.name.split(' ')[0], hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0 }
      })
      allAtt.forEach(atts => {
        atts.forEach(a => {
          if (!memberStats[a.member_id]) return
          memberStats[a.member_id][a.status]++
          memberStats[a.member_id].total++
        })
      })

      const rankArr = Object.values(memberStats)
        .map(m => ({
          name:  m.name,
          hadir: m.total > 0 ? Math.round((m.hadir / m.total) * 100) : 0,
          izin:  m.total > 0 ? Math.round((m.izin  / m.total) * 100) : 0,
          sakit: m.total > 0 ? Math.round((m.sakit / m.total) * 100) : 0,
          alpha: m.total > 0 ? Math.round((m.alpha / m.total) * 100) : 0,
          value: 0,
        }))

      setRankData(rankArr)
      setLoading(false)
    }
    compute()
  }, [group_id, filteredSessions, memberIds, filteredMembers])

  // Ranking sorted by selected metric
  const sortedRank = useMemo(() => {
    return [...rankData]
      .map(m => ({ ...m, value: m[rankMetric] }))
      .sort((a,b) => b.value - a.value)
  }, [rankData, rankMetric])

  const rankColors = { hadir: '#00e5ff', izin: '#ffe600', sakit: '#b56aff', alpha: '#ff4d6d' }
  const rankLabels = { hadir: '% Hadir', izin: '% Izin', sakit: '% Sakit', alpha: '% Alpha' }

  // Instruments & jabatan options
  const instrumentOpts = ['all', ...new Set(members.filter(m=>m.status==='active').map(m=>m.instrument).filter(Boolean))]
  const jabatanOpts    = ['all', ...new Set(members.filter(m=>m.status==='active').map(m=>m.jabatan).filter(Boolean))]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Filter bar */}
      <div className="card-glass rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={12} className="text-beat-cyan"/>
          <span className="text-[10px] font-body text-beat-cyan uppercase tracking-wider">Filter</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {/* Instrument */}
          <div>
            <p className="text-[9px] font-body text-beat-muted mb-1 uppercase">Instrumen</p>
            <select value={filterInstrument} onChange={e => setFilterInstrument(e.target.value)}
              className="w-full bg-beat-surface border border-beat-border rounded-lg px-2 py-1.5 text-xs text-beat-text font-body focus:outline-none focus:border-beat-cyan transition-colors">
              {instrumentOpts.map(o => <option key={o} value={o}>{o === 'all' ? 'Semua' : o}</option>)}
            </select>
          </div>
          {/* Jabatan */}
          <div>
            <p className="text-[9px] font-body text-beat-muted mb-1 uppercase">Jabatan</p>
            <select value={filterJabatan} onChange={e => setFilterJabatan(e.target.value)}
              className="w-full bg-beat-surface border border-beat-border rounded-lg px-2 py-1.5 text-xs text-beat-text font-body focus:outline-none focus:border-beat-cyan transition-colors">
              {jabatanOpts.map(o => <option key={o} value={o}>{o === 'all' ? 'Semua' : o}</option>)}
            </select>
          </div>
          {/* Period */}
          <div>
            <p className="text-[9px] font-body text-beat-muted mb-1 uppercase">Periode</p>
            <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
              className="w-full bg-beat-surface border border-beat-border rounded-lg px-2 py-1.5 text-xs text-beat-text font-body focus:outline-none focus:border-beat-cyan transition-colors">
              <option value="all">Semua</option>
              <option value="last5">5 Sesi Terakhir</option>
              <option value="last10">10 Sesi Terakhir</option>
            </select>
          </div>
        </div>
        {/* Active filter summary */}
        {(filterInstrument !== 'all' || filterJabatan !== 'all') && (
          <p className="text-[10px] font-body text-beat-cyan mt-1">
            Menampilkan {filteredMembers.length} anggota
            {filterInstrument !== 'all' && ` · ${filterInstrument}`}
            {filterJabatan !== 'all' && ` · ${filterJabatan}`}
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <SkeletonCard key={i}/>)}
        </div>
      ) : (
        <>
          {/* Trend Chart */}
          <div>
            <SectionTitle>Tren Absensi per Sesi</SectionTitle>
            <Card className="p-4">
              <AttendanceTrendChart data={chartData}/>
            </Card>
          </div>

          {/* Rate Line Chart */}
          {chartData.length > 1 && (
            <div>
              <SectionTitle>Persentase Kehadiran</SectionTitle>
              <Card className="p-4">
                <AttendanceRateChart data={chartData}/>
              </Card>
            </div>
          )}

          {/* Ranking */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionTitle>Ranking Anggota</SectionTitle>
              <div className="flex gap-1">
                {Object.entries(rankLabels).map(([k, label]) => (
                  <button key={k} onClick={() => setRankMetric(k)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-body border transition-all ${
                      rankMetric === k
                        ? 'border-transparent text-beat-bg font-semibold'
                        : 'border-beat-border text-beat-muted hover:border-beat-bordhi'
                    }`}
                    style={rankMetric === k ? { background: rankColors[k] } : {}}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Card className="p-4">
              <p className="text-[10px] font-body text-beat-muted mb-3">
                {rankMetric === 'hadir' ? '🏆 Siapa yang paling rajin hadir?' :
                 rankMetric === 'alpha' ? '⚠️ Siapa yang paling sering alpha?' :
                 rankMetric === 'izin'  ? '📋 Siapa yang paling sering izin?' :
                 '🤒 Siapa yang paling sering sakit?'}
              </p>
              <MemberRankingChart
                data={sortedRank}
                color={rankColors[rankMetric]}
                valueLabel={rankLabels[rankMetric]}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// TAB: Penilaian (existing stats)
function StatModal({ member, sessions, group_id, onClose }) {
  const { history, latest, loading, initScores, saveStat } = useStats(member.member_id, group_id)
  const [sessionId, setSessionId] = useState(sessions[0]?.session_id || '')
  const [scores,    setScores]    = useState(null)
  const [note,      setNote]      = useState('')
  const [saving,    setSaving]    = useState(false)

  const session = sessions.find(s => s.session_id === sessionId)

  useEffect(() => {
    if (!sessionId) return
    initScores(sessionId).then(s => { setScores({ ...s }); setNote('') })
  }, [sessionId, initScores])

  async function handleSave() {
    if (!session || !scores) return
    setSaving(true)
    await saveStat(session.session_id, session.session_date, scores, note)
    setSaving(false)
    onClose()
  }

  const setScore = (key, val) => setScores(s => ({ ...s, [key]: val }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-beat-sub font-body">Sesi</label>
        <select value={sessionId} onChange={e => setSessionId(e.target.value)}
          className="w-full bg-beat-surface border border-beat-border rounded-lg px-3 py-2.5 text-sm text-beat-text font-body focus:outline-none focus:border-beat-cyan transition-colors">
          {sessions.map(s => (
            <option key={s.session_id} value={s.session_id}>
              {s.title} — {formatDate(s.session_date)}
            </option>
          ))}
        </select>
      </div>
      {scores && (
        <div className="space-y-4 py-1">
          {SKILL_VARS.map(v => (
            <Slider key={v.key} label={v.label} color={v.color}
              value={scores[v.key]} onChange={val => setScore(v.key, val)}/>
          ))}
        </div>
      )}
      <Textarea label="Catatan evaluasi" placeholder="Komentar singkat trainer..."
        value={note} onChange={e => setNote(e.target.value)}/>
      <div className="flex gap-2 justify-end">
        <Btn variant="outline" onClick={onClose}>Batal</Btn>
        <Btn onClick={handleSave} disabled={saving || !scores}>
          {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
        </Btn>
      </div>
    </div>
  )
}

function MemberStatCard({ member, group_id }) {
  const { history, latest, loading } = useStats(member.member_id, group_id)
  const prev = history.length >= 2 ? history[history.length - 2] : null
  const [expanded, setExpanded] = useState(false)

  const avg = latest
    ? Math.round(Object.values(latest.scores).reduce((a,b) => a+b, 0) / 5)
    : null

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-beat-surface/50 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 rounded-full bg-beat-surface border border-beat-border flex items-center justify-center text-sm font-display text-beat-cyan flex-shrink-0">
          {member.name[0]}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-body font-medium text-beat-text truncate">{member.name}</p>
          <p className="text-xs font-body text-beat-muted">{member.instrument}
            {member.jabatan && member.jabatan !== 'Anggota' && ` · ${member.jabatan}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {avg !== null && (
            <div className="text-right">
              <div className="text-base font-display text-beat-cyan">{avg}</div>
              <div className="text-[10px] font-body text-beat-muted">avg</div>
            </div>
          )}
          <ChevronDown size={16} className={`text-beat-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}/>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-beat-border px-4 pb-4 pt-3 space-y-3 animate-fade-in">
          {loading ? <Spinner/> : (
            <>
              <MemberRadar latest={latest} previous={prev}/>
              {latest && <ScoreCards scores={latest.scores} prevScores={prev?.scores}/>}
              {history.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-body text-beat-muted mb-2 uppercase tracking-wider">Riwayat</p>
                  <div className="space-y-1.5">
                    {[...history].reverse().slice(0, 5).map(h => (
                      <div key={h.stat_id} className="flex items-center justify-between py-1.5 border-b border-beat-border last:border-0">
                        <span className="text-xs font-body text-beat-muted">{formatDate(h.session_date)}</span>
                        <div className="flex gap-1">
                          {SKILL_VARS.map(v => (
                            <span key={v.key} className="text-[10px] font-body px-1.5 py-0.5 rounded bg-beat-surface" style={{ color: v.color }}>
                              {h.scores[v.key]}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// Stats ranking tab - filter by skill
function StatsRanking({ members, group_id, sessions }) {
  const [filterSkill,      setFilterSkill]      = useState('loyalitas')
  const [filterInstrument, setFilterInstrument] = useState('all')
  const [filterJabatan,    setFilterJabatan]    = useState('all')
  const [rankData,         setRankData]         = useState([])
  const [loading,          setLoading]          = useState(true)

  const filteredMembers = useMemo(() => members.filter(m => {
    if (m.status !== 'active') return false
    if (filterInstrument !== 'all' && m.instrument !== filterInstrument) return false
    if (filterJabatan !== 'all' && m.jabatan !== filterJabatan) return false
    return true
  }), [members, filterInstrument, filterJabatan])

  useEffect(() => {
    if (!group_id || filteredMembers.length === 0) { setRankData([]); setLoading(false); return }
    setLoading(true)
    async function compute() {
      const results = await Promise.all(
        filteredMembers.map(async m => {
          const latest = await statsDB.getLatest(m.member_id, group_id)
          return {
            name:  m.name.split(' ')[0],
            value: latest?.scores?.[filterSkill] ?? 0,
          }
        })
      )
      setRankData(results.sort((a,b) => b.value - a.value))
      setLoading(false)
    }
    compute()
  }, [group_id, filteredMembers, filterSkill])

  const skillColor = SKILL_VARS.find(v => v.key === filterSkill)?.color ?? '#00e5ff'
  const instrumentOpts = ['all', ...new Set(members.filter(m=>m.status==='active').map(m=>m.instrument).filter(Boolean))]
  const jabatanOpts    = ['all', ...new Set(members.filter(m=>m.status==='active').map(m=>m.jabatan).filter(Boolean))]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Filter */}
      <div className="card-glass rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={12} className="text-beat-cyan"/>
          <span className="text-[10px] font-body text-beat-cyan uppercase tracking-wider">Filter Ranking</span>
        </div>
        <div>
          <p className="text-[9px] font-body text-beat-muted mb-1.5 uppercase">Skill</p>
          <div className="flex gap-1.5 flex-wrap">
            {SKILL_VARS.map(v => (
              <button key={v.key} onClick={() => setFilterSkill(v.key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-body border transition-all ${
                  filterSkill === v.key ? 'border-transparent text-beat-bg font-semibold' : 'border-beat-border text-beat-muted'
                }`}
                style={filterSkill === v.key ? { background: v.color } : {}}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-body text-beat-muted mb-1 uppercase">Instrumen</p>
            <select value={filterInstrument} onChange={e => setFilterInstrument(e.target.value)}
              className="w-full bg-beat-surface border border-beat-border rounded-lg px-2 py-1.5 text-xs text-beat-text font-body focus:outline-none focus:border-beat-cyan transition-colors">
              {instrumentOpts.map(o => <option key={o} value={o}>{o === 'all' ? 'Semua' : o}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[9px] font-body text-beat-muted mb-1 uppercase">Jabatan</p>
            <select value={filterJabatan} onChange={e => setFilterJabatan(e.target.value)}
              className="w-full bg-beat-surface border border-beat-border rounded-lg px-2 py-1.5 text-xs text-beat-text font-body focus:outline-none focus:border-beat-cyan transition-colors">
              {jabatanOpts.map(o => <option key={o} value={o}>{o === 'all' ? 'Semua' : o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div>
        <SectionTitle>
          Ranking {SKILL_VARS.find(v=>v.key===filterSkill)?.label}
          {filterInstrument !== 'all' && ` · ${filterInstrument}`}
          {filterJabatan !== 'all' && ` · ${filterJabatan}`}
        </SectionTitle>
        <Card className="p-4">
          {loading ? <Spinner/> : rankData.length === 0
            ? <EmptyState icon="📊" title="Belum ada data penilaian"/>
            : <MemberRankingChart data={rankData} color={skillColor} valueLabel={SKILL_VARS.find(v=>v.key===filterSkill)?.label}/>
          }
        </Card>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main Stats Page
export default function Stats() {
  const { activeGroup } = useGroup()
  const gid = activeGroup?.group_id
  const { members, loading: mLoading } = useMembers(gid)
  const { sessions } = useSessions(gid)

  const [tab,       setTab]       = useState('absensi')  // 'absensi' | 'penilaian' | 'ranking'
  const [evalModal, setEvalModal] = useState(null)

  const activeMembers = members.filter(m => m.status === 'active')

  if (!activeGroup) return <EmptyState icon="📊" title="Pilih grup dulu"/>

  const TABS = [
    { key: 'absensi',   label: 'Absensi',   icon: BarChart2 },
    { key: 'penilaian', label: 'Penilaian', icon: Users     },
    { key: 'ranking',   label: 'Ranking',   icon: TrendingUp},
  ]

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Statistik</SectionTitle>
        {tab === 'penilaian' && (
          <Btn size="sm" onClick={() => setEvalModal(true)} disabled={!sessions.length}>
            + Nilai
          </Btn>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 p-1 bg-beat-surface rounded-xl border border-beat-border">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body transition-all duration-200 ${
              tab === key
                ? 'bg-beat-cyan text-beat-bg font-semibold'
                : 'text-beat-muted hover:text-beat-text'
            }`}>
            <Icon size={13}/>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'absensi' && (
        sessions.length === 0
          ? <EmptyState icon="📋" title="Belum ada sesi" subtitle="Buat sesi latihan terlebih dahulu"/>
          : <AttendanceCharts group_id={gid} members={members} sessions={sessions}/>
      )}

      {tab === 'penilaian' && (
        mLoading
          ? <div className="space-y-2">{[1,2,3].map(i => <SkeletonCard key={i}/>)}</div>
          : activeMembers.length === 0
            ? <EmptyState icon="🎵" title="Belum ada anggota aktif"/>
            : (
              <div className="space-y-2">
                {activeMembers.map(m => (
                  <MemberStatCard key={m.member_id} member={m} group_id={gid}/>
                ))}
              </div>
            )
      )}

      {tab === 'ranking' && (
        <StatsRanking members={members} group_id={gid} sessions={sessions}/>
      )}

      {/* Eval Modal */}
      <Modal open={!!evalModal} onClose={() => setEvalModal(null)} title="Input Penilaian">
        {evalModal === true ? (
          <div className="space-y-2">
            <p className="text-xs font-body text-beat-muted mb-3">Pilih anggota:</p>
            {activeMembers.map(m => (
              <button key={m.member_id} onClick={() => setEvalModal(m)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-beat-surface rounded-xl hover:bg-beat-border transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-beat-card border border-beat-border flex items-center justify-center text-sm font-display text-beat-cyan">
                  {m.name[0]}
                </div>
                <div>
                  <p className="text-sm font-body text-beat-text">{m.name}</p>
                  <p className="text-xs font-body text-beat-muted">{m.instrument}</p>
                </div>
              </button>
            ))}
          </div>
        ) : evalModal && (
          <StatModal
            member={evalModal}
            sessions={sessions}
            group_id={gid}
            onClose={() => setEvalModal(null)}/>
        )}
      </Modal>
    </div>
  )
}
