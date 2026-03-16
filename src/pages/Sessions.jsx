import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, ChevronLeft, Save, Lock } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { useSessions, useAttendance, useMembers } from '../hooks'
import { Btn, Card, Modal, Input, Textarea, EmptyState, Spinner, SectionTitle, Badge } from '../components/ui'
import { formatDate, cycleStatus } from '../utils/helpers'
import { ATTENDANCE_STATUS, STATUS_COLOR } from '../utils/constants'

// ── Sessions List Page ─────────────────────────────────────
export default function Sessions() {
  const { activeGroup } = useGroup()
  const { sessions, loading, saveSession } = useSessions(activeGroup?.group_id)
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState({ title: '', session_date: new Date().toISOString().split('T')[0], notes: '' })
  const navigate = useNavigate()

  async function handleCreate() {
    if (!form.title.trim() || !form.session_date) return
    const s = await saveSession(form)
    setModal(false)
    setForm({ title: '', session_date: new Date().toISOString().split('T')[0], notes: '' })
    navigate(`/sessions/${s.session_id}`)
  }

  if (!activeGroup) return <EmptyState icon="🎵" title="Pilih grup dulu" subtitle="Gunakan menu di atas untuk memilih grup"/>

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Sesi Latihan</SectionTitle>
        <Btn size="sm" onClick={() => setModal(true)}><Plus size={14}/>Buat Sesi</Btn>
      </div>

      {loading ? <Spinner/> : sessions.length === 0
        ? <EmptyState icon="📋" title="Belum ada sesi" subtitle="Buat sesi latihan pertama untuk mulai absensi"/>
        : (
          <div className="space-y-2">
            {sessions.map(s => (
              <Link key={s.session_id} to={`/sessions/${s.session_id}`}
                className="flex items-center justify-between card-glass rounded-xl px-4 py-3.5 hover:border-beat-muted transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-beat-text truncate">{s.title}</p>
                  <p className="text-xs font-body text-beat-muted">{formatDate(s.session_date)}</p>
                  {s.notes && <p className="text-xs font-body text-beat-muted mt-0.5 truncate">{s.notes}</p>}
                </div>
                <Badge label={s.status === 'open' ? 'Open' : 'Closed'} color={s.status === 'open' ? 'teal' : 'gray'}/>
              </Link>
            ))}
          </div>
        )}

      <Modal open={modal} onClose={() => setModal(false)} title="Buat Sesi Latihan">
        <div className="space-y-4">
          <Input label="Nama sesi" placeholder="Latihan rutin minggu ke-2"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
          <Input label="Tanggal" type="date"
            value={form.session_date} onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}/>
          <Textarea label="Catatan (opsional)" placeholder="Fokus materi hari ini..."
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setModal(false)}>Batal</Btn>
            <Btn onClick={handleCreate} disabled={!form.title.trim()}><Save size={14}/>Buat</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Attendance Detail Page ─────────────────────────────────
