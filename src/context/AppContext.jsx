import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { groupsDB, syncQueueDB } from '../services/indexeddb'
import { initSync, runSync } from '../services/sync'

// ── Theme helper — detect accent color from group name ────────
function getGroupTheme(group) {
  if (!group) return 'cyan'
  const name = (group.group_name || '').toLowerCase()
  // Yellow keywords
  const yellowKeys = ['pixie', 'yellow', 'gold', 'sunny', 'warm', 'amber']
  if (yellowKeys.some(k => name.includes(k))) return 'yellow'
  return 'cyan'
}

function applyTheme(theme) {
  if (theme === 'yellow') {
    document.documentElement.setAttribute('data-theme', 'yellow')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// ── Group Context ──────────────────────────────────────────────
const GroupCtx = createContext(null)

export function GroupProvider({ children }) {
  const [groups,      setGroups]      = useState([])
  const [activeGroup, setActiveGroupState] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [theme,       setTheme]       = useState('cyan')

  const loadGroups = useCallback(async () => {
    const gs = await groupsDB.getAll()
    setGroups(gs)
    const lastId = localStorage.getItem('beat_active_group')
    const found  = gs.find(g => g.group_id === lastId) ?? gs[0] ?? null
    setActiveGroupState(found)
    const t = getGroupTheme(found)
    setTheme(t)
    applyTheme(t)
    setLoading(false)
  }, [])

  useEffect(() => { loadGroups() }, [loadGroups])

  const setActiveGroup = useCallback((g) => {
    setActiveGroupState(g)
    const t = getGroupTheme(g)
    setTheme(t)
    applyTheme(t)
    if (g) localStorage.setItem('beat_active_group', g.group_id)
  }, [])

  const refreshGroups = useCallback(async () => {
    const gs = await groupsDB.getAll()
    setGroups(gs)
    if (activeGroup) {
      const updated = gs.find(g => g.group_id === activeGroup.group_id)
      if (updated) setActiveGroupState(updated)
    }
  }, [activeGroup])

  return (
    <GroupCtx.Provider value={{ groups, activeGroup, setActiveGroup, loading, refreshGroups, theme }}>
      {children}
    </GroupCtx.Provider>
  )
}

export const useGroup = () => useContext(GroupCtx)

// ── Sync Context ───────────────────────────────────────────────
const SyncCtx = createContext(null)

export function SyncProvider({ children }) {
  const [isOnline,     setIsOnline]     = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing,    setIsSyncing]    = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  useEffect(() => {
    initSync()
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      const c = await syncQueueDB.countPending()
      setPendingCount(c)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const syncNow = useCallback(async () => {
    setIsSyncing(true)
    await runSync()
    setIsSyncing(false)
    const c = await syncQueueDB.countPending()
    setPendingCount(c)
    if (c === 0) setLastSyncedAt(new Date())
  }, [])

  return (
    <SyncCtx.Provider value={{ isOnline, pendingCount, isSyncing, syncNow, lastSyncedAt }}>
      {children}
    </SyncCtx.Provider>
  )
}

export const useSync = () => useContext(SyncCtx)
