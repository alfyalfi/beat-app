import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, Upload } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { useMembers } from '../hooks'
import { membersDB } from '../services/indexeddb'
import { enqueue } from '../services/sync'
import { importMembersFromExcel } from '../services/importExport'
import {
  Btn, Card, Modal, Input, Select, Textarea,
  EmptyState, Spinner, SectionTitle, Badge
} from '../components/ui'
import { INSTRUMENTS, MEMBER_STATUS, JABATAN } from '../utils/constants'

const STATUS_COLOR = {
  active:   'cyan',
  inactive: 'gray',
  alumni:   'purple',
  on_leave: 'yellow',
}

const JABATAN_COLOR = {
  'Ketua Band':    'yellow',
  'Wakil Ketua':   'yellow',
  'Vokalis Utama': 'cyan',
  'Manager':       'purple',
}

function MemberForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', instrument: 'Vokal', jabatan: 'Anggota', angkatan: '',
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
        <Select label="Jabatan" value={form.jabatan || 'Anggota'} onChange={e => set('jabatan', e.target.value)}>
          {JABATAN.map(j => <option key={j}>{j}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}>
          {MEMBER_STATUS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </Select>
        <Input label="Angkatan" placeholder="2023" value={form.angkatan}
          onChange={e => set('angkatan', e.target.value)}/>
      </div>
      <Input label="Bergabung" type="date" value={form.joined_at}
        onChange={e => set('joined_at', e.target.value)}/>
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
  const { members, loading, saveMember, deleteMember, reload } = useMembers(activeGroup?.group_id)

  const [modal,     setModal]     = useState(null)
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState('all')
  const [delTarget, setDelTarget] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const xlsxRef = useRef()

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = m.name.toLowerCase().includes(q) ||
      (m.instrument || '').toLowerCase().includes(q) ||
      (m.jabatan || '').toLowerCase().includes(q)
    const matchFilter = filter === 'all' || m.status === filter
    return matchSearch && matchFilter
  })

  async function handleSave(data) {
    await saveMember({ ...(modal !== 'add' ? modal : {}), ...data })
    setModal(null)
  }

  async function handleDelete() {
    if (!delTarget) return
    await deleteMember(delTarget.member_id)
    setDelTarget(null)
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file || !activeGroup) return
    setImporting(true)
    setImportMsg(null)
    try {
      const imported = await importMembersFromExcel(file, activeGroup.group_id)
      for (const m of imported) {
        await membersDB.put(m)
        await enqueue('upsert', 'members', m)
      }
      await reload()
      setImportMsg({ type: 'success', text: `${imported.length} anggota berhasil diimport!` })
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message })
    }
    setImporting(false)
    xlsxRef.current.value = ''
    setTimeout(() => setImportMsg(null), 4000)
  }

  if (!activeGroup) return <EmptyState icon="👥" title="Pilih grup dulu"/>

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Anggota</SectionTitle>
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={() => xlsxRef.current?.click()} disabled={importing}>
            <Upload size={13}/>{importing ? 'Import...' : 'Import'}
          </Btn>
          <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport}/>
          <Btn size="sm" onClick={() => setModal('add')}><Plus size={13}/>Tambah</Btn>
        </div>
      </div>

      {/* Import feedback */}
      {importMsg && (
        <div className={`mb-3 px-4 py-2.5 rounded-xl text-sm font-body border animate-slide-up ${
          importMsg.type === 'success'
            ? 'bg-beat-cyan/10 text-beat-cyan border-beat-cyan/30'
            : 'bg-beat-coral/10 text-beat-coral border-beat-coral/30'
        }`}>
          {importMsg.text}
        </div>
      )}

      {/* Import hint */}
      <div className="mb-3 px-3 py-2 rounded-lg bg-beat-surface border border-beat-border text-[11px] font-body text-beat-muted">
        Template Excel: kolom <span className="text-beat-cyan font-mono">name</span>, <span className="text-beat-cyan font-mono">instrument</span>, <span className="text-beat-cyan font-mono">jabatan</span>, <span className="text-beat-cyan font-mono">angkatan</span>
      </div>

      {/* Search + filter */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-beat-muted"/>
          <input
            className="w-full bg-beat-surface border border-beat-border rounded-lg pl-8 pr-4 py-2.5 text-sm font-body text-beat-text placeholder-beat-muted focus:outline-none focus:border-beat-cyan transition-all"
            placeholder="Cari nama, instrumen, jabatan..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{ k: 'all', l: 'Semua' }, ...MEMBER_STATUS.map(s => ({ k: s.key, l: s.label }))].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              className={`px-3 py-1 rounded-full text-xs font-body whitespace-nowrap border transition-all ${
                filter === f.k
                  ? 'bg-beat-cyan text-beat-bg border-beat-cyan font-semibold'
                  : 'border-beat-border text-beat-muted hover:border-beat-bordhi hover:text-beat-sub'
              }`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? <Spinner/> : filtered.length === 0
        ? <EmptyState icon="🎸" title="Tidak ada anggota" subtitle="Tambah anggota atau ubah filter"/>
        : (
          <div className="space-y-2">
            {filtered.map(m => (
              <Card key={m.member_id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-display font-bold text-beat-bg"
                    style={{ background: 'linear-gradient(135deg, #00e5ff, #007acc)', boxShadow: '0 0 10px rgba(0,229,255,0.3)' }}>
                    {m.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-body font-medium text-beat-text truncate">{m.name}</p>
                      <Badge label={MEMBER_STATUS.find(s => s.key === m.status)?.label} color={STATUS_COLOR[m.status]}/>
                      {m.jabatan && m.jabatan !== 'Anggota' && (
                        <Badge label={m.jabatan} color={JABATAN_COLOR[m.jabatan] || 'gray'}/>
                      )}
                    </div>
                    <p className="text-xs font-body text-beat-muted mt-0.5">
                      {m.instrument}
                      {m.jabatan && <span className="text-beat-sub"> · {m.jabatan}</span>}
                      {m.angkatan && <span> · {m.angkatan}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal(m)}
                      className="p-2 text-beat-muted hover:text-beat-cyan transition-colors rounded-lg hover:bg-beat-cyan/5">
                      <Pencil size={13}/>
                    </button>
                    <button onClick={() => setDelTarget(m)}
                      className="p-2 text-beat-muted hover:text-beat-coral transition-colors rounded-lg hover:bg-beat-coral/10">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal === 'add' ? 'Tambah Anggota' : `Edit — ${modal?.name}`}>
        {modal && (
          <MemberForm initial={modal !== 'add' ? modal : undefined}
            onSave={handleSave} onCancel={() => setModal(null)}/>
        )}
      </Modal>

      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="Hapus Anggota">
        <p className="font-body text-sm text-beat-sub mb-4">
          Hapus <span className="text-beat-text font-medium">{delTarget?.name}</span>?
          Data absensi dan stats terkait tidak ikut terhapus.
        </p>
        <div className="flex gap-2 justify-end">
          <Btn variant="outline" onClick={() => setDelTarget(null)}>Batal</Btn>
          <Btn variant="danger" onClick={handleDelete}><Trash2 size={13}/>Hapus</Btn>
        </div>
      </Modal>
    </div>
  )
}