export function AttendancePage() {
  const { session_id } = useParams()
  const { activeGroup } = useGroup()
  const navigate = useNavigate()
  const gid = activeGroup?.group_id

  const { sessions, closeSession } = useSessions(gid)
  const { members } = useMembers(gid)
  const { records, loading, initDraft, saveAttendance } = useAttendance(session_id, gid)

  const [session, setSession] = useState(null)
  const [draft,   setDraft]   = useState({})
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    const s = sessions.find(s => s.session_id === session_id)
    setSession(s)
  }, [sessions, session_id])

  useEffect(() => {
    if (!session || !members.length) return
    const activeMembers = members.filter(m => m.status === 'active')
    initDraft(activeMembers).then(setDraft)
  }, [session, members, initDraft])

  function toggleStatus(member_id) {
    if (session?.status === 'closed') return
    setDraft(d => ({
      ...d,
      [member_id]: {
        ...d[member_id],
        status: cycleStatus(d[member_id].status, ATTENDANCE_STATUS)
      }
    }))
    setSaved(false)
  }

  function setNote(member_id, note) {
    setDraft(d => ({ ...d, [member_id]: { ...d[member_id], note } }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await saveAttendance(draft)
    setSaving(false)
    setSaved(true)
  }

  async function handleClose() {
    await handleSave()
    await closeSession(session_id)
  }

  const isClosed = session?.status === 'closed'
  const counts   = { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
  Object.values(draft).forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })

  if (!activeGroup) return <EmptyState icon="🎵" title="Pilih grup dulu"/>
  if (!session && !loading) return (
    <div className="px-4 pt-8 text-center">
      <p className="text-beat-muted font-body text-sm">Sesi tidak ditemukan.</p>
      <button onClick={() => navigate('/sessions')} className="mt-3 text-beat-cyan text-sm font-body">
        ← Kembali ke daftar sesi
      </button>
    </div>
  )
  if (loading || !session) return <Spinner/>

  return (
    <div className="px-4 pt-4 pb-28 max-w-2xl mx-auto animate-fade-in">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/sessions')} className="text-beat-muted hover:text-beat-text">
          <ChevronLeft size={20}/>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-sm text-beat-text truncate">{session.title}</h1>
          <p className="font-body text-xs text-beat-muted">{formatDate(session.session_date)}</p>
        </div>
        {isClosed && <Badge label="Closed" color="gray"/>}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Hadir',  val: counts.hadir,  cls: 'text-beat-cyan'   },
          { label: 'Izin',   val: counts.izin,   cls: 'text-beat-yellow'  },
          { label: 'Sakit',  val: counts.sakit,  cls: 'text-beat-purple' },
          { label: 'Alpha',  val: counts.alpha,  cls: 'text-beat-coral'  },
        ].map(s => (
          <div key={s.label} className="card-glass rounded-xl p-2.5 text-center">
            <div className={`text-lg font-display ${s.cls}`}>{s.val}</div>
            <div className="text-[10px] font-body text-beat-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick mode tip */}
      {!isClosed && (
        <p className="text-xs font-body text-beat-muted mb-3 text-center">
          Semua anggota default <span className="text-beat-cyan">Hadir</span> · Tap status untuk mengubah
        </p>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {Object.values(draft).map(rec => {
          const member = members.find(m => m.member_id === rec.member_id)
          if (!member) return null
          const st = ATTENDANCE_STATUS.find(s => s.key === rec.status)
          return (
            <Card key={rec.member_id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-beat-text truncate">{member.name}</p>
                  <p className="text-xs font-body text-beat-muted">{member.instrument}</p>
                </div>
                <button
                  onClick={() => toggleStatus(rec.member_id)}
                  disabled={isClosed}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-all ${STATUS_COLOR[rec.status]} ${isClosed ? 'cursor-default' : 'active:scale-95 cursor-pointer'}`}>
                  {st?.label}
                </button>
              </div>
              {rec.status !== 'hadir' && !isClosed && (
                <input
                  className="mt-2 w-full bg-beat-surface rounded-lg px-3 py-2 text-xs font-body text-beat-text placeholder-beat-muted border border-beat-border focus:outline-none focus:border-beat-cyan"
                  placeholder="Keterangan (opsional)"
                  value={rec.note}
                  onChange={e => setNote(rec.member_id, e.target.value)}
                />
              )}
              {isClosed && rec.note && (
                <p className="mt-1 text-xs font-body text-beat-muted">{rec.note}</p>
              )}
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      {!isClosed && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 flex gap-2 max-w-2xl mx-auto">
          <Btn variant="ghost" className="flex-1" onClick={handleSave} disabled={saving}>
            <Save size={14}/>{saved ? 'Tersimpan ✓' : 'Simpan'}
          </Btn>
          <Btn variant="danger" onClick={handleClose}>
            <Lock size={14}/>Tutup Sesi
          </Btn>
        </div>
      )}
    </div>
  )
}
