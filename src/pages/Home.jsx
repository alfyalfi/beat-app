import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, Music2, Trash2, Pencil, Zap } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { groupsDB } from '../services/indexeddb'
import { enqueue } from '../services/sync'
import { generateId } from '../utils/helpers'
import { Btn, Modal, Input, Textarea } from '../components/ui'

function GroupCard({ group, isActive, onSelect, onEdit, onDelete }) {
  const isYellow = (group.group_name || '').toLowerCase().includes('pixie') ||
                   (group.group_name || '').toLowerCase().includes('yellow')
  const accent = isYellow ? '#f5a623' : '#00b4d8'
  const accentBg = isYellow ? 'rgba(245,166,35,0.08)' : 'rgba(0,180,216,0.08)'
  const accentBorder = isYellow ? 'rgba(245,166,35,0.3)' : 'rgba(0,180,216,0.3)'

  return (
    <div
      className="relative card-glass rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-card-lift active:scale-[0.98] group"
      style={isActive ? { border: `1px solid ${accentBorder}`, boxShadow: `0 2px 16px ${accentBg}` } : {}}
      onClick={() => onSelect(group)}>

      <div className="flex items-center gap-3.5">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: isActive ? accentBg : 'rgba(0,0,0,0.04)', border: `1px solid ${isActive ? accentBorder : 'rgba(0,0,0,0.06)'}` }}>
          <Music2 size={20} style={{ color: isActive ? accent : '#9aa0ad' }}/>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-sm text-m-text truncate">{group.group_name}</h3>
            {isActive && (
              <span className="text-[9px] font-body font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: accentBg, color: accent, border: `1px solid ${accentBorder}` }}>
                Aktif
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-xs text-m-muted mt-0.5 truncate">{group.description}</p>
          )}
        </div>

        <ChevronRight size={15} className="text-m-muted flex-shrink-0 group-hover:text-m-sub transition-colors"/>
      </div>

      {/* Edit/Delete — show on hover */}
      <div className="absolute top-3 right-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(group)}
          className="p-1.5 rounded-lg text-m-muted hover:text-m-cyandark hover:bg-slate-100 transition-colors">
          <Pencil size={12}/>
        </button>
        <button onClick={() => onDelete(group)}
          className="p-1.5 rounded-lg text-m-muted hover:text-m-coral hover:bg-red-50 transition-colors">
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  )
}

function GroupForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { group_name: '', description: '' })
  return (
    <div className="space-y-4">
      <Input label="Nama grup" placeholder="Sound A Little Pixie"
        value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))}/>
      <Textarea label="Deskripsi (opsional)" placeholder="Genre, tahun berdiri, dll."
        value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
      <div className="flex gap-2 justify-end">
        <Btn variant="outline" onClick={onCancel}>Batal</Btn>
        <Btn onClick={() => onSave(form)} disabled={!form.group_name.trim()}>Simpan</Btn>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { groups, activeGroup, setActiveGroup, refreshGroups } = useGroup()
  const [groupModal, setGroupModal] = useState(null)
  const [delGroup,   setDelGroup]   = useState(null)

  async function handleSaveGroup(data) {
    const now = new Date().toISOString()
    const isNew = !groupModal || groupModal === 'add'
    const g = {
      ...(isNew ? {} : groupModal), ...data,
      group_id:   isNew ? generateId('GRP') : groupModal.group_id,
      is_active:  true,
      created_at: isNew ? now : (groupModal?.created_at || now),
      updated_at: now,
    }
    await groupsDB.put(g)
    await enqueue('upsert', 'groups', g)
    await refreshGroups()
    if (isNew) setActiveGroup(g)
    setGroupModal(null)
  }

  async function handleDeleteGroup() {
    if (!delGroup) return
    await groupsDB.delete(delGroup.group_id)
    await enqueue('delete', 'groups', delGroup)
    await refreshGroups()
    if (activeGroup?.group_id === delGroup.group_id) {
      const remaining = groups.filter(g => g.group_id !== delGroup.group_id)
      setActiveGroup(remaining[0] ?? null)
    }
    setDelGroup(null)
  }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 pt-8 pb-28 max-w-2xl mx-auto animate-fade-in">

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-glow)' }}>
          <Zap size={28} style={{ color: 'var(--accent)' }}/>
        </div>
        <h1 className="font-display font-bold text-2xl text-m-text tracking-tight mb-1">
          Pilih Grup
        </h1>
        <p className="text-m-muted text-sm font-body">
          {groups.length === 0 ? 'Buat grup pertamamu untuk mulai' : 'Tap kartu untuk membuka dashboard'}
        </p>
      </div>

      {/* Group list */}
      <div className="space-y-2.5 mb-5">
        {groups.map(g => (
          <GroupCard
            key={g.group_id} group={g}
            isActive={activeGroup?.group_id === g.group_id}
            onSelect={g => { setActiveGroup(g); navigate('/dashboard') }}
            onEdit={g => setGroupModal(g)}
            onDelete={g => setDelGroup(g)}
          />
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-6 mb-5">
          <p className="text-4xl mb-3 opacity-30">🎸</p>
          <p className="text-m-muted text-sm">Belum ada grup. Buat sekarang!</p>
        </div>
      )}

      <Btn className="w-full justify-center" onClick={() => setGroupModal('add')}>
        <Plus size={15}/>Buat Grup Baru
      </Btn>

      <Modal open={!!groupModal} onClose={() => setGroupModal(null)}
        title={groupModal === 'add' ? 'Buat Grup Baru' : `Edit — ${groupModal?.group_name}`}>
        {groupModal && (
          <GroupForm initial={groupModal !== 'add' ? groupModal : undefined}
            onSave={handleSaveGroup} onCancel={() => setGroupModal(null)}/>
        )}
      </Modal>

      <Modal open={!!delGroup} onClose={() => setDelGroup(null)} title="Hapus Grup">
        <p className="text-sm text-m-sub mb-1 font-body">
          Hapus <span className="text-m-text font-semibold">{delGroup?.group_name}</span>?
        </p>
        <p className="text-xs text-m-coral mb-4 font-body">Data anggota & sesi tidak ikut terhapus dari perangkat.</p>
        <div className="flex gap-2 justify-end">
          <Btn variant="outline" onClick={() => setDelGroup(null)}>Batal</Btn>
          <Btn variant="danger" onClick={handleDeleteGroup}><Trash2 size={13}/>Hapus</Btn>
        </div>
      </Modal>
    </div>
  )
}
