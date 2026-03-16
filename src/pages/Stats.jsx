import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { useMembers, useStats, useSessions } from '../hooks'
import { MemberRadar, ScoreCards } from '../components/charts'
import { Btn, Card, Modal, Slider, Textarea, EmptyState, Spinner, SectionTitle } from '../components/ui'
import { SKILL_VARS } from '../utils/constants'
import { formatDate } from '../utils/helpers'

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
      {/* Session selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-beat-sub font-body">Sesi</label>
        <select value={sessionId} onChange={e => setSessionId(e.target.value)}
          className="w-full bg-beat-surface border border-beat-border rounded-lg px-3 py-2.5 text-sm text-beat-text font-body focus:outline-none focus:border-beat-accent transition-colors">
          {sessions.map(s => (
            <option key={s.session_id} value={s.session_id}>
              {s.title} — {formatDate(s.session_date)}
            </option>
          ))}
        </select>
      </div>

      {/* Sliders */}
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
        <div className="w-9 h-9 rounded-full bg-beat-surface border border-beat-border flex items-center justify-center text-sm font-display text-beat-accent flex-shrink-0">
          {member.name[0]}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-body font-medium text-beat-text truncate">{member.name}</p>
          <p className="text-xs font-body text-beat-muted">{member.instrument}</p>
        </div>
        <div className="flex items-center gap-3">
          {avg !== null && (
            <div className="text-right">
              <div className="text-base font-display text-beat-accent">{avg}</div>
              <div className="text-[10px] font-body text-beat-muted">rata-rata</div>
            </div>
          )}
          <ChevronDown size={16} className={`text-beat-muted transition-transform ${expanded ? 'rotate-180' : ''}`}/>
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

export default function Stats() {
  const { activeGroup } = useGroup()
  const gid = activeGroup?.group_id
  const { members, loading: mLoading } = useMembers(gid)
  const { sessions } = useSessions(gid)
  const [evalModal, setEvalModal] = useState(null)

  const activeMembers = members.filter(m => m.status === 'active')

  if (!activeGroup) return <EmptyState icon="📊" title="Pilih grup dulu"/>

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Penilaian Anggota</SectionTitle>
        <Btn size="sm" onClick={() => setEvalModal(true)} disabled={!sessions.length}>
          + Nilai
        </Btn>
      </div>

      {/* Member eval modal - pick member then score */}
      <Modal open={!!evalModal} onClose={() => setEvalModal(null)} title="Input Penilaian">
        {evalModal === true ? (
          <div className="space-y-2">
            <p className="text-xs font-body text-beat-muted mb-3">Pilih anggota:</p>
            {activeMembers.map(m => (
              <button key={m.member_id} onClick={() => setEvalModal(m)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-beat-surface rounded-xl hover:bg-beat-border transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-beat-card border border-beat-border flex items-center justify-center text-sm font-display text-beat-accent">
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

      {mLoading ? <Spinner/> : activeMembers.length === 0
        ? <EmptyState icon="🎵" title="Belum ada anggota aktif"/>
        : (
          <div className="space-y-2">
            {activeMembers.map(m => (
              <MemberStatCard key={m.member_id} member={m} group_id={gid}/>
            ))}
          </div>
        )}
    </div>
  )
}
