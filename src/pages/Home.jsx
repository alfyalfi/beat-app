import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Zap, ChevronRight, Users, Music2, Trash2, Pencil } from 'lucide-react'
import { useGroup } from '../context/AppContext'
import { groupsDB } from '../services/indexeddb'
import { enqueue } from '../services/sync'
import { generateId } from '../utils/helpers'
import { Btn, Modal, Input, Textarea } from '../components/ui'

function GroupCard({ group, isActive, onSelect, onEdit, onDelete }) {
  return (
    <div
      className={`relative card-glass rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group ${
        isActive ? 'border-beat-cyan/40' : 'hover:border-beat-cyan/20'
      }`}
      style={isActive ? { boxShadow: '0 0 30px rgba(0,229,255,0.12), inset 0 1px 0 rgba(0,229,255,0.1)' } : {}}
      onClick={() => onSelect(group)}
    >
      {/* Active dot */}
      {isActive && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-beat-cyan animate-pulse-dot"
          style={{ boxShadow: '0 0 8px #00e5ff' }}/>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isActive
              ? 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,122,204,0.1))'
              : 'rgba(255,255,255,0.04)',
            border: isActive ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.06)'
          }}>
          <Music2 size={22} style={{ color: isActive ? '#00e5ff' : '#44445a',
            filter: isActive ? 'drop-shadow(0 0 6px #00e5ff)' : 'none' }}/>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-display font-bold text-base leading-tight truncate ${
            isActive ? 'text-beat-cyan neon-text-cyan' : 'text-beat-text'
          }`}>
            {group.group_name}
          </h3>
          {group.description && (
            <p className="text-xs font-body text-beat-muted mt-1 truncate">{group.description}</p>
          )}
          {isActive && (
            <span className="inline-block mt-2 text-[10px] font-body text-beat-cyan bg-beat-cyan/10 border border-beat-cyan/20 px-2 py-0.5 rounded-full">
              Aktif
            </span>
          )}
        </div>

        <ChevronRight size={16} className={`flex-shrink-0 mt-1 transition-colors ${
          isActive ? 'text-beat-cyan' : 'text-beat-muted group-hover:text-beat-sub'
        }`}/>
      </div>

      {/* Edit/Delete */}
      <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(group)}
          className="p-1.5 rounded-lg text-beat-muted hover:text-beat-cyan hover:bg-beat-cyan/10 transition-colors">
          <Pencil size={12}/>
        </button>
        <button onClick={() => onDelete(group)}
          className="p-1.5 rounded-lg text-beat-muted hover:text-beat-coral hover:bg-beat-coral/10 transition-colors">
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
      ...(isNew ? {} : groupModal),
      ...data,
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

  function handleSelect(group) {
    setActiveGroup(group)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 pt-8 pb-24 max-w-2xl mx-auto animate-fade-in">

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 relative"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.12), rgba(0,122,204,0.06))',
            border: '1px solid rgba(0,229,255,0.2)',
            boxShadow: '0 0 40px rgba(0,229,255,0.12)'
          }}>
          <Zap size={36} className="text-beat-cyan" style={{ filter: 'drop-shadow(0 0 10px #00e5ff)' }}/>
          {/* Scan line */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-beat-cyan/40 to-transparent animate-scan"/>
          </div>
        </div>
        <h1 className="font-display font-black text-3xl text-beat-cyan neon-text-cyan tracking-widest mb-2">
          BEAT
        </h1>
        <p className="text-beat-sub font-body text-sm">
          {groups.length === 0
            ? 'Buat grup pertamamu untuk mulai'
            : 'Pilih grup untuk membuka dashboard'}
        </p>
      </div>

      {/* Group list */}
      {groups.length > 0 && (
        <div className="space-y-3 mb-6">
          {groups.map(g => (
            <GroupCard
              key={g.group_id}
              group={g}
              isActive={activeGroup?.group_id === g.group_id}
              onSelect={handleSelect}
              onEdit={g => setGroupModal(g)}
              onDelete={g => setDelGroup(g)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="text-center py-8 mb-6">
          <div className="text-5xl mb-4 opacity-20">🎸</div>
          <p className="text-beat-sub font-body text-sm">Belum ada grup. Buat sekarang!</p>
        </div>
      )}

      {/* Add group button */}
      <Btn
        className="w-full justify-center py-3"
        onClick={() => setGroupModal('add')}
      >
        <Plus size={16}/>Buat Grup Baru
      </Btn>

      {/* Hint jika ada grup */}
      {groups.length > 0 && (
        <p className="text-center text-[11px] font-body text-beat-muted mt-4">
          Tap kartu grup untuk masuk ke dashboard
        </p>
      )}

      {/* Modals */}
      <Modal open={!!groupModal} onClose={() => setGroupModal(null)}
        title={groupModal === 'add' ? 'Buat Grup Baru' : `Edit — ${groupModal?.group_name}`}>
        {groupModal && (
          <GroupForm
            initial={groupModal !== 'add' ? groupModal : undefined}
            onSave={handleSaveGroup}
            onCancel={() => setGroupModal(null)}
          />
        )}
      </Modal>

      <Modal open={!!delGroup} onClose={() => setDelGroup(null)} title="Hapus Grup">
        <p className="font-body text-sm text-beat-sub mb-1">
          Hapus grup <span className="text-beat-text font-medium">{delGroup?.group_name}</span>?
        </p>
        <p className="font-body text-xs text-beat-coral mb-4">
          Data anggota, sesi, dan absensi tidak ikut terhapus dari IndexedDB.
        </p>
        <div className="flex gap-2 justify-end">
          <Btn variant="outline" onClick={() => setDelGroup(null)}>Batal</Btn>
          <Btn variant="danger" onClick={handleDeleteGroup}><Trash2 size={14}/>Hapus</Btn>
        </div>
      </Modal>
    </div>
  )
}
