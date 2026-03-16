import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSync } from '../../context/AppContext'
import { pushAllToSheets, pullFromSheets } from '../../services/sync'
import {
  LogIn, LogOut, RefreshCw, CheckCircle,
  AlertCircle, Cloud, Upload, Download
} from 'lucide-react'

export function GoogleLoginCard({ onPullDone }) {
  const { user, loggedIn, loading, error, login, logout, isConfigured } = useAuth()
  const { isOnline, pendingCount, isSyncing, syncNow } = useSync()

  const [pushState, setPushState] = useState(null) // null | 'running' | 'done' | 'error'
  const [pullState, setPullState] = useState(null)
  const [progress,  setProgress]  = useState('')
  const [pushError, setPushError] = useState(null)

  async function handlePush() {
    setPushState('running')
    setPushError(null)
    try {
      await pushAllToSheets(({ table, done, total }) => {
        setProgress(table === 'selesai' ? 'Selesai!' : `Mengirim ${table}... (${done+1}/${total})`)
      })
      setPushState('done')
      setProgress('Semua data berhasil dikirim ke Sheets!')
    } catch (e) {
      setPushState('error')
      setPushError(e.message)
    }
  }

  async function handlePull() {
    setPullState('running')
    setPushError(null)
    try {
      await pullFromSheets(({ table, done, total }) => {
        setProgress(table === 'selesai' ? 'Selesai!' : `Mengambil ${table}... (${done+1}/${total})`)
      })
      setPullState('done')
      setProgress('Data dari Sheets berhasil dimuat!')
      onPullDone?.()
    } catch (e) {
      setPullState('error')
      setPushError(e.message)
    }
  }

  if (!isConfigured) {
    return (
      <div className="card-glass rounded-xl p-4 border border-beat-border">
        <div className="flex items-center gap-3 mb-2">
          <Cloud size={18} className="text-beat-muted"/>
          <span className="text-sm font-body font-medium text-beat-text">Google Sheets Sync</span>
        </div>
        <p className="text-xs font-body text-beat-muted">
          <span className="text-beat-cyan font-mono">VITE_OAUTH_CLIENT_ID</span> belum diisi di GitHub Secrets
        </p>
      </div>
    )
  }

  return (
    <div className={`card-glass rounded-xl p-4 border transition-all ${loggedIn ? 'border-beat-cyan/30' : 'border-beat-border'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Cloud size={18} className={loggedIn ? 'text-beat-cyan' : 'text-beat-muted'}
          style={loggedIn ? { filter: 'drop-shadow(0 0 6px #00e5ff)' } : {}}/>
        <span className="text-sm font-body font-medium text-beat-text">Google Sheets Sync</span>
        {loggedIn && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-beat-green font-body">
            <CheckCircle size={10}/> Login
          </span>
        )}
      </div>

      {/* Error */}
      {(error || pushError) && (
        <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg bg-beat-coral/10 border border-beat-coral/20">
          <AlertCircle size={13} className="text-beat-coral mt-0.5 flex-shrink-0"/>
          <p className="text-xs font-body text-beat-coral">{error || pushError}</p>
        </div>
      )}

      {/* Progress */}
      {progress && (pushState === 'running' || pullState === 'running' || pushState === 'done' || pullState === 'done') && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-body border ${
          (pushState === 'done' || pullState === 'done')
            ? 'bg-beat-green/10 text-beat-green border-beat-green/20'
            : 'bg-beat-cyan/10 text-beat-cyan border-beat-cyan/20'
        }`}>
          {(pushState === 'running' || pullState === 'running') && (
            <RefreshCw size={10} className="inline animate-spin mr-1"/>
          )}
          {(pushState === 'done' || pullState === 'done') && (
            <CheckCircle size={10} className="inline mr-1"/>
          )}
          {progress}
        </div>
      )}

      {loggedIn ? (
        <div className="space-y-3">
          {/* User info */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-beat-surface border border-beat-border">
            <p className="text-xs font-body text-beat-sub truncate">{user?.email}</p>
          </div>

          {/* Online status */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-beat-surface border border-beat-border">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-beat-cyan animate-pulse-dot' : 'bg-beat-coral'}`}
                style={isOnline ? { boxShadow: '0 0 6px #00e5ff' } : {}}/>
              <span className="text-xs font-body text-beat-sub">
                {isOnline
                  ? pendingCount > 0 ? `${pendingCount} perubahan pending` : 'Tersinkronisasi'
                  : 'Offline'}
              </span>
            </div>
            <button onClick={syncNow} disabled={isSyncing || !isOnline}
              className="flex items-center gap-1 text-xs text-beat-cyan font-body hover:neon-text-cyan disabled:opacity-40 transition-all">
              <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''}/>
              Sync
            </button>
          </div>

          {/* Push & Pull buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handlePush}
              disabled={pushState === 'running' || !isOnline}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-beat-cyan/20 bg-beat-cyan/5 hover:bg-beat-cyan/10 hover:border-beat-cyan/40 transition-all disabled:opacity-40 text-beat-cyan">
              {pushState === 'running'
                ? <RefreshCw size={16} className="animate-spin"/>
                : <Upload size={16}/>}
              <span className="text-[10px] font-body text-center leading-tight">
                {pushState === 'running' ? 'Mengirim...' : 'Kirim semua\nke Sheets'}
              </span>
            </button>

            <button onClick={handlePull}
              disabled={pullState === 'running' || !isOnline}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-beat-yellow/20 bg-beat-yellow/5 hover:bg-beat-yellow/10 hover:border-beat-yellow/40 transition-all disabled:opacity-40 text-beat-yellow">
              {pullState === 'running'
                ? <RefreshCw size={16} className="animate-spin"/>
                : <Download size={16}/>}
              <span className="text-[10px] font-body text-center leading-tight">
                {pullState === 'running' ? 'Mengambil...' : 'Ambil data\ndari Sheets'}
              </span>
            </button>
          </div>

          <p className="text-[10px] font-body text-beat-muted text-center leading-relaxed">
            Di HP baru → tap <span className="text-beat-yellow">Ambil data dari Sheets</span><br/>
            Setelah edit di laptop → tap <span className="text-beat-cyan">Kirim semua ke Sheets</span>
          </p>

          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-body text-beat-muted hover:text-beat-coral border border-beat-border hover:border-beat-coral/30 rounded-lg transition-all">
            <LogOut size={12}/>Logout Google
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-body text-beat-sub leading-relaxed">
            Login untuk menyinkronkan data antar device lewat Google Sheets.
          </p>
          <button onClick={login} disabled={loading || !isOnline}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-body text-sm font-semibold transition-all disabled:opacity-50 bg-beat-yellow text-beat-bg hover:shadow-glow-yellow active:scale-95">
            {loading
              ? <><RefreshCw size={14} className="animate-spin"/>Menghubungkan...</>
              : <><LogIn size={14}/>Login dengan Google</>}
          </button>
          {!isOnline && (
            <p className="text-[10px] text-beat-muted font-body text-center">Butuh koneksi internet</p>
          )}
        </div>
      )}
    </div>
  )
}
