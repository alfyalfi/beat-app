import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Download, Upload, Database, RefreshCw, FileSpreadsheet } from 'lucide-react'
import { useGroup, useSync } from '../context/AppContext'
import { groupsDB, membersDB } from '../services/indexeddb'
import { enqueue } from '../services/sync'
import { exportGroupToExcel, createBackup, restoreBackup, importMembersFromExcel } from '../services/importExport'
import { Btn, Card, Modal, Input, Textarea, EmptyState, SectionTitle } from '../components/ui'
import { generateId, formatDateTime } from '../utils/helpers'

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

export default function Settings() {
  const { groups, activeGroup, refreshGroups, setActiveGroup } = useGroup()
  const { isOnline, pendingCount, isSyncing, syncNow } = useSync()

  const [groupModal,  setGroupModal]  = useState(null)
  const [delGroup,    setDelGroup]    = useState(null)
  const [importing,   setImporting]   = useState(false)
  const [toast,       setToast]       = useState(null)
  const fileRef  = useRef()
  const xlsxRef  = useRef()

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Group CRUD ────────────────────────────────────────────
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
    showToast(isNew ? 'Grup berhasil dibuat' : 'Grup diperbarui')
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
    showToast('Grup dihapus', 'error')
  }

  // ── Import Excel ──────────────────────────────────────────
  async function handleImportExcel(e) {
    const file = e.target.files?.[0]
    if (!file || !activeGroup) return
    setImporting(true)
    try {
      const members = await importMembersFromExcel(file, activeGroup.group_id)
      for (const m of members) {
        await membersDB.put(m)
        await enqueue('upsert', 'members', m)
      }
      showToast(`${members.length} anggota berhasil diimport`)
    } catch (err) {
      showToast(err.message, 'error')
    }
    setImporting(false)
    xlsxRef.current.value = ''
  }

  // ── Backup/Restore ────────────────────────────────────────
  async function handleBackup() {
    if (!activeGroup) return
    await createBackup(activeGroup.group_id)
    showToast('Backup berhasil diunduh')
  }

  async function handleRestore(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const gid = await restoreBackup(file)
      await refreshGroups()
      showToast('Restore berhasil')
    } catch (err) {
      showToast(err.message, 'error')
    }
    fileRef.current.value = ''
  }

  return (
    <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto animate-fade-in space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-body shadow-lg animate-slide-up
          ${toast.type === 'error' ? 'bg-beat-coral text-white' : 'bg-beat-cyan text-beat-bg'}`}>
          {toast.msg}
        </div>
      )}

      {/* Sync status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-body font-medium text-beat-text">Sinkronisasi</p>
            <p className="text-xs font-body text-beat-muted mt-0.5">
              {isOnline
                ? pendingCount > 0
                  ? `${pendingCount} perubahan menunggu sync`
                  : 'Semua data tersinkronisasi'
                : 'Offline — perubahan disimpan lokal'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-beat-cyan animate-pulse-dot' : 'bg-beat-coral'}`}/>
            <Btn size="sm" variant="ghost" onClick={syncNow} disabled={isSyncing || !isOnline}>
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''}/>
              Sync
            </Btn>
          </div>
        </div>
      </Card>

      {/* Groups management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Manajemen Grup</SectionTitle>
          <Btn size="sm" onClick={() => setGroupModal('add')}><Plus size={14}/>Tambah</Btn>
        </div>
        <div className="space-y-2">
          {groups.length === 0
            ? <EmptyState icon="🎵" title="Belum ada grup" subtitle="Buat grup pertama untuk mulai"/>
            : groups.map(g => (
              <Card key={g.group_id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-body font-medium text-beat-text truncate">{g.group_name}</p>
                      {activeGroup?.group_id === g.group_id && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-beat-cyan/10 text-beat-cyan border border-beat-cyan/20 font-body">aktif</span>
                      )}
                    </div>
                    {g.description && <p className="text-xs font-body text-beat-muted truncate">{g.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setGroupModal(g)} className="p-2 text-beat-muted hover:text-beat-text rounded-lg hover:bg-beat-surface transition-colors">
                      <Pencil size={14}/>
                    </button>
                    <button onClick={() => setDelGroup(g)} className="p-2 text-beat-muted hover:text-beat-coral rounded-lg hover:bg-beat-coral/10 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* Data tools */}
      {activeGroup && (
        <div>
          <SectionTitle>Data — {activeGroup.group_name}</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {/* Import Excel */}
            <button onClick={() => xlsxRef.current?.click()}
              disabled={importing}
              className="flex flex-col items-center gap-2 p-4 card-glass rounded-xl hover:border-beat-muted transition-all active:scale-95">
              <Upload size={20} className="text-beat-cyan"/>
              <span className="text-xs font-body text-beat-sub text-center">
                {importing ? 'Mengimport...' : 'Import Anggota\nfrom Excel'}
              </span>
            </button>
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel}/>

            {/* Export Excel */}
            <button onClick={() => exportGroupToExcel(activeGroup.group_id, activeGroup.group_name)}
              className="flex flex-col items-center gap-2 p-4 card-glass rounded-xl hover:border-beat-muted transition-all active:scale-95">
              <FileSpreadsheet size={20} className="text-beat-yellow"/>
              <span className="text-xs font-body text-beat-sub text-center">Export Data\nke Excel</span>
            </button>

            {/* Backup JSON */}
            <button onClick={handleBackup}
              className="flex flex-col items-center gap-2 p-4 card-glass rounded-xl hover:border-beat-muted transition-all active:scale-95">
              <Download size={20} className="text-beat-purple"/>
              <span className="text-xs font-body text-beat-sub text-center">Backup JSON</span>
            </button>

            {/* Restore */}
            <button onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-2 p-4 card-glass rounded-xl hover:border-beat-muted transition-all active:scale-95">
              <Database size={20} className="text-beat-coral"/>
              <span className="text-xs font-body text-beat-sub text-center">Restore\nBackup</span>
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore}/>
          </div>

          {/* Excel template hint */}
          <p className="text-xs font-body text-beat-muted mt-3 text-center">
            Template Excel: kolom <code className="text-beat-cyan">name</code>, <code className="text-beat-cyan">instrument</code>, <code className="text-beat-cyan">angkatan</code>
          </p>
        </div>
      )}

      {/* Group modals */}
      <Modal open={!!groupModal} onClose={() => setGroupModal(null)}
        title={groupModal === 'add' ? 'Buat Grup Baru' : `Edit — ${groupModal?.group_name}`}>
        {groupModal && (
          <GroupForm
            initial={groupModal !== 'add' ? groupModal : undefined}
            onSave={handleSaveGroup}
            onCancel={() => setGroupModal(null)}/>
        )}
      </Modal>

      <Modal open={!!delGroup} onClose={() => setDelGroup(null)} title="Hapus Grup">
        <p className="font-body text-sm text-beat-sub mb-1">
          Hapus grup <span className="text-beat-text font-medium">{delGroup?.group_name}</span>?
        </p>
        <p className="font-body text-xs text-beat-coral mb-4">
          Data anggota, sesi, dan absensi dalam grup ini tidak ikut terhapus dari IndexedDB, namun grup tidak lagi tampil.
        </p>
        <div className="flex gap-2 justify-end">
          <Btn variant="outline" onClick={() => setDelGroup(null)}>Batal</Btn>
          <Btn variant="danger" onClick={handleDeleteGroup}><Trash2 size={14}/>Hapus</Btn>
        </div>
      </Modal>
    </div>
  )
}
