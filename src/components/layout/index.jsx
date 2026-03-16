import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, Users, BarChart2, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useGroup, useSync } from '../../context/AppContext'
import { useState, useEffect, useRef } from 'react'

const NAV = [
  { to: '/',           icon: Home,          label: 'Home'    },
  { to: '/sessions',   icon: ClipboardList, label: 'Sesi'    },
  { to: '/members',    icon: Users,         label: 'Anggota' },
  { to: '/stats',      icon: BarChart2,     label: 'Stats'   },
  { to: '/settings',   icon: Settings,      label: 'Kelola'  },
]

export function Navbar() {
  const { activeGroup, groups, setActiveGroup } = useGroup()
  const { isOnline, pendingCount, isSyncing, syncNow } = useSync()
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <header className="sticky top-0 z-40 bg-beat-bg/80 backdrop-blur border-b border-beat-border">
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
        {/* Logo */}
        <span className="font-display text-beat-accent font-bold text-lg tracking-tight">BEAT</span>

        {/* Group Switcher */}
        <div className="relative" ref={dropRef}>
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-beat-surface border border-beat-border text-beat-text text-xs font-body hover:border-beat-muted transition-colors">
            <span className="w-2 h-2 rounded-full bg-beat-accent inline-block"/>
            <span className="max-w-[120px] truncate">{activeGroup?.group_name ?? 'Pilih Grup'}</span>
            <span className="text-beat-muted">▾</span>
          </button>
          {open && (
            <div className="absolute top-10 right-0 w-52 bg-beat-card border border-beat-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              {groups.map(g => (
                <button key={g.group_id}
                  className={`w-full text-left px-4 py-3 text-xs font-body hover:bg-beat-surface transition-colors ${g.group_id === activeGroup?.group_id ? 'text-beat-accent' : 'text-beat-text'}`}
                  onClick={() => { setActiveGroup(g); setOpen(false) }}>
                  {g.group_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sync indicator */}
        <button onClick={syncNow} disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs font-body transition-colors"
          title={isOnline ? `${pendingCount} pending` : 'Offline'}>
          {isOnline
            ? <Wifi size={14} className={pendingCount > 0 ? 'text-beat-amber' : 'text-beat-teal'}/>
            : <WifiOff size={14} className="text-beat-coral"/>}
          {isOnline && pendingCount > 0 && (
            <span className="text-beat-amber">{pendingCount}</span>
          )}
          {isSyncing && <RefreshCw size={12} className="text-beat-accent animate-spin"/>}
        </button>
      </div>
    </header>
  )
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-beat-bg/90 backdrop-blur border-t border-beat-border">
      <div className="flex items-center justify-around max-w-2xl mx-auto h-16 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${isActive ? 'text-beat-accent' : 'text-beat-muted hover:text-beat-sub'}`
            }>
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5}/>
                <span className="text-[10px] font-body">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
