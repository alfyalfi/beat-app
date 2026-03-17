import { NavLink, useNavigate } from 'react-router-dom'
import { Home, ClipboardList, Users, BarChart2, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useGroup, useSync } from '../../context/AppContext'
import { useState, useEffect, useRef } from 'react'

const NAV = [
  { to: '/',         icon: Home,          label: 'Grup',    end: true },
  { to: '/sessions', icon: ClipboardList, label: 'Sesi'    },
  { to: '/members',  icon: Users,         label: 'Anggota' },
  { to: '/stats',    icon: BarChart2,     label: 'Stats'   },
  { to: '/settings', icon: Settings,      label: 'Kelola'  },
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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-m-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto gap-3">

        {/* Logo */}
        <NavLink to="/"
          className="font-display font-bold text-lg tracking-tight neon-text shrink-0">
          Mentor
        </NavLink>

        {/* Group switcher */}
        <div className="relative flex-1 max-w-[180px]" ref={dropRef}>
          <button onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-m-border text-m-text text-xs font-body hover:border-m-bordhi transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot flex-shrink-0"/>
            <span className="truncate flex-1 text-left">{activeGroup?.group_name ?? 'Pilih Grup'}</span>
            <span className="text-m-muted text-[10px] flex-shrink-0">▾</span>
          </button>
          {open && (
            <div className="absolute top-10 left-0 right-0 bg-white rounded-xl shadow-card-md z-50 overflow-hidden animate-fade-in border border-m-border">
              {groups.length === 0
                ? <p className="px-4 py-3 text-xs text-m-muted font-body">Belum ada grup</p>
                : groups.map(g => (
                  <button key={g.group_id}
                    className={`w-full text-left px-4 py-2.5 text-xs font-body hover:bg-slate-50 transition-colors border-b border-m-border last:border-0 ${
                      g.group_id === activeGroup?.group_id ? 'text-[var(--accent)] font-semibold' : 'text-m-text'
                    }`}
                    onClick={() => { setActiveGroup(g); setOpen(false); navigate('/dashboard') }}>
                    {g.group_id === activeGroup?.group_id && <span className="mr-1.5">▶</span>}
                    {g.group_name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Sync */}
        <button onClick={syncNow} disabled={isSyncing}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          title={!isOnline ? 'Offline' : pendingCount > 0 ? `${pendingCount} pending` : lastSyncedAt ? `Sync ${lastSyncedAt.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}` : 'Sync'}>
          {isSyncing
            ? <RefreshCw size={15} className="text-[var(--accent)] animate-spin"/>
            : isOnline
              ? <Wifi size={15} className={pendingCount > 0 ? 'text-m-yellow' : 'text-[var(--accent)]'}/>
              : <WifiOff size={15} className="text-m-coral"/>
          }
        </button>
      </div>
    </header>
  )
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-m-border">
      <div className="flex items-center justify-around max-w-2xl mx-auto h-16 px-1">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                isActive ? 'text-[var(--accent)]' : 'text-m-muted hover:text-m-sub'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8}/>
                <span className="text-[10px] font-body font-medium">{label}</span>
                {isActive && (
                  <span className="absolute -bottom-0 w-6 h-0.5 bg-[var(--accent)] rounded-full"
                    style={{ boxShadow: '0 0 6px var(--accent-glow)' }}/>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
