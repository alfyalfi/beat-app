import { NavLink, useNavigate } from 'react-router-dom'
import { Home, ClipboardList, Users, BarChart2, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useGroup, useSync } from '../../context/AppContext'
import { useState, useEffect, useRef } from 'react'

const NAV = [
  { to: '/',          icon: Home,          label: 'Grup',    end: true },
  { to: '/sessions',  icon: ClipboardList, label: 'Sesi'    },
  { to: '/members',   icon: Users,         label: 'Anggota' },
  { to: '/stats',     icon: BarChart2,     label: 'Stats'   },
  { to: '/settings',  icon: Settings,      label: 'Kelola'  },
]

export function Navbar() {
  const { activeGroup, groups, setActiveGroup } = useGroup()
  const { isOnline, pendingCount, isSyncing, syncNow, lastSyncedAt } = useSync()
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <header className="sticky top-0 z-40 bg-beat-bg/80 backdrop-blur-xl border-b border-beat-border"
      style={{ boxShadow: '0 1px 0 rgba(0,229,255,0.08)' }}>
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
        <NavLink to="/" className="font-display font-black text-xl tracking-widest text-beat-cyan neon-text-cyan">
          BEAT
        </NavLink>

        <div className="relative" ref={dropRef}>
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg card-glass text-beat-text text-xs font-body hover:border-beat-cyan/30 transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-beat-cyan animate-pulse-dot"
              style={{ boxShadow: '0 0 6px #00e5ff' }}/>
            <span className="max-w-[110px] truncate">{activeGroup?.group_name ?? 'Pilih Grup'}</span>
            <span className="text-beat-muted text-[10px]">▾</span>
          </button>
          {open && (
            <div className="absolute top-10 right-0 w-52 card-glass rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in border border-beat-cyan/15">
              {groups.length === 0
                ? <p className="px-4 py-3 text-xs text-beat-muted font-body">Belum ada grup</p>
                : groups.map(g => (
                  <button key={g.group_id}
                    className={`w-full text-left px-4 py-3 text-xs font-body hover:bg-beat-cyan/5 transition-colors border-b border-beat-border last:border-0 ${g.group_id === activeGroup?.group_id ? 'text-beat-cyan' : 'text-beat-text'}`}
                    onClick={() => { setActiveGroup(g); setOpen(false); navigate('/dashboard') }}>
                    {g.group_id === activeGroup?.group_id && <span className="mr-2 text-beat-cyan">▶</span>}
                    {g.group_name}
                  </button>
                ))}
            </div>
          )}
        </div>

        <button onClick={syncNow} disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs font-body transition-colors p-2 rounded-lg hover:bg-beat-surface"
          title={
            !isOnline ? 'Offline' :
            isSyncing ? 'Menyinkronkan...' :
            pendingCount > 0 ? `${pendingCount} perubahan pending` :
            lastSyncedAt ? `Tersinkron ${lastSyncedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` :
            'Klik untuk sync'
          }>
          {isOnline
            ? <Wifi size={14} className={pendingCount > 0 ? 'text-beat-yellow' : 'text-beat-cyan'}
                style={{ filter: `drop-shadow(0 0 4px ${pendingCount > 0 ? '#ffe600' : '#00e5ff'})` }}/>
            : <WifiOff size={14} className="text-beat-coral"/>}
          {isOnline && pendingCount > 0 && <span className="text-beat-yellow text-[10px]">{pendingCount}</span>}
          {isSyncing && <RefreshCw size={12} className="text-beat-cyan animate-spin"/>}
        </button>
      </div>
    </header>
  )
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-beat-bg/90 backdrop-blur-xl border-t border-beat-border"
      style={{ boxShadow: '0 -1px 0 rgba(0,229,255,0.06)' }}>
      <div className="flex items-center justify-around max-w-2xl mx-auto h-16 px-2">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'text-beat-cyan' : 'text-beat-muted hover:text-beat-sub'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5}
                  style={isActive ? { filter: 'drop-shadow(0 0 6px #00e5ff)' } : {}}/>
                <span className="text-[10px] font-body tracking-wide">{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-8 h-0.5 bg-beat-cyan rounded-full"
                    style={{ boxShadow: '0 0 8px #00e5ff' }}/>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
