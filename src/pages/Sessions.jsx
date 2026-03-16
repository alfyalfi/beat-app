import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, ChevronLeft, Save, Lock, Pencil, Trash2, LockOpen, MoreVertical } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { useSessions, useAttendance, useMembers } from '../hooks'
import { Btn, Card, Modal, Input, Textarea, EmptyState, Spinner, SectionTitle, Badge } from '../components/ui'
import { formatDate, cycleStatus } from '../utils/helpers'
import { ATTENDANCE_STATUS, STATUS_COLOR } from '../utils/constants'

// ── Session Form (create & edit) ───────────────────────────────
function SessionForm({ initial, onSave, onCancel, title = 'Buat Sesi Latihan' }) {
  const [form, setForm] = useState(initial || {
    title: '', session_date: new Date().toISOString().split('T')[0], notes: ''
  })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div className="space-y-4">
      <Input label="Nama sesi" placeholder="Latihan rutin minggu ke-2"
        value={form.title} onChange={e => f('title', e.target.value)}/>
      <Input label="Tanggal" type="date"
        value={form.session_date} onChange={e => f('session_date', e.target.value)}/>
      <Textarea label="Catatan (opsional)" placeholder="Fokus materi hari ini..."
        value={form.notes} onChange={e => f('notes', e.target.value)}/>
      <div className="flex gap-2 justify-end">
        <Btn variant="outline" onClick={onCancel}>Batal</Btn>
        <Btn onClick={() => onSave(form)} disabled={!form.title.trim()}>
          <Save size={13}/>{initial ? 'Simpan Perubahan' : 'Buat Sesi'}
        </Btn>
      </div>
    </div>
  )
}

