import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { useMembers } from '../hooks'
import {
  Btn, Card, Modal, Input, Select, Textarea,
  EmptyState, Spinner, SectionTitle, Badge
} from '../components/ui'
import { INSTRUMENTS, MEMBER_STATUS } from '../utils/constants'

const STATUS_COLOR = {
  active:   'teal',
  inactive: 'gray',
  alumni:   'purple',
  on_leave: 'amber',
}

function MemberForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', instrument: 'Vokal', angkatan: '',
    status: 'active', joined_at: new Date().toISOString().split('T')[0], notes: ''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <Input label="Nama lengkap" placeholder="Andi Pratama" value={form.name}
        onChange={e => set('name', e.target.value)}/>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Instrumen" value={form.instrument} onChange={e => set('instrument', e.target.value)}>
          {INSTRUMENTS.map(i => <option key={i}>{i}</option>)}
        </Select>
        <Input label="Angkatan" placeholder="2023" value={form.angkatan}
          onChange={e => set('angkatan', e.target.value)}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
          {MEMBER_STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </Select>
        <Input label="Bergabung" type="date" value={form.joined_at}
          onChange={e => set('joined_at', e.target.value)}/>
      </div>
      <Textarea label="Catatan" placeholder="Info tambahan..." value={form.notes}
        onChange={e => set('notes', e.target.value)}/>
      <div className="flex gap-2 justify-end pt-1">
        <Btn variant="outline" onClick={onCancel}>Batal</Btn>
        <Btn onClick={() => onSave(form)} disabled={!form.name.trim()}>Simpan</Btn>
      </div>
    </div>
  )
}

export default function Members() {
  const { activeGroup } = useGroup()
  const { members, loading, saveMember, deleteMember } = useMembers(activeGroup?.group_id)

  const [modal,  setModal]  = useState(null)  // null | 'add' | member obj
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [delTarget, setDelTarget] = useState(null)

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.instrument.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || m.status === filter
    return matchSearch && matchFilter
  })

  async function handleSave(data) {
    const existing = modal !== 'add' ? modal : null
    await saveMember({ ...(existing || {}), ...data })
    setModal(null)
  }

  async function handleDelete() {
    if (!delTarget) return
    await deleteMember(delTarget.member_id)
    setDelTarget(null)
  }

  if (!activeGroup) return <EmptyState icon="👥" title="Pilih grup dulu"/>

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Anggota</SectionTitle>
        <Btn size="sm" onClick={() => setModal('add')}><Plus size={14}/>Tambah</Btn>
      </div>

      {/* Search + filter */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-beat-muted"/>
          <input
            className="w-full bg-beat-surface border border-beat-border rounded-lg pl-8 pr-4 py-2.5 text-sm font-body text-beat-text placeholder-beat-muted focus:outline-none focus:border-beat-accent transition-colors"
            placeholder="Cari nama atau instrumen..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ k: 'all', l: 'Semua' }, ...MEMBER_STATUS.map(s => ({ k: s.key, l: s.label }))].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-3 py-1 rounded-full text-xs font-body whitespace-nowrap border transition-all ${filter === f.k ? 'bg-beat-accent text-beat-bg border-beat-accent' : 'border-beat-border text-beat-muted hover:border-beat-muted'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner/> : filtered.length === 0
        ? <EmptyState icon="🎸" title="Tidak ada anggota" subtitle="Tambah anggota baru atau ubah filter pencarian"/>
        : (
          <div className="space-y-2">
            {filtered.map(m => (
              <Card key={m.member_id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-beat-surface border border-beat-border flex items-center justify-center text-sm font-display text-beat-accent flex-shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-body font-medium text-beat-text truncate">{m.name}</p>
                      <Badge label={MEMBER_STATUS.find(s => s.key === m.status)?.label} color={STATUS_COLOR[m.status]}/>
                    </div>
                    <p className="text-xs font-body text-beat-muted">{m.instrument} · {m.angkatan || '-'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(m)} className="p-2 text-beat-muted hover:text-beat-text transition-colors rounded-lg hover:bg-beat-surface">
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => setDelTarget(m)} className="p-2 text-beat-muted hover:text-beat-coral transition-colors rounded-lg hover:bg-beat-coral/10">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      {/* Add/Edit modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Tambah Anggota' : `Edit — ${modal?.name}`}>
        {modal && (
          <MemberForm
            initial={modal !== 'add' ? modal : undefined}
            onSave={handleSave}
            onCancel={() => setModal(null)}/>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Hapus Anggota">
        <p className="font-body text-sm text-beat-sub mb-4">
          Hapus <span className="text-beat-text font-medium">{delTarget?.name}</span>? Data absensi dan stats terkait tidak ikut terhapus.
        </p>
        <div className="flex gap-2 justify-end">
          <Btn variant="outline" onClick={() => setDelTarget(null)}>Batal</Btn>
          <Btn variant="danger" onClick={handleDelete}><Trash2 size={14}/>Hapus</Btn>
        </div>
      </Modal>
    </div>
  )
}
