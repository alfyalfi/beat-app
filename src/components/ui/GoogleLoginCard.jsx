import { useAuth } from '../../context/AuthContext'
import { useSync } from '../../context/AppContext'
import { LogIn, LogOut, RefreshCw, CheckCircle, AlertCircle, Cloud } from 'lucide-react'

export function GoogleLoginCard() {
  const { user, loggedIn, loading, error, synced, login, logout, isConfigured } = useAuth()
  const { isOnline, pendingCount, isSyncing, syncNow } = useSync()

  if (!isConfigured) {
    return (
      <div className="card-glass rounded-xl p-4 border border-beat-border">
        <div className="flex items-center gap-3 mb-2">
          <Cloud size={18} className="text-beat-muted"/>
          <span className="text-sm font-body font-medium text-beat-text">Google Sheets Sync</span>
        </div>
        <p className="text-xs font-body text-beat-muted">
          VITE_OAUTH_CLIENT_ID belum diisi di file <span className="text-beat-cyan font-mono">.env</span>
        </p>
      </div>
    )
  }

  return (
    <div className={`card-glass rounded-xl p-4 border transition-all ${
      loggedIn ? 'border-beat-cyan/30' : 'border-beat-border'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <Cloud size={18} className={loggedIn ? 'text-beat-cyan' : 'text-beat-muted'}
          style={loggedIn ? { filter: 'drop-shadow(0 0 6px #00e5ff)' } : {}}/>
        <span className="text-sm font-body font-medium text-beat-text">Google Sheets Sync</span>
        {loggedIn && synced && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-beat-green font-body">
            <CheckCircle size={10}/> Terhubung
          </span>
        )}
        {!loggedIn && (
          <span className="ml-auto text-[10px] text-beat-muted font-body">Belum login</span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg bg-beat-coral/10 border border-beat-coral/20">
          <AlertCircle size={13} className="text-beat-coral mt-0.5 flex-shrink-0"/>
          <p className="text-xs font-body text-beat-coral">{error}</p>
        </div>
      )}

      {loggedIn ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-body text-beat-sub">Login sebagai</p>
              <p className="text-sm font-body text-beat-text font-medium">{user?.email || 'Google User'}</p>
            </div>
          </div>

          {/* Sync status */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-beat-surface border border-beat-border">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-beat-cyan animate-pulse-dot' : 'bg-beat-coral'}`}
                style={isOnline ? { boxShadow: '0 0 6px #00e5ff' } : {}}/>
              <span className="text-xs font-body text-beat-sub">
                {isOnline
                  ? pendingCount > 0
                    ? `${pendingCount} perubahan menunggu`
                    : 'Semua tersinkronisasi'
                  : 'Offline'}
              </span>
            </div>
            <button onClick={syncNow} disabled={isSyncing || !isOnline}
              className="flex items-center gap-1 text-xs text-beat-cyan font-body hover:neon-text-cyan disabled:opacity-40">
              <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''}/>
              Sync
            </button>
          </div>

          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-body text-beat-muted hover:text-beat-coral border border-beat-border hover:border-beat-coral/30 rounded-lg transition-all">
            <LogOut size={13}/>Logout Google
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-body text-beat-sub leading-relaxed">
            Login dengan Google untuk menyinkronkan data ke Sheets secara otomatis.
          </p>
          <button onClick={login} disabled={loading || !isOnline}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-body text-sm font-semibold transition-all disabled:opacity-50
              bg-beat-yellow text-beat-bg hover:shadow-glow-yellow active:scale-95">
            {loading
              ? <><RefreshCw size={14} className="animate-spin"/>Menghubungkan...</>
              : <><LogIn size={14}/>Login dengan Google</>}
          </button>
          {!isOnline && (
            <p className="text-[10px] text-beat-muted font-body text-center">Butuh koneksi internet untuk login</p>
          )}
        </div>
      )}
    </div>
  )
}