// ── Sessions List Page ──────────────────────────────────────────
export default function Sessions() {
  const { activeGroup } = useGroup()
  const gid = activeGroup?.group_id
  const { sessions, loading, saveSession, deleteSession } = useSessions(gid)
  const navigate = useNavigate()

  const [createModal,    setCreateModal]    = useState(false)
  const [editModal,      setEditModal]      = useState(null)   // session obj
  const [deleteModal,    setDeleteModal]    = useState(null)   // session obj
  const [overwriteModal, setOverwriteModal] = useState(null)   // { form, existing }
  const [menuOpen,       setMenuOpen]       = useState(null)   // session_id
  const [form,           setForm]           = useState({
    title: '', session_date: new Date().toISOString().split('T')[0], notes: ''
  })

  // Tutup menu kalau klik di luar
  useEffect(() => {
    const close = () => setMenuOpen(null)
    if (menuOpen) document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  // ── Buat sesi baru ─────────────────────────────────────────
  async function handleCreate(data) {
    if (!data.title.trim() || !data.session_date) return

    // Cek apakah tanggal yang sama sudah ada
    const duplicate = sessions.find(s => s.session_date === data.session_date)
    if (duplicate) {
      setCreateModal(false)
      setOverwriteModal({ form: data, existing: duplicate })
      return
    }

    const s = await saveSession(data)
    setCreateModal(false)
    setForm({ title: '', session_date: new Date().toISOString().split('T')[0], notes: '' })
    navigate(`/sessions/${s.session_id}`)
  }

  // ── Overwrite sesi yang sama tanggalnya ────────────────────
  async function handleOverwrite() {
    if (!overwriteModal) return
    const { form, existing } = overwriteModal
    // Update sesi yang ada dengan data baru (pertahankan session_id)
    await saveSession({ ...existing, ...form })
    setOverwriteModal(null)
    navigate(`/sessions/${existing.session_id}`)
  }

  // ── Buat sesi baru meski tanggal sama ─────────────────────
  async function handleCreateAnyway() {
    if (!overwriteModal) return
    const s = await saveSession(overwriteModal.form)
    setOverwriteModal(null)
    navigate(`/sessions/${s.session_id}`)
  }

  // ── Edit sesi ─────────────────────────────────────────────
  async function handleEdit(data) {
    await saveSession({ ...editModal, ...data })
    setEditModal(null)
  }

  // ── Hapus sesi ────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteModal) return
    await deleteSession(deleteModal.session_id)
    setDeleteModal(null)
  }

  if (!activeGroup) return (
    <EmptyState icon="🎵" title="Pilih grup dulu" subtitle="Gunakan menu di atas untuk memilih grup"/>
  )

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Sesi Latihan</SectionTitle>
        <Btn size="sm" onClick={() => setCreateModal(true)}>
          <Plus size={13}/>Buat Sesi
        </Btn>
      </div>

      {loading ? <Spinner/> : sessions.length === 0
        ? <EmptyState icon="📋" title="Belum ada sesi" subtitle="Buat sesi latihan pertama untuk mulai absensi"/>
        : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.session_id} className="relative flex items-center gap-2">
                {/* Main card — navigasi ke absensi */}
                <Link to={`/sessions/${s.session_id}`}
                  className="flex-1 flex items-center justify-between card-glass rounded-xl px-4 py-3.5 hover:border-beat-cyan/25 transition-all min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-beat-text truncate">{s.title}</p>
                    <p className="text-xs font-body text-beat-muted">{formatDate(s.session_date)}</p>
                    {s.notes && (
                      <p className="text-xs font-body text-beat-muted mt-0.5 truncate">{s.notes}</p>
                    )}
                  </div>
                  <Badge
                    label={s.status === 'open' ? 'Open' : 'Closed'}
                    color={s.status === 'open' ? 'cyan' : 'gray'}/>
                </Link>

                {/* Menu button */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpen(menuOpen === s.session_id ? null : s.session_id)}
                    className="p-2.5 text-beat-muted hover:text-beat-text card-glass rounded-xl border border-beat-border transition-all">
                    <MoreVertical size={15}/>
                  </button>

                  {/* Dropdown menu */}
                  {menuOpen === s.session_id && (
                    <div className="absolute right-0 top-11 w-44 card-glass rounded-xl border border-beat-cyan/15 z-20 overflow-hidden animate-fade-in shadow-2xl">
                      <button
                        onClick={() => { setEditModal(s); setMenuOpen(null) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-body text-beat-text hover:bg-beat-cyan/5 transition-colors border-b border-beat-border">
                        <Pencil size={13} className="text-beat-cyan"/>Edit sesi
                      </button>
                      <Link
                        to={`/sessions/${s.session_id}`}
                        onClick={() => setMenuOpen(null)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-body text-beat-text hover:bg-beat-yellow/5 transition-colors border-b border-beat-border">
                        <Pencil size={13} className="text-beat-yellow"/>Edit absensi
                      </Link>
                      <button
                        onClick={() => { setDeleteModal(s); setMenuOpen(null) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-body text-beat-coral hover:bg-beat-coral/5 transition-colors">
                        <Trash2 size={13}/>Hapus sesi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* ── Modal: Buat sesi ── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Buat Sesi Latihan">
        <SessionForm
          initial={form}
          onSave={handleCreate}
          onCancel={() => setCreateModal(false)}/>
      </Modal>

      {/* ── Modal: Edit sesi ── */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit — ${editModal?.title}`}>
        {editModal && (
          <SessionForm
            initial={editModal}
            onSave={handleEdit}
            onCancel={() => setEditModal(null)}
            title="Edit Sesi"/>
        )}
      </Modal>

      {/* ── Modal: Hapus sesi ── */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Hapus Sesi">
        <div className="space-y-4">
          <div className="px-4 py-3 rounded-xl bg-beat-coral/10 border border-beat-coral/20">
            <p className="text-sm font-body font-medium text-beat-text">{deleteModal?.title}</p>
            <p className="text-xs font-body text-beat-muted mt-0.5">{formatDate(deleteModal?.session_date)}</p>
          </div>
          <p className="text-sm font-body text-beat-sub">
            Hapus sesi ini? Data absensi yang sudah dicatat dalam sesi ini juga akan ikut terhapus.
          </p>
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setDeleteModal(null)}>Batal</Btn>
            <Btn variant="danger" onClick={handleDelete}><Trash2 size={13}/>Hapus</Btn>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Overwrite tanggal sama ── */}
      <Modal open={!!overwriteModal} onClose={() => setOverwriteModal(null)} title="Sesi Tanggal Ini Sudah Ada">
        <div className="space-y-4">
          <div className="px-4 py-3 rounded-xl bg-beat-yellow/10 border border-beat-yellow/20">
            <p className="text-[10px] font-body text-beat-yellow uppercase tracking-wider mb-1">Sesi yang sudah ada</p>
            <p className="text-sm font-body font-medium text-beat-text">{overwriteModal?.existing?.title}</p>
            <p className="text-xs font-body text-beat-muted">{formatDate(overwriteModal?.existing?.session_date)}</p>
          </div>
          <p className="text-sm font-body text-beat-sub">
            Sudah ada sesi di tanggal ini. Mau apa?
          </p>
          <div className="space-y-2">
            <button onClick={handleOverwrite}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl card-glass border border-beat-yellow/30 hover:border-beat-yellow/60 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-beat-yellow/10 flex items-center justify-center flex-shrink-0">
                <Pencil size={14} className="text-beat-yellow"/>
              </div>
              <div>
                <p className="text-sm font-body font-medium text-beat-text">Timpa sesi yang ada</p>
                <p className="text-xs font-body text-beat-muted">Update nama & catatan, absensi tetap</p>
              </div>
            </button>
            <button onClick={handleCreateAnyway}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl card-glass border border-beat-cyan/30 hover:border-beat-cyan/60 transition-all text-left">
              <div className="w-8 h-8 rounded-lg bg-beat-cyan/10 flex items-center justify-center flex-shrink-0">
                <Plus size={14} className="text-beat-cyan"/>
              </div>
              <div>
                <p className="text-sm font-body font-medium text-beat-text">Buat sesi baru tetap</p>
                <p className="text-xs font-body text-beat-muted">Dua sesi di tanggal yang sama</p>
              </div>
            </button>
            <button onClick={() => setOverwriteModal(null)}
              className="w-full py-2.5 text-xs font-body text-beat-muted hover:text-beat-text border border-beat-border rounded-xl transition-all">
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Attendance Detail Page ──────────────────────────────────────
export function AttendancePage() {
  const { session_id } = useParams()
  const { activeGroup } = useGroup()
  const navigate = useNavigate()
  const gid = activeGroup?.group_id

  const { sessions, closeSession, saveSession } = useSessions(gid)
  const { members } = useMembers(gid)
  const { records, loading, initDraft, saveAttendance } = useAttendance(session_id, gid)

  const [session,     setSession]     = useState(null)
  const [draft,       setDraft]       = useState({})
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [reopenModal, setReopenModal] = useState(false)

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

  async function handleReopen() {
    // Buka kembali sesi yang sudah closed
    await saveSession({ ...session, status: 'open' })
    setReopenModal(false)
    setSaved(false)
  }

  const isClosed = session?.status === 'closed'
  const counts   = { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
  Object.values(draft).forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++ })

  if (!activeGroup) return <EmptyState icon="🎵" title="Pilih grup dulu"/>
  if (!session && !loading) return (
    <div className="px-4 pt-8 text-center">
      <p className="text-beat-muted font-body text-sm">Sesi tidak ditemukan.</p>
      <button onClick={() => navigate('/sessions')}
        className="mt-3 text-beat-cyan text-sm font-body">
        ← Kembali ke daftar sesi
      </button>
    </div>
  )
  if (loading || !session) return <Spinner/>

  return (
    <div className="px-4 pt-4 pb-28 max-w-2xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/sessions')}
          className="text-beat-muted hover:text-beat-cyan transition-colors">
          <ChevronLeft size={20}/>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xs tracking-widest text-beat-cyan truncate uppercase">
            {session.title}
          </h1>
          <p className="font-body text-xs text-beat-muted">{formatDate(session.session_date)}</p>
        </div>
        {isClosed ? (
          <button onClick={() => setReopenModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body border border-beat-yellow/30 text-beat-yellow bg-beat-yellow/5 hover:bg-beat-yellow/10 transition-all">
            <LockOpen size={12}/>Buka Lagi
          </button>
        ) : (
          <Badge label="Open" color="cyan"/>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Hadir', val: counts.hadir, color: '#00e5ff' },
          { label: 'Izin',  val: counts.izin,  color: '#ffe600' },
          { label: 'Sakit', val: counts.sakit, color: '#b56aff' },
          { label: 'Alpha', val: counts.alpha, color: '#ff4d6d' },
        ].map(s => (
          <div key={s.label} className="card-glass rounded-xl p-2.5 text-center">
            <div className="text-lg font-display font-bold"
              style={{ color: s.color, textShadow: `0 0 10px ${s.color}60` }}>
              {s.val}
            </div>
            <div className="text-[10px] font-body text-beat-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {!isClosed && (
        <p className="text-xs font-body text-beat-muted mb-3 text-center">
          Default <span className="text-beat-cyan">Hadir</span> · Tap status untuk ubah
        </p>
      )}

      {isClosed && (
        <div className="mb-3 px-3 py-2.5 rounded-xl bg-beat-yellow/5 border border-beat-yellow/20 text-center">
          <p className="text-xs font-body text-beat-yellow">
            Sesi sudah ditutup — tap <span className="font-semibold">Buka Lagi</span> untuk edit absensi
          </p>
        </div>
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
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-display font-bold text-beat-bg"
                  style={{ background: 'linear-gradient(135deg, #00e5ff, #007acc)', boxShadow: '0 0 8px rgba(0,229,255,0.3)' }}>
                  {member.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-beat-text truncate">{member.name}</p>
                  <p className="text-xs font-body text-beat-muted">
                    {member.instrument}
                    {member.jabatan && member.jabatan !== 'Anggota' && ` · ${member.jabatan}`}
                  </p>
                </div>
                <button
                  onClick={() => toggleStatus(rec.member_id)}
                  disabled={isClosed}
                  className={`px-3 py-1.5 rounded-lg text-xs font-body border transition-all ${STATUS_COLOR[rec.status]} ${isClosed ? 'cursor-default opacity-70' : 'active:scale-95 cursor-pointer'}`}>
                  {st?.label}
                </button>
              </div>
              {rec.status !== 'hadir' && !isClosed && (
                <input
                  className="mt-2 w-full bg-beat-surface rounded-lg px-3 py-2 text-xs font-body text-beat-text placeholder-beat-muted border border-beat-border focus:outline-none focus:border-beat-cyan transition-all"
                  placeholder="Keterangan (opsional)"
                  value={rec.note}
                  onChange={e => setNote(rec.member_id, e.target.value)}/>
              )}
              {isClosed && rec.note && (
                <p className="mt-1.5 text-xs font-body text-beat-muted pl-11">{rec.note}</p>
              )}
            </Card>
          )
        })}
      </div>

      {/* Action bar */}
      {!isClosed && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 flex gap-2 max-w-2xl mx-auto">
          <Btn variant="ghost" className="flex-1" onClick={handleSave} disabled={saving}>
            <Save size={13}/>{saved ? 'Tersimpan ✓' : 'Simpan'}
          </Btn>
          <Btn variant="danger" onClick={handleClose}>
            <Lock size={13}/>Tutup Sesi
          </Btn>
        </div>
      )}

      {/* ── Modal: Buka kembali sesi ── */}
      <Modal open={reopenModal} onClose={() => setReopenModal(false)} title="Buka Sesi Kembali">
        <div className="space-y-4">
          <p className="text-sm font-body text-beat-sub">
            Buka kembali sesi <span className="text-beat-text font-medium">{session.title}</span>?
            Kamu bisa mengubah absensi lagi setelah ini.
          </p>
          <div className="flex gap-2 justify-end">
            <Btn variant="outline" onClick={() => setReopenModal(false)}>Batal</Btn>
            <Btn variant="yellow" onClick={handleReopen}>
              <LockOpen size={13}/>Buka Lagi
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
